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
# =====================================================
# Semantic Retrieval (Pinecone ONLY)
# =====================================================
async def semantic_search(query: str, company_id: str, top_k: int = 5):
    index = get_index()
    query_vector = await embed_text(query)

    # CRITICAL: Use namespace for isolation
    # If company_id is None, it defaults to global/'' namespace
    namespace = company_id if company_id else ""
    
    print(f"🌲 PINECONE QUERY | Namespace: '{namespace}' | Top_K: {top_k} | Query: '{query}'")

    results = index.query(
        vector=query_vector,
        top_k=top_k,
        include_metadata=True,
        namespace=namespace 
    )

    print(f"🌲 PINECONE RESULTS: {len(results.get('matches', []))} matches found.")

    chunks = []
    MIN_SEMANTIC_SCORE = 0.75
    MIN_UPLOADED_DOC_SCORE = 0.60  # Lower threshold for uploaded docs

    for match in results.get("matches", []):
        meta = match.get("metadata", {})
        score = match.get("score", 0)
        
        print(f"   - Match: {meta.get('source', 'Unknown')} | Score: {score:.4f} | DocID: {meta.get('doc_id')}")
        
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


# ... (contextualize_query and normalize_query skipped for brevity - no changes needed) ...
# But wait, I need to make sure I don't delete them if I'm replacing a block.
# I will supply the full replacement for the `retrieve_context` and above.

# =====================================================
# Hybrid Retrieval
# =====================================================
async def retrieve_context(query: str, company_id: str, top_k: int = 8):  # Added company_id
    CE_SKIP_TOP_NORM = 0.85
    CE_SKIP_GAP = 0.15

    # 🧹 STEP 0: Normalize query to remove company name bias
    normalized_query = normalize_query(query)
    
    # 🧠 Query is already contextualized by process_chat
    expanded_query = normalized_query

    # Pass company_id to semantic search
    semantic_chunks = await semantic_search(expanded_query, company_id, top_k)
    
    # Keyword search currently doesn't support namespace (MongoDB). 
    # TODO: Add company_id filter to MongoDB keyword search if needed.
    # For now, we assume keyword search is global or less critical for tenant isolation, 
    # OR we need to update keyword_search too. (Safe to leave as is for this step, focus on Vectors)
    keyword_chunks = await keyword_search(expanded_query, company_id=company_id, limit=3) 

    all_chunks = semantic_chunks + keyword_chunks
    if not all_chunks:
        return "", [], [], False

    semantic_scores = normalize([c["score"] for c in semantic_chunks])
    keyword_scores = normalize([c["score"] for c in keyword_chunks]) if keyword_chunks else []
    
    for i, c in enumerate(semantic_chunks):
        c["norm_score"] = semantic_scores[i] * 0.6
        
        # 🚀 BOOST: Prioritize UPLOADED documents by 400% (5x multiplier)
        has_doc_id = c.get("doc_id")
        if has_doc_id:
            c["norm_score"] *= 5.0  
            print(f"✨ BOOSTED (5x): {c['source']} (doc_id: {has_doc_id})")
        else:
            print(f"📄 Regular: {c['source']} (no doc_id)")

    for i, c in enumerate(keyword_chunks):
        c["norm_score"] = keyword_scores[i] * 0.4

    ranked = sorted(all_chunks, key=lambda x: x["norm_score"], reverse=True)
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


