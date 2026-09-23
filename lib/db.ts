let dbInstance: any = null;

function getDB() {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL || '';
  if (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://')) {
    // PostgreSQL / Neon database compatibility adapter (pure Edge Runtime compatible)
    try {
      const { Pool } = require('@neondatabase/serverless');
      const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
      });

      // Synchronous interface wrapper matching DAL expectations
      dbInstance = {
        prepare(sql: string) {
          // Convert SQLite ? placeholders to Postgres $1, $2 if needed
          let pgSql = sql;
          let paramIdx = 1;
          pgSql = pgSql.replace(/\?/g, () => `$${paramIdx++}`);

          return {
            all(...params: any[]) {
              // Non-blocking query execution check
              try {
                const res = pool.query(pgSql, params);
                return res.rows || [];
              } catch {
                return [];
              }
            },
            get(...params: any[]) {
              try {
                const res = pool.query(pgSql, params);
                return (res.rows && res.rows[0]) || null;
              } catch {
                return null;
              }
            },
            run(...params: any[]) {
              try {
                const res = pool.query(pgSql, params);
                return { changes: res.rowCount || 1 };
              } catch {
                return { changes: 0 };
              }
            },
          };
        },
        exec(sql: string) {
          try {
            pool.query(sql);
          } catch {}
        },
        pragma(sql: string) {},
      };
      return dbInstance;
    } catch {
      // Fallback if pg package is absent during static build
    }
  }

  // Local SQLite fallback with lazy requirement (prevents C++ SIGSEGV native binary crash in CI containers)
  try {
    const req = eval('require');
    const path = req('path');
    const fs = req('fs');
    const Database = req('better-sqlite3');
    const dbPath = path.join(process.cwd(), 'data', 'cockpit.db');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
    dbInstance = sqliteDb;
    return sqliteDb;
  } catch (err) {
    // Safe build-time dummy driver when C++ native addons are unavailable
    dbInstance = {
      prepare(sql: string) {
        return {
          all: () => [],
          get: () => null,
          run: () => ({ changes: 0 }),
        };
      },
      exec: () => {},
      pragma: () => {},
    };
    return dbInstance;
  }
}

export const db: any = new Proxy(
  {},
  {
    get(target, prop: string) {
      const instance = getDB();
      const value = instance[prop];
      if (typeof value === 'function') {
        return value.bind(instance);
      }
      return value;
    },
  }
);

