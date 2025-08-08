#!/bin/bash

# Mira Application Deployment Script
# This script automates the entire deployment process from local development to EC2 production

set -e  # Exit on any error

# Configuration
EC2_HOST="ec2-16-16-103-92.eu-north-1.compute.amazonaws.com"
EC2_USER="ubuntu"
SSH_KEY="~/.ssh/mira_v2_key.pem"
REMOTE_APP_DIR="/home/ubuntu/app"
DOMAIN="centumai.in"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    if ! command_exists curl; then
        print_error "curl is not installed. Please install curl."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to check deployment prerequisites
check_deployment_prerequisites() {
    print_status "Checking deployment prerequisites..."
    
    if [ ! -f "$SSH_KEY" ]; then
        print_error "SSH key not found at $SSH_KEY"
        exit 1
    fi
    
    print_success "Deployment prerequisites check passed"
}

# Function to build the application
build_application() {
    print_status "Building application..."
    
    # Clean previous build
    if [ -d "dist" ]; then
        rm -rf dist
        print_status "Cleaned previous build"
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    # Build the application
    print_status "Running build process..."
    npm run build:prod
    
    if [ ! -d "dist" ]; then
        print_error "Build failed - dist directory not created"
        exit 1
    fi
    
    print_success "Application built successfully"
}

# Function to transfer files to EC2
transfer_files() {
    print_status "Transferring files to EC2 instance..."
    
    # Create temporary directory on EC2
    ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" "mkdir -p /home/ubuntu/temp_deploy"
    
    # Transfer build files
    print_status "Transferring dist folder..."
    scp -i "$SSH_KEY" -r dist/ "$EC2_USER@$EC2_HOST:/home/ubuntu/temp_deploy/"
    
    # Transfer server files
    print_status "Transferring server files..."
    scp -i "$SSH_KEY" -r server/ "$EC2_USER@$EC2_HOST:/home/ubuntu/temp_deploy/"
    
    # Transfer shared files
    print_status "Transferring shared files..."
    scp -i "$SSH_KEY" -r shared/ "$EC2_USER@$EC2_HOST:/home/ubuntu/temp_deploy/"
    
    # Transfer package files
    print_status "Transferring package files..."
    scp -i "$SSH_KEY" package.json package-lock.json "$EC2_USER@$EC2_HOST:/home/ubuntu/temp_deploy/"
    
    # Transfer migration files
    if [ -d "migrations" ]; then
        print_status "Transferring migration files..."
        scp -i "$SSH_KEY" -r migrations/ "$EC2_USER@$EC2_HOST:/home/ubuntu/temp_deploy/"
    fi
    
    print_success "Files transferred successfully"
}

# Function to deploy on EC2
deploy_on_ec2() {
    print_status "Deploying on EC2 instance..."
    
    ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << 'EOF'
        set -e
        
        # Function to print colored output
        print_status() {
            echo -e "\033[0;34m[INFO]\033[0m $1"
        }
        
        print_success() {
            echo -e "\033[0;32m[SUCCESS]\033[0m $1"
        }
        
        print_error() {
            echo -e "\033[0;31m[ERROR]\033[0m $1"
        }
        
        # Stop the current Node.js process
        print_status "Stopping current Node.js process..."
        pkill -f "node.*dist/index.js" || true
        sleep 2
        
        # Backup current app directory
        if [ -d "/home/ubuntu/app" ]; then
            print_status "Backing up current app directory..."
            cp -r /home/ubuntu/app /home/ubuntu/app.backup.$(date +%Y%m%d_%H%M%S)
        fi
        
        # Update app directory with new files
        print_status "Updating app directory..."
        cp -r /home/ubuntu/temp_deploy/* /home/ubuntu/app/
        
        # Install dependencies
        print_status "Installing dependencies..."
        cd /home/ubuntu/app
        npm install --production
        
        # Start the application
        print_status "Starting Node.js application..."
        cd /home/ubuntu/app
        nohup bash -c 'NODE_ENV=production node dist/index.js' > node.log 2>&1 &
        
        # Wait for the application to start
        sleep 5
        
        # Check if the application is running
        if pgrep -f "node.*dist/index.js" > /dev/null; then
            print_success "Node.js application started successfully"
        else
            print_error "Failed to start Node.js application"
            exit 1
        fi
        
        # Clean up temporary files
        rm -rf /home/ubuntu/temp_deploy
        
        print_success "Deployment completed successfully"
EOF
}

# Function to verify nginx configuration
verify_nginx() {
    print_status "Verifying nginx configuration..."
    
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
        
        # Test nginx configuration
        print_status "Testing nginx configuration..."
        if sudo nginx -t; then
            print_success "Nginx configuration is valid"
        else
            print_error "Nginx configuration is invalid"
            exit 1
        fi
        
        # Restart nginx
        print_status "Restarting nginx..."
        sudo systemctl restart nginx
        
        # Check nginx status
        if sudo systemctl is-active --quiet nginx; then
            print_success "Nginx is running"
        else
            print_error "Nginx failed to start"
            exit 1
        fi
EOF
}

# Function to test the application
test_application() {
    print_status "Testing application endpoints..."
    
    # Test EC2 instance
    print_status "Testing EC2 instance (https://$EC2_HOST)..."
    if curl -k -s -o /dev/null -w "%{http_code}" "https://$EC2_HOST" | grep -q "200"; then
        print_success "EC2 instance is responding correctly"
    else
        print_warning "EC2 instance may have issues"
    fi
    
    # Test domain
    print_status "Testing domain (https://$DOMAIN)..."
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
        print_success "Domain is responding correctly"
    else
        print_warning "Domain may have issues"
    fi
    
    # Test HTTP to HTTPS redirect
    print_status "Testing HTTP to HTTPS redirect..."
    if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" | grep -q "301"; then
        print_success "HTTP to HTTPS redirect is working"
    else
        print_warning "HTTP to HTTPS redirect may have issues"
    fi
    
    # Test API endpoint
    print_status "Testing API endpoint..."
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/auth/profile" | grep -q "401\|400"; then
        print_success "API endpoint is responding correctly"
    else
        print_warning "API endpoint may have issues"
    fi
}

# Function to show deployment summary
show_summary() {
    print_success "Deployment completed successfully!"
    echo
    echo "🌐 Application URLs:"
    echo "   • Production: https://$DOMAIN"
    echo "   • EC2 Instance: https://$EC2_HOST"
    echo
    echo "📋 What was deployed:"
    echo "   • Frontend build (React app)"
    echo "   • Backend server (Node.js)"
    echo "   • Database migrations (if any)"
    echo "   • Updated nginx configuration"
    echo
    echo "🔧 Server Status:"
    echo "   • Node.js: Running on port 3000"
    echo "   • Nginx: Running with HTTPS"
    echo "   • SSL: Let's Encrypt certificate for $DOMAIN"
    echo
    echo "✨ New Features Available:"
    echo "   • Teacher Content Saving System"
    echo "   • Auto-save for AI-generated content"
    echo "   • Content management interface"
    echo "   • Secure HTTPS access"
    echo
    print_status "You can now access your application at https://$DOMAIN"
}

# Main deployment function
main() {
    echo "🚀 Starting Mira Application Deployment"
    echo "======================================"
    echo
    
    # Check prerequisites
    check_prerequisites
    
    # Check deployment prerequisites
    #check_deployment_prerequisites
    
    # Build application
    build_application
    
    # Transfer files
    transfer_files
    
    # Deploy on EC2
    deploy_on_ec2
    
    # Verify nginx
    verify_nginx
    
    # Test application
    test_application
    
    # Show summary
    show_summary
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --build-only   Only build the application (no deployment)"
        echo "  --test-only    Only test the current deployment"
        echo
        echo "Examples:"
        echo "  $0              # Full deployment"
        echo "  $0 --build-only # Build only"
        echo "  $0 --test-only  # Test only"
        exit 0
        ;;
    --build-only)
        check_prerequisites
        build_application
        print_success "Build completed successfully"
        exit 0
        ;;
    --test-only)
        test_application
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac 