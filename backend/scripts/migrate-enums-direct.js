const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('🔄 Starting migration: CUSTOMER_SUCCESS -> CUSTOMER_SERVICE and remove SENIOR_AGENT...\n');

    // Step 1: Add CUSTOMER_SERVICE to department enum using raw SQL
    console.log('📝 Step 1: Adding CUSTOMER_SERVICE to department enum...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TYPE department ADD VALUE IF NOT EXISTS 'CUSTOMER_SERVICE'
      `);
      console.log('✅ Added CUSTOMER_SERVICE to department enum');
    } catch (error) {
      if (error.message.includes('already exists') || error.code === 'P2010') {
        console.log('ℹ️  CUSTOMER_SERVICE already exists in department enum');
      } else {
        throw error;
      }
    }

    // Step 2: Update all CUSTOMER_SUCCESS to CUSTOMER_SERVICE
    console.log('\n📝 Step 2: Updating departments from CUSTOMER_SUCCESS to CUSTOMER_SERVICE...');
    const updateUsersDepartment = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET department = 'CUSTOMER_SERVICE'::department
      WHERE department::text = 'CUSTOMER_SUCCESS'
    `);
    console.log(`✅ Updated ${updateUsersDepartment} users`);

    const updateTicketsDepartment = await prisma.$executeRawUnsafe(`
      UPDATE department_tickets
      SET department = 'CUSTOMER_SERVICE'::department
      WHERE department::text = 'CUSTOMER_SUCCESS'
    `);
    console.log(`✅ Updated ${updateTicketsDepartment} tickets`);

    // Step 3: Update SENIOR_AGENT roles to AGENT roles
    console.log('\n📝 Step 3: Updating roles from SENIOR_AGENT to AGENT...');
    const updateCSSenior = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET role = 'CS_AGENT'::user_role
      WHERE role::text = 'CS_SENIOR_AGENT'
    `);
    console.log(`✅ Updated ${updateCSSenior} CS_SENIOR_AGENT -> CS_AGENT`);

    const updateOPSSenior = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET role = 'OPS_AGENT'::user_role
      WHERE role::text = 'OPS_SENIOR_AGENT'
    `);
    console.log(`✅ Updated ${updateOPSSenior} OPS_SENIOR_AGENT -> OPS_AGENT`);

    const updateFinanceSenior = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET role = 'FINANCE_AGENT'::user_role
      WHERE role::text = 'FINANCE_SENIOR_AGENT'
    `);
    console.log(`✅ Updated ${updateFinanceSenior} FINANCE_SENIOR_AGENT -> FINANCE_AGENT`);

    // Step 4: Update user_position from SENIOR_AGENT to AGENT
    console.log('\n📝 Step 4: Updating user_position from SENIOR_AGENT to AGENT...');
    const updatePosition = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET user_position = 'AGENT'::user_position
      WHERE user_position::text = 'SENIOR_AGENT'
    `);
    console.log(`✅ Updated ${updatePosition} user positions`);

    // Step 5: Verify changes
    console.log('\n🔍 Verifying changes...\n');
    
    const departments = await prisma.$queryRawUnsafe(`
      SELECT department::text as department, COUNT(*)::int as count
      FROM users
      WHERE department IS NOT NULL
      GROUP BY department
    `);
    console.log('📊 Departments:');
    departments.forEach(d => {
      console.log(`   ${d.department}: ${d.count}`);
    });

    const roles = await prisma.$queryRawUnsafe(`
      SELECT role::text as role, COUNT(*)::int as count
      FROM users
      WHERE role::text LIKE '%_AGENT' OR role::text LIKE '%_HEAD'
      GROUP BY role
      ORDER BY role
    `);
    console.log('\n📊 Roles:');
    roles.forEach(r => {
      console.log(`   ${r.role}: ${r.count}`);
    });

    const positions = await prisma.$queryRawUnsafe(`
      SELECT user_position::text as user_position, COUNT(*)::int as count
      FROM users
      WHERE user_position IS NOT NULL
      GROUP BY user_position
    `);
    console.log('\n📊 Positions:');
    positions.forEach(p => {
      console.log(`   ${p.user_position}: ${p.count}`);
    });

    console.log('\n✅ Data migration completed successfully!');
    console.log('\n⚠️  Next steps:');
    console.log('   1. Run: npx prisma db push --accept-data-loss');
    console.log('   2. This will remove CUSTOMER_SUCCESS, SENIOR_AGENT, and SENIOR_AGENT roles from enums');
    console.log('   3. The schema will match the updated database structure');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Make sure your database is accessible');
    console.error('   - Check if CUSTOMER_SERVICE enum value already exists');
    console.error('   - You may need to run: ALTER TYPE department ADD VALUE \'CUSTOMER_SERVICE\'; manually');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

