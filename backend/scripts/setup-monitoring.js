#!/usr/bin/env node

/**
 * Setup Monitoring Dashboard
 * Creates monitoring infrastructure for solo dev
 */

const fs = require('fs');
const path = require('path');

class MonitoringSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
  }

  async setupMonitoring() {
    console.log('🚀 Setting up monitoring infrastructure...\n');

    await this.createDockerCompose();
    await this.createGrafanaConfig();
    await this.createPrometheusConfig();
    await this.createMonitoringScripts();
    await this.createAlertingRules();
    await this.createDashboardConfigs();

    console.log('✅ Monitoring setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: docker-compose -f docker-compose.monitoring.yml up -d');
    console.log('2. Access Grafana: http://localhost:3000 (admin/admin)');
    console.log('3. Access Prometheus: http://localhost:9090');
    console.log('4. Import dashboards from ./monitoring/dashboards/');
  }

  async createDockerCompose() {
    const dockerCompose = `version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/prometheus/rules:/etc/prometheus/rules
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    restart: unless-stopped

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://nusa:nusa372747@host.docker.internal:5432/nusa_db?sslmode=disable
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped

volumes:
  grafana-storage:
`;

    const filePath = path.join(this.projectRoot, 'docker-compose.monitoring.yml');
    fs.writeFileSync(filePath, dockerCompose);
    console.log('✅ Created docker-compose.monitoring.yml');
  }

  async createGrafanaConfig() {
    const grafanaDir = path.join(this.projectRoot, 'monitoring', 'grafana', 'provisioning');
    fs.mkdirSync(grafanaDir, { recursive: true });

    // Datasources
    const datasources = {
      apiVersion: 1,
      datasources: [
        {
          name: 'Prometheus',
          type: 'prometheus',
          url: 'http://prometheus:9090',
          access: 'proxy',
          isDefault: true
        }
      ]
    };

    fs.writeFileSync(
      path.join(grafanaDir, 'datasources.yml'),
      JSON.stringify(datasources, null, 2)
    );

    // Dashboards
    const dashboards = {
      apiVersion: 1,
      providers: [
        {
          name: 'default',
          orgId: 1,
          folder: '',
          type: 'file',
          disableDeletion: false,
          updateIntervalSeconds: 10,
          allowUiUpdates: true,
          options: {
            path: '/var/lib/grafana/dashboards'
          }
        }
      ]
    };

    fs.writeFileSync(
      path.join(grafanaDir, 'dashboards.yml'),
      JSON.stringify(dashboards, null, 2)
    );

    console.log('✅ Created Grafana configuration');
  }

  async createPrometheusConfig() {
    const prometheusDir = path.join(this.projectRoot, 'monitoring', 'prometheus');
    fs.mkdirSync(prometheusDir, { recursive: true });

    const prometheusConfig = `global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'app-metrics'
    static_configs:
      - targets: ['host.docker.internal:5000']
    metrics_path: '/metrics'
    scrape_interval: 30s
`;

    fs.writeFileSync(
      path.join(prometheusDir, 'prometheus.yml'),
      prometheusConfig
    );

    console.log('✅ Created Prometheus configuration');
  }

  async createMonitoringScripts() {
    const scriptsDir = path.join(this.projectRoot, 'scripts');
    
    // Database backup script
    const backupScript = `#!/bin/bash

# Database Backup Script
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="nusa_db_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

echo "🔄 Starting database backup..."

PGPASSWORD=nusa372747 pg_dump -h localhost -U nusa -d nusa_db > $BACKUP_DIR/$BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup completed: $BACKUP_FILE"
    
    # Compress backup
    gzip $BACKUP_DIR/$BACKUP_FILE
    echo "📦 Backup compressed: $BACKUP_FILE.gz"
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
    echo "🧹 Old backups cleaned up"
else
    echo "❌ Backup failed!"
    exit 1
fi
`;

    fs.writeFileSync(
      path.join(scriptsDir, 'backup-database.sh'),
      backupScript
    );

    // Make executable
    fs.chmodSync(path.join(scriptsDir, 'backup-database.sh'), '755');

    console.log('✅ Created monitoring scripts');
  }

  async createAlertingRules() {
    const rulesDir = path.join(this.projectRoot, 'monitoring', 'prometheus', 'rules');
    fs.mkdirSync(rulesDir, { recursive: true });

    const alertRules = `groups:
  - name: database.rules
    rules:
      - alert: DatabaseDown
        expr: up{job="postgres-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          description: "PostgreSQL database has been down for more than 1 minute."

      - alert: HighDatabaseConnections
        expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database connections are above 80% of maximum."

      - alert: SlowQueries
        expr: pg_stat_statements_mean_time > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow queries detected"
          description: "Average query time is above 1 second."

      - alert: HighDiskUsage
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High disk usage"
          description: "Disk usage is above 80%."

      - alert: ApplicationDown
        expr: up{job="app-metrics"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Application is down"
          description: "The application has been down for more than 1 minute."
`;

    fs.writeFileSync(
      path.join(rulesDir, 'database.yml'),
      alertRules
    );

    console.log('✅ Created alerting rules');
  }

  async createDashboardConfigs() {
    const dashboardsDir = path.join(this.projectRoot, 'monitoring', 'grafana', 'dashboards');
    fs.mkdirSync(dashboardsDir, { recursive: true });

    // Database dashboard
    const databaseDashboard = {
      dashboard: {
        id: null,
        title: "Database Monitoring",
        tags: ["database", "postgresql"],
        timezone: "browser",
        panels: [
          {
            id: 1,
            title: "Database Connections",
            type: "stat",
            targets: [
              {
                expr: "pg_stat_database_numbackends",
                legendFormat: "Active Connections"
              }
            ],
            gridPos: { h: 8, w: 12, x: 0, y: 0 }
          },
          {
            id: 2,
            title: "Query Performance",
            type: "graph",
            targets: [
              {
                expr: "rate(pg_stat_statements_calls[5m])",
                legendFormat: "Queries/sec"
              }
            ],
            gridPos: { h: 8, w: 12, x: 12, y: 0 }
          },
          {
            id: 3,
            title: "Database Size",
            type: "stat",
            targets: [
              {
                expr: "pg_database_size_bytes",
                legendFormat: "Database Size"
              }
            ],
            gridPos: { h: 8, w: 12, x: 0, y: 8 }
          },
          {
            id: 4,
            title: "Slow Queries",
            type: "table",
            targets: [
              {
                expr: "topk(10, pg_stat_statements_mean_time)",
                legendFormat: "Slow Queries"
              }
            ],
            gridPos: { h: 8, w: 12, x: 12, y: 8 }
          }
        ],
        time: {
          from: "now-1h",
          to: "now"
        },
        refresh: "30s"
      }
    };

    fs.writeFileSync(
      path.join(dashboardsDir, 'database-dashboard.json'),
      JSON.stringify(databaseDashboard, null, 2)
    );

    console.log('✅ Created dashboard configurations');
  }
}

// Run setup
async function main() {
  const setup = new MonitoringSetup();
  try {
    await setup.setupMonitoring();
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MonitoringSetup;
