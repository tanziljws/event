#!/bin/bash

echo "🔍 Checking ngrok status..."

# Wait for ngrok to start
sleep 3

# Try to get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Ngrok not running or no tunnel found"
    echo "📋 Please run: ngrok http 3001"
    echo "🔗 Then check: http://localhost:4040"
else
    echo "✅ Ngrok tunnel found: $NGROK_URL"
    echo "📧 Webhook Email Service URL: $NGROK_URL"
    echo ""
    echo "🚀 Set this URL in Railway dashboard:"
    echo "   Variable: WEBHOOK_EMAIL_URL"
    echo "   Value: $NGROK_URL"
fi
