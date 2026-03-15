#!/bin/bash

# Configuration
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="aegis-caregiver"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Starting deployment for $SERVICE_NAME to $PROJECT_ID..."

# 1. Build the Docker image using Cloud Build (so you don't need Docker locally)
echo "📦 Building container image..."
gcloud builds submit --tag $IMAGE_NAME .

# 2. Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production" \
  --update-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"

# 3. Get the URL
URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format='value(status.url)')

echo "✅ Deployment complete!"
echo "📍 Access your app at: $URL"
echo ""
echo "Note: Ensure you have created a secret named 'GEMINI_API_KEY' in Secret Manager before this deployment will work."
echo "You can do this with: printf 'YOUR_API_KEY' | gcloud secrets create GEMINI_API_KEY --data-file=-"
