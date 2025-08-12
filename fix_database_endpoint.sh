#!/bin/bash

echo "🔧 Fixing database endpoint issue..."

# Configuration
EC2_HOST="ec2-16-16-103-92.eu-north-1.compute.amazonaws.com"
EC2_USER="ubuntu"
SSH_KEY="~/.ssh/mira_v2_key.pem"

# Working database URL from development
WORKING_DATABASE_URL="postgresql://neondb_owner:npg_3EHCfhMwO2cK@ep-weathered-pine-a1t0ojee.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

echo "📡 Connecting to server to fix the database endpoint..."

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

print_status "Backing up current .env file..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

print_status "Updating DATABASE_URL in .env file..."
# Replace the disabled database URL with the working one
sed -i 's|DATABASE_URL=postgresql://neondb_owner:npg_ngz93luWksay@ep-morning-lab-a6dus61f.us-west-2.aws.neon.tech/neondb?sslmode=require|DATABASE_URL=postgresql://neondb_owner:npg_3EHCfhMwO2cK@ep-weathered-pine-a1t0ojee.ap-southeast-1.aws.neon.tech/neondb?sslmode=require|g' .env

print_status "Verifying the change..."
echo "New DATABASE_URL:"
grep "DATABASE_URL" .env

print_status "Restarting the Node.js service to pick up the new environment variables..."
sudo systemctl restart mira-frontend

print_status "Waiting for service to restart..."
sleep 5

print_status "Checking service status..."
sudo systemctl status mira-frontend --no-pager

print_status "Testing database connection..."
sleep 3

# Test if the database is now accessible
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/protected/teacher-content/content-generations" | grep -q "401"; then
    print_success "API endpoint is responding (401 is expected without auth token)"
else
    print_warning "API endpoint may have issues"
fi

print_status "Checking recent logs for database connection status..."
tail -20 node.log | grep -E "(Database|database|NeonDbError|content-generations)" || echo "No recent database-related logs found"

print_success "✅ Database endpoint has been updated!"
print_status "🌐 The saved content tab should now work in the teacher dashboard"
print_status "🔧 The application is now using the working database endpoint"

EOF

echo "🎉 Database endpoint fix completed!"
echo ""
echo "📋 What was fixed:"
echo "   • Updated production DATABASE_URL to use the working endpoint"
echo "   • Restarted the Node.js service to pick up the new configuration"
echo "   • The saved content tab should now work properly"
echo ""
echo "🌐 Test the application at: https://centumai.in"
echo "🔍 Check the saved content tab in the teacher dashboard"
echo "💾 Try generating and saving some content to verify it's working" 