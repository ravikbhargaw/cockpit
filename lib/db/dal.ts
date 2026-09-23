import { db } from '../db';
import { formatINR, normalizeDomain } from '@/lib/utils';
import { VerificationStatus, PartnerOpportunitySignal } from '@/types';

export const DAL = {
  // Companies
  getCompanies(status?: string, search?: string) {
    let query = `
      SELECT c.*, r.status as relationship_status, r.temperature as relationship_temperature
      FROM companies c
      LEFT JOIN relationships r ON c.id = r.company_id
      WHERE c.is_archived = 0
    `;
    const params: any[] = [];

    if (status && status !== 'All') {
      query += ` AND r.status = ?`;
      params.push(status);
    }
    if (search && search.trim() !== '') {
      query += ` AND (c.name LIKE ? OR c.city LIKE ? OR c.type LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY c.created_at DESC`;
    const rows = db.prepare(query).all(...params) as any[];

    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      domain: c.domain,
      type: c.type,
      city: c.city,
      employeeCount: c.employee_count,
      website: c.website,
      logoInitials: c.logo_initials,
      yearEstablished: c.year_established,
      status: c.relationship_status || 'Prospect',
      temperature: c.relationship_temperature || 'Warm',
      relationship: {
        status: c.relationship_status || 'Prospect',
        nextAction: '',
      }
    }));
  },

  getCompanyById(id: string) {
    const company = db.prepare('SELECT * FROM companies WHERE id = ? AND is_archived = 0').get(id) as any;
    if (!company) return null;

    const relationship = db.prepare('SELECT * FROM relationships WHERE company_id = ?').get(id) as any;
    const contacts = db.prepare('SELECT * FROM contacts WHERE company_id = ? AND (is_archived IS NULL OR is_archived = 0) ORDER BY is_decision_maker DESC, created_at ASC').all(id) as any[];
    const opportunities = db.prepare('SELECT * FROM opportunities WHERE company_id = ? AND (is_archived IS NULL OR is_archived = 0) ORDER BY created_at DESC').all(id) as any[];
    const interactions = db.prepare('SELECT * FROM interactions WHERE company_id = ? ORDER BY date DESC').all(id) as any[];
    const research = db.prepare('SELECT * FROM research_notes WHERE company_id = ?').get(id) as any;
    const intelligence = db.prepare('SELECT * FROM intelligence_notes WHERE company_id = ?').get(id) as any;
    const projectLinks = db.prepare('SELECT * FROM project_links WHERE company_id = ?').all(id) as any[];

    // Fetch linked research candidate data if available
    const candidateRow = db.prepare("SELECT * FROM research_candidates WHERE created_company_id = ? OR (domain IS NOT NULL AND domain != '' AND domain = ?)").get(id, company.domain || '') as any;
    let candidateData = null;
    if (candidateRow) {
      candidateData = DAL.getCandidateById(candidateRow.id);
    }

    return {
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain,
        type: company.type,
        city: company.city,
        employeeCount: company.employee_count,
        website: company.website,
        logoInitials: company.logo_initials,
        yearEstablished: company.year_established,
      },
      relationship: relationship ? {
        id: relationship.id,
        companyId: relationship.company_id,
        status: relationship.status,
        temperature: relationship.temperature,
        owner: relationship.owner,
        firstContactDate: relationship.first_contact_date,
        lastMeaningfulInteractionDate: relationship.last_meaningful_interaction_date,
        daysInactive: relationship.days_inactive,
        nextAction: relationship.next_action,
        nextActionDate: relationship.next_action_date,
        partnerSince: relationship.partner_since,
        relationshipNotes: relationship.relationship_notes,
        servicesDiscussed: relationship.services_discussed ? JSON.parse(relationship.services_discussed) : [],
      } : null,
      contacts: contacts.map(c => ({
        id: c.id,
        companyId: c.company_id,
        name: c.name,
        role: c.role,
        email: c.email,
        phone: c.phone,
        linkedin: c.linkedin || '',
        notes: c.notes || '',
        isDecisionMaker: Boolean(c.is_decision_maker),
      })),
      opportunities: opportunities.map(o => ({
        id: o.id,
        companyId: o.company_id,
        title: o.title,
        stage: o.stage,
        estimatedValueFormatted: formatINR(o.estimated_value_amount),
        estimatedValueAmount: o.estimated_value_amount || 0,
        nextAction: o.next_action,
        nextActionDate: o.next_action_date,
      })),
      interactions: interactions.map(i => ({
        id: i.id,
        companyId: i.company_id,
        contactName: i.contact_name,
        date: i.date,
        channel: i.channel,
        summary: i.summary,
        whatTheyNeeded: i.what_they_needed,
        whatWeLearned: i.what_we_learned,
        nextAction: i.next_action,
        nextActionDate: i.next_action_date,
      })),
      research: research ? {
        id: research.id,
        companyId: research.company_id,
        marketSegment: research.market_segment,
        strengths: JSON.parse(research.strengths || '[]'),
        growthSignals: JSON.parse(research.growth_signals || '[]'),
        sources: JSON.parse(research.sources || '[]'),
      } : null,
      candidateResearch: candidateData,
      intelligence: intelligence ? {
        id: intelligence.id,
        companyId: intelligence.company_id,
        healthScore: intelligence.health_score,
        recommendation: intelligence.recommendation,
        nurtureCadence: intelligence.nurture_cadence,
        growthPotential: intelligence.growth_potential,
      } : null,
      projectLinks: projectLinks.map(p => ({
        id: p.id,
        companyId: p.company_id,
        projectHubId: p.project_hub_id,
        projectName: p.project_name,
        status: p.status,
        valueFormatted: p.value_formatted,
      })),
    };
  },

  // Opportunities
  getOpportunities(companyId?: string) {
    let query = `
      SELECT o.*, c.name as company_name
      FROM opportunities o
      JOIN companies c ON o.company_id = c.id
      WHERE c.is_archived = 0
    `;
    const params: any[] = [];

    if (companyId) {
      query += ` AND o.company_id = ?`;
      params.push(companyId);
    }

    query += ` ORDER BY o.created_at DESC`;
    const rows = db.prepare(query).all(...params) as any[];

    return rows.map((o) => {
      const numericAmount = o.estimated_value_amount || 0;
      return {
        id: o.id,
        companyId: o.company_id,
        companyName: o.company_name,
        title: o.title,
        stage: o.stage,
        estimatedValueFormatted: formatINR(numericAmount),
        estimatedValueAmount: numericAmount,
        nextAction: o.next_action,
        nextActionDate: o.next_action_date,
        createdDate: o.created_at.split('T')[0],
      };
    });
  },

  // --- SPRINT 4: RESEARCH WORKBENCH DAL METHODS ---

  getResearchSetup() {
    const row = db.prepare('SELECT * FROM research_setup LIMIT 1').get() as any;
    if (!row) {
      return {
        targetCompanyType: 'Boutique Interior Design Firm',
        geography: 'Bangalore',
        industry: 'Commercial / Office Interiors',
        companySize: '5-50',
        services: 'Design + D&B',
        keywords: 'workspace, office interiors',
        website: '',
        notes: '',
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      targetCompanyType: row.target_company_type || '',
      geography: row.geography || '',
      industry: row.industry || '',
      companySize: row.company_size || '',
      services: row.services || '',
      keywords: row.keywords || '',
      website: row.website || '',
      notes: row.notes || '',
      updatedAt: row.updated_at,
    };
  },

  saveResearchSetup(data: any) {
    const existing = db.prepare('SELECT id FROM research_setup LIMIT 1').get() as any;
    const now = new Date().toISOString();
    if (existing) {
      db.prepare(`
        UPDATE research_setup SET
          target_company_type = ?, geography = ?, industry = ?, company_size = ?,
          services = ?, keywords = ?, website = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `).run(
        data.targetCompanyType || '',
        data.geography || '',
        data.industry || '',
        data.companySize || '',
        data.services || '',
        data.keywords || '',
        data.website || '',
        data.notes || '',
        now,
        existing.id
      );
    } else {
      const id = `setup-${Date.now()}`;
      db.prepare(`
        INSERT INTO research_setup (id, target_company_type, geography, industry, company_size, services, keywords, website, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.targetCompanyType || '',
        data.geography || '',
        data.industry || '',
        data.companySize || '',
        data.services || '',
        data.keywords || '',
        data.website || '',
        data.notes || '',
        now
      );
    }
    return this.getResearchSetup();
  },

  getResearchQueueMetrics() {
    const total = db.prepare('SELECT COUNT(*) as count FROM research_candidates').get() as { count: number };
    const ready = db.prepare("SELECT COUNT(*) as count FROM research_candidates WHERE research_status = 'READY_FOR_REVIEW'").get() as { count: number };
    const highPrio = db.prepare("SELECT COUNT(*) as count FROM research_candidates WHERE priority = 'HIGH'").get() as { count: number };
    const approved = db.prepare("SELECT COUNT(*) as count FROM research_candidates WHERE research_status = 'APPROVED'").get() as { count: number };

    return {
      totalCandidates: total.count,
      readyForReview: ready.count,
      highPriority: highPrio.count,
      approved: approved.count,
    };
  },

  mapCandidateRow(row: any, isListOnly: boolean = false): any {
    if (!row) return null;
    let businessSignals: any = {};
    try {
      if (row.business_signals) businessSignals = JSON.parse(row.business_signals);
    } catch (e) {}

    let evidenceList: any[] = [];
    if (row.evidence_json) {
      try {
        evidenceList = JSON.parse(row.evidence_json);
      } catch (e) {}
    }

    let partnerModelSignals: string[] = [];
    try {
      if (row.partner_model_signals) partnerModelSignals = JSON.parse(row.partner_model_signals);
    } catch (e) {}

    let founderInvestigationFlags: string[] = [];
    try {
      if (row.founder_investigation_flags) founderInvestigationFlags = JSON.parse(row.founder_investigation_flags);
    } catch (e) {}

    const companyName = row.name || row.company_name || 'Untitled Candidate';
    const city = row.location || row.city || '';
    const industrySegment = row.industry || row.industry_segment || 'Architecture';
    const summary = row.description || row.summary || '';
    const discoveredDate = row.discovered_date || row.created_at || new Date().toISOString().split('T')[0];
    const fitScore = row.fit_score !== undefined && row.fit_score !== null ? row.fit_score : (row.ai_score || 80);

    let verStatus: VerificationStatus = 'UNVERIFIED';
    let verReason = row.verification_reason || '';

    // Check stored evidence list for KNOWN website verification
    const hasVerifiedWebsiteClaim = evidenceList.some(ev =>
      ev.status === 'KNOWN' &&
      (ev.claim.toLowerCase().includes('verified active website') ||
       ev.claim.toLowerCase().includes('identifiable company website') ||
       ev.claim.toLowerCase().includes('official website'))
    );

    const dbVerStatus = (row.verification_status || '').toUpperCase();

    if (dbVerStatus && dbVerStatus !== 'UNVERIFIED' && ['VERIFIED', 'PARTIALLY_VERIFIED', 'DOMAIN_MISMATCH', 'PARKED_DOMAIN', 'INACTIVE_DOMAIN'].includes(dbVerStatus)) {
      verStatus = dbVerStatus as VerificationStatus;
    } else if (hasVerifiedWebsiteClaim || (row.website && row.website.trim() !== '' && row.verification_status === 'Approved')) {
      verStatus = 'VERIFIED';
      if (!verReason) verReason = `Verified: Active website confirmed for ${companyName} (${row.website || 'official website'}).`;
    } else {
      verStatus = 'UNVERIFIED';
      if (!verReason) verReason = `Unverified: Public website content for ${companyName} could not be fully verified from evidence.`;
    }

    // Partner Opportunity Signal Backward Compatibility
    let oppSignal: PartnerOpportunitySignal = 'UNKNOWN';
    let oppReason = row.partner_opportunity_reason || '';
    let evidenceLim = row.evidence_limitations || '';

    const dbOppSignal = (row.partner_opportunity_signal || '').toUpperCase();
    if (dbOppSignal && dbOppSignal !== 'UNKNOWN' && ['HIGH', 'MEDIUM', 'LOW'].includes(dbOppSignal)) {
      oppSignal = dbOppSignal as PartnerOpportunitySignal;
    } else {
      oppSignal = 'UNKNOWN';
      if (!oppReason) {
        oppReason = 'Partner opportunity was not established by captured research data and requires founder investigation.';
      }
    }

    if (!evidenceLim) {
      const unknownClaims = evidenceList.filter(ev => ev.status === 'UNKNOWN').map(ev => ev.claim);
      if (unknownClaims.length > 0) {
        evidenceLim = `Public evidence limitations: ${unknownClaims.slice(0, 2).join(' ')}`;
      } else {
        evidenceLim = 'Public web evidence captured; operational vendor subcontracting model requires founder verification.';
      }
    }

    // Founder Investigation Flags Backward Compatibility
    if (!founderInvestigationFlags || founderInvestigationFlags.length === 0) {
      const derivedFlags: string[] = [];
      const unknownText = evidenceList.filter(ev => ev.status === 'UNKNOWN').map(ev => ev.claim.toLowerCase()).join(' ');

      if (unknownText.includes('commercial')) {
        derivedFlags.push('⚠️ Commercial project focus is not established by captured evidence — verify before outreach.');
      }
      if (unknownText.includes('turnkey') || unknownText.includes('design-and-build') || unknownText.includes('execution')) {
        derivedFlags.push('⚠️ Turnkey / design-and-build execution capability is not established by captured evidence — verify execution model.');
      }
      if (derivedFlags.length === 0 && verStatus === 'VERIFIED') {
        derivedFlags.push('⚠️ Confirm whether specialist or overflow execution is handled in-house or outsourced.');
      }

      founderInvestigationFlags = derivedFlags;
    }

    // Partner Model Signals Backward Compatibility
    if (!partnerModelSignals || partnerModelSignals.length === 0) {
      const derivedSignals: string[] = [];
      if (summary.toLowerCase().includes('boutique') || summary.toLowerCase().includes('residential')) {
        derivedSignals.push('Boutique Design Focus');
      }
      if (summary.toLowerCase().includes('commercial') || summary.toLowerCase().includes('office')) {
        derivedSignals.push('Commercial Capability');
      }
      if (verStatus === 'VERIFIED') {
        derivedSignals.push('Identifiable Website');
      }
      partnerModelSignals = derivedSignals.length > 0 ? derivedSignals : ['General Design Practice'];
    }

    return {
      id: row.id,
      companyName,
      name: companyName,
      website: row.website || '',
      domain: row.domain || normalizeDomain(row.website),
      location: city,
      city: city,
      companyType: row.company_type || industrySegment,
      industry: industrySegment,
      industrySegment,
      description: summary,
      summary,
      source: row.source || 'AI Research Engine',
      sourceUrl: row.source_url || '',
      discoveredAt: discoveredDate,
      discoveredDate,
      researchStatus: row.research_status || 'DISCOVERED',
      verificationStatus: verStatus,
      verificationReason: verReason,
      qualificationStatus: row.qualification_status || 'Unqualified',
      fitScore,
      aiScore: fitScore,
      fitReason: row.fit_reason || '',
      priority: row.priority || 'MEDIUM',
      notes: row.notes || '',
      businessSignals,
      partnerModelSignals,
      partnerOpportunitySignal: oppSignal,
      partnerOpportunityReason: oppReason,
      evidenceLimitations: evidenceLim,
      founderInvestigationFlags,
      keyContactsIdentified: row.key_contacts_identified || 1,
      createdCompanyId: row.created_company_id || null,
      jobId: row.job_id || null,
      evidenceList: isListOnly ? [] : evidenceList,
      createdAt: row.created_at || discoveredDate,
      updatedAt: row.updated_at || discoveredDate,
    };
  },

  // --- SPRINT 5: AI RESEARCH JOB DAL METHODS ---

  createResearchJob(instruction: string, criteria: any, modelName?: string, budgetLimit: number = 150) {
    const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const criteriaJson = typeof criteria === 'string' ? criteria : JSON.stringify(criteria || {});
    const activeModel = modelName || process.env.RESEARCH_AI_MODEL || 'gpt-5.6-luna';

    db.prepare(`
      INSERT INTO research_jobs (
        id, original_instruction, parsed_criteria, status, created_at,
        candidate_count, qualified_count, final_shortlist_count, estimated_cost,
        search_call_count, model_name, budget_limit, status_message
      ) VALUES (?, ?, ?, 'PLANNING', ?, 0, 0, 0, 0.0, 0, ?, ?, 'Initializing research plan...')
    `).run(id, instruction, criteriaJson, now, activeModel, budgetLimit);

    return DAL.getResearchJobById(id);
  },

  getResearchJobs() {
    const rows = db.prepare('SELECT * FROM research_jobs ORDER BY created_at DESC').all() as any[];
    return rows.map(r => DAL.mapResearchJobRow(r));
  },

  getResearchJobById(id: string) {
    const row = db.prepare('SELECT * FROM research_jobs WHERE id = ?').get(id) as any;
    if (!row) return null;
    return DAL.mapResearchJobRow(row);
  },

  mapResearchJobRow(row: any) {
    if (!row) return null;
    let parsedCriteria = {};
    try {
      if (row.parsed_criteria) parsedCriteria = JSON.parse(row.parsed_criteria);
    } catch (e) {}

    return {
      id: row.id,
      originalInstruction: row.original_instruction,
      parsedCriteria,
      status: row.status,
      createdAt: row.created_at,
      completedAt: row.completed_at || null,
      candidateCount: row.candidate_count || 0,
      qualifiedCount: row.qualified_count || 0,
      finalShortlistCount: row.final_shortlist_count || 0,
      estimatedCost: row.estimated_cost || 0,
      searchCallCount: row.search_call_count || 0,
      modelName: row.model_name || 'gpt-5.6-luna',
      notes: row.notes || '',
      budgetLimit: row.budget_limit || 150,
      statusMessage: row.status_message || '',
    };
  },

  updateResearchJobStatus(id: string, status: string, statusMessage?: string, notes?: string) {
    const now = new Date().toISOString();
    const completedAt = (status === 'COMPLETED' || status === 'READY_FOR_REVIEW' || status === 'FAILED') ? now : null;

    db.prepare(`
      UPDATE research_jobs SET
        status = ?,
        status_message = COALESCE(?, status_message),
        notes = COALESCE(?, notes),
        completed_at = COALESCE(?, completed_at)
      WHERE id = ?
    `).run(status, statusMessage || null, notes || null, completedAt, id);

    return DAL.getResearchJobById(id);
  },

  updateResearchJobMetrics(id: string, metrics: {
    candidateCount?: number;
    qualifiedCount?: number;
    finalShortlistCount?: number;
    estimatedCost?: number;
    searchCallCount?: number;
    status?: string;
    statusMessage?: string;
  }) {
    const existing = db.prepare('SELECT * FROM research_jobs WHERE id = ?').get(id) as any;
    if (!existing) return null;

    const candCount = metrics.candidateCount !== undefined ? metrics.candidateCount : existing.candidate_count;
    const qualCount = metrics.qualifiedCount !== undefined ? metrics.qualifiedCount : existing.qualified_count;
    const shortCount = metrics.finalShortlistCount !== undefined ? metrics.finalShortlistCount : existing.final_shortlist_count;
    const estCost = metrics.estimatedCost !== undefined ? metrics.estimatedCost : existing.estimated_cost;
    const searchCalls = metrics.searchCallCount !== undefined ? metrics.searchCallCount : existing.search_call_count;
    const status = metrics.status || existing.status;
    const statusMsg = metrics.statusMessage || existing.status_message;

    db.prepare(`
      UPDATE research_jobs SET
        candidate_count = ?,
        qualified_count = ?,
        final_shortlist_count = ?,
        estimated_cost = ?,
        search_call_count = ?,
        status = ?,
        status_message = ?
      WHERE id = ?
    `).run(candCount, qualCount, shortCount, estCost, searchCalls, status, statusMsg, id);

    return DAL.getResearchJobById(id);
  },

  getResearchCandidates(statusFilter?: string, searchQuery?: string, isListOnly: boolean = false) {
    let query = 'SELECT * FROM research_candidates WHERE 1=1';
    const params: any[] = [];

    if (statusFilter && statusFilter !== 'All') {
      query += ' AND research_status = ?';
      params.push(statusFilter);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = `%${searchQuery.trim()}%`;
      query += ' AND (name LIKE ? OR location LIKE ? OR city LIKE ? OR company_type LIKE ? OR industry LIKE ? OR source LIKE ?)';
      params.push(q, q, q, q, q, q);
    }

    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => DAL.mapCandidateRow(r, isListOnly));
  },

  getCandidateById(id: string): any {
    const row = db.prepare('SELECT * FROM research_candidates WHERE id = ?').get(id) as any;
    if (!row) return null;

    const candidate = DAL.mapCandidateRow(row, false);
    const notesRows = db.prepare('SELECT * FROM candidate_notes WHERE candidate_id = ? ORDER BY date DESC, created_at DESC').all(id) as any[];

    candidate.candidateNotes = notesRows.map(n => ({
      id: n.id,
      candidateId: n.candidate_id,
      note: n.note,
      date: n.date,
      source: n.source || '',
      sourceUrl: n.source_url || '',
      createdAt: n.created_at,
    }));

    if (candidate.jobId) {
      const jobRow = db.prepare('SELECT original_instruction FROM research_jobs WHERE id = ?').get(candidate.jobId) as any;
      if (jobRow) {
        candidate.originatingInstruction = jobRow.original_instruction;
      }
    }

    return candidate;
  },

  createResearchCandidate(data: any) {
    const id = `rc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const dateStr = now.split('T')[0];

    const companyName = data.companyName || data.name || 'Untitled Candidate';
    const website = data.website || '';
    const domain = data.domain || normalizeDomain(website);
    const location = data.location || data.city || '';
    const companyType = data.companyType || data.industrySegment || 'Architecture';
    const industry = data.industry || data.industrySegment || companyType;
    const description = data.description || data.summary || '';
    const source = data.source || 'AI Research Engine';
    const sourceUrl = data.sourceUrl || '';
    const fitScore = data.fitScore !== undefined ? Number(data.fitScore) : (data.aiScore !== undefined ? Number(data.aiScore) : 80);
    const priority = data.priority || 'MEDIUM';
    const jobId = data.jobId || null;
    const evidenceJson = data.evidenceList ? JSON.stringify(data.evidenceList) : (data.evidenceJson || null);

    const verificationStatus = data.verificationStatus || 'UNVERIFIED';
    const verificationReason = data.verificationReason || '';
    const partnerModelSignals = data.partnerModelSignals ? JSON.stringify(data.partnerModelSignals) : null;
    const partnerOpportunitySignal = data.partnerOpportunitySignal || 'UNKNOWN';
    const partnerOpportunityReason = data.partnerOpportunityReason || '';
    const evidenceLimitations = data.evidenceLimitations || '';
    const founderInvestigationFlags = data.founderInvestigationFlags ? JSON.stringify(data.founderInvestigationFlags) : null;

    db.prepare(`
      INSERT INTO research_candidates (
        id, name, website, domain, location, company_type, industry, industry_segment, city,
        description, source, source_url, discovered_date, summary, research_status, verification_status,
        verification_reason, partner_model_signals, partner_opportunity_signal, partner_opportunity_reason,
        evidence_limitations, founder_investigation_flags, qualification_status, fit_score, fit_reason,
        priority, notes, business_signals, key_contacts_identified, job_id, evidence_json, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      id, companyName, website, domain, location, companyType, industry, industry, location,
      description, source, sourceUrl, dateStr, description, data.researchStatus || 'DISCOVERED', verificationStatus,
      verificationReason, partnerModelSignals, partnerOpportunitySignal, partnerOpportunityReason,
      evidenceLimitations, founderInvestigationFlags, data.qualificationStatus || 'Unqualified', fitScore, data.fitReason || '',
      priority, data.notes || '', JSON.stringify(data.businessSignals || {}), 1, jobId, evidenceJson, now, now
    );

    if (data.initialNote || data.notes) {
      const noteText = data.initialNote || data.notes;
      const noteId = `cnote-${Date.now()}`;
      db.prepare(`
        INSERT INTO candidate_notes (id, candidate_id, note, date, source, source_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(noteId, id, noteText, dateStr, source, sourceUrl, now);
    }

    return DAL.getCandidateById(id);
  },

  updateCandidate(id: string, data: any) {
    const existing = db.prepare('SELECT * FROM research_candidates WHERE id = ?').get(id) as any;
    if (!existing) return null;

    const now = new Date().toISOString();
    const companyName = data.companyName !== undefined ? data.companyName : (data.name !== undefined ? data.name : existing.name);
    const website = data.website !== undefined ? data.website : existing.website;
    const domain = data.domain !== undefined ? data.domain : (website ? normalizeDomain(website) : existing.domain);
    const location = data.location !== undefined ? data.location : (data.city !== undefined ? data.city : existing.location);
    const companyType = data.companyType !== undefined ? data.companyType : existing.company_type;
    const industry = data.industry !== undefined ? data.industry : existing.industry;
    const description = data.description !== undefined ? data.description : (data.summary !== undefined ? data.summary : existing.description);
    const source = data.source !== undefined ? data.source : existing.source;
    const sourceUrl = data.sourceUrl !== undefined ? data.sourceUrl : existing.source_url;
    const researchStatus = data.researchStatus !== undefined ? data.researchStatus : existing.research_status;
    const verificationStatus = data.verificationStatus !== undefined ? data.verificationStatus : existing.verification_status;
    const verificationReason = data.verificationReason !== undefined ? data.verificationReason : existing.verification_reason;
    const fitScore = data.fitScore !== undefined ? Number(data.fitScore) : (data.aiScore !== undefined ? Number(data.aiScore) : existing.fit_score);
    const fitReason = data.fitReason !== undefined ? data.fitReason : existing.fit_reason;
    const priority = data.priority !== undefined ? data.priority : existing.priority;
    const notes = data.notes !== undefined ? data.notes : existing.notes;
    const businessSignals = data.businessSignals !== undefined ? JSON.stringify(data.businessSignals) : existing.business_signals;
    const partnerModelSignals = data.partnerModelSignals !== undefined ? JSON.stringify(data.partnerModelSignals) : existing.partner_model_signals;
    const partnerOpportunitySignal = data.partnerOpportunitySignal !== undefined ? data.partnerOpportunitySignal : existing.partner_opportunity_signal;
    const partnerOpportunityReason = data.partnerOpportunityReason !== undefined ? data.partnerOpportunityReason : existing.partner_opportunity_reason;
    const evidenceLimitations = data.evidenceLimitations !== undefined ? data.evidenceLimitations : existing.evidence_limitations;
    const founderInvestigationFlags = data.founderInvestigationFlags !== undefined ? JSON.stringify(data.founderInvestigationFlags) : existing.founder_investigation_flags;
    const jobId = data.jobId !== undefined ? data.jobId : existing.job_id;
    const evidenceJson = data.evidenceList !== undefined ? JSON.stringify(data.evidenceList) : (data.evidenceJson !== undefined ? data.evidenceJson : existing.evidence_json);

    db.prepare(`
      UPDATE research_candidates SET
        name = ?, website = ?, domain = ?, location = ?, company_type = ?, industry = ?,
        industry_segment = ?, city = ?, description = ?, source = ?, source_url = ?,
        summary = ?, research_status = ?, verification_status = ?, verification_reason = ?,
        partner_model_signals = ?, partner_opportunity_signal = ?, partner_opportunity_reason = ?,
        evidence_limitations = ?, founder_investigation_flags = ?, fit_score = ?,
        fit_reason = ?, priority = ?, notes = ?, business_signals = ?, job_id = ?,
        evidence_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      companyName, website, domain, location, companyType, industry,
      companyType || industry, location, description, source, sourceUrl,
      description, researchStatus, verificationStatus, verificationReason,
      partnerModelSignals, partnerOpportunitySignal, partnerOpportunityReason,
      evidenceLimitations, founderInvestigationFlags, fitScore,
      fitReason, priority, notes, businessSignals, jobId,
      evidenceJson, now,
      id
    );

    return DAL.getCandidateById(id);
  },

  addCandidateNote(candidateId: string, noteData: { note: string; date?: string; source?: string; sourceUrl?: string }) {
    const noteId = `cnote-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();
    const dateStr = noteData.date || now.split('T')[0];

    db.prepare(`
      INSERT INTO candidate_notes (id, candidate_id, note, date, source, source_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(noteId, candidateId, noteData.note, dateStr, noteData.source || '', noteData.sourceUrl || '', now);

    return DAL.getCandidateById(candidateId);
  },

  approveCandidate(candidateId: string) {
    const candidate = DAL.getCandidateById(candidateId);
    if (!candidate) throw new Error('Candidate not found');

    const normCandidateDomain = normalizeDomain(candidate.website || candidate.domain);
    const candidateNameLower = candidate.companyName.trim().toLowerCase();

    // 1. Check for existing company match
    const allCompanies = db.prepare('SELECT * FROM companies WHERE is_archived = 0').all() as any[];

    let matchedCompany = allCompanies.find(c => {
      const cDomain = normalizeDomain(c.website || c.domain);
      if (normCandidateDomain && cDomain && normCandidateDomain === cDomain) return true;
      if (c.name.trim().toLowerCase() === candidateNameLower) return true;
      return false;
    });

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    let companyId: string;
    let isExisting = false;

    if (matchedCompany) {
      companyId = matchedCompany.id;
      isExisting = true;
    } else {
      // Create new Company
      companyId = `comp-${Date.now()}`;
      const words = candidate.companyName.trim().split(' ').filter(Boolean);
      const initials = words.map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() || 'CO';

      db.prepare(`
        INSERT INTO companies (id, name, domain, type, city, employee_count, website, logo_initials, year_established, is_archived, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).run(
        companyId,
        candidate.companyName,
        normCandidateDomain,
        candidate.companyType || candidate.industry || 'Architecture',
        candidate.location || 'India',
        candidate.businessSignals?.companySize || '10-25',
        candidate.website || '',
        initials,
        new Date().getFullYear(),
        now,
        now
      );

      // Create Relationship record for Company
      const relId = `rel-${Date.now()}`;
      db.prepare(`
        INSERT INTO relationships (
          id, company_id, status, temperature, owner, first_contact_date,
          last_meaningful_interaction_date, days_inactive, next_action, next_action_date,
          relationship_notes, services_discussed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
      `).run(
        relId,
        companyId,
        'Prospect',
        'Warm',
        'Ravi',
        today,
        today,
        'Initial research approved. Outreach recommended.',
        today,
        candidate.description || candidate.notes || 'Research approved candidate.',
        JSON.stringify(['Architectural Millwork', 'Joinery']),
        now,
        now
      );
    }

    // Mark candidate as APPROVED and attach created_company_id
    db.prepare(`
      UPDATE research_candidates SET
        research_status = 'APPROVED',
        verification_status = 'Approved',
        created_company_id = ?,
        updated_at = ?
      WHERE id = ?
    `).run(companyId, now, candidateId);

    // Sync research data to research_notes table for Company Account → AI Research tab
    const existingResNote = db.prepare('SELECT * FROM research_notes WHERE company_id = ?').get(companyId) as any;
    const strengths = candidate.fitReason ? [candidate.fitReason] : ['Strong market alignment'];
    const growthSignals = candidate.businessSignals?.projectsWorkTypes ? [candidate.businessSignals.projectsWorkTypes] : ['Target sector active'];
    const sourcesList = candidate.source ? [{ title: candidate.source, url: candidate.sourceUrl || '' }] : [];

    if (!existingResNote) {
      db.prepare(`
        INSERT INTO research_notes (id, company_id, market_segment, strengths, growth_signals, sources, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `resnote-${Date.now()}`,
        companyId,
        candidate.industry || candidate.companyType || 'Commercial',
        JSON.stringify(strengths),
        JSON.stringify(growthSignals),
        JSON.stringify(sourcesList),
        today
      );
    }

    return {
      success: true,
      companyId,
      isExisting,
      message: isExisting
        ? `Research attached to existing company: ${matchedCompany.name}`
        : `Approved candidate and created company prospect: ${candidate.companyName}`,
    };
  },

  // Search
  searchEntities(queryStr: string) {
    const q = `%${queryStr.trim()}%`;

    const companies = db.prepare(`
      SELECT id, name, type, city, domain FROM companies
      WHERE is_archived = 0 AND (name LIKE ? OR type LIKE ? OR city LIKE ? OR domain LIKE ?)
      LIMIT 5
    `).all(q, q, q, q) as any[];

    const contacts = db.prepare(`
      SELECT cnt.id, cnt.name, cnt.role, cnt.email, cnt.company_id, comp.name as company_name
      FROM contacts cnt
      JOIN companies comp ON cnt.company_id = comp.id
      WHERE comp.is_archived = 0 AND (cnt.is_archived IS NULL OR cnt.is_archived = 0)
        AND (cnt.name LIKE ? OR cnt.role LIKE ? OR cnt.email LIKE ? OR cnt.phone LIKE ?)
      LIMIT 5
    `).all(q, q, q, q) as any[];

    const opportunities = db.prepare(`
      SELECT opp.id, opp.title, opp.stage, opp.estimated_value_amount, opp.company_id, comp.name as company_name
      FROM opportunities opp
      JOIN companies comp ON opp.company_id = comp.id
      WHERE comp.is_archived = 0 AND (opp.is_archived IS NULL OR opp.is_archived = 0)
        AND (opp.title LIKE ? OR opp.stage LIKE ?)
      LIMIT 5
    `).all(q, q) as any[];

    const interactions = db.prepare(`
      SELECT i.id, i.summary, i.channel, i.date, i.company_id, comp.name as company_name
      FROM interactions i
      JOIN companies comp ON i.company_id = comp.id
      WHERE comp.is_archived = 0 AND (i.summary LIKE ? OR i.channel LIKE ?)
      LIMIT 5
    `).all(q, q) as any[];

    const candidates = db.prepare(`
      SELECT id, name, company_type, location, research_status, fit_score
      FROM research_candidates
      WHERE name LIKE ? OR location LIKE ? OR company_type LIKE ? OR industry LIKE ?
      LIMIT 5
    `).all(q, q, q, q) as any[];

    return {
      companies: companies.map(c => ({ id: c.id, name: c.name, type: c.type, city: c.city })),
      contacts: contacts.map(c => ({ id: c.id, name: c.name, role: c.role, companyId: c.company_id, companyName: c.company_name })),
      opportunities: opportunities.map(o => ({
        id: o.id,
        title: o.title,
        stage: o.stage,
        value: formatINR(o.estimated_value_amount),
        companyId: o.company_id,
        companyName: o.company_name,
      })),
      interactions: interactions.map(i => ({
        id: i.id,
        summary: i.summary,
        channel: i.channel,
        date: i.date,
        companyId: i.company_id,
        companyName: i.company_name,
      })),
      candidates: candidates.map(c => ({
        id: c.id,
        name: c.name,
        type: c.company_type || 'Architecture',
        location: c.location || '',
        status: c.research_status || 'DISCOVERED',
        fitScore: c.fit_score || 80,
      })),
    };
  },

  getUsers() {
    return db.prepare('SELECT id, name, email, role FROM users ORDER BY name ASC').all() as any[];
  },

  // Manual Company Creation & Management
  createCompany(data: any, currentUser?: any) {
    const name = (data.name || data.companyName || '').trim();
    if (!name) throw new Error('Company name is required');

    const website = (data.website || '').trim();
    const domain = (data.domain || (website ? normalizeDomain(website) : '')).trim();
    const city = (data.city || data.location || 'India').trim();
    const type = (data.type || data.companyType || 'Architecture').trim();
    const description = (data.description || data.summary || '').trim();
    const status = data.status || 'Prospect';
    const temperature = data.temperature || 'Warm';
    const owner = data.owner || currentUser?.name || currentUser?.email || 'Ravi';
    const notes = data.notes || data.relationshipNotes || description || '';

    const normDomain = normalizeDomain(domain || website);
    const nameLower = name.toLowerCase();
    const allCompanies = db.prepare('SELECT * FROM companies WHERE is_archived = 0').all() as any[];
    const existing = allCompanies.find(c => {
      const cDom = normalizeDomain(c.website || c.domain);
      if (normDomain && cDom && normDomain === cDom) return true;
      if (c.name.trim().toLowerCase() === nameLower) return true;
      return false;
    });

    if (existing && data.checkDuplicateOnly) {
      return { isDuplicate: true, existingCompany: existing };
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const companyId = `comp-${Date.now()}`;
    const words = name.split(' ').filter(Boolean);
    const initials = words.map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() || 'CO';

    db.prepare(`
      INSERT INTO companies (id, name, domain, type, city, employee_count, website, logo_initials, year_established, is_archived, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      companyId, name, normDomain || domain, type, city, data.employeeCount || '10-25', website, initials, new Date().getFullYear(), now, now
    );

    const relId = `rel-${Date.now()}`;
    db.prepare(`
      INSERT INTO relationships (
        id, company_id, status, temperature, owner, first_contact_date,
        last_meaningful_interaction_date, days_inactive, next_action, next_action_date,
        relationship_notes, services_discussed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
    `).run(
      relId, companyId, status, temperature, owner, today, today,
      data.nextAction || 'Initial company created', data.nextActionDate || today,
      notes, JSON.stringify(data.servicesDiscussed || ['Architectural Millwork']), now, now
    );

    return {
      success: true,
      companyId,
      company: DAL.getCompanyById(companyId)
    };
  },

  updateCompany(id: string, data: any) {
    const existing = db.prepare('SELECT * FROM companies WHERE id = ?').get(id) as any;
    if (!existing) return null;

    const now = new Date().toISOString();
    const name = data.name !== undefined ? data.name : existing.name;
    const website = data.website !== undefined ? data.website : existing.website;
    const domain = data.domain !== undefined ? data.domain : (website ? normalizeDomain(website) : existing.domain);
    const type = data.type !== undefined ? data.type : (data.companyType !== undefined ? data.companyType : existing.type);
    const city = data.city !== undefined ? data.city : (data.location !== undefined ? data.location : existing.city);
    const employeeCount = data.employeeCount !== undefined ? data.employeeCount : existing.employee_count;

    db.prepare(`
      UPDATE companies SET
        name = ?, website = ?, domain = ?, type = ?, city = ?, employee_count = ?, updated_at = ?
      WHERE id = ?
    `).run(name, website, domain, type, city, employeeCount, now, id);

    if (data.notes !== undefined || data.relationshipNotes !== undefined || data.status !== undefined || data.temperature !== undefined || data.owner !== undefined) {
      DAL.updateRelationship(id, {
        relationshipNotes: data.notes !== undefined ? data.notes : data.relationshipNotes,
        status: data.status,
        temperature: data.temperature,
        owner: data.owner
      });
    }

    return DAL.getCompanyById(id);
  },

  updateRelationship(companyId: string, data: any) {
    const existing = db.prepare('SELECT * FROM relationships WHERE company_id = ?').get(companyId) as any;
    const now = new Date().toISOString();

    if (!existing) {
      const relId = `rel-${Date.now()}`;
      const today = now.split('T')[0];
      db.prepare(`
        INSERT INTO relationships (
          id, company_id, status, temperature, owner, first_contact_date,
          last_meaningful_interaction_date, days_inactive, next_action, next_action_date,
          relationship_notes, services_discussed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
      `).run(
        relId, companyId, data.status || 'Prospect', data.temperature || 'Warm', data.owner || 'Ravi',
        today, today, data.nextAction || '', data.nextActionDate || '', data.relationshipNotes || data.notes || '',
        JSON.stringify(data.servicesDiscussed || []), now, now
      );
    } else {
      const status = data.status !== undefined ? data.status : existing.status;
      const temperature = data.temperature !== undefined ? data.temperature : existing.temperature;
      const owner = data.owner !== undefined ? data.owner : existing.owner;
      const notes = data.relationshipNotes !== undefined ? data.relationshipNotes : (data.notes !== undefined ? data.notes : existing.relationship_notes);
      const nextAction = data.nextAction !== undefined ? data.nextAction : existing.next_action;
      const nextActionDate = data.nextActionDate !== undefined ? data.nextActionDate : existing.next_action_date;

      db.prepare(`
        UPDATE relationships SET
          status = ?, temperature = ?, owner = ?, relationship_notes = ?,
          next_action = ?, next_action_date = ?, updated_at = ?
        WHERE company_id = ?
      `).run(status, temperature, owner, notes, nextAction, nextActionDate, now, companyId);
    }

    return DAL.getCompanyById(companyId);
  },

  createContact(data: any) {
    if (!data.companyId) throw new Error('Company ID is required for contact');
    if (!data.name || !data.name.trim()) throw new Error('Contact name is required');

    const id = `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO contacts (
        id, company_id, name, role, email, phone, linkedin, notes, is_decision_maker, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      id, data.companyId, data.name.trim(), data.role || data.designation || 'Contact',
      data.email || '', data.phone || '', data.linkedin || '', data.notes || '',
      data.isDecisionMaker ? 1 : 0, now, now
    );

    return DAL.getCompanyById(data.companyId);
  },

  updateContact(id: string, data: any) {
    const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as any;
    if (!existing) return null;

    const now = new Date().toISOString();
    const name = data.name !== undefined ? data.name : existing.name;
    const role = data.role !== undefined ? data.role : (data.designation !== undefined ? data.designation : existing.role);
    const email = data.email !== undefined ? data.email : existing.email;
    const phone = data.phone !== undefined ? data.phone : existing.phone;
    const linkedin = data.linkedin !== undefined ? data.linkedin : existing.linkedin;
    const notes = data.notes !== undefined ? data.notes : existing.notes;
    const isDecisionMaker = data.isDecisionMaker !== undefined ? (data.isDecisionMaker ? 1 : 0) : existing.is_decision_maker;

    db.prepare(`
      UPDATE contacts SET
        name = ?, role = ?, email = ?, phone = ?, linkedin = ?, notes = ?, is_decision_maker = ?, updated_at = ?
      WHERE id = ?
    `).run(name, role, email, phone, linkedin, notes, isDecisionMaker, now, id);

    return DAL.getCompanyById(existing.company_id);
  },

  archiveContact(id: string) {
    const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as any;
    if (!existing) return null;

    const now = new Date().toISOString();
    db.prepare('UPDATE contacts SET is_archived = 1, updated_at = ? WHERE id = ?').run(now, id);
    return DAL.getCompanyById(existing.company_id);
  },

  createOpportunity(data: any) {
    if (!data.companyId) throw new Error('Company ID is required for opportunity');
    if (!data.title || !data.title.trim()) throw new Error('Opportunity title is required');

    const id = `opp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();
    const rawVal = Number(data.estimatedValueAmount || data.estimatedValue || 0);

    db.prepare(`
      INSERT INTO opportunities (
        id, company_id, title, stage, estimated_value_formatted, estimated_value_amount,
        next_action, next_action_date, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      id, data.companyId, data.title.trim(), data.stage || 'Qualification',
      formatINR(rawVal), rawVal, data.nextAction || '', data.nextActionDate || '',
      now, now
    );

    return DAL.getCompanyById(data.companyId);
  },

  updateOpportunity(id: string, data: any) {
    const existing = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id) as any;
    if (!existing) return null;

    const now = new Date().toISOString();
    const title = data.title !== undefined ? data.title : existing.title;
    const stage = data.stage !== undefined ? data.stage : existing.stage;
    const rawVal = data.estimatedValueAmount !== undefined ? Number(data.estimatedValueAmount) : (data.estimatedValue !== undefined ? Number(data.estimatedValue) : existing.estimated_value_amount);
    const nextAction = data.nextAction !== undefined ? data.nextAction : existing.next_action;
    const nextActionDate = data.nextActionDate !== undefined ? data.nextActionDate : existing.next_action_date;

    db.prepare(`
      UPDATE opportunities SET
        title = ?, stage = ?, estimated_value_amount = ?, estimated_value_formatted = ?,
        next_action = ?, next_action_date = ?, updated_at = ?
      WHERE id = ?
    `).run(title, stage, rawVal, formatINR(rawVal), nextAction, nextActionDate, now, id);

    return DAL.getCompanyById(existing.company_id);
  },

  archiveOpportunity(id: string) {
    const existing = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id) as any;
    if (!existing) return null;

    const now = new Date().toISOString();
    db.prepare("UPDATE opportunities SET is_archived = 1, stage = 'Closed Lost', updated_at = ? WHERE id = ?").run(now, id);
    return DAL.getCompanyById(existing.company_id);
  }
};
