const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('🔄 Starting migration: CUSTOMER_SUCCESS -> CUSTOMER_SERVICE and remove SENIOR_AGENT...\n');

    // Step 1: Update department from CUSTOMER_SUCCESS to CUSTOMER_SERVICE
    console.log('📝 Step 1: Updating department from CUSTOMER_SUCCESS to CUSTOMER_SERVICE...');
    
    // Use raw SQL with proper enum casting
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
    console.log(`✅ Updated ${updateTicketsDepartment} tickets\n`);

    // Step 2: Update user roles - convert SENIOR_AGENT to AGENT
    console.log('📝 Step 2: Updating user roles from SENIOR_AGENT to AGENT...');
    
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
    console.log(`✅ Updated ${updateFinanceSenior} FINANCE_SENIOR_AGENT -> FINANCE_AGENT\n`);

    // Step 3: Update user_position - convert SENIOR_AGENT to AGENT
    console.log('📝 Step 3: Updating user_position from SENIOR_AGENT to AGENT...');
    
    const updatePosition = await prisma.$executeRawUnsafe(`
      UPDATE users 
      SET user_position = 'AGENT'::user_position
      WHERE user_position::text = 'SENIOR_AGENT'
    `);
    console.log(`✅ Updated ${updatePosition} user positions\n`);

    // Step 4: Verify changes
    console.log('🔍 Verifying changes...\n');
    
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
    console.log('   2. This will update the schema to match the new enum values');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n💡 If you see enum casting errors, you may need to:');
    console.error('   1. Temporarily add CUSTOMER_SERVICE to the enum in schema.prisma');
    console.error('   2. Run: npx prisma db push');
    console.error('   3. Then run this migration script');
    console.error('   4. Then remove CUSTOMER_SUCCESS from schema and run db push again');
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

