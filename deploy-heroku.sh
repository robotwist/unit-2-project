#!/bin/bash

# Analog Society - Heroku Deployment Script
# This script automates the deployment process to Heroku

echo "🚀 Deploying Analog Society to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Not logged in to Heroku. Please run: heroku login"
    exit 1
fi

# Create Heroku app (if it doesn't exist)
echo "📱 Creating Heroku app..."
heroku create analog-society-$(date +%s) --region us || echo "App may already exist, continuing..."

# Add MongoDB addon
echo "🗄️ Adding MongoDB addon..."
heroku addons:create mongolab:sandbox

# Set environment variables
echo "⚙️ Setting environment variables..."
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)

# Deploy to Heroku
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy to Heroku - $(date)"
git push heroku main

# Open the app
echo "🌐 Opening deployed app..."
heroku open

echo "✅ Deployment complete!"
echo "📊 View logs with: heroku logs --tail"
echo "🔧 Manage app at: https://dashboard.heroku.com/apps"
