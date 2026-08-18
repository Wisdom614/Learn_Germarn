FROM python:3.11-slim

# Prevent Python from writing pyc files & enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY . .

# Expose port (GCP Cloud Run injects PORT environment variable)
ENV PORT=8000
EXPOSE 8000

# Run Uvicorn server
CMD exec uvicorn main:app --host 0.0.0.0 --port $PORT
