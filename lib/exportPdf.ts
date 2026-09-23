import { ResearchCandidate } from '@/types';

const MEAVEN_LOGO_DATA_URI = 'data:image/png;base64,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';

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateResearchDossierHTML(candidate: ResearchCandidate): string {
  const companyName = escapeHtml(candidate.companyName || candidate.name || 'Research Candidate');
  const companyType = escapeHtml(candidate.companyType || candidate.industrySegment || 'Architecture & Design');
  const location = escapeHtml(candidate.location || candidate.city || 'Location N/A');
  const website = candidate.website || '';
  const domain = escapeHtml(candidate.domain || website.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'N/A');
  const discoveredDate = escapeHtml(candidate.discoveredDate || candidate.discoveredAt || new Date().toISOString().split('T')[0]);
  const fitScore = candidate.fitScore !== undefined ? candidate.fitScore : (candidate.aiScore || 80);
  const priority = escapeHtml(candidate.priority || 'MEDIUM');
  const verStatus = escapeHtml((candidate.verificationStatus || 'UNVERIFIED').replace('_', ' '));
  const oppSignal = escapeHtml(candidate.partnerOpportunitySignal || 'UNKNOWN');
  const verReason = escapeHtml(candidate.verificationReason || '');
  const oppReason = escapeHtml(candidate.partnerOpportunityReason || '');
  const evLimitations = escapeHtml(candidate.evidenceLimitations || '');
  const summary = escapeHtml(candidate.summary || candidate.description || '');
  const fitReason = escapeHtml(candidate.fitReason || '');
  const originatingInstruction = escapeHtml(candidate.originatingInstruction || 'Natural-language AI research execution instruction.');

  // Premium Light Theme Status Badges
  const verColorClass = candidate.verificationStatus === 'VERIFIED'
    ? 'border: 1px solid #a7f3d0; background: #ecfdf5; color: #065f46;'
    : candidate.verificationStatus === 'PARTIALLY_VERIFIED'
    ? 'border: 1px solid #bfdbfe; background: #eff6ff; color: #1e40af;'
    : 'border: 1px solid #fde68a; background: #fffbeb; color: #92400e;';

  const oppColorClass = candidate.partnerOpportunitySignal === 'HIGH'
    ? 'border: 1px solid #a7f3d0; background: #ecfdf5; color: #065f46;'
    : candidate.partnerOpportunitySignal === 'MEDIUM'
    ? 'border: 1px solid #fde68a; background: #fffbeb; color: #92400e;'
    : 'border: 1px solid #e2e8f0; background: #f8fafc; color: #475569;';

  const prioColorClass = candidate.priority === 'HIGH'
    ? 'border: 1px solid #fecdd3; background: #fff1f2; color: #9f1239;'
    : 'border: 1px solid #fde68a; background: #fffbeb; color: #92400e;';

  // Format Evidence List (Light Print Theme Table Rows)
  const evidenceRowsHtml = (candidate.evidenceList || []).map(ev => {
    const claim = escapeHtml(ev.claim);
    const status = escapeHtml(ev.status);
    const title = escapeHtml(ev.sourceTitle || 'Web Source');
    const url = ev.sourceUrl ? escapeHtml(ev.sourceUrl) : '#';
    const statusClass = status === 'KNOWN'
      ? 'color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0;'
      : status === 'INFERRED'
      ? 'color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe;'
      : 'color: #b45309; background: #fffbeb; border: 1px solid #fde68a;';

    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500; line-height: 1.5;">${claim}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">
          <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-family: monospace; font-size: 9px; font-weight: 700; ${statusClass}">${status}</span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 11px;">
          ${url !== '#' ? `<a href="${url}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 500;">${title}</a>` : title}
        </td>
      </tr>
    `;
  }).join('');

  // Format Founder Investigation Flags (Refined Warning Alert styling for Light Theme)
  const flagsHtml = (candidate.founderInvestigationFlags || []).map(flag => `
    <li style="margin-bottom: 8px; color: #92400e; background: #fffbeb; border: 1px solid #fef3c7; border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 0 4px 4px 0; font-size: 11.5px; line-height: 1.5;">
      ${escapeHtml(flag)}
    </li>
  `).join('');

  // Format Partner Model Signals (Subtle Light Neutral Chips)
  const modelSignalsHtml = (candidate.partnerModelSignals || []).map(sig => `
    <span style="display: inline-block; padding: 4px 10px; margin: 2px 4px 4px 0; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; font-size: 10.5px; font-weight: 600;">
      ${escapeHtml(sig)}
    </span>
  `).join('');

  // Format Logged Notes
  const notesHtml = (candidate.candidateNotes || []).map(n => `
    <div style="padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; font-family: monospace; font-size: 10px; color: #64748b; margin-bottom: 4px;">
        <span>DATE: ${escapeHtml(n.date)}</span>
        ${n.source ? `<span>SOURCE: ${escapeHtml(n.source)}</span>` : ''}
      </div>
      <div style="color: #334155; font-size: 11.5px; line-height: 1.5;">${escapeHtml(n.note)}</div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>MEAVEN Research Intelligence Dossier - ${companyName}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 16mm 14mm 18mm 14mm;
  }

  @media print {
    body {
      background-color: #ffffff !important;
      color: #0f172a !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }

  * { box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #ffffff;
    color: #0f172a;
    margin: 0;
    padding: 24px;
    font-size: 12px;
    line-height: 1.5;
  }

  .dossier-wrapper {
    max-width: 900px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 28px;
  }

  /* BRAND HEADER */
  .brand-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 14px;
    margin-bottom: 24px;
  }

  .meaven-logo {
    height: 38px;
    width: auto;
    display: block;
    object-fit: contain;
  }

  .meaven-tagline {
    font-family: monospace;
    font-size: 10px;
    font-weight: 700;
    color: #1e40af;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-top: 6px;
  }

  .header-right {
    text-align: right;
    font-family: monospace;
    font-size: 10.5px;
    color: #475569;
  }

  .brand-url {
    color: #2563eb;
    text-decoration: underline;
    font-weight: 700;
  }

  /* DOSSIER TITLE & METADATA GRID */
  .candidate-title-block {
    margin-bottom: 20px;
  }

  .candidate-name {
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
  }

  .candidate-subtitle {
    font-size: 12px;
    color: #64748b;
    font-family: monospace;
  }

  .candidate-website-link {
    color: #2563eb;
    text-decoration: underline;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 24px;
  }

  .meta-item {
    font-family: monospace;
  }

  .meta-label {
    font-size: 9px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: block;
    margin-bottom: 5px;
  }

  .meta-value {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
  }

  /* BADGES */
  .badge-box {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }

  /* SECTIONS */
  .section-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 22px;
  }

  .section-header {
    font-family: monospace;
    font-size: 11px;
    font-weight: 800;
    color: #1e40af;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .summary-text {
    font-size: 12.5px;
    color: #334155;
    line-height: 1.6;
    margin: 0;
  }

  /* INSTRUCTION BLOCK */
  .instruction-block {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-left: 3px solid #0284c7;
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 22px;
    font-size: 11.5px;
    color: #0369a1;
    line-height: 1.5;
  }

  /* EVIDENCE TABLE */
  .evidence-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 11.5px;
  }

  .evidence-table th {
    background: #f8fafc;
    color: #475569;
    font-family: monospace;
    font-size: 9.5px;
    text-transform: uppercase;
    padding: 10px 12px;
    border-bottom: 2px solid #cbd5e1;
    text-align: left;
    font-weight: 700;
  }

  /* FOOTER */
  .dossier-footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: 1px solid #cbd5e1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: monospace;
    font-size: 10px;
    color: #64748b;
  }

  .footer-link {
    color: #2563eb;
    text-decoration: underline;
    font-weight: 700;
  }
</style>
</head>
<body>

<div class="dossier-wrapper">

  <!-- HEADER -->
  <div class="brand-header">
    <div>
      <img src="${MEAVEN_LOGO_DATA_URI}" alt="MEAVEN" class="meaven-logo" />
      <div class="meaven-tagline">FOUNDER COCKPIT · RESEARCH INTELLIGENCE REPORT</div>
    </div>
    <div class="header-right">
      <div style="color: #1e293b; font-weight: 700;">Meaven Designs Pvt Ltd</div>
      <a href="https://meaven.in/" target="_blank" class="brand-url">https://meaven.in/</a>
    </div>
  </div>

  <!-- CANDIDATE HEADER BLOCK -->
  <div class="candidate-title-block">
    <h1 class="candidate-name">${companyName}</h1>
    <div class="candidate-subtitle">
      <span>${companyType}</span> &bull; 
      <span>${location}</span>
      ${website ? ` &bull; <a href="${website.startsWith('http') ? website : 'https://' + website}" target="_blank" class="candidate-website-link">${domain}</a>` : ''}
    </div>
  </div>

  <!-- METADATA GRID -->
  <div class="meta-grid">
    <div class="meta-item">
      <span class="meta-label">VERIFICATION STATUS</span>
      <span class="badge-box" style="${verColorClass}">${verStatus}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">PARTNER OPPORTUNITY</span>
      <span class="badge-box" style="${oppColorClass}">OPPORTUNITY: ${oppSignal}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">FIT SCORE</span>
      <span class="meta-value" style="color: #2563eb;">${fitScore} / 100</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">PRIORITY</span>
      <span class="badge-box" style="${prioColorClass}">${priority}</span>
    </div>
  </div>

  <!-- ORIGINATING INSTRUCTION -->
  <div class="instruction-block">
    <strong style="font-family: monospace; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 3px; color: #0284c7;">ORIGINATING RESEARCH INSTRUCTION:</strong>
    "${originatingInstruction}"
  </div>

  <!-- TIER 1: FOUNDER SNAPSHOT -->
  <div class="section-card">
    <div class="section-header">
      <span>TIER 1 — FOUNDER SNAPSHOT SUMMARY</span>
      <span style="color: #64748b; font-weight: 600;">DISCOVERED: ${discoveredDate}</span>
    </div>

    <div style="margin-bottom: 16px;">
      <span style="font-family: monospace; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 6px;">RESEARCH EXECUTIVE SYNTHESIS:</span>
      <p class="summary-text">${summary}</p>
    </div>

    ${fitReason ? `
    <div style="margin-bottom: 12px; background: #f8fafc; padding: 12px 14px; border-radius: 6px; border: 1px solid #e2e8f0; border-left: 3px solid #2563eb;">
      <span style="font-family: monospace; font-size: 9.5px; color: #1e40af; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 3px;">ICP FIT SCORE EVALUATION (${fitScore}/100):</span>
      <div style="color: #334155; font-size: 11.5px; line-height: 1.5;">${fitReason}</div>
    </div>
    ` : ''}

    ${oppReason ? `
    <div style="margin-bottom: 12px; background: #f8fafc; padding: 12px 14px; border-radius: 6px; border: 1px solid #e2e8f0; border-left: 3px solid #d97706;">
      <span style="font-family: monospace; font-size: 9.5px; color: #b45309; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 3px;">PARTNER OPPORTUNITY SIGNAL ANALYSIS (${oppSignal}):</span>
      <div style="color: #334155; font-size: 11.5px; line-height: 1.5;">${oppReason}</div>
    </div>
    ` : ''}

    ${evLimitations ? `
    <div style="margin-bottom: 12px; background: #f8fafc; padding: 12px 14px; border-radius: 6px; border: 1px solid #e2e8f0; border-left: 3px solid #64748b;">
      <span style="font-family: monospace; font-size: 9.5px; color: #475569; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 3px;">EVIDENCE LIMITATIONS & BOUNDARIES:</span>
      <div style="color: #334155; font-size: 11.5px; line-height: 1.5;">${evLimitations}</div>
    </div>
    ` : ''}
  </div>

  <!-- FOUNDER INVESTIGATION FLAGS -->
  ${flagsHtml ? `
  <div class="section-card" style="border-color: #fde68a;">
    <div class="section-header" style="color: #b45309; border-bottom-color: #fde68a;">
      <span>FOUNDER INVESTIGATION POINTS (&nbsp;&nbsp;WARNINGS FOR PRE-OUTREACH REVIEW)</span>
    </div>
    <ul style="list-style: none; padding: 0; margin: 0;">
      ${flagsHtml}
    </ul>
  </div>
  ` : ''}

  <!-- TIER 2: BUSINESS & PARTNER MODEL SIGNALS -->
  <div class="section-card">
    <div class="section-header">
      <span>TIER 2 — BUSINESS & PARTNER MODEL SIGNALS</span>
    </div>

    ${modelSignalsHtml ? `
    <div style="margin-bottom: 16px;">
      <span style="font-family: monospace; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 8px;">STRUCTURED PARTNER MODEL SIGNALS:</span>
      <div>${modelSignalsHtml}</div>
    </div>
    ` : ''}

    ${candidate.businessSignals ? `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
      ${candidate.businessSignals.projectsWorkTypes ? `
        <div style="background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <strong style="color: #1e40af; font-family: monospace; font-size: 10px; display: block; margin-bottom: 3px;">PROJECTS & WORK TYPES:</strong>
          <span style="color: #334155; font-size: 11.5px;">${escapeHtml(candidate.businessSignals.projectsWorkTypes)}</span>
        </div>
      ` : ''}
      ${candidate.businessSignals.commercialFocus ? `
        <div style="background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <strong style="color: #1e40af; font-family: monospace; font-size: 10px; display: block; margin-bottom: 3px;">COMMERCIAL FOCUS:</strong>
          <span style="color: #334155; font-size: 11.5px;">${escapeHtml(candidate.businessSignals.commercialFocus)}</span>
        </div>
      ` : ''}
      ${candidate.businessSignals.residentialFocus ? `
        <div style="background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <strong style="color: #1e40af; font-family: monospace; font-size: 10px; display: block; margin-bottom: 3px;">RESIDENTIAL FOCUS:</strong>
          <span style="color: #334155; font-size: 11.5px;">${escapeHtml(candidate.businessSignals.residentialFocus)}</span>
        </div>
      ` : ''}
      ${candidate.businessSignals.dnbCapability ? `
        <div style="background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <strong style="color: #1e40af; font-family: monospace; font-size: 10px; display: block; margin-bottom: 3px;">D&B / TURNKEY CAPABILITY:</strong>
          <span style="color: #334155; font-size: 11.5px;">${escapeHtml(candidate.businessSignals.dnbCapability)}</span>
        </div>
      ` : ''}
    </div>
    ` : ''}
  </div>

  <!-- TIER 3: DETAILED EVIDENCE LEDGER -->
  <div class="section-card">
    <div class="section-header">
      <span>TIER 3 — RESEARCH EVIDENCE LEDGER</span>
      <span style="color: #64748b; font-weight: 600;">${(candidate.evidenceList || []).length} EVIDENCE CLAIMS CAPTURED</span>
    </div>

    ${evidenceRowsHtml ? `
    <table class="evidence-table">
      <thead>
        <tr>
          <th>Research Claim / Captured Evidence</th>
          <th style="width: 90px; text-align: center;">Status</th>
          <th style="width: 220px;">Web Source</th>
        </tr>
      </thead>
      <tbody>
        ${evidenceRowsHtml}
      </tbody>
    </table>
    ` : '<div style="color: #64748b; font-style: italic; padding: 8px;">No evidence claims captured.</div>'}
  </div>

  <!-- TIER 4: LOGGED NOTES TIMELINE -->
  ${notesHtml ? `
  <div class="section-card">
    <div class="section-header">
      <span>TIMELINE — LOGGED RESEARCH NOTES</span>
    </div>
    ${notesHtml}
  </div>
  ` : ''}

  <!-- FOOTER -->
  <div class="dossier-footer">
    <div>
      Meaven Designs Pvt Ltd &bull; 
      <a href="https://meaven.in/" target="_blank" class="footer-link">meaven.in</a>
    </div>
    <div>
      CONFIDENTIAL &bull; FOR INTERNAL FOUNDER REVIEW ONLY
    </div>
  </div>

</div>

<script>
  window.onload = function() {
    setTimeout(function() {
      window.print();
    }, 400);
  };
</script>
</body>
</html>`;
}

export function printResearchDossier(candidate: ResearchCandidate) {
  const htmlContent = generateResearchDossierHTML(candidate);
  const printWindow = window.open('', '_blank', 'width=1000,height=900,scrollbars=yes');

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert('Please allow popups for this site to export the Meaven Research Dossier PDF.');
  }
}
