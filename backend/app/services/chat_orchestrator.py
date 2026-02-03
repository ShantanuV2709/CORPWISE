from datetime import datetime
from collections import Counter
import logging

from app.services.intent import detect_intent
from app.services.system_answers import get_system_answer
from app.services.memory import get_recent_messages
from app.services.cache import get_cached_response, store_response
from app.db.mongodb import db
from app.services.keyword_retriever import keyword_search
from app.services.cross_encoder_reranker import cross_encoder_rerank
from app.services.confidence import compute_chunk_confidence
from app.services.negative_logger import log_negative_retrieval
from app.services.llm.gemini_client import generate_gemini_response
from app.services.context_compressor import compress_chunk
from app.services.answer_calibrator import calibrate_answer
from app.services.llm.prompts import SAFE_REWRITE_PROMPT
from app.services.lingo import translate
from app.db.pinecone_client import get_index
from app.services.embeddings import embed_text


# =====================================================
# Config
# =====================================================
logger = logging.getLogger("corpwise.retrieval")

CE_MIN_SCORE = 3.5
MIN_CONTEXT_TOKENS = 120

REFUSAL_MESSAGE = "I do not have sufficient internal information to answer this question."


# =====================================================
# Semantic Retrieval (Pinecone ONLY)
# =====================================================
async def semantic_search(query: str, top_k: int = 5):
    index = get_index()
    query_vector = await embed_text(query)

    results = index.query(
        vector=query_vector,
        top_k=top_k,
        include_metadata=True
    )

    chunks = []
    MIN_SEMANTIC_SCORE = 0.75
    MIN_UPLOADED_DOC_SCORE = 0.60  # Lower threshold for uploaded docs

    for match in results.get("matches", []):
        meta = match.get("metadata", {})
        score = match.get("score", 0)
        
        # Use lower threshold for uploaded documents
        has_doc_id = meta.get("doc_id")
        threshold = MIN_UPLOADED_DOC_SCORE if has_doc_id else MIN_SEMANTIC_SCORE

        if score < threshold:
            continue

        if meta.get("text") and meta.get("source"):
            chunks.append({
                "text": meta["text"],
                "source": meta["source"],
                "section": meta.get("section"),
                "doc_id": meta.get("doc_id"),  # Extract doc_id for boost detection
                "doc_type": meta.get("doc_type"),  # Also extract doc_type
                "score": score,
                "type": "semantic"
            })

    return chunks


def diversify_chunks(chunks, max_per_source=1, max_total=6):
    seen = {}
    diversified = []

    for c in chunks:
        src = c["source"]
        seen[src] = seen.get(src, 0) + 1

        if seen[src] <= max_per_source:
            diversified.append(c)

        if len(diversified) >= max_total:
            break

    return diversified


def expand_query(original_query: str) -> str:
    """
    Use LLM to expand/rewrite the query for better semantic search.
    Converts natural questions into search-optimized queries.
    """
    expansion_prompt = f"""You are a search query optimizer. Your job is to rewrite user questions into better search queries.

User's question: "{original_query}"

Rewrite this as a search query that would find the most relevant information. Include:
- Key concepts and synonyms
- Related terms
- Alternative phrasings

Output ONLY the expanded search query, nothing else. Keep it under 30 words.

Examples:
- "Who's the CEO?" → "Chief Executive Officer CEO company leader executive"
- "What is the future direction?" → "future direction roadmap vision upcoming plans strategy goals objectives"
- "How does it work?" → "how it works functionality mechanism process operation explanation"

Expanded query:"""

    expanded = generate_gemini_response(expansion_prompt).strip()
    
    # Fallback to original if expansion fails or is too long
    if len(expanded) > 200 or not expanded:
        return original_query
    
    print(f"🔍 Query Expansion: '{original_query}' → '{expanded}'")
    return expanded


