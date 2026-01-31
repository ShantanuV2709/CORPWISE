import os
import uuid
import asyncio
from pathlib import Path

from app.services.embeddings import embed_text
from app.db.pinecone_client import get_index

# =====================================================
# Configuration
# =====================================================
BASE_DIR = Path(__file__).resolve().parents[2]
DOCUMENT_ROOT = BASE_DIR / "documents"
print("📂 DOCUMENT_ROOT =", DOCUMENT_ROOT.resolve())

CHUNK_SIZE = 400
OVERLAP = 50

index = get_index()

# =====================================================
# Markdown Section Splitter (AUTHORITATIVE)
# =====================================================
def split_markdown_by_section(text: str):
    """
    Splits markdown text into (section_title, section_body)
    using ALL markdown heading levels (#, ##, ###).

    Guarantees:
    - One section per chunk
    - No None / empty sections
    """
    sections = []
    current_section = "overview"
    buffer = []

    for line in text.splitlines():
        line = line.strip()

        if line.startswith("#"):
            if buffer:
                sections.append(
                    (current_section, "\n".join(buffer).strip())
                )
                buffer = []

            current_section = line.lstrip("#").strip().lower()
        else:
            buffer.append(line)

    if buffer:
        sections.append(
            (current_section, "\n".join(buffer).strip())
        )

    return sections


# =====================================================
# Chunking Logic
# =====================================================
def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=OVERLAP):
    """
    Splits text into overlapping word-based chunks.
    """
    words = text.split()
    chunks = []

    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start = end - overlap

    return chunks


# =====================================================
# Ingestion Pipeline
# =====================================================
async def ingest():
    to_upsert = []

    for root, _, files in os.walk(DOCUMENT_ROOT):
        for file in files:
            if not file.endswith(".md"):
                continue

            path = Path(root) / file
            source = str(path.relative_to(DOCUMENT_ROOT)).replace("\\", "/")


            print(f"📄 INDEXING: {source}")

            text = path.read_text(encoding="utf-8").strip()
            if not text:
                continue

            # 🔥 SECTION-FIRST SPLITTING (CRITICAL FIX)
            sections = split_markdown_by_section(text)

            for section_title, section_body in sections:
                section_title = section_title.strip()

                # HARD GUARDS — DO NOT REMOVE
                if not section_title:
                    raise ValueError(f"Empty section title in {source}")

                if not section_body.strip():
                    continue

                chunks = chunk_text(section_body)

                for chunk in chunks:
                    if not chunk.strip():
                        continue

                    embedding = await embed_text(chunk)

                    to_upsert.append((
                        str(uuid.uuid4()),
                        embedding,
                        {
                            "source": source,
                            "section": section_title,
                            "text": chunk
                        }
                    ))

    if not to_upsert:
        print("⚠️ No documents found to ingest")
        return

    index.upsert(vectors=to_upsert)
    print(f"✅ Ingested {len(to_upsert)} chunks into Pinecone")


# =====================================================
# Entrypoint
# =====================================================
if __name__ == "__main__":
    asyncio.run(ingest())
