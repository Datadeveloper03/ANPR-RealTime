#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "📦 Building React frontend..."
cd frontend
if npm ci || npm install; then
  npm run build || echo "⚠️ npm run build failed, falling back to committed dist/ assets"
else
  echo "⚠️ npm install failed, falling back to committed dist/ assets"
fi
cd ..

echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "✅ Build completed successfully!"
