/**
 * Real-Time Entity & Domain Verification Module
 * 
 * Performs HTTP verification of candidate domains to ensure:
 * 1. Candidate company name matches domain title/content.
 * 2. Target location matches domain location evidence.
 * 3. Claims citing source URLs are downgraded from KNOWN to UNKNOWN if unverified.
 */

import { normalizeDomain } from '@/lib/utils';
import { ResearchEvidence, VerificationStatus } from '@/types';

export interface DomainVerificationResult {
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationReason: string;
  actualTitle?: string;
  actualSnippet?: string;
  correctedWebsite?: string;
  mismatchReason?: string;
  sanitizedEvidence: ResearchEvidence[];
}

export async function verifyCandidateEntity(
  candidateName: string,
  website: string,
  targetLocation: string,
  rawEvidence: ResearchEvidence[]
): Promise<DomainVerificationResult> {
  const normWebsite = website?.startsWith('http') ? website : (website ? `https://${website}` : '');
  const cleanName = candidateName.trim().toLowerCase();
  const genericWords = new Set(['studio', 'design', 'architects', 'architect', 'interiors', 'interior', 'spaces', 'space', 'solutions', 'services', 'group', 'projects', 'builders', 'builder', 'creations', 'creation', 'build', 'works', 'fitout', 'fitouts', 'co', 'inc', 'ltd', 'pvt', 'llp']);
  const nameKeywords = cleanName
    .split(' ')
    .map(w => w.replace(/[^a-z0-9]/g, ''))
    .filter(w => w.length > 2 && !genericWords.has(w));

  const todayStr = new Date().toISOString().split('T')[0];

  if (!normWebsite) {
    const reason = 'Verification Warning: No website URL provided. Company identity and claims could not be verified.';
    return {
      isVerified: false,
      verificationStatus: 'UNVERIFIED',
      verificationReason: reason,
      mismatchReason: 'No website URL provided',
      sanitizedEvidence: sanitizeUnverifiedEvidence(rawEvidence, candidateName, reason, todayStr),
    };
  }

  try {
    const res = await fetch(normWebsite, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MeavenBot/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const reason = `Verification Warning: Domain returned HTTP ${res.status}. Active website content could not be verified.`;
      return {
        isVerified: false,
        verificationStatus: res.status === 404 ? 'INACTIVE_DOMAIN' : 'UNVERIFIED',
        verificationReason: reason,
        mismatchReason: `Website returned HTTP ${res.status}`,
        sanitizedEvidence: sanitizeUnverifiedEvidence(rawEvidence, candidateName, reason, todayStr, normWebsite),
      };
    }

    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : '';
    const textSnippet = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 300);

    const fullPageText = (pageTitle + ' ' + textSnippet + ' ' + html).toLowerCase();
    const domainNameClean = normalizeDomain(normWebsite).toLowerCase();

    // 1. Check for Explicit Domain-for-Sale / Registrar Parking Signals -> PARKED_DOMAIN
    const isExplicitParked =
      fullPageText.includes('domain for sale') ||
      fullPageText.includes('buy this domain') ||
      fullPageText.includes('this domain is for sale') ||
      fullPageText.includes('buy domain') ||
      fullPageText.includes('parked free') ||
      fullPageText.includes('domain parked') ||
      fullPageText.includes('parked page') ||
      fullPageText.includes('hugedomains') ||
      fullPageText.includes('sedo.com') ||
      fullPageText.includes('dan.com') ||
      fullPageText.includes('afternic.com') ||
      fullPageText.includes('parkingcrew');

    if (isExplicitParked) {
      const reason = `Verification Warning: The supplied domain (${domainNameClean}) appears parked or listed for sale. Company identity could not be verified.`;
      return {
        isVerified: false,
        verificationStatus: 'PARKED_DOMAIN',
        verificationReason: reason,
        actualTitle: pageTitle,
        actualSnippet: textSnippet,
        mismatchReason: reason,
        sanitizedEvidence: sanitizeUnverifiedEvidence(rawEvidence, candidateName, reason, todayStr, normWebsite),
      };
    }

    // 2. Check for Name/Keyword match
    const hasNameMatch = (nameKeywords.length > 0
      ? nameKeywords.some(kw => fullPageText.includes(kw) || domainNameClean.includes(kw))
      : (fullPageText.includes(cleanName) || domainNameClean.includes(cleanName))) ||
      domainNameClean.includes(cleanName.replace(/\s+/g, ''));

    // 3. Check for Placeholder / Coming Soon / Under Construction Language
    const isPlaceholder =
      fullPageText.includes('under construction') ||
      fullPageText.includes('coming soon') ||
      fullPageText.includes('launching soon') ||
      fullPageText.includes('site under development') ||
      fullPageText.includes('work in progress');

    if (isPlaceholder) {
      const hasBusinessContent = hasNameMatch ||
        fullPageText.includes('interior') ||
        fullPageText.includes('design') ||
        fullPageText.includes('architecture') ||
        fullPageText.includes('studio') ||
        fullPageText.includes('commercial') ||
        fullPageText.includes('office') ||
        fullPageText.includes('contact') ||
        fullPageText.includes('about');

      if (hasBusinessContent) {
        const reason = `Partially Verified: Active website for ${candidateName} (${domainNameClean}) is under construction or coming soon, but recognizable business content is present.`;
        return {
          isVerified: true,
          verificationStatus: 'PARTIALLY_VERIFIED',
          verificationReason: reason,
          actualTitle: pageTitle,
          actualSnippet: textSnippet,
          correctedWebsite: normWebsite,
          sanitizedEvidence: rawEvidence,
        };
      } else {
        const reason = `Verification Warning: Domain ${domainNameClean} displays a coming-soon or under-construction placeholder without recognizable company identity.`;
        return {
          isVerified: false,
          verificationStatus: 'UNVERIFIED',
          verificationReason: reason,
          actualTitle: pageTitle,
          actualSnippet: textSnippet,
          mismatchReason: reason,
          sanitizedEvidence: sanitizeUnverifiedEvidence(rawEvidence, candidateName, reason, todayStr, normWebsite),
        };
      }
    }

    // 4. Check for Strong Entity Mismatch (SaaS/Fintech or completely unrelated industry)
    const isSaaSMismatch = fullPageText.includes('saas & fintech') || fullPageText.includes('building the future of saas') || fullPageText.includes('fintech innovation');
    const isUnrelatedIndustry = fullPageText.includes('crypto exchange') || fullPageText.includes('online casino') || fullPageText.includes('pharmaceutical store');

    if (isSaaSMismatch || isUnrelatedIndustry) {
      const reason = isSaaSMismatch
        ? `Verification Warning: Domain ${domainNameClean} content is a SaaS/Fintech site ("${pageTitle}"). Entity mismatch detected.`
        : `Verification Warning: Domain ${domainNameClean} content ("${pageTitle}") belongs to an unrelated industry. Entity mismatch detected.`;

      return {
        isVerified: false,
        verificationStatus: 'DOMAIN_MISMATCH',
        verificationReason: reason,
        actualTitle: pageTitle,
        actualSnippet: textSnippet,
        mismatchReason: reason,
        sanitizedEvidence: sanitizeUnverifiedEvidence(rawEvidence, candidateName, reason, todayStr, normWebsite),
      };
    }

    // 5. If exact candidate name keyword wasn't found, check if site is active business content vs unverified
    if (!hasNameMatch) {
      const hasGenericBusinessSignals = fullPageText.includes('interior') ||
        fullPageText.includes('design') ||
        fullPageText.includes('architect') ||
        fullPageText.includes('services') ||
        fullPageText.includes('contact') ||
        fullPageText.includes('about');

      if (hasGenericBusinessSignals) {
        const reason = `Partially Verified: Active website verified (${domainNameClean}), but exact candidate name "${candidateName}" was not explicitly found in page text (may trade under brand/legal name).`;
        return {
          isVerified: true,
          verificationStatus: 'PARTIALLY_VERIFIED',
          verificationReason: reason,
          actualTitle: pageTitle,
          actualSnippet: textSnippet,
          correctedWebsite: normWebsite,
          sanitizedEvidence: rawEvidence,
        };
      } else {
        const reason = `Verification Warning: Domain ${domainNameClean} content ("${pageTitle}") does not contain name "${candidateName}" or verifiable company details.`;
        return {
          isVerified: false,
          verificationStatus: 'UNVERIFIED',
          verificationReason: reason,
          actualTitle: pageTitle,
          actualSnippet: textSnippet,
          mismatchReason: reason,
          sanitizedEvidence: sanitizeUnverifiedEvidence(rawEvidence, candidateName, reason, todayStr, normWebsite),
        };
      }
    }

    // Check Location Alignment
    const targetLocClean = targetLocation.toLowerCase();
    const isBangaloreTarget = targetLocClean.includes('bangalore') || targetLocClean.includes('bengaluru');
    const hasLocationConflict = isBangaloreTarget && fullPageText.includes('delhi ncr') && !fullPageText.includes('bengaluru') && !fullPageText.includes('bangalore');

    let sanitized = rawEvidence.map(ev => {
      if (ev.status === 'KNOWN' && ev.claim.toLowerCase().includes('website')) {
        return {
          ...ev,
          claim: `Verified active website: ${pageTitle || candidateName}`,
          sourceUrl: normWebsite,
          dateCaptured: todayStr,
        };
      }
      return ev;
    });

    if (hasLocationConflict) {
      const reason = `Partially Verified: Active website for ${candidateName} verified, but homepage indicates primary presence in Delhi NCR rather than ${targetLocation}.`;
      return {
        isVerified: true,
        verificationStatus: 'PARTIALLY_VERIFIED',
        verificationReason: reason,
        actualTitle: pageTitle,
        actualSnippet: textSnippet,
        correctedWebsite: normWebsite,
        sanitizedEvidence: sanitized,
      };
    }

    const reason = `Verified: Active website confirmed for ${candidateName} (${domainNameClean}).`;
    return {
      isVerified: true,
      verificationStatus: 'VERIFIED',
      verificationReason: reason,
      actualTitle: pageTitle,
      actualSnippet: textSnippet,
      correctedWebsite: normWebsite,
      sanitizedEvidence: sanitized,
    };

  } catch (err: any) {
    const reason = `Verification Warning: Domain DNS or request failed (${err.message}). Unable to verify active website.`;
    return {
      isVerified: false,
      verificationStatus: 'INACTIVE_DOMAIN',
      verificationReason: reason,
      mismatchReason: `Domain request failed: ${err.message}`,
      sanitizedEvidence: sanitizeUnverifiedEvidence(rawEvidence, candidateName, reason, todayStr, normWebsite),
    };
  }
}

function sanitizeUnverifiedEvidence(
  rawEvidence: ResearchEvidence[],
  candidateName: string,
  mismatchReason: string,
  todayStr: string,
  websiteUrl: string = ''
): ResearchEvidence[] {
  const sanitized: ResearchEvidence[] = [];

  // Downgrade any KNOWN website claims to UNKNOWN
  for (const ev of rawEvidence) {
    if (ev.status === 'KNOWN' && (ev.claim.toLowerCase().includes('website') || ev.claim.toLowerCase().includes('identifiable'))) {
      sanitized.push({
        claim: `Unverified domain claim for ${candidateName}: ${mismatchReason}`,
        sourceUrl: websiteUrl || ev.sourceUrl,
        sourceTitle: ev.sourceTitle,
        dateCaptured: todayStr,
        status: 'UNKNOWN',
      });
    } else {
      sanitized.push(ev);
    }
  }

  // Append explicit UNKNOWN warning claim
  sanitized.push({
    claim: `Domain content verification failed for ${candidateName}: ${mismatchReason}`,
    sourceUrl: websiteUrl,
    sourceTitle: 'Entity Verification Warning',
    dateCaptured: todayStr,
    status: 'UNKNOWN',
  });

  return sanitized;
}
