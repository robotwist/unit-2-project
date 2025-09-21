# 🚀 Analog Society - Deployment Guide

This guide covers deploying Analog Society to both **Heroku** and **Netlify** using best practices.

## 📋 Prerequisites

### Required Tools
- **Git** - Version control
- **Node.js** (v18+) - Runtime environment
- **MongoDB** - Database (local or cloud)
- **Heroku CLI** - For Heroku deployment
- **Netlify CLI** - For Netlify deployment

### Install CLI Tools
```bash
# Install Heroku CLI
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install.sh | sh

# Install Netlify CLI
npm install -g netlify-cli
```

## 🎯 Quick Deployment

### Option 1: Automated Scripts
```bash
# For Heroku
./deploy-heroku.sh

# For Netlify
./deploy-netlify.sh
```

### Option 2: Manual Deployment
Follow the detailed steps below for each platform.

---

## 🔵 Heroku Deployment

### Step 1: Prepare for Heroku
```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create analog-society-[your-name]

# Add MongoDB addon
heroku addons:create mongolab:sandbox
```

### Step 2: Configure Environment Variables
```bash
# Set production environment
heroku config:set NODE_ENV=production

# Set session secret (generate a secure one)
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)

# MongoDB URI will be automatically set by the addon
# Check with: heroku config:get MONGODB_URI
```

### Step 3: Deploy
```bash
# Add Heroku remote
git remote add heroku https://git.heroku.com/analog-society-[your-name].git

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Open your app
heroku open
```

### Step 4: Monitor
```bash
# View logs
heroku logs --tail

# Check app status
heroku ps

# Scale if needed
heroku ps:scale web=1
```

---

## 🟢 Netlify Deployment

### Step 1: Prepare for Netlify
```bash
# Login to Netlify
netlify login

# Initialize site
netlify init
```

### Step 2: Configure Environment Variables
In your Netlify dashboard:
1. Go to **Site Settings** → **Environment Variables**
2. Add the following variables:
   - `NODE_ENV` = `production`
   - `SESSION_SECRET` = `[your-secure-secret]`
   - `MONGODB_URI` = `[your-mongodb-connection-string]`

### Step 3: Deploy
```bash
# Build and deploy
npm run build
netlify deploy --prod

# Or use continuous deployment
git push origin main  # If connected to GitHub
```

### Step 4: Configure Redirects
Netlify will use the `netlify.toml` configuration file for:
- Build settings
- Redirect rules
- Headers
- Environment variables

---

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Set as `MONGODB_URI` environment variable

### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/analog-society?retryWrites=true&w=majority
```

---

## 🔧 Environment Variables

### Required Variables
```bash
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key
MONGODB_URI=your-mongodb-connection-string
PORT=3000  # Usually set automatically by platform
```

### Optional Variables
```bash
# For enhanced security
TRUST_PROXY=true

# For monitoring
LOG_LEVEL=info

# For file uploads (if using cloud storage)
CLOUDINARY_URL=your-cloudinary-url
```

---

## 🚀 Production Optimizations

### Performance
- **Compression**: Gzip enabled automatically
- **Static Assets**: Cached with proper headers
- **Database**: Indexed for optimal queries
- **Images**: Optimized uploads with size limits

### Security
- **HTTPS**: Enabled by default on both platforms
- **Headers**: Security headers configured
- **Sessions**: Secure session management
- **Input Validation**: Comprehensive validation

### Monitoring
- **Logs**: Available in platform dashboards
- **Health Checks**: Built-in endpoint monitoring
- **Error Tracking**: Comprehensive error handling

---

## 📊 Post-Deployment Checklist

### ✅ Verify Deployment
- [ ] App loads without errors
- [ ] User registration works
- [ ] Database connection established
- [ ] File uploads functional
- [ ] All routes accessible
- [ ] Offline functionality works

### ✅ Test Core Features
- [ ] Create new materials
- [ ] Upload photos
- [ ] Browse inventory
- [ ] Trading system
- [ ] Benefits calculation
- [ ] Data export

### ✅ Security Check
- [ ] HTTPS enabled
- [ ] Environment variables secure
- [ ] Session management working
- [ ] Input validation active
- [ ] File upload restrictions

---

## 🔄 Continuous Deployment

### GitHub Integration
Both platforms support automatic deployment from GitHub:

**Heroku:**
1. Connect GitHub repository in Heroku dashboard
2. Enable automatic deploys from main branch

**Netlify:**
1. Connect GitHub repository in Netlify dashboard
2. Configure build settings
3. Enable automatic deploys

### Deployment Branches
- `main` → Production
- `develop` → Staging (optional)
- `feature/*` → Preview deployments

---

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Errors:**
```bash
# Check connection string format
heroku config:get MONGODB_URI

# Verify database access
heroku run node -e "console.log(process.env.MONGODB_URI)"
```

**Build Failures:**
```bash
# Check build logs
heroku logs --tail
netlify logs

# Verify package.json scripts
npm run build
```

**Environment Variables:**
```bash
# List all variables
heroku config
netlify env:list

# Set missing variables
heroku config:set VARIABLE_NAME=value
netlify env:set VARIABLE_NAME value
```

### Getting Help
- **Heroku**: [Dev Center](https://devcenter.heroku.com/)
- **Netlify**: [Documentation](https://docs.netlify.com/)
- **MongoDB**: [Atlas Documentation](https://docs.atlas.mongodb.com/)

---

## 🎉 Success!

Your Analog Society platform is now live and ready for the community!

**Next Steps:**
1. Share with your community
2. Monitor usage and performance
3. Gather feedback for improvements
4. Scale as needed

**Platform URLs:**
- Heroku: `https://your-app-name.herokuapp.com`
- Netlify: `https://your-site-name.netlify.app`

Happy analog preserving! 🎵📻📷
