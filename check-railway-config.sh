#!/bin/bash

echo "🚀 RAILWAY CONFIG CHECKER"
echo "=========================="
echo ""

# Check backend env.example
echo "📦 Backend Configuration:"
if grep -q "web-production-38c7.up.railway.app" backend/env.example; then
    echo "  ✅ API_BASE_URL: Railway configured"
else
    echo "  ❌ API_BASE_URL: Not configured"
fi

if grep -q "nozomi.proxy.rlwy.net" backend/env.example; then
    echo "  ✅ DATABASE_URL: Railway configured"
else
    echo "  ❌ DATABASE_URL: Not configured"
fi

echo ""
echo "🌐 Frontend Configuration:"
if grep -q "NEXT_PUBLIC_API_URL" frontend/next.config.js; then
    echo "  ✅ next.config.js: Using NEXT_PUBLIC_API_URL"
else
    echo "  ❌ next.config.js: Not using env variable"
fi

echo ""
echo "🔒 Security (CORS):"
if grep -q "web-production-38c7.up.railway.app" backend/src/middlewares/security.js; then
    echo "  ✅ CORS: Railway URL allowed"
else
    echo "  ❌ CORS: Railway URL not configured"
fi

echo ""
echo "📝 Git Status:"
git status --short | head -5
echo ""

echo "✅ Quick check complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Set environment variables di Railway Dashboard"
echo "  2. git add . && git commit -m 'feat: Railway config'"
echo "  3. git push"
echo "  4. Deploy di Railway Dashboard"