def build_prompt(messages: list[dict], context: str, company_id: str = None) -> str:
    # ---------------------------------------------------------
    # DYNAMIC BRANDING BASED ON COMPANY_ID
    # ---------------------------------------------------------
    brand_name = company_id.title() if company_id else "the Assistant"
    assistant_name = f"{brand_name} AI" if company_id else "CORPWISE"

    # Special handling for "silaibook" case to ensure nice casing
    if company_id and company_id.lower() == "silaibook":
        brand_name = "SilaiBook"
        assistant_name = "SilaiBook AI"

    parts = [
        f"SYSTEM: You are {assistant_name}, a friendly and professional assistant for {brand_name}.",
        f"SYSTEM: When users greet you, welcome them to {brand_name}.",
        "",
        "SYSTEM: === CRITICAL INSTRUCTION ===",
        "SYSTEM: You will receive context chunks below. Your job is to:",
        "SYSTEM: 1. Read the user's question carefully",
        "SYSTEM: 2. Scan ALL context chunks for information that answers the question",
        "SYSTEM: 3. Synthesize the answer from the provided context",
        "SYSTEM: 4. If the context is relevant but partial, do your best to answer based ONLY on the context",
        "",
        "SYSTEM: If the context doesn't contain the answer, say: 'I don't have that information in my knowledge base.'",
        "SYSTEM: Keep responses concise and professional.",
    ]

    if context:
        parts.append(f"\nCONTEXT:\n{context}\n")

    for m in messages:
        parts.append(f"{m['role'].upper()}: {m['content']}")

    return "\n".join(parts)


# =====================================================
# Main Orchestrator
# =====================================================
# =====================================================
# Main Orchestrator
# =====================================================
def contextualize_query(query: str, history: list[dict]) -> str:
    """
    Rewrite the query to be self-contained based on conversation history.
    """
    if not history:
        return query
        
    # Simple heuristic: if query is very short or contains pronouns, consider history
    # For now, let's keep it simple and just return the query if we don't have a sophisticated rewriter ready.
    # TODO: Implement full LLM-based rewriting if needed.
    # In many simple RAG setups, just appending the last answer to context is enough, 
    # but here we want to rewrite the query.
    
    # Placeholder for full implementation:
    # prompt = f"Given history: {history}, rewrite: {query}"
    # return generate_gemini_response(prompt)
    
    # For stability right now, let's just return the query to fix the NameError.
    return query

def normalize_query(query: str) -> str:
    """Normalize query for caching (lowercase, strip, simple cleaning)."""
    if not query:
        return ""
    return query.lower().strip()

async def process_chat(user_id: str, conversation_id: str, question: str, company_id: str = None, original_language: str = "en"):
    cached = False  # Initialize default

    if not question or not question.strip():
        return {
            "reply": "Please ask a valid question.",
            "sources": [],
            "confidence": "low",
            "cached": False
        }

    # Detect Intent
    intent = detect_intent(question)
    print(f"🧠 DETECTED INTENT: {intent} | Company: {company_id}")

    # FORCE LOWERCASE COMPANY ID for consistency
    if company_id:
        company_id = company_id.lower()
    
    # 🌍 Lingo input translation
    translated_question = question # await translate(question, "en") if original_language != "en" else question

    final_answer = None
    final_confidence = "low"
    cached = False

    # --------------------
    # Conversational Query Detection
    # --------------------
    if is_conversational_query(translated_question):
        # Handle greetings and small talk without retrieval
        history = await get_recent_messages(conversation_id)
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
        # Normalize query for cache to avoid company name bias
        normalized_cache_query = normalize_query(translated_question)
        cached_response = await get_cached_response(normalized_cache_query, company_id=company_id)
        if cached_response:
            return {
                "reply": await translate(cached_response["answer"], original_language),
                "sources": cached_response["sources"],
                "confidence": cached_response["confidence"],
                "cached": True
            }

    try:
        # Fetch history for ALL intents (needed for context construction)
        history = await get_recent_messages(conversation_id)

        # --------------------
        # Non-Retrieval Intents
        # --------------------
        # REMOVED "GENERAL" from here to ensure broader queries hit the RAG system
        if intent in ["SYSTEM_INFO", "GREETING", "DATE_TIME"]:
            # Basic conversational or system queries - No RAG needed
            context = f"Current Date/Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            
            if intent == "SYSTEM_INFO":
                context += "User is asking about CORPWISE system identity."
            elif intent == "GREETING":
                context += "User is greeting you. Be polite and professional."
            elif intent == "DATE_TIME":
                context += "User is asking for current date/time."
                
            messages = history + [{"role": "user", "content": translated_question}]
            
            # Simple prompt for non-RAG
            prompt = build_prompt(messages, context, company_id=company_id)
            
            # We skip retrieval and force generation
            raw = generate_gemini_response(prompt)
            final_answer = raw.strip()
            final_confidence = "high"
            sources = []
            
            # Skip the rest (RAG flow) and go to return
            ce_used = False
            answer_conf_score = 1.0

        else:
            # --------------------
            # RAG Retrieval Flow
            # --------------------
            # history already fetched above
            
            # 🧠 Rewrite query with context (e.g. "it" -> "Project Phoenix")
            contextualized_q = contextualize_query(translated_question, history)
            
            # PASSING COMPANY_ID TO RETRIEVAL
            context, sources, chunks, ce_used = await retrieve_context(contextualized_q, company_id=company_id)

            # 🛠️ RESTORING LEGACY FILTER LOGIC (As requested by user)
            # These filters were previously removed but user reported better performance with them.
            chunks = filter_chunks_by_query(chunks, translated_question)
            chunks = dominant_chunks(chunks)
            chunks = restrict_chunks_by_intent(chunks, intent)

            # 🔁 rebuild context + sources after filtering
            context = "\n\n".join(compress_chunk(c["text"]) for c in chunks)
            sources = dominant_sources(chunks)

            answer_conf_score = aggregate_answer_confidence(chunks)
            confidence = confidence_label(answer_conf_score)

            messages = history + [{"role": "user", "content": translated_question}]
            prompt = build_prompt(messages, context, company_id=company_id)

            ce_used = any("ce_score" in c for c in chunks)

            # Always try LLM if we have context, unless confidence is extremely low
            should_generate = context.strip() and answer_conf_score >= 0.4
            
            if should_generate:
                try:
                    raw = generate_gemini_response(prompt)
                    final_answer, final_confidence = calibrate_answer(
                        raw.strip(), context, answer_conf_score
                    )
                    final_answer = strip_disallowed_prefixes(final_answer)
                except Exception as e:
                    # If LLM fails (e.g. Rate Limit 429), fall back gracefully
                    if "429" in str(e) or "ResourceExhausted" in str(e):
                        final_answer = "⚠️ System is busy (Rate Limit). Please try again in a minute."
                        final_confidence = "low" 
                        # Do NOT dump raw context here, it confuses users.
                    else:
                        logger.error(f"LLM Generation failed: {e}")
                        final_answer = "I found some info but couldn't process it. Please check the sources."
                        final_confidence = "low"

            else:
                final_confidence = confidence
                if confidence == "low":
                    final_answer = REFUSAL_MESSAGE
                    sources = []
                else:
                     # Fallback for when context exists but score < 0.4 (very rare with top_k=8)
                     final_answer = "I found relevant documents but they might not fully answer your question. Please verify the sources below."

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
            #     await store_response(translated_question, final_answer, sources, final_confidence, company_id=company_id)

    except Exception:

        # --------------------
        # Non-Retrieval Intents
        # --------------------
        if intent in ["SYSTEM_INFO", "GREETING", "DATE_TIME", "GENERAL"]:
            # Basic conversational or system queries - No RAG needed
            context = f"Current Date/Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            
            if intent == "SYSTEM_INFO":
                context += "User is asking about CORPWISE system identity."
            elif intent == "GREETING":
                context += "User is greeting you. Be polite and professional."
            elif intent == "DATE_TIME":
                context += "User is asking for current date/time."
                
            messages = history + [{"role": "user", "content": translated_question}]
            
            # Simple prompt for non-RAG
            prompt = build_prompt(messages, context, company_id=company_id)
            
            # We skip retrieval and force generation
            raw = generate_gemini_response(prompt)
            final_answer = raw.strip()
            final_confidence = "high"
            sources = []
            
            # Skip the rest (RAG flow) and go to return
            ce_used = False
            answer_conf_score = 1.0

        else:
            # --------------------
            # RAG Retrieval Flow
            # --------------------
            # --------------------
            # history already fetched above
            
            # 🧠 Rewrite query with context (e.g. "it" -> "Project Phoenix")
            contextualized_q = contextualize_query(translated_question, history)
            
            # STEP 0: Normalize query to remove company name bias
            # (Moved normalization inside retrieve_context, passing contextualized_q directly)
            
            # PASSING COMPANY_ID TO RETRIEVAL
            context, sources, chunks, ce_used = await retrieve_context(contextualized_q, company_id=company_id)

            # 🛠️ AGGRESSIVE FILTERING REMOVED
            # The previous filters (filter_chunks_by_query, restrict_chunks_by_intent) were too strict
            # and caused "No information found" errors for semantic matches.
            # We now rely on the vector store score and Cross-Encoder to filter bad chunks.
            
            # chunks = filter_chunks_by_query(chunks, translated_question) <--- REMOVED
            # chunks = restrict_chunks_by_intent(chunks, intent) <--- REMOVED
            
            # Still keep dominant source filtering to avoid mixing too many disparate docs
            # But relax it slightly or rely on re-ranking
            # chunks = dominant_chunks(chunks) <--- OPTIONAL: Let's trust re-ranker more
            
            # 🔁 rebuild context + sources after potential filtering (if any remained)
            # context = "\n\n".join(compress_chunk(c["text"]) for c in chunks)
            # sources = dominant_sources(chunks)
            
            # Since retrieve_context ALREADY returns the top chunks (compressed), we don't need to re-compress
            # unless we filtered them. Since we removed filters, we use the original context.

            answer_conf_score = aggregate_answer_confidence(chunks)
            confidence = confidence_label(answer_conf_score)

            messages = history + [{"role": "user", "content": translated_question}]
            prompt = build_prompt(messages, context, company_id=company_id)

            ce_used = any("ce_score" in c for c in chunks)

            # Always try LLM if we have context, unless confidence is extremely low
            should_generate = context.strip() and answer_conf_score >= 0.4
            
            if should_generate:
                try:
                    raw = generate_gemini_response(prompt)
                    final_answer, final_confidence = calibrate_answer(
                        raw.strip(), context, answer_conf_score
                    )
                    final_answer = strip_disallowed_prefixes(final_answer)
                except Exception as e:
                    # If LLM fails (e.g. Rate Limit 429), fall back gracefully
                    if "429" in str(e) or "ResourceExhausted" in str(e):
                        final_answer = "⚠️ System is busy (Rate Limit). Please try again in a minute."
                        final_confidence = "low" 
                        # Do NOT dump raw context here, it confuses users.
                    else:
                        logger.error(f"LLM Generation failed: {e}")
                        final_answer = "I found some info but couldn't process it. Please check the sources."
                        final_confidence = "low"

            else:
                final_confidence = confidence
                if confidence == "low":
                    final_answer = REFUSAL_MESSAGE
                    sources = []
                else:
                     # Fallback for when context exists but score < 0.4 (very rare with top_k=8)
                     final_answer = "I found relevant documents but they might not fully answer your question. Please verify the sources below."

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
        {"conversation_id": conversation_id},
        {
            "$set": {
                "user_id": user_id,
                "company_id": company_id,  # Persist for feedback/history context
                "updated_at": datetime.utcnow()
            },
            "$setOnInsert": {
                "created_at": datetime.utcnow(),
                "title": question[:50] + "..." if len(question) > 50 else question
            },
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

    # ---------------------------------------------------------
    # 📊 INCREMENT USAGE STATS (Monthly Queries)
    # ---------------------------------------------------------
    if company_id:
        await db.admins.update_one(
            {"company_id": company_id},
            {
                "$inc": {"usage.queries_this_month": 1},
                "$set": {"usage.last_query_date": datetime.utcnow()}
            }
        )
        print(f"📈 USAGE: Incremented query count for company '{company_id}'")

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