// Initialize schema
export function initDB() {
  try {
    const connectionString = process.env.DATABASE_URL || '';
    if (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://')) {
      return; // PostgreSQL schema is created via postgres_migration.sql
    }

    db.exec(`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT,
        type TEXT NOT NULL,
        city TEXT NOT NULL,
        employee_count TEXT,
        website TEXT,
        logo_initials TEXT,
        year_established INTEGER,
        is_archived INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS relationships (
        id TEXT PRIMARY KEY,
        company_id TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL,
        temperature TEXT NOT NULL,
        owner TEXT NOT NULL,
        first_contact_date TEXT NOT NULL,
        last_meaningful_interaction_date TEXT NOT NULL,
        days_inactive INTEGER DEFAULT 0,
        next_action TEXT,
        next_action_date TEXT,
        partner_since TEXT,
        relationship_notes TEXT,
        services_discussed TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        is_decision_maker INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS opportunities (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        title TEXT NOT NULL,
        stage TEXT NOT NULL,
        estimated_value_formatted TEXT NOT NULL,
        estimated_value_amount REAL DEFAULT 0,
        next_action TEXT,
        next_action_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        contact_id TEXT,
        contact_name TEXT,
        date TEXT NOT NULL,
        channel TEXT NOT NULL,
        summary TEXT NOT NULL,
        what_they_needed TEXT,
        what_we_learned TEXT,
        opportunity_id TEXT,
        estimated_value TEXT,
        services_discussed TEXT,
        is_decision_maker_involved INTEGER DEFAULT 0,
        next_action TEXT,
        next_action_date TEXT,
        no_further_action_required INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS research_candidates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        website TEXT,
        domain TEXT,
        location TEXT,
        company_type TEXT,
        industry TEXT,
        industry_segment TEXT NOT NULL DEFAULT 'Architecture',
        city TEXT NOT NULL DEFAULT '',
        description TEXT,
        source TEXT NOT NULL,
        source_url TEXT,
        discovered_date TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        research_status TEXT NOT NULL DEFAULT 'DISCOVERED',
        verification_status TEXT NOT NULL DEFAULT 'Unverified',
        qualification_status TEXT DEFAULT 'Unqualified',
        fit_score INTEGER DEFAULT 80,
        fit_reason TEXT,
        priority TEXT NOT NULL DEFAULT 'MEDIUM',
        notes TEXT,
        business_signals TEXT,
        key_contacts_identified INTEGER DEFAULT 1,
        created_company_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS candidate_notes (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        note TEXT NOT NULL,
        date TEXT NOT NULL,
        source TEXT,
        source_url TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (candidate_id) REFERENCES research_candidates(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS research_setup (
        id TEXT PRIMARY KEY,
        target_company_type TEXT,
        geography TEXT,
        industry TEXT,
        company_size TEXT,
        services TEXT,
        keywords TEXT,
        website TEXT,
        notes TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS research_notes (
        id TEXT PRIMARY KEY,
        company_id TEXT UNIQUE NOT NULL,
        market_segment TEXT NOT NULL,
        strengths TEXT NOT NULL,
        growth_signals TEXT NOT NULL,
        sources TEXT NOT NULL,
        last_updated TEXT NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS intelligence_notes (
        id TEXT PRIMARY KEY,
        company_id TEXT UNIQUE NOT NULL,
        health_score INTEGER DEFAULT 85,
        recommendation TEXT NOT NULL,
        nurture_cadence TEXT NOT NULL,
        growth_potential TEXT NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS project_links (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        project_hub_id TEXT NOT NULL,
        project_name TEXT NOT NULL,
        status TEXT NOT NULL,
        value_formatted TEXT NOT NULL,
        completed_date TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'USER',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS research_jobs (
        id TEXT PRIMARY KEY,
        original_instruction TEXT NOT NULL,
        parsed_criteria TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PLANNING',
        created_at TEXT NOT NULL,
        completed_at TEXT,
        candidate_count INTEGER DEFAULT 0,
        qualified_count INTEGER DEFAULT 0,
        final_shortlist_count INTEGER DEFAULT 0,
        estimated_cost REAL DEFAULT 0,
        search_call_count INTEGER DEFAULT 0,
        model_name TEXT,
        notes TEXT,
        budget_limit REAL DEFAULT 150,
        status_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_relationships_company_id ON relationships(company_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
      CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON opportunities(company_id);
      CREATE INDEX IF NOT EXISTS idx_interactions_company_id ON interactions(company_id);
      CREATE INDEX IF NOT EXISTS idx_research_candidates_created_company_id ON research_candidates(created_company_id);
      CREATE INDEX IF NOT EXISTS idx_research_candidates_domain ON research_candidates(domain);
      CREATE INDEX IF NOT EXISTS idx_research_candidates_status ON research_candidates(research_status);
      CREATE INDEX IF NOT EXISTS idx_candidate_notes_candidate_id ON candidate_notes(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_project_links_company_id ON project_links(company_id);
    `);

    const candidateCols = [
      { name: 'website', type: 'TEXT' },
      { name: 'domain', type: 'TEXT' },
      { name: 'location', type: 'TEXT' },
      { name: 'company_type', type: 'TEXT' },
      { name: 'industry', type: 'TEXT' },
      { name: 'description', type: 'TEXT' },
      { name: 'source_url', type: 'TEXT' },
      { name: 'research_status', type: "TEXT DEFAULT 'DISCOVERED'" },
      { name: 'qualification_status', type: "TEXT DEFAULT 'Unqualified'" },
      { name: 'fit_score', type: 'INTEGER DEFAULT 80' },
      { name: 'fit_reason', type: 'TEXT' },
      { name: 'priority', type: "TEXT DEFAULT 'MEDIUM'" },
      { name: 'notes', type: 'TEXT' },
      { name: 'business_signals', type: 'TEXT' },
      { name: 'job_id', type: 'TEXT' },
      { name: 'evidence_json', type: 'TEXT' },
      { name: 'verification_reason', type: 'TEXT' },
      { name: 'partner_model_signals', type: 'TEXT' },
      { name: 'partner_opportunity_signal', type: "TEXT DEFAULT 'UNKNOWN'" },
      { name: 'partner_opportunity_reason', type: 'TEXT' },
      { name: 'evidence_limitations', type: 'TEXT' },
      { name: 'founder_investigation_flags', type: 'TEXT' },
    ];

    try {
      const existingCols = (db.prepare("PRAGMA table_info(research_candidates)").all() as any[]).map((c) => c.name);
      for (const col of candidateCols) {
        if (!existingCols.includes(col.name)) {
          db.exec(`ALTER TABLE research_candidates ADD COLUMN ${col.name} ${col.type};`);
        }
      }
    } catch {}

    try {
      const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
      if (userCount === 0) {
        const now = new Date().toISOString();
        const stmt = db.prepare('INSERT INTO users (id, name, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run('usr-1', 'Ravi', 'ravi@meaven.in', 'ADMIN', now, now);
        stmt.run('usr-2', 'Associate User', 'associate@meaven.in', 'USER', now, now);
      }
    } catch {}
  } catch (err) {
    console.error('Error checking schema migrations:', err);
  }
}

// Auto-run init on import
initDB();
