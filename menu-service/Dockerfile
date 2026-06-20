# Stage 1: Builder
FROM python:3.14-slim AS builder
WORKDIR /app
# Install build essentials for compiling native Python extensions (like psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends build-essential
# Create a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
# Install dependencies into the venv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Production Runner
FROM python:3.14-slim
WORKDIR /app
# Create a non-root user
RUN useradd -m -r appuser
# Copy the built virtual environment
COPY --from=builder /opt/venv /opt/venv
# Enable the venv and set production environment variables
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
COPY . .
# Secure the container
USER appuser
EXPOSE 3002
# Run via Uvicorn with multiple workers for production traffic
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3002", "--workers", "4"]