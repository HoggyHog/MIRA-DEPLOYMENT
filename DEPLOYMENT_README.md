# Mira Application Deployment Guide

This guide explains how to use the automated deployment script to deploy your Mira application from local development to the EC2 production server.

## 🚀 Quick Start

### Full Deployment
```bash
./deploy.sh
```

This will:
1. Build your application locally
2. Transfer files to EC2
3. Deploy and restart services
4. Verify nginx configuration
5. Test all endpoints
6. Show deployment summary

## 📋 Prerequisites

Before running the deployment script, ensure you have:

1. **SSH Key**: Your EC2 SSH key at `~/.ssh/mira_v2_key.pem`
2. **Node.js & npm**: Installed locally for building
3. **curl**: For testing endpoints
4. **Internet Connection**: To access EC2 and test endpoints

## 🔧 Script Options

### Full Deployment
```bash
./deploy.sh
```
Complete deployment process from build to verification.

### Build Only
```bash
./deploy.sh --build-only
```
Only builds the application locally without deploying.

### Test Only
```bash
./deploy.sh --test-only
```
Only tests the current deployment without rebuilding.

### Help
```bash
./deploy.sh --help
```
Shows usage information and available options.

## 📁 What Gets Deployed

The script deploys the following components:

### Frontend
- React application build (`dist/` folder)
- All static assets and bundled JavaScript
- HTML templates

### Backend
- Node.js server files (`server/` folder)
- API routes and middleware
- Authentication logic

### Configuration
- Package dependencies (`package.json`, `package-lock.json`)
- Shared schemas (`shared/` folder)
- Database migrations (`migrations/` folder)

## 🌐 Deployment Targets

### Production Domain
- **URL**: https://centumai.in
- **SSL**: Let's Encrypt certificate
- **Status**: Primary production endpoint

### EC2 Instance
- **URL**: https://ec2-16-16-103-92.eu-north-1.compute.amazonaws.com
- **SSL**: Self-signed certificate
- **Status**: Backup/testing endpoint

## 🔄 Deployment Process

### 1. Prerequisites Check
- Verifies npm, curl, and SSH key availability
- Ensures all required tools are installed

### 2. Application Build
- Cleans previous build artifacts
- Installs dependencies if needed
- Runs `npm run build` to create production build
- Validates build output

### 3. File Transfer
- Creates temporary directory on EC2
- Transfers build files, server files, and configuration
- Uses SCP for secure file transfer

### 4. Server Deployment
- Stops existing Node.js process
- Backs up current application
- Updates application files
- Installs production dependencies
- Starts new Node.js process
- Verifies process is running

### 5. Nginx Verification
- Tests nginx configuration syntax
- Restarts nginx service
- Verifies nginx is running

### 6. Endpoint Testing
- Tests EC2 instance accessibility
- Tests domain accessibility
- Verifies HTTP to HTTPS redirects
- Tests API endpoint responses

## 🔍 Monitoring & Troubleshooting

### Check Application Status
```bash
# Check if Node.js is running
ssh -i ~/.ssh/mira_v2_key.pem ubuntu@ec2-16-16-103-92.eu-north-1.compute.amazonaws.com "ps aux | grep node"

# Check nginx status
ssh -i ~/.ssh/mira_v2_key.pem ubuntu@ec2-16-16-103-92.eu-north-1.compute.amazonaws.com "sudo systemctl status nginx"
```

### View Logs
```bash
# Node.js application logs
ssh -i ~/.ssh/mira_v2_key.pem ubuntu@ec2-16-16-103-92.eu-north-1.compute.amazonaws.com "tail -f /home/ubuntu/app/node.log"

# Nginx logs
ssh -i ~/.ssh/mira_v2_key.pem ubuntu@ec2-16-16-103-92.eu-north-1.compute.amazonaws.com "sudo tail -f /var/log/nginx/access.log"
```

