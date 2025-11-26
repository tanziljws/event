#!/bin/bash

echo "=== 🧪 TEST DETECT EVENT API ==="
echo ""

# Test dengan token dari QR code
TOKEN="3C71D93234"
API_URL="https://backend-nasa.up.railway.app/api/events/organizer/detect-event"

echo "📱 Testing with token: $TOKEN"
echo "📡 API: $API_URL"
echo ""

# Note: Perlu auth token untuk test real
echo "⚠️  Note: This requires authentication token"
echo "   Use Postman or curl with Bearer token"
echo ""
echo "Example curl command:"
echo "curl -X POST '$API_URL' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "  -d '{\"token\": \"$TOKEN\"}'"
echo ""

