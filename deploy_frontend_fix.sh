#!/bin/bash

echo "🚀 Deploying fixed frontend to server..."

# Copy the built frontend to the server
scp -r dist/* ubuntu@ec2-51-20-191-105.eu-north-1.compute.amazonaws.com:/home/ubuntu/mira-app/client/dist/

echo "✅ Frontend deployed successfully!"
echo "🔄 Restarting services on server..."

# Restart the services on the server
ssh ubuntu@ec2-51-20-191-105.eu-north-1.compute.amazonaws.com << 'EOF'
cd /home/ubuntu/mira-app

# Stop existing services
sudo systemctl stop mira-frontend
sudo systemctl stop mira-backend

# Start services
sudo systemctl start mira-backend
sudo systemctl start mira-frontend

# Reload nginx
sudo systemctl reload nginx

echo "✅ Services restarted successfully!"
echo "🌐 Your app should now be accessible at:"
echo "   https://ec2-51-20-191-105.eu-north-1.compute.amazonaws.com"
EOF

echo "🎉 Deployment complete! The mixed content issue should now be resolved." 