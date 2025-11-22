#!/bin/bash

echo "🚀 Starting Webhook Email Service..."

# Kill existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f "node server.js" 2>/dev/null
pkill -f cloudflared 2>/dev/null
sleep 2

# Start webhook service
cd /Users/tanziljws/Documents/nusaevent/webhook-email-service
npm start &
WEBHOOK_PID=$!

echo "📧 Webhook service started (PID: $WEBHOOK_PID)"

# Wait for webhook to be ready
sleep 3

# Start cloudflare tunnel and capture output
echo "🌐 Starting Cloudflare Tunnel..."
cloudflared tunnel --url http://localhost:3002 > tunnel.log 2>&1 &
TUNNEL_PID=$!

echo "🔗 Cloudflare tunnel started (PID: $TUNNEL_PID)"

# Wait for tunnel to be ready and extract URL
echo "⏳ Waiting for tunnel to be ready..."
sleep 10

# Extract tunnel URL from log
TUNNEL_URL=$(grep "https://.*trycloudflare.com" tunnel.log | tail -1 | sed 's/.*https:/https:/' | sed 's/ .*//')

if [ -n "$TUNNEL_URL" ]; then
    echo "✅ Services started!"
    echo "📧 Webhook service: http://localhost:3002"
    echo "🌐 Cloudflare tunnel: $TUNNEL_URL"
    
    # Update Railway environment variable
    echo "🚂 Updating Railway environment variable..."
    railway variables --set "WEBHOOK_EMAIL_URL=$TUNNEL_URL" --service web --environment production
    
    if [ $? -eq 0 ]; then
        echo "✅ Railway environment updated successfully!"
        echo "🔄 Railway will redeploy automatically..."
    else
        echo "❌ Failed to update Railway environment"
        echo "📝 Please manually update WEBHOOK_EMAIL_URL to: $TUNNEL_URL"
    fi
else
    echo "❌ Failed to get tunnel URL"
    echo "📝 Check tunnel.log for details"
fi

# Keep script running
echo "Press Ctrl+C to stop all services"
wait
