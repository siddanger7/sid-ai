import os

SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "sidai-jwt-secret-change-in-production")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS: int = int(os.environ.get("JWT_EXPIRE_HOURS", "72"))

# LLM provider: "llama" (local llama-server) or "openai" (Groq/OpenAI API)
LLM_PROVIDER: str = os.environ.get("LLM_PROVIDER", "llama")
LLAMA_SERVER_URL: str = os.environ.get("LLAMA_SERVER_URL", "http://127.0.0.1:8081/v1/chat/completions")
OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")
OPENAI_BASE_URL: str = os.environ.get("OPENAI_BASE_URL", "https://api.groq.com/openai/v1")
OPENAI_MODEL: str = os.environ.get("OPENAI_MODEL", "llama3-8b-8192")

DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./sidai.db")

CORS_ORIGINS: list[str] = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

RATE_LIMIT_MAX: int = int(os.environ.get("RATE_LIMIT_MAX", "60"))
RATE_LIMIT_WINDOW: int = int(os.environ.get("RATE_LIMIT_WINDOW", "60"))

LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")
