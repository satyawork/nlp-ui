from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from sentence_transformers import SentenceTransformer, CrossEncoder
import uuid
import os
import aiofiles
import requests
import pdfplumber
import docx
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Qdrant client
qdrant = QdrantClient(host="localhost", port=6333)

# Embedding + reranker
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

# vLLM API
VLLM_API_URL = "http://localhost:11434/api/chat"


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Helpers ---
def chunk_text(text, max_words=100, overlap=30):
    words = text.split()
    chunks = []
    for i in range(0, len(words), max_words - overlap):
        chunk = " ".join(words[i:i+max_words])
        chunks.append(chunk)
    return chunks

def extract_text_from_file(filepath: str, filename: str, content: bytes) -> str:
    """Extract text from multiple file formats."""
    text = ""
    ext = filename.lower()

    if ext.endswith(".pdf"):
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""

    elif ext.endswith(".docx"):
        doc = docx.Document(filepath)
        text = "\n".join([para.text for para in doc.paragraphs])

    elif ext.endswith((".xlsx", ".xls")):
        df = pd.read_excel(filepath)
        text = df.astype(str).apply(lambda x: " ".join(x), axis=1).str.cat(sep="\n")

    elif ext.endswith(".csv"):
        df = pd.read_csv(filepath)
        text = df.astype(str).apply(lambda x: " ".join(x), axis=1).str.cat(sep="\n")

    elif ext.endswith((".txt", ".md", ".rtf")):
        try:
            text = content.decode("utf-8")
        except Exception:
            raise ValueError("File encoding not supported. Use UTF-8 text files.")

    else:
        raise ValueError("Unsupported file format. Upload PDF, DOCX, TXT, CSV, XLSX, or MD.")

    return text


def truncate_context(question, hits, max_prompt_tokens=1500):
    context_parts = []
    total_words = 0
    for hit in hits:
        words = hit.payload["text"].split()
        if total_words + len(words) > max_prompt_tokens:
            break
        context_parts.append(hit.payload["text"])
        total_words += len(words)
    return "\n".join(context_parts)

# --- Endpoints ---
@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    filepath = os.path.join(UPLOAD_DIR, file.filename)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    try:
        text = extract_text_from_file(filepath, file.filename, content)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

    if not text.strip():
        return JSONResponse(status_code=400, content={"error": "No extractable text found in file."})

    chunks = chunk_text(text)
    collection_name = file.filename.split(".")[0]


    if not qdrant.collection_exists(collection_name):
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )

    embeddings = embedding_model.encode(chunks).tolist()
    points = [
        PointStruct(id=str(uuid.uuid4()), vector=embedding, payload={"text": chunk})
        for embedding, chunk in zip(embeddings, chunks)
    ]
    qdrant.upsert(collection_name=collection_name, points=points)

    return {
        "message": "Document uploaded and indexed",
        "collection": collection_name,
        "chunks": len(chunks),
    }


@app.get("/collections")
def get_collections():
    collections = qdrant.get_collections().collections
    return [c.name for c in collections]


@app.post("/ask")
def ask_question(question: str = Form(...), collection: str = Form(...)):
    # Step 1: Embed + search
    question_embedding = embedding_model.encode([question])[0].tolist()
    hits = qdrant.search(collection_name=collection, query_vector=question_embedding, limit=15)

    if not hits:
        return JSONResponse(status_code=404, content={"error": "No relevant documents found."})

    # Step 2: Rerank
    pairs = [(question, hit.payload["text"]) for hit in hits]
    scores = reranker.predict(pairs)
#    ranked_hits = [hit for _, hit in sorted(zip(scores, hits), reverse=True)]
    ranked_hits = sorted(hits, key=lambda h: h.score, reverse=True)


    # Step 3: Truncate
    context_texts = truncate_context(question, ranked_hits[:5], max_prompt_tokens=1000)

    # Step 4: Build payload
    MODEL_MAX_TOKENS = 4096
    prompt_tokens_est = len((f"Context:\n{context_texts}\n\nQuestion: {question}").split())
    available_for_completion = MODEL_MAX_TOKENS - prompt_tokens_est
    max_tokens = max(128, min(512, available_for_completion))

    payload = {
        "model": "phi4:14b",
        "stream": False,
        "messages": [
            {"role": "system", "content": "You are a helpful AI assistant. Use the context below to answer factually."},
            {"role": "user", "content": f"Context:\n{context_texts}\n\nQuestion: {question}"}
        ]
    }
    
    response = requests.post(VLLM_API_URL, json=payload)

    if response.status_code == 200:
        return response.json()
    else:
        try:
            error_detail = response.json()
        except Exception:
            error_detail = response.text
        return JSONResponse(status_code=response.status_code, content={"error": "vLLM request failed", "detail": error_detail})