### Manual Restart
```bash
# Restart Node.js application
ssh -i ~/.ssh/mira_v2_key.pem ubuntu@ec2-16-16-103-92.eu-north-1.compute.amazonaws.com "cd /home/ubuntu/app && pkill -f 'node.*dist/index.js' && nohup NODE_ENV=production node dist/index.js > node.log 2>&1 &"

# Restart nginx
ssh -i ~/.ssh/mira_v2_key.pem ubuntu@ec2-16-16-103-92.eu-north-1.compute.amazonaws.com "sudo systemctl restart nginx"
```

## 🛠️ Configuration

### EC2 Settings
The script uses these default settings:
- **Host**: ec2-16-16-103-92.eu-north-1.compute.amazonaws.com
- **User**: ubuntu
- **SSH Key**: ~/.ssh/mira_v2_key.pem
- **App Directory**: /home/ubuntu/app

### Domain Settings
- **Primary Domain**: centumai.in
- **SSL Provider**: Let's Encrypt
- **Redirect**: HTTP → HTTPS

## 🔒 Security Features

### HTTPS Configuration
- Automatic HTTP to HTTPS redirects
- HSTS (HTTP Strict Transport Security)
- Modern SSL/TLS protocols (TLS 1.2/1.3)
- Security headers (X-Frame-Options, X-XSS-Protection, etc.)

### Server Security
- Production Node.js environment
- Secure file permissions
- Automatic backup before deployment
- Process isolation

## 📊 Deployment Verification

After deployment, the script verifies:

1. **Build Success**: Dist folder created with assets
2. **File Transfer**: All files transferred to EC2
3. **Process Status**: Node.js application running
4. **Nginx Status**: Web server running with valid config
5. **Endpoint Health**: All URLs responding correctly
6. **SSL Status**: HTTPS working with valid certificates
7. **API Health**: Backend endpoints responding

## 🚨 Error Handling

The script includes comprehensive error handling:

- **Exit on Error**: Script stops if any step fails
- **Colored Output**: Clear status indicators
- **Detailed Logging**: Step-by-step progress
- **Rollback Capability**: Automatic backups before changes
- **Health Checks**: Verification of all components

## 📝 Troubleshooting Common Issues

### Build Failures
```bash
# Check npm dependencies
npm install

# Clear npm cache
npm cache clean --force

# Check for TypeScript errors
npx tsc --noEmit
```

### SSH Connection Issues
```bash
# Test SSH connection
ssh -i ~/.ssh/mira_v2_key.pem ubuntu@ec2-16-16-103-92.eu-north-1.compute.amazonaws.com

# Check SSH key permissions
chmod 600 ~/.ssh/mira_v2_key.pem
```

### Nginx Issues
```bash
# Test nginx configuration
ssh -i ~/.ssh/mira_v2_key.pem ubuntu@ec2-16-16-103-92.eu-north-1.compute.amazonaws.com "sudo nginx -t"

# Check nginx error logs
ssh -i ~/.ssh/mira_v2_key.pem ubuntu@ec2-16-16-103-92.eu-north-1.compute.amazonaws.com "sudo tail -f /var/log/nginx/error.log"
```

### SSL Certificate Issues
```bash
# Check certificate status
ssh -i ~/.ssh/mira_v2_key.pem ubuntu@ec2-16-16-103-92.eu-north-1.compute.amazonaws.com "sudo certbot certificates"

# Renew certificates if needed
ssh -i ~/.ssh/mira_v2_key.pem ubuntu@ec2-16-16-103-92.eu-north-1.compute.amazonaws.com "sudo certbot renew"
```

## 🎯 Best Practices

1. **Test Locally**: Always test changes locally before deploying
2. **Backup**: The script automatically creates backups, but verify important data
3. **Monitor**: Check logs after deployment for any issues
4. **Gradual Rollout**: Consider testing on staging environment first
5. **Documentation**: Update this guide when making significant changes

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the deployment logs
3. Verify server status and connectivity
4. Check nginx and application logs
5. Ensure all prerequisites are met

---

**Happy Deploying! 🚀** 