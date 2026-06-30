FROM python:3.11-slim
WORKDIR /app

RUN pip install --no-cache-dir fastapi uvicorn

COPY mock_agent ./mock_agent

CMD ["python", "-m", "mock_agent.server"]
