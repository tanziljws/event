require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/add_balance_payout_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running migration...');
    console.log('Migration file:', migrationPath);

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizer_balance', 'balance_transactions', 'payout_accounts', 'disbursements')
      ORDER BY table_name;
    `);

    console.log('✅ Tables created:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check enums
    const enums = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname IN ('transaction_type', 'account_type', 'disbursement_status')
      ORDER BY typname;
    `);

    console.log('✅ Enums created:');
    enums.rows.forEach(row => {
      console.log(`   - ${row.typname}`);
    });

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (error.code === '42P07') {
      console.log('⚠️  Table or enum already exists. This is OK if migration was run before.');
    } else {
      throw error;
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration()
  .then(() => {
    console.log('🎉 Migration process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });

