#!/bin/bash

echo "🔄 Updating frontend files on server..."

# This script should be run on the server to update the frontend files

# Navigate to the app directory
cd app

# Backup current frontend
echo "📦 Backing up current frontend..."
cp -r client/dist client/dist.backup.$(date +%Y%m%d_%H%M%S)

# Update the API endpoints in the built files
echo "🔧 Updating API endpoints in built files..."

# Update the main JavaScript file
sed -i 's|http://localhost:8001|/api|g' client/dist/public/assets/index-*.js

# Update any other files that might have hardcoded URLs
find client/dist -name "*.js" -exec sed -i 's|http://localhost:8001|/api|g' {} \;

echo "✅ Frontend files updated!"
echo "🔄 Restarting services..."

# Restart the services
sudo systemctl restart mira-backend
sudo systemctl restart mira-frontend
sudo systemctl reload nginx

echo "✅ Services restarted successfully!"
echo "🌐 Your app should now be accessible at:"
echo "   https://ec2-51-20-191-105.eu-north-1.compute.amazonaws.com"
echo ""
echo "🎉 The mixed content issue should now be resolved!" 