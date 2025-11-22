#!/usr/bin/env node

/**
 * Database Health Check Script
 * Monitors database performance and health metrics
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class DatabaseHealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      checks: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async runAllChecks() {
    console.log('🔍 Starting Database Health Checks...\n');

    await this.checkConnection();
    await this.checkTableSizes();
    await this.checkIndexUsage();
    await this.checkSlowQueries();
    await this.checkDataIntegrity();
    await this.checkBackupStatus();
    await this.checkPerformanceMetrics();

    this.generateReport();
    this.saveReport();
  }

  async checkConnection() {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - start;

      this.addCheck('connection', {
        status: 'PASS',
        message: 'Database connection successful',
        duration: `${duration}ms`,
        threshold: duration < 100 ? 'GOOD' : duration < 500 ? 'WARNING' : 'CRITICAL'
      });
    } catch (error) {
      this.addCheck('connection', {
        status: 'FAIL',
        message: `Connection failed: ${error.message}`,
        error: error.message
      });
    }
  }

  async checkTableSizes() {
    try {
      const tables = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `;

      const largeTables = tables.filter(t => t.size_bytes > 100 * 1024 * 1024); // > 100MB

      this.addCheck('table_sizes', {
        status: largeTables.length > 0 ? 'WARNING' : 'PASS',
        message: `Found ${tables.length} tables, ${largeTables.length} large tables`,
        data: tables,
        largeTables: largeTables.length
      });
    } catch (error) {
      this.addCheck('table_sizes', {
        status: 'FAIL',
        message: `Failed to check table sizes: ${error.message}`
      });
    }
  }

  async checkIndexUsage() {
    try {
      const indexUsage = await prisma.$queryRaw`
        SELECT 
          schemaname,
          relname as tablename,
          indexrelname as indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 10
      `;

      const unusedIndexes = indexUsage.filter(idx => idx.idx_scan === 0);

      this.addCheck('index_usage', {
        status: unusedIndexes.length > 0 ? 'WARNING' : 'PASS',
        message: `Found ${unusedIndexes.length} unused indexes`,
        data: indexUsage,
        unusedIndexes: unusedIndexes.length
      });
    } catch (error) {
      this.addCheck('index_usage', {
        status: 'FAIL',
        message: `Failed to check index usage: ${error.message}`
      });
    }
  }

  async checkSlowQueries() {
    try {
      // Check if pg_stat_statements extension is available
      const extensionCheck = await prisma.$queryRaw`
        SELECT EXISTS(
          SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
        ) as extension_exists
      `;

      if (!extensionCheck[0].extension_exists) {
        this.addCheck('slow_queries', {
          status: 'WARNING',
          message: 'pg_stat_statements extension not installed - slow query monitoring unavailable'
        });
        return;
      }

      const slowQueries = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > 1000
        ORDER BY mean_time DESC
        LIMIT 5
      `;

      this.addCheck('slow_queries', {
        status: slowQueries.length > 0 ? 'WARNING' : 'PASS',
        message: `Found ${slowQueries.length} slow queries`,
        data: slowQueries
      });
    } catch (error) {
      this.addCheck('slow_queries', {
        status: 'FAIL',
        message: `Failed to check slow queries: ${error.message}`
      });
    }
  }

  async checkDataIntegrity() {
    try {
      // Check for orphaned records
      const orphanedRegistrations = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM event_registrations er
        LEFT JOIN events e ON er.event_id = e.id
        WHERE e.id IS NULL
      `;

      const orphanedNotifications = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE u.id IS NULL
      `;

      const totalOrphaned = parseInt(orphanedRegistrations[0].count) + parseInt(orphanedNotifications[0].count);

      this.addCheck('data_integrity', {
        status: totalOrphaned > 0 ? 'WARNING' : 'PASS',
        message: `Found ${totalOrphaned} orphaned records`,
        orphanedRegistrations: parseInt(orphanedRegistrations[0].count),
        orphanedNotifications: parseInt(orphanedNotifications[0].count)
      });
    } catch (error) {
      this.addCheck('data_integrity', {
        status: 'FAIL',
        message: `Failed to check data integrity: ${error.message}`
      });
    }
  }

  async checkBackupStatus() {
    try {
      // Check if backup directory exists and has recent files
      const backupDir = path.join(__dirname, '../backups');
      const exists = fs.existsSync(backupDir);
      
      let recentBackups = 0;
      if (exists) {
        const files = fs.readdirSync(backupDir);
        const now = Date.now();
        recentBackups = files.filter(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return (now - stats.mtime.getTime()) < 24 * 60 * 60 * 1000; // Last 24 hours
        }).length;
      }

      this.addCheck('backup_status', {
        status: recentBackups > 0 ? 'PASS' : 'WARNING',
        message: `Found ${recentBackups} recent backups`,
        backupDir: backupDir,
        backupDirExists: exists
      });
    } catch (error) {
      this.addCheck('backup_status', {
        status: 'FAIL',
        message: `Failed to check backup status: ${error.message}`
      });
    }
  }

  async checkPerformanceMetrics() {
    try {
      const metrics = await prisma.$queryRaw`
        SELECT 
          'active_connections' as metric,
          COUNT(*) as value
        FROM pg_stat_activity 
        WHERE state = 'active'
        UNION ALL
        SELECT 
          'total_connections' as metric,
          COUNT(*) as value
        FROM pg_stat_activity
        UNION ALL
        SELECT 
          'database_size' as metric,
          pg_database_size(current_database()) as value
      `;

      this.addCheck('performance_metrics', {
        status: 'PASS',
        message: 'Performance metrics collected',
        data: metrics
      });
    } catch (error) {
      this.addCheck('performance_metrics', {
        status: 'FAIL',
        message: `Failed to collect performance metrics: ${error.message}`
      });
    }
  }

  addCheck(name, result) {
    this.results.checks[name] = result;
    this.results.summary.total++;
    
    if (result.status === 'PASS') {
      this.results.summary.passed++;
    } else if (result.status === 'FAIL') {
      this.results.summary.failed++;
    } else if (result.status === 'WARNING') {
      this.results.summary.warnings++;
    }
  }

  generateReport() {
    console.log('\n📊 Database Health Report');
    console.log('='.repeat(50));
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`Total Checks: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`⚠️  Warnings: ${this.results.summary.warnings}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log('='.repeat(50));

    Object.entries(this.results.checks).forEach(([name, check]) => {
      const status = check.status === 'PASS' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${status} ${name.toUpperCase()}: ${check.message}`);
    });
  }

  saveReport() {
    const reportPath = path.join(__dirname, '../logs/database-health-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Convert BigInt to string for JSON serialization
    const serializableResults = JSON.parse(JSON.stringify(this.results, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    fs.writeFileSync(reportPath, JSON.stringify(serializableResults, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }
}

// Run health checks
async function main() {
  const checker = new DatabaseHealthChecker();
  try {
    await checker.runAllChecks();
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseHealthChecker;
