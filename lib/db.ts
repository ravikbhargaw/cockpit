import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'cockpit.db');

// Ensure data folder exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initDB() {
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
      services_discussed TEXT, -- JSON array string
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
      services_discussed TEXT, -- JSON array string
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
      strengths TEXT NOT NULL, -- JSON array string
      growth_signals TEXT NOT NULL, -- JSON array string
      sources TEXT NOT NULL, -- JSON array string
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

    -- Targeted SQLite Indexes for Performance Optimization
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

  // Safely perform alter table migrations using schema inspection
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
    const existingCols = (db.prepare("PRAGMA table_info(research_candidates)").all() as any[]).map(c => c.name);
    for (const col of candidateCols) {
      if (!existingCols.includes(col.name)) {
        db.exec(`ALTER TABLE research_candidates ADD COLUMN ${col.name} ${col.type};`);
      }
    }

    const contactCols = [
      { name: 'linkedin', type: 'TEXT' },
      { name: 'notes', type: 'TEXT' },
      { name: 'is_archived', type: 'INTEGER DEFAULT 0' },
    ];
    const existingContactCols = (db.prepare("PRAGMA table_info(contacts)").all() as any[]).map(c => c.name);
    for (const col of contactCols) {
      if (!existingContactCols.includes(col.name)) {
        db.exec(`ALTER TABLE contacts ADD COLUMN ${col.name} ${col.type};`);
      }
    }

    const oppCols = [
      { name: 'is_archived', type: 'INTEGER DEFAULT 0' },
    ];
    const existingOppCols = (db.prepare("PRAGMA table_info(opportunities)").all() as any[]).map(c => c.name);
    for (const col of oppCols) {
      if (!existingOppCols.includes(col.name)) {
        db.exec(`ALTER TABLE opportunities ADD COLUMN ${col.name} ${col.type};`);
      }
    }
  } catch (err) {
    console.error('Error checking schema migrations:', err);
  }

  // Auto-seed demo data if empty (disabled for clean pilot dataset)
  // seedDemoDataIfEmpty();

  // Normalize existing opportunity values to pure numeric amounts & proper UTF-8 INR formatting
  try {
    db.exec(`
      UPDATE opportunities SET estimated_value_amount = 8500000, estimated_value_formatted = '₹85,00,000' WHERE id = 'opp-demo-1';
      UPDATE opportunities SET estimated_value_amount = 7500000, estimated_value_formatted = '₹75,00,000' WHERE id = 'opp-1789670469238';
      UPDATE opportunities SET estimated_value_amount = 230000, estimated_value_formatted = '₹2,30,000' WHERE id = 'opp-1789672640652';
    `);
  } catch (err) {}

  try {
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    if (userCount === 0) {
      const now = new Date().toISOString();
      const stmt = db.prepare('INSERT INTO users (id, name, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
      stmt.run('usr-1', 'Ravi', 'ravi@meaven.in', 'ADMIN', now, now);
      stmt.run('usr-2', 'Associate User', 'associate@meaven.in', 'USER', now, now);
    }
  } catch (err) {}
}


function seedDemoDataIfEmpty() {
  const companyCount = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
  if (companyCount.count > 0) return;

  const now = new Date().toISOString();

  // Seed Companies
  const companies = [
    {
      id: "comp-demo-1",
      name: "Northstar Interiors (Demo)",
      domain: "northstardesign.co",
      type: "Interior Design",
      city: "Mumbai",
      employee_count: "25-50",
      website: "https://northstardesign.co",
      logo_initials: "NI",
      year_established: 2017,
    },
    {
      id: "comp-demo-2",
      name: "Studio Arc (Demo)",
      domain: "studioarc.in",
      type: "Architecture",
      city: "Bengaluru",
      employee_count: "50-100",
      website: "https://studioarc.in",
      logo_initials: "SA",
      year_established: 2014,
    },
    {
      id: "comp-demo-3",
      name: "BuildLab Design (Demo)",
      domain: "buildlab.io",
      type: "Turnkey D&B",
      city: "Delhi NCR",
      employee_count: "10-25",
      website: "https://buildlab.io",
      logo_initials: "BL",
      year_established: 2019,
    },
  ];

  const insertCompany = db.prepare(`
    INSERT INTO companies (id, name, domain, type, city, employee_count, website, logo_initials, year_established, is_archived, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);

  for (const c of companies) {
    insertCompany.run(c.id, c.name, c.domain, c.type, c.city, c.employee_count, c.website, c.logo_initials, c.year_established, now, now);
  }

  // Seed Relationships
  const insertRel = db.prepare(`
    INSERT INTO relationships (id, company_id, status, temperature, owner, first_contact_date, last_meaningful_interaction_date, days_inactive, next_action, next_action_date, partner_since, relationship_notes, services_discussed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRel.run(
    "rel-demo-1",
    "comp-demo-1",
    "Active Partner",
    "Warm",
    "Ravi",
    "2025-11-10",
    "2026-08-27",
    21,
    "Follow up regarding upcoming luxury residential pipeline",
    "2026-09-18",
    "2026-02-15",
    "Key partner for premium interior execution (Demo Record).",
    JSON.stringify(["Bespoke Joinery", "Turnkey Fitout"]),
    now,
    now
  );

  insertRel.run(
    "rel-demo-2",
    "comp-demo-2",
    "Opportunity",
    "Hot",
    "Ravi",
    "2026-01-14",
    "2026-09-12",
    5,
    "Review commercial proposal terms and schedule closing meeting",
    "2026-09-19",
    null,
    "Leading architecture firm in South India (Demo Record).",
    JSON.stringify(["Architectural Millwork"]),
    now,
    now
  );

  insertRel.run(
    "rel-demo-3",
    "comp-demo-3",
    "Active Partner",
    "Hot",
    "Ravi",
    "2025-09-01",
    "2026-09-15",
    2,
    "Prepare design coordination kickoff for North Plaza project",
    "2026-09-22",
    "2025-12-01",
    "Strategic Design-Build partner in NCR (Demo Record).",
    JSON.stringify(["Full Turnkey Execution"]),
    now,
    now
  );

  // Seed Contacts
  const insertContact = db.prepare(`
    INSERT INTO contacts (id, company_id, name, role, email, phone, is_decision_maker, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertContact.run("cnt-demo-1", "comp-demo-1", "Ar. Priya Sharma", "Design Director & Founder", "priya@northstardesign.co", "+91 98200 11223", 1, now, now);
  insertContact.run("cnt-demo-2", "comp-demo-2", "Rajesh Iyer", "Managing Principal", "riyer@studioarc.in", "+91 98450 33445", 1, now, now);

  // Seed Opportunities
  const insertOpp = db.prepare(`
    INSERT INTO opportunities (id, company_id, title, stage, estimated_value_formatted, estimated_value_amount, next_action, next_action_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOpp.run("opp-demo-1", "comp-demo-2", "Bengaluru Tech Park - Phase 2 (Demo)", "Proposal", "₹85 Lac", 8500000, "Submit refined BOQ schedule", "2026-09-19", now, now);

  // Seed Interactions
  const insertInt = db.prepare(`
    INSERT INTO interactions (id, company_id, contact_id, contact_name, date, channel, summary, what_they_needed, what_we_learned, opportunity_id, estimated_value, services_discussed, is_decision_maker_involved, next_action, next_action_date, no_further_action_required, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertInt.run(
    "int-demo-1",
    "comp-demo-1",
    "cnt-demo-1",
    "Ar. Priya Sharma",
    "2026-08-27",
    "Meeting",
    "Reviewed upcoming Q4 luxury residential portfolio (Demo Record).",
    "Joinery precision manufacturing",
    "Expanding into Goa luxury villas",
    null,
    null,
    JSON.stringify(["Joinery"]),
    1,
    "Follow up regarding upcoming Goa villa project pipeline",
    "2026-09-18",
    0,
    now
  );

  // Seed Research Candidates
  const insertCandidate = db.prepare(`
    INSERT INTO research_candidates (id, name, industry_segment, city, source, ai_score, verification_status, discovered_date, summary, key_contacts_identified, created_company_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCandidate.run(
    "rc-demo-1",
    "Apex Workspaces (Demo Candidate)",
    "Turnkey D&B",
    "Mumbai",
    "AI Discovery Engine",
    92,
    "Qualified",
    "2026-09-14",
    "Fast-growing commercial interior studio delivering tech office headquarters across Western India.",
    3,
    null,
    now,
    now
  );
}

// Auto-run init on import
initDB();
