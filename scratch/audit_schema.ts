import { db } from '../lib/db';

function auditSchema() {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
  console.log('=== DATABASE SCHEMA AUDIT ===\n');

  for (const table of tables) {
    const tableName = table.name;
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${tableName})`).all() as any[];
    const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all() as any[];
    const count = (db.prepare(`SELECT COUNT(*) as c FROM ${tableName}`).get() as any).c;

    console.log(`TABLE: ${tableName} (${count} rows)`);
    console.log('Columns:');
    columns.forEach(c => {
      console.log(`  - ${c.name}: ${c.type} ${c.pk ? '[PK]' : ''} ${c.notnull ? '[NOT NULL]' : ''} ${c.dflt_value !== null ? `[DEFAULT ${c.dflt_value}]` : ''}`);
    });

    if (foreignKeys.length > 0) {
      console.log('Foreign Keys:');
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.from} -> ${fk.table}(${fk.to}) [ON DELETE ${fk.on_delete}]`);
      });
    }

    if (indexes.length > 0) {
      console.log('Indexes:');
      indexes.forEach(idx => {
        console.log(`  - ${idx.name} (unique: ${idx.unique})`);
      });
    }

    console.log('---------------------------------------------------\n');
  }
}

auditSchema();
