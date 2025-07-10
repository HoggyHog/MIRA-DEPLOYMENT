#!/bin/bash

echo "🔍 Checking server status and fixing configuration..."

# Connect to the server and check what's running
ssh -i ~/.ssh/your-key.pem ubuntu@ec2-51-20-191-105.eu-north-1.compute.amazonaws.com << 'EOF'

echo "📊 Checking running processes..."
ps aux | grep -E "(python|uvicorn|fastapi)" | grep -v grep

echo ""
echo "🔧 Checking service status..."
sudo systemctl status mira-backend --no-pager

echo ""
echo "📁 Checking app directory structure..."
cd /home/ubuntu/mira-app
ls -la

echo ""
echo "🐍 Checking Python files..."
find . -name "*.py" -type f | head -10

echo ""
echo "🔍 Checking if lesson_generator_api.py exists..."
if [ -f "lesson_generator_api.py" ]; then
    echo "✅ lesson_generator_api.py found"
    echo "📋 Checking the main function..."
    grep -A 5 -B 5 "if __name__" lesson_generator_api.py
else
    echo "❌ lesson_generator_api.py not found"
fi

echo ""
echo "🔧 Checking current FastAPI startup command..."
sudo systemctl cat mira-backend --no-pager

echo ""
echo "🛠️ Fixing the FastAPI server configuration..."

# Stop the current backend service
sudo systemctl stop mira-backend

# Create a proper startup script for lesson_generator_api.py
cat > /home/ubuntu/mira-app/start_fastapi.sh << 'SCRIPT_EOF'
#!/bin/bash
cd /home/ubuntu/mira-app
source deployment/bin/activate
python lesson_generator_api.py
SCRIPT_EOF

chmod +x /home/ubuntu/mira-app/start_fastapi.sh

# Update the systemd service to use the correct Python file
sudo tee /etc/systemd/system/mira-backend.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=Mira AI Backend (FastAPI)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mira-app
ExecStart=/home/ubuntu/mira-app/deployment/bin/python lesson_generator_api.py
Restart=always
RestartSec=10
Environment=PYTHONPATH=/home/ubuntu/mira-app

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Reload systemd and restart the service
sudo systemctl daemon-reload
sudo systemctl enable mira-backend
sudo systemctl start mira-backend

echo ""
echo "✅ Backend service restarted!"
echo "🔍 Checking service status..."
sudo systemctl status mira-backend --no-pager

echo ""
echo "🌐 Testing API endpoints..."
sleep 5
curl -k https://localhost/api/config-options || echo "❌ API test failed"

echo ""
echo "🔄 Restarting frontend service..."
sudo systemctl restart mira-frontend
sudo systemctl reload nginx

echo ""
echo "✅ All services restarted!"
echo "🌐 Your app should now be accessible at:"
echo "   https://ec2-51-20-191-105.eu-north-1.compute.amazonaws.com"

EOF

echo "🎉 Server check and fix completed!" 