import fs from 'fs';
import path from 'path';
import { db, initDB } from '../lib/db';
import Database from 'better-sqlite3';

async function createBackup() {
  initDB();
  db.pragma('wal_checkpoint(TRUNCATE)');

  const backupDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  const backupPath = path.join(backupDir, `cockpit-prod-readiness-${timestamp}.db`);

  console.log(`Performing SQLite backup to ${backupPath}...`);
  await db.backup(backupPath);

  console.log(`Verifying backup file readability at ${backupPath}...`);
  const backupDb = new Database(backupPath);
  
  const tables = backupDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
  console.log('Tables found in backup:');
  tables.forEach(t => console.log(`  - ${t.name}`));

  const companyCount = (backupDb.prepare('SELECT COUNT(*) as count FROM companies').get() as any).count;
  const candidateCount = (backupDb.prepare('SELECT COUNT(*) as count FROM research_candidates').get() as any).count;
  const userCount = (backupDb.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;

  console.log(`\nBackup Verification Summary:`);
  console.log(`- Companies: ${companyCount}`);
  console.log(`- Research Candidates: ${candidateCount}`);
  console.log(`- Users: ${userCount}`);
  
  backupDb.close();

  if (companyCount > 0 && candidateCount > 0 && userCount > 0) {
    console.log('\n✓ PRE-MIGRATION BACKUP CREATED AND VERIFIED SUCCESSFULLY!');
  } else {
    console.error('\n✗ BACKUP VERIFICATION FAILED: Database missing expected records.');
    process.exit(1);
  }
}

createBackup().catch(err => {
  console.error('Backup error:', err);
  process.exit(1);
});
