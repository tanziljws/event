#!/bin/bash

# Step-by-step migration script
# This script will:
# 1. Add CUSTOMER_SERVICE to department enum
# 2. Update all data
# 3. Remove old enum values (requires db push)

echo "🔄 Starting migration: CUSTOMER_SUCCESS -> CUSTOMER_SERVICE and remove SENIOR_AGENT..."
echo ""

# Step 1: Add CUSTOMER_SERVICE to department enum
echo "📝 Step 1: Adding CUSTOMER_SERVICE to department enum..."
psql $DATABASE_URL -c "ALTER TYPE department ADD VALUE IF NOT EXISTS 'CUSTOMER_SERVICE';" || echo "⚠️  CUSTOMER_SERVICE may already exist"

# Step 2: Update all data
echo "📝 Step 2: Updating data..."
psql $DATABASE_URL << EOF
-- Update departments
UPDATE users 
SET department = 'CUSTOMER_SERVICE'
WHERE department = 'CUSTOMER_SUCCESS';

UPDATE department_tickets
SET department = 'CUSTOMER_SERVICE'
WHERE department = 'CUSTOMER_SUCCESS';

-- Update roles
UPDATE users 
SET role = 'CS_AGENT'
WHERE role = 'CS_SENIOR_AGENT';

UPDATE users 
SET role = 'OPS_AGENT'
WHERE role = 'OPS_SENIOR_AGENT';

UPDATE users 
SET role = 'FINANCE_AGENT'
WHERE role = 'FINANCE_SENIOR_AGENT';

-- Update positions
UPDATE users 
SET user_position = 'AGENT'
WHERE user_position = 'SENIOR_AGENT';
EOF

echo "✅ Data updated successfully!"
echo ""
echo "⚠️  Next steps:"
echo "   1. Run: npx prisma db push --accept-data-loss"
echo "   2. This will remove CUSTOMER_SUCCESS, SENIOR_AGENT, and SENIOR_AGENT roles from enums"

