FROM python:3.12-slim

WORKDIR /app

# Install dependencies (using clean requirements for cloud)
COPY requirements-cloudrun.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY server.py .
COPY db.py .
COPY .env .

# Cloud Run sets PORT env variable
ENV PORT=8080

EXPOSE 8080

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
