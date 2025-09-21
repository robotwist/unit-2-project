#!/bin/bash

# Analog Society - Netlify Deployment Script
# This script automates the deployment process to Netlify

echo "🚀 Deploying Analog Society to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Please install it first:"
    echo "   npm install -g netlify-cli"
    exit 1
fi

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo "❌ Not logged in to Netlify. Please run: netlify login"
    exit 1
fi

# Initialize Netlify site (if not already initialized)
echo "📱 Initializing Netlify site..."
if [ ! -f ".netlify/state.json" ]; then
    netlify init
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
netlify deploy --prod

# Set environment variables (you'll need to do this manually in Netlify dashboard)
echo "⚙️ Setting up environment variables..."
echo "Please set the following environment variables in your Netlify dashboard:"
echo "  - NODE_ENV=production"
echo "  - SESSION_SECRET=<your-secret-key>"
echo "  - MONGODB_URI=<your-mongodb-connection-string>"

# Open the site
echo "🌐 Opening deployed site..."
netlify open:site

echo "✅ Deployment complete!"
echo "📊 View site at: https://app.netlify.com/sites"
echo "🔧 Manage site at: https://app.netlify.com/teams"
