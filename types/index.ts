export type SectorType = 'Architecture' | 'Interior Design' | 'Turnkey D&B' | 'Real Estate Developer';

export type RelationshipStatus =
  | 'Research Candidate'
  | 'Prospect'
  | 'Qualified'
  | 'Contacted'
  | 'Meeting'
  | 'Opportunity'
  | 'Active Partner'
  | 'Repeat Partner'
  | 'Strategic Partner';

export type RelationshipTemperature = 'Hot' | 'Warm' | 'Cool' | 'Stale';

export type InteractionChannel = 'Meeting' | 'Call' | 'Email' | 'WhatsApp' | 'Note';

export type VerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'DOMAIN_MISMATCH'
  | 'PARKED_DOMAIN'
  | 'INACTIVE_DOMAIN';

export type PartnerOpportunitySignal = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type ResearchStatus =
  | 'DISCOVERED'
  | 'RESEARCHING'
  | 'RESEARCHED'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CandidateNote {
  id: string;
  candidateId: string;
  note: string;
  date: string;
  source?: string;
  sourceUrl?: string;
  createdAt: string;
}

export interface BusinessSignals {
  projectsWorkTypes?: string;
  commercialFocus?: string;
  residentialFocus?: string;
  dnbCapability?: string;
  meavenFit?: string;
  geographicRelevance?: string;
  companySize?: string;
  otherSignals?: string;
}

export type ResearchJobStatus =
  | 'PLANNING'
  | 'DISCOVERING'
  | 'FILTERING'
  | 'QUALIFYING'
  | 'DEEP_RESEARCH'
  | 'READY_FOR_REVIEW'
  | 'COMPLETED'
  | 'FAILED';

export interface ParsedCriteria {
  targetCompanyTypes?: string[];
  geographies?: string[];
  industries?: string[];
  services?: string[];
  minFitScore?: number;
  customRequirements?: string;
  searchQueries?: string[];
}

export interface ResearchEvidence {
  id?: string;
  claim: string;
  sourceUrl: string;
  sourceTitle?: string;
  dateCaptured: string;
  status: 'KNOWN' | 'INFERRED' | 'UNKNOWN';
}

export interface ResearchJob {
  id: string;
  originalInstruction: string;
  parsedCriteria: ParsedCriteria;
  status: ResearchJobStatus;
  createdAt: string;
  completedAt?: string | null;
  candidateCount: number;
  qualifiedCount: number;
  finalShortlistCount: number;
  estimatedCost: number;
  searchCallCount: number;
  modelName?: string;
  notes?: string;
  budgetLimit: number;
  statusMessage?: string;
}

export interface ResearchSetup {
  targetCompanyType: string;
  geography: string;
  industry: string;
  companySize: string;
  services: string;
  keywords: string;
  website: string;
  notes: string;
  updatedAt: string;
}

export interface ResearchCandidate {
  id: string;
  name: string;
  companyName?: string;
  website?: string;
  domain?: string;
  location?: string;
  city?: string;
  companyType?: string;
  industry?: string;
  industrySegment?: SectorType;
  description?: string;
  summary?: string;
  source?: string;
  sourceUrl?: string;
  discoveredAt?: string;
  discoveredDate?: string;
  researchStatus?: ResearchStatus;
  verificationStatus?: VerificationStatus;
  verificationReason?: string;
  qualificationStatus?: string;
  fitScore?: number;
  aiScore?: number;
  fitReason?: string;
  priority?: PriorityLevel;
  notes?: string;
  businessSignals?: BusinessSignals;
  partnerModelSignals?: string[];
  partnerOpportunitySignal?: PartnerOpportunitySignal;
  partnerOpportunityReason?: string;
  evidenceLimitations?: string;
  founderInvestigationFlags?: string[];
  candidateNotes?: CandidateNote[];
  keyContactsIdentified?: number;
  createdCompanyId?: string | null;
  jobId?: string;
  originatingInstruction?: string;
  evidenceList?: ResearchEvidence[];
  createdAt?: string;
  updatedAt?: string;
}



export interface Company {
  id: string;
  name: string;
  domain: string;
  type: SectorType;
  city: string;
  employeeCount: string;
  website: string;
  logoInitials: string;
  yearEstablished: number;
}

export interface Relationship {
  id: string;
  companyId: string;
  status: RelationshipStatus;
  temperature: RelationshipTemperature;
  owner: string;
  firstContactDate: string;
  lastMeaningfulInteractionDate: string;
  daysInactive: number;
  nextAction: string;
  nextActionDate: string;
  partnerSince?: string;
  relationshipNotes: string;
  servicesDiscussed: string[];
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  linkedin?: string;
  notes?: string;
  isDecisionMaker: boolean;
}

export interface Opportunity {
  id: string;
  companyId: string;
  title: string;
  stage: 'Qualification' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  estimatedValueFormatted: string;
  estimatedValueAmount: number;
  nextAction: string;
  nextActionDate: string;
  createdDate: string;
}

export interface Interaction {
  id: string;
  companyId: string;
  contactId?: string;
  contactName?: string;
  date: string;
  channel: InteractionChannel;
  summary: string;
  whatTheyNeeded: string;
  whatWeLearned: string;
  nextAction: string;
  nextActionDate: string;
  noFurtherActionRequired: boolean;
}

export interface Research {
  id: string;
  companyId: string;
  marketSegment: string;
  strengths: string[];
  growthSignals: string[];
  sources: { title: string; url: string }[];
  lastUpdated: string;
}

export interface Intelligence {
  id: string;
  companyId: string;
  healthScore: number;
  recommendation: string;
  nurtureCadence: string;
  growthPotential: 'High' | 'Medium' | 'Exceptional';
}

export interface ProjectLink {
  id: string;
  companyId: string;
  projectHubId: string;
  projectName: string;
  status: 'Completed' | 'In Execution' | 'Planning';
  valueFormatted: string;
  completedDate?: string;
}

export interface PriorityItem {
  id: string;
  companyId: string;
  companyName: string;
  reason: string;
  priority: 'High' | 'Medium';
  suggestedAction: string;
  dueText: string;
}

export interface PartnerGoal {
  activeCount: number;
  targetCount: number;
  headline: string;
  subtext: string;
}

export interface ExecutiveKPIs {
  activePartners: number;
  openOpportunities: number;
  pipelineValueFormatted: string;
  followupsDue: number;
  staleRelationships: number;
}
