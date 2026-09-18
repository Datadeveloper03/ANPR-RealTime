#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "📦 Installing Node dependencies and building React frontend..."
cd frontend
npm ci || npm install
npm run build
cd ..

echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "✅ Build completed successfully!"
