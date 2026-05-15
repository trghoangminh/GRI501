import google.generativeai as genai
from qdrant_client import QdrantClient
from langchain_google_genai import ChatGoogleGenerativeAI
from sentence_transformers import SentenceTransformer
from app.config import settings
import os

# Initialize Google Generative AI
genai.configure(api_key=settings.GOOGLE_GEMINI_API_KEY)

# Define standard models
GEMINI_MODEL = "gemini-1.5-flash"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

# Ensure Qdrant storage exists
os.makedirs(settings.QDRANT_PATH, exist_ok=True)

# Initialize clients lazily or globally
_qdrant_client = None
_embedding_model = None
_llm = None

def get_qdrant_client() -> QdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(path=settings.QDRANT_PATH)
    return _qdrant_client

def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        # Runs locally
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _embedding_model

def get_llm(temperature: float = 0.7, streaming: bool = False) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        google_api_key=settings.GOOGLE_GEMINI_API_KEY,
        temperature=temperature,
        streaming=streaming
    )
