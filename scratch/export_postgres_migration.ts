import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';

function generatePostgresMigration() {
  const tables = [
    'users',
    'companies',
    'relationships',
    'contacts',
    'opportunities',
    'interactions',
    'research_candidates',
    'candidate_notes',
    'research_notes',
    'intelligence_notes',
    'project_links',
    'settings',
    'research_setup',
    'research_jobs',
  ];

  let sql = `-- MEAVEN FOUNDER COCKPIT - POSTGRESQL MIGRATION SCHEMA & DATA EXPORT
-- Generated automatically for local-to-production migration readiness
-- Compatible with PostgreSQL 12+, Supabase, Neon, AWS RDS

BEGIN;

-- 1. DROP EXISTING TABLES IF EXISTS (CLEAN REBUILD ORDER)
DROP TABLE IF EXISTS candidate_notes CASCADE;
DROP TABLE IF EXISTS research_notes CASCADE;
DROP TABLE IF EXISTS intelligence_notes CASCADE;
DROP TABLE IF EXISTS project_links CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS research_candidates CASCADE;
DROP TABLE IF EXISTS research_jobs CASCADE;
DROP TABLE IF EXISTS research_setup CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE POSTGRESQL TABLES WITH FULL CONSTRAINTS AND INDEXES

CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'USER',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE companies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  type VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  employee_count VARCHAR(100),
  website TEXT,
  logo_initials VARCHAR(10),
  year_established INTEGER,
  is_archived INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE relationships (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status VARCHAR(100) NOT NULL,
  temperature VARCHAR(50) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  first_contact_date DATE NOT NULL,
  last_meaningful_interaction_date DATE NOT NULL,
  days_inactive INTEGER DEFAULT 0,
  next_action TEXT,
  next_action_date DATE,
  partner_since DATE,
  relationship_notes TEXT,
  services_discussed JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE contacts (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(100),
  linkedin TEXT,
  notes TEXT,
  is_decision_maker INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE opportunities (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  stage VARCHAR(100) NOT NULL,
  estimated_value_formatted VARCHAR(100) NOT NULL,
  estimated_value_amount NUMERIC(15,2) DEFAULT 0,
  next_action TEXT,
  next_action_date DATE,
  is_archived INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE interactions (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id VARCHAR(255),
  contact_name VARCHAR(255),
  date DATE NOT NULL,
  channel VARCHAR(100) NOT NULL,
  summary TEXT NOT NULL,
  what_they_needed TEXT,
  what_we_learned TEXT,
  opportunity_id VARCHAR(255),
  estimated_value VARCHAR(100),
  services_discussed JSONB,
  is_decision_maker_involved INTEGER DEFAULT 0,
  next_action TEXT,
  next_action_date DATE,
  no_further_action_required INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE research_candidates (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website TEXT,
  domain VARCHAR(255),
  location VARCHAR(255),
  company_type VARCHAR(255),
  industry VARCHAR(255),
  industry_segment VARCHAR(255) NOT NULL DEFAULT 'Architecture',
  city VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT,
  source VARCHAR(255) NOT NULL,
  source_url TEXT,
  discovered_date DATE NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  research_status VARCHAR(100) NOT NULL DEFAULT 'DISCOVERED',
  verification_status VARCHAR(100) NOT NULL DEFAULT 'Unverified',
  verification_reason TEXT,
  qualification_status VARCHAR(100) DEFAULT 'Unqualified',
  fit_score INTEGER DEFAULT 80,
  ai_score INTEGER DEFAULT 80,
  fit_reason TEXT,
  priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
  notes TEXT,
  business_signals JSONB,
  partner_model_signals JSONB,
  partner_opportunity_signal VARCHAR(100) DEFAULT 'UNKNOWN',
  partner_opportunity_reason TEXT,
  evidence_json JSONB,
  evidence_limitations JSONB,
  founder_investigation_flags JSONB,
  key_contacts_identified INTEGER DEFAULT 1,
  created_company_id VARCHAR(255),
  job_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE candidate_notes (
  id VARCHAR(255) PRIMARY KEY,
  candidate_id VARCHAR(255) NOT NULL REFERENCES research_candidates(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  date DATE NOT NULL,
  source VARCHAR(255),
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE research_setup (
  id VARCHAR(255) PRIMARY KEY,
  target_company_type TEXT,
  geography TEXT,
  industry TEXT,
  company_size TEXT,
  services TEXT,
  keywords TEXT,
  website TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE research_notes (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  market_segment VARCHAR(255) NOT NULL,
  strengths JSONB NOT NULL,
  growth_signals JSONB NOT NULL,
  sources JSONB NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL
);

CREATE TABLE intelligence_notes (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  health_score INTEGER DEFAULT 85,
  recommendation TEXT NOT NULL,
  nurture_cadence VARCHAR(255) NOT NULL,
  growth_potential VARCHAR(255) NOT NULL
);

CREATE TABLE project_links (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_hub_id VARCHAR(255) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  status VARCHAR(100) NOT NULL,
  value_formatted VARCHAR(100) NOT NULL,
  completed_date DATE,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE settings (
  key VARCHAR(255) PRIMARY KEY,
  value_json JSONB NOT NULL
);

CREATE TABLE research_jobs (
  id VARCHAR(255) PRIMARY KEY,
  original_instruction TEXT NOT NULL,
  parsed_criteria JSONB NOT NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'PLANNING',
  created_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  candidate_count INTEGER DEFAULT 0,
  qualified_count INTEGER DEFAULT 0,
  final_shortlist_count INTEGER DEFAULT 0,
  estimated_cost NUMERIC(10,2) DEFAULT 0,
  search_call_count INTEGER DEFAULT 0,
  model_name VARCHAR(255),
  notes TEXT,
  budget_limit NUMERIC(10,2) DEFAULT 150,
  status_message TEXT
);

-- INDEXES FOR POSTGRESQL OPTIMIZATION
CREATE INDEX idx_relationships_company_id ON relationships(company_id);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX idx_interactions_company_id ON interactions(company_id);
CREATE INDEX idx_research_candidates_created_company_id ON research_candidates(created_company_id);
CREATE INDEX idx_research_candidates_domain ON research_candidates(domain);
CREATE INDEX idx_research_candidates_status ON research_candidates(research_status);
CREATE INDEX idx_candidate_notes_candidate_id ON candidate_notes(candidate_id);
CREATE INDEX idx_project_links_company_id ON project_links(company_id);

-- 3. DATA EXPORT (PRESERVING ALL LOCAL REPOSITORY DATA)
\n`;

  function escapeSqlVal(val: any, isJson: boolean = false): string {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? '1' : '0';
    let str = String(val);
    if (isJson) {
      try {
        // Validate JSON
        JSON.parse(str);
        return `'${str.replace(/'/g, "''")}'::jsonb`;
      } catch {
        return `'${JSON.stringify(str).replace(/'/g, "''")}'::jsonb`;
      }
    }
    return `'${str.replace(/'/g, "''")}'`;
  }

  for (const table of tables) {
    const rows = db.prepare(`SELECT * FROM ${table}`).all() as any[];
    if (rows.length === 0) continue;

    sql += `-- Data for ${table} (${rows.length} rows)\n`;
    const cols = Object.keys(rows[0]);

    for (const row of rows) {
      const valuesFormatted = cols.map(col => {
        const val = row[col];
        const isJsonCol = col.endsWith('_json') || col.endsWith('_signals') || col === 'services_discussed' || col === 'strengths' || col === 'sources' || col === 'parsed_criteria' || col === 'evidence_limitations' || col === 'founder_investigation_flags' || col === 'partner_model_signals';
        return escapeSqlVal(val, isJsonCol);
      });

      sql += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${valuesFormatted.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }

  sql += `COMMIT;\n`;

  const outputPath = path.join(process.cwd(), 'data', 'postgres_migration.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`✓ PostgreSQL Migration Script generated at: ${outputPath}`);
}

generatePostgresMigration();
