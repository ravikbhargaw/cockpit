const http = require('http');
const path = require('path');
const fs = require('fs');

const BRIDGE_PORT = parseInt(process.env.SQLITE_BRIDGE_PORT || '3919', 10);
let serverInstance = null;
let sqliteDb = null;

function getSqliteInstance() {
  if (sqliteDb) return sqliteDb;
  const Database = require('better-sqlite3');
  const dbPath = path.join(process.cwd(), 'data', 'cockpit.db');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  return sqliteDb;
}

function cleanParams(params) {
  if (!Array.isArray(params)) return [];
  return params.map((p) => (p === undefined ? null : p));
}

function handleQuery(query, params, action) {
  const db = getSqliteInstance();
  // Normalize ILIKE to LIKE for SQLite compatibility
  const cleanSql = query.replace(/\bILIKE\b/gi, 'LIKE');

  if (action === 'exec' || (cleanSql.includes(';') && cleanSql.split(';').filter((s) => s.trim().length > 0).length > 1)) {
    db.exec(cleanSql);
    return { rows: [], rowCount: 0 };
  }

  const stmt = db.prepare(cleanSql);
  const parameters = cleanParams(params);

  if (stmt.reader) {
    const rows = stmt.all(...parameters);
    return { rows, rowCount: rows.length };
  } else {
    const result = stmt.run(...parameters);
    return { rows: [], rowCount: result.changes };
  }
}

function startSqliteBridge(port = BRIDGE_PORT) {
  if (serverInstance) {
    return Promise.resolve(serverInstance);
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // CORS headers for local loopback
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, port }));
        return;
      }

      if (req.method === 'POST' && req.url === '/sql') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const { query, params, action } = JSON.parse(body || '{}');
            if (!query) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Query parameter is required' }));
              return;
            }
            const result = handleQuery(query, params || [], action);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (err) {
            console.error('[SQLite Bridge Error]:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message || 'SQLite query execution failed' }));
          }
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[SQLite Bridge] Port ${port} is already in use, reusing existing bridge.`);
        resolve(server);
      } else {
        console.error('[SQLite Bridge] Server error:', err);
        reject(err);
      }
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`[SQLite Bridge] Listening on http://127.0.0.1:${port}`);
      serverInstance = server;
      resolve(server);
    });
  });
}

function stopSqliteBridge() {
  if (serverInstance) {
    try {
      serverInstance.close();
    } catch {}
    serverInstance = null;
  }
  if (sqliteDb) {
    try {
      sqliteDb.close();
    } catch {}
    sqliteDb = null;
  }
}

module.exports = {
  BRIDGE_PORT,
  startSqliteBridge,
  stopSqliteBridge,
  handleQuery,
};
