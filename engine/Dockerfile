FROM python:3.11-slim
WORKDIR /app

RUN pip install --no-cache-dir \
    httpx tenacity pydantic pydantic-settings structlog \
    python-dotenv "psycopg[binary]" redis boto3 anyio \
    anthropic openai

COPY engine ./engine

ENV PYTHONPATH=/app

CMD ["python", "-m", "engine.worker"]