# =====================================================
# Hybrid Retrieval
# =====================================================
async def retrieve_context(query: str, top_k: int = 20):  # Increased to 20 for better coverage
    CE_SKIP_TOP_NORM = 0.85
    CE_SKIP_GAP = 0.15

    # 🧠 STEP 1: Expand query for better semantic understanding
    expanded_query = expand_query(query)

    semantic_chunks = await semantic_search(expanded_query, top_k)
    keyword_chunks = await keyword_search(expanded_query, limit=5)  # Also increase keyword

    all_chunks = semantic_chunks + keyword_chunks
    if not all_chunks:
        return "", [], [], False

    semantic_scores = normalize([c["score"] for c in semantic_chunks])
    keyword_scores = normalize([c["score"] for c in keyword_chunks]) if keyword_chunks else []
    
    for i, c in enumerate(semantic_chunks):
        c["norm_score"] = semantic_scores[i] * 0.6
        
        # 🚀 BOOST: Prioritize UPLOADED documents by 400% (5x multiplier)
        # Uploaded docs have a 'doc_id' field, old system docs don't
        has_doc_id = c.get("doc_id")
        if has_doc_id:
            c["norm_score"] *= 5.0  # Massive boost to ensure dominance
            print(f"✨ BOOSTED (5x): {c['source']} (doc_id: {has_doc_id})")
        else:
            print(f"📄 Regular: {c['source']} (no doc_id)")

    for i, c in enumerate(keyword_chunks):
        c["norm_score"] = keyword_scores[i] * 0.4
        
        # ⚠️ REMOVED KEYWORD BOOST
        # Boosting keyword chunks is dangerous because a single word match 
        # (e.g. "memory") could normalize to 1.0 and hide relevant system docs.
        # We only boost SEMANTIC chunks because they pass a relevance threshold.

    ranked = sorted(all_chunks, key=lambda x: x["norm_score"], reverse=True)
    
    # 🎯 Removed exclusive preference to prevent irrelevant uploaded docs from blocking system docs
    # The 5x boost above is sufficient to prioritize RELEVANT uploaded docs
    candidates = diversify_chunks(ranked)

    skip_ce = False
    if candidates and candidates[0]["norm_score"] >= CE_SKIP_TOP_NORM:
        if len(candidates) == 1 or (
            candidates[0]["norm_score"] - candidates[1]["norm_score"] >= CE_SKIP_GAP
        ):
            skip_ce = True

    if skip_ce:
        top_chunks = candidates[:3]
        ce_used = False
    else:
        reranked = cross_encoder_rerank(query=query, chunks=candidates, top_k=3)
        if not reranked or reranked[0].get("ce_score", 0) < CE_MIN_SCORE:
            top_chunks = ranked[:3]
            ce_used = False
        else:
            # ✅ ROBUST FILTER: Only keep positive matches
            # MS-MARCO CE scores < 0 usually mean "not relevant"
            filtered_reranked = [c for c in reranked if c.get("ce_score", 0) >= 0.3]  
            
            # Fallback: if filtering removed everything (rare if top score > MIN), 
            # but we know top score was good, keep just the top one.
            top_chunks = filtered_reranked if filtered_reranked else [reranked[0]]
            ce_used = True

    for c in top_chunks:
        c["confidence"] = compute_chunk_confidence(c)

    context = "\n\n".join(
        compress_chunk(c["text"])
        for c in sorted(top_chunks, key=lambda x: x.get("ce_score", 0), reverse=True)
    )

    sources = dominant_sources(top_chunks)
    return context, sources, top_chunks, ce_used


# =====================================================
# Prompt Builder
# =====================================================
def is_conversational_query(question: str) -> bool:
    """Detect if a query is a greeting or casual conversation."""
    q_lower = question.lower().strip()
    
    # Greetings
    greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]
    
    # Casual phrases
    casual = ["how are you", "what's up", "sup", "thank you", "thanks", "bye", "goodbye"]
    
    # Help requests (phrased as questions about the assistant itself)
    help_requests = ["help me", "can you help", "how can you help", "what can you do", "who are you"]
    
    all_patterns = greetings + casual + help_requests
    
    # Check if it's a short conversational phrase
    return any(pattern in q_lower for pattern in all_patterns) and len(q_lower.split()) <= 15


