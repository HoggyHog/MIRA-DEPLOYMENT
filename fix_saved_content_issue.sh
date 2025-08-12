#!/bin/bash

echo "🔧 Fixing saved content issue in teacher dashboard..."

# Configuration
EC2_HOST="ec2-16-16-103-92.eu-north-1.compute.amazonaws.com"
EC2_USER="ubuntu"
SSH_KEY="~/.ssh/mira_v2_key.pem"

echo "📡 Connecting to server to fix the issue..."

ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << 'EOF'
set -e

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

cd /home/ubuntu/app

print_status "Stopping current Node.js process..."
pkill -f "node dist/index.js" || true
sleep 2

print_status "Creating a proper startup script with environment variables..."

# Create a startup script that loads the .env file
cat > start_nodejs.sh << 'SCRIPT_EOF'
#!/bin/bash
cd /home/ubuntu/app

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from .env file"
    echo "📊 DATABASE_URL: ${DATABASE_URL:0:50}..."
    echo "🔐 AUTH0_DOMAIN: $VITE_AUTH0_DOMAIN"
else
    echo "❌ .env file not found!"
    exit 1
fi

# Start the Node.js application
echo "🚀 Starting Node.js application..."
NODE_ENV=production node dist/index.js
SCRIPT_EOF

chmod +x start_nodejs.sh

print_status "Creating systemd service for Node.js application..."

# Create systemd service file
sudo tee /etc/systemd/system/mira-frontend.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=Mira Frontend (Node.js)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/app
ExecStart=/home/ubuntu/app/start_nodejs.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE_EOF

print_status "Reloading systemd and starting the service..."
sudo systemctl daemon-reload
sudo systemctl enable mira-frontend
sudo systemctl start mira-frontend

print_status "Waiting for service to start..."
sleep 5

print_status "Checking service status..."
sudo systemctl status mira-frontend --no-pager

print_status "Checking if Node.js process is running..."
if pgrep -f "node dist/index.js" > /dev/null; then
    print_success "Node.js application is running"
else
    print_error "Node.js application failed to start"
    exit 1
fi

print_status "Testing the saved content endpoint..."
sleep 3

# Test the endpoint (this will fail with 401 but should not crash)
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/protected/teacher-content/content-generations" | grep -q "401"; then
    print_success "API endpoint is responding (401 is expected without auth token)"
else
    print_warning "API endpoint may have issues"
fi

print_status "Checking Node.js logs for any startup errors..."
tail -10 node.log

print_success "✅ Saved content issue should now be fixed!"
print_status "🌐 The teacher dashboard should now be able to load saved content properly"
print_status "🔧 The Node.js application is now running with proper environment variables"

EOF

echo "🎉 Fix completed!"
echo ""
echo "📋 What was fixed:"
echo "   • Created proper startup script that loads .env file"
echo "   • Created systemd service for automatic management"
echo "   • Node.js now has access to DATABASE_URL and Auth0 config"
echo "   • Saved content tab should now work in teacher dashboard"
echo ""
echo "🌐 Test the application at: https://centumai.in"
echo "🔍 Check the saved content tab in the teacher dashboard" 