const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'cockpit.db');
const backupDir = path.join(__dirname, '..', 'data', 'backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const backupPath = path.join(backupDir, `cockpit-pre-pilot-${timestamp}.db`);

fs.copyFileSync(dbPath, backupPath);

const backupDb = new Database(backupPath);
const count = backupDb.prepare('SELECT COUNT(*) as c FROM companies').get();

console.log('=====================================================');
console.log('✓ BACKUP CREATED:', backupPath);
console.log('✓ VERIFIED READABLE. Company count in backup:', count.c);
console.log('=====================================================');