def build_prompt(messages: list[dict], context: str) -> str:
    parts = [
        "SYSTEM: You are CORPWISE, a friendly and professional corporate AI assistant.",
        "SYSTEM: When users greet you or ask how you can help, respond warmly and explain your role.",
        "SYSTEM: For factual questions, answer using ONLY the provided internal context below.",
        "SYSTEM: If the context doesn't contain the answer, politely say you don't have that information in your knowledge base.",
        "SYSTEM: Keep responses concise, clear, and helpful.",
    ]

    if context:
        parts.append(f"\nCONTEXT:\n{context}\n")

    for m in messages:
        parts.append(f"{m['role'].upper()}: {m['content']}")

    return "\n".join(parts)


# =====================================================
# Main Orchestrator
# =====================================================
async def process_chat(user_id: str, question: str, language: str = "en"):

    if not question or not question.strip():
        return {
            "reply": "Please ask a valid question.",
            "sources": [],
            "confidence": "low",
            "cached": False
        }

    # 🌍 Lingo input translation
    original_language = language
    translated_question = await translate(question, "en")

    final_answer = None
    final_confidence = "low"
    cached = False

    intent = detect_intent(translated_question)

    # --------------------
    # Conversational Query Detection
    # --------------------
    if is_conversational_query(translated_question):
        # Handle greetings and small talk without retrieval
        history = await get_recent_messages(user_id)
        messages = history + [{"role": "user", "content": translated_question}]
        
        # Simple conversational prompt (no context needed)
        conversational_prompt = build_prompt(messages, "")
        
        final_answer = generate_gemini_response(conversational_prompt).strip()
        final_confidence = "high"
        sources = []
        
        # Return conversational response directly
        # (Message history is managed elsewhere in the system)
        return {
            "reply": final_answer,
            "sources": sources,
            "confidence": final_confidence,
            "cached": False
        }

    # --------------------
    # Cache check (language-agnostic)
    # --------------------
    if intent != "SYSTEM_INFO":
        cached_response = await get_cached_response(translated_question)
        if cached_response:
            return {
                "reply": await translate(cached_response["answer"], original_language),
                "sources": cached_response["sources"],
                "confidence": cached_response["confidence"],
                "cached": True
            }

    try:
        if intent == "SYSTEM_INFO":
            final_answer = await get_system_answer()
            final_confidence = "high"
            sources = []

        else:
            history = await get_recent_messages(user_id)

            context, sources, chunks, ce_used = await retrieve_context(translated_question)

            chunks = filter_chunks_by_query(chunks, translated_question)
            chunks = dominant_chunks(chunks)
            chunks = restrict_chunks_by_intent(chunks, intent)

            # 🔁 rebuild context + sources after filtering
            context = "\n\n".join(compress_chunk(c["text"]) for c in chunks)
            sources = dominant_sources(chunks)

            answer_conf_score = aggregate_answer_confidence(chunks)
            confidence = confidence_label(answer_conf_score)

            messages = history + [{"role": "user", "content": translated_question}]
            prompt = build_prompt(messages, context)

            ce_used = any("ce_score" in c for c in chunks)

            if (
                ce_used
                and answer_conf_score >= 0.7
                and context_is_sufficient(context)
            ):
                raw = generate_gemini_response(prompt)
                final_answer, final_confidence = calibrate_answer(
                    raw.strip(), context, answer_conf_score
                )
                final_answer = strip_disallowed_prefixes(final_answer)

            else:
                final_confidence = confidence
                if confidence == "low":
                    final_answer = REFUSAL_MESSAGE
                    sources = []
                elif context.strip():
                    clean = dedupe_sentences(strip_markdown_headers(context))
                    draft = " ".join(clean.split(".")[:3]) + "."
                    if intent == "EXPLANATION" and answer_conf_score >= 0.6:
                        rewritten = generate_gemini_response(
                            SAFE_REWRITE_PROMPT.format(context=context, draft=draft)
                        )
                        final_answer = strip_disallowed_prefixes(rewritten.strip())
                    else:
                        final_answer = draft
                else:
                    final_answer = REFUSAL_MESSAGE

            if final_confidence != "high":
                await log_negative_retrieval(
                    question=translated_question,
                    confidence=final_confidence,
                    answer_conf_score=answer_conf_score,
                    ce_used=ce_used,
                    top_ce_score=chunks[0].get("ce_score") if chunks else None,
                    sources=sources,
                )

            # Automatic caching is DISABLED.
            # Caching is now triggered via the /feedback endpoint upon positive user feedback.
            # if final_confidence == "high":
            #     await store_response(...)

    except Exception:
        logger.exception("Chat processing failed")
        final_answer = "I'm temporarily unable to access internal knowledge."
        final_confidence = "low"
        sources = []

    # 🌍 Lingo output translation
    final_answer = await translate(final_answer, original_language)

    answer = {
        "reply": final_answer,
        "sources": sources,
        "confidence": final_confidence,
        "cached": cached
    }

    await db.conversations.update_one(
        {"user_id": user_id},
        {
            "$push": {
                "messages": {
                    "$each": [
                        {"role": "user", "content": question, "timestamp": datetime.utcnow()},
                        {"role": "assistant", "content": final_answer, "timestamp": datetime.utcnow()}
                    ]
                }
            }
        },
        upsert=True
    )

    return answer


# =====================================================
# Helpers
# =====================================================
def normalize(scores):
    if not scores:
        return []
    m = max(scores)
    if m == 0:
        return [0 for _ in scores]
    return [s / m for s in scores]


def aggregate_answer_confidence(chunks):
    semantic = [c for c in chunks if c["type"] == "semantic"]
    if not semantic:
        return 0.0
    # Use max confidence to avoid penalizing single-fact answers with noisy neighbors
    return round(max(c["confidence"] for c in semantic), 3)


def confidence_label(score):
    if score >= 0.75:
        return "high"
    if score >= 0.45:
        return "medium"
    return "low"


def strip_disallowed_prefixes(text):
    for p in [
        "Based on the available internal documentation:",
        "Based on the provided context:",
        "Here is the answer:",
    ]:
        while text.startswith(p):
            text = text[len(p):].strip()
    return text


def context_is_sufficient(context):
    return len(context.split()) >= MIN_CONTEXT_TOKENS


def dominant_sources(chunks):
    if not chunks:
        return []
    counts = Counter(c["source"] for c in chunks)
    src, count = counts.most_common(1)[0]
    return [src] if count / len(chunks) >= 0.7 else list(counts.keys())


def strip_markdown_headers(text):
    return "\n".join(l for l in text.splitlines() if not l.strip().startswith("#"))


def dedupe_sentences(text):
    seen, out = set(), []
    for s in text.split("."):
        s = s.strip()
        if s and s not in seen:
            seen.add(s)
            out.append(s)
    return ". ".join(out) + "."


def filter_chunks_by_query(chunks, query):
    q = query.lower().split()
    return [c for c in chunks if any(k in c["text"].lower() for k in q)] or chunks


def dominant_chunks(chunks):
    if not chunks:
        return chunks
    counts = Counter(c["source"] for c in chunks)
    src, count = counts.most_common(1)[0]
    return [c for c in chunks if c["source"] == src] if count / len(chunks) >= 0.6 else chunks


def restrict_chunks_by_intent(chunks, intent):
    INTENT_DOMAINS = {
        "EXPLANATION": [
            "memory", "storage", "conversation", "retrieval", "hybrid", "encoder",
            "it", "hr", "policy", "support", "security", "general", "test"
        ],
        "FACT": [
            "memory", "storage",
            "it", "hr", "policy", "general", "test"
        ],
        "GENERAL": [
            "overview", "architecture",
            "it", "hr", "general", "test"
        ],
    }

    keys = INTENT_DOMAINS.get(intent)
    if not keys:
        return chunks

    filtered = [c for c in chunks if any(k in c["source"].lower() for k in keys)]
    return filtered or chunks
