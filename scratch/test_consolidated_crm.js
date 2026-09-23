const { DAL } = require('../lib/db/dal');
const { db } = require('../lib/db');

async function runTests() {
  console.log('=====================================================');
  console.log('TESTING CONSOLIDATED CRM FOUNDATION IMPLEMENTATION');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, title) {
    if (condition) {
      console.log(`✓ PASS: ${title}`);
      passed++;
    } else {
      console.log(`✗ FAIL: ${title}`);
      failed++;
    }
  }

  // 1. Manual Company Creation
  console.log('--- 1. TESTING MANUAL COMPANY CREATION ---');
  const companyData = {
    name: 'Test Nexus Designs',
    website: 'https://nexusdesign.co',
    domain: 'nexusdesign.co',
    city: 'Hyderabad',
    companyType: 'Interior Design',
    industry: 'Commercial Interiors',
    description: 'Boutique design studio focused on commercial workspace projects.',
    status: 'Prospect',
    temperature: 'Warm',
    owner: 'Ravi',
    notes: 'Key founder contact established through referral.',
  };

  const createRes = DAL.createCompany(companyData);
  assert(Boolean(createRes && createRes.companyId), 'Company created successfully');
  const compId = createRes.companyId;

  // 2. Duplicate Check Warning
  console.log('\n--- 2. TESTING DUPLICATE DOMAIN WARNING ---');
  const dupCheck = DAL.createCompany({
    name: 'Nexus Designs Copy',
    website: 'https://nexusdesign.co',
    checkDuplicateOnly: true,
  });
  assert(Boolean(dupCheck && dupCheck.isDuplicate), 'Duplicate domain detected correctly');

  // 3. Company Account Fetch & Overview Structure
  console.log('\n--- 3. TESTING COMPANY ACCOUNT VIEW & NOTES ---');
  const accountData = DAL.getCompanyById(compId);
  assert(accountData.company.name === 'Test Nexus Designs', 'Company name matches');
  assert(accountData.relationship.relationshipNotes === 'Key founder contact established through referral.', 'Company notes stored in relationshipNotes');

  // Update Relationship Status, Temp, & Notes
  DAL.updateRelationship(compId, {
    status: 'Active Partner',
    temperature: 'Hot',
    relationshipNotes: 'Updated permanent company notes context.',
  });
  const updatedAccount = DAL.getCompanyById(compId);
  assert(updatedAccount.relationship.status === 'Active Partner', 'Relationship status updated to Active Partner');
  assert(updatedAccount.relationship.temperature === 'Hot', 'Relationship temperature updated to Hot');
  assert(updatedAccount.relationship.relationshipNotes === 'Updated permanent company notes context.', 'Company notes updated persistently');

  // 4. Contact Management
  console.log('\n--- 4. TESTING CONTACT MANAGEMENT ---');
  DAL.createContact({
    companyId: compId,
    name: 'Ar. Ananya Rao',
    role: 'Principal Architect & Director',
    email: 'ananya@nexusdesign.co',
    phone: '+91 99000 88776',
    linkedin: 'https://linkedin.com/in/ananya-rao',
    notes: 'Primary decision maker for turnkey procurement.',
    isDecisionMaker: true,
  });

  const accountWithContact = DAL.getCompanyById(compId);
  assert(accountWithContact.contacts.length === 1, 'Contact created and associated with company');
  assert(accountWithContact.contacts[0].isDecisionMaker === true, 'Contact tagged as Decision Maker');
  assert(accountWithContact.contacts[0].email === 'ananya@nexusdesign.co', 'Contact email validated & stored');

  // Soft Archive Contact
  const contactId = accountWithContact.contacts[0].id;
  DAL.archiveContact(contactId);
  const accountAfterContactArchive = DAL.getCompanyById(compId);
  assert(accountAfterContactArchive.contacts.length === 0, 'Soft archived contact hidden from active contacts list');

  // Re-create contact for opportunity testing
  DAL.createContact({
    companyId: compId,
    name: 'Ar. Ananya Rao',
    role: 'Principal Architect & Director',
    email: 'ananya@nexusdesign.co',
    isDecisionMaker: true,
  });

  // 5. Opportunity Management
  console.log('\n--- 5. TESTING OPPORTUNITY MANAGEMENT ---');
  DAL.createOpportunity({
    companyId: compId,
    title: 'Nexus Cyber Tower - Phase 1 Interiors',
    stage: 'Proposal',
    estimatedValueAmount: 6500000,
    nextAction: 'Submit final commercial quotation & BOQ',
    nextActionDate: '2026-09-28',
  });

  const accountWithOpp = DAL.getCompanyById(compId);
  assert(accountWithOpp.opportunities.length === 1, 'Opportunity created in company account');
  assert(accountWithOpp.opportunities[0].stage === 'Proposal', 'Opportunity stage set to Proposal');
  assert(accountWithOpp.opportunities[0].estimatedValueAmount === 6500000, 'Opportunity estimated value amount accurate');

  // Soft Archive Opportunity
  const oppId = accountWithOpp.opportunities[0].id;
  DAL.archiveOpportunity(oppId);
  const accountAfterOppArchive = DAL.getCompanyById(compId);
  assert(accountAfterOppArchive.opportunities.length === 0, 'Soft archived opportunity hidden from active list');

  // Re-create opportunity for search testing
  DAL.createOpportunity({
    companyId: compId,
    title: 'Nexus Cyber Tower - Phase 1 Interiors',
    stage: 'Proposal',
    estimatedValueAmount: 6500000,
  });

  // 6. Deterministic Search
  console.log('\n--- 6. TESTING DETERMINISTIC SEARCH ---');
  const searchCompany = DAL.searchEntities('Nexus');
  assert(searchCompany.companies.length > 0, 'Company found via name search');

  const searchContact = DAL.searchEntities('Ananya');
  assert(searchContact.contacts.length > 0, 'Contact found via name search');

  const searchOpp = DAL.searchEntities('Cyber Tower');
  assert(searchOpp.opportunities.length > 0, 'Opportunity found via title search');

  // Clean up test records
  db.prepare('DELETE FROM contacts WHERE company_id = ?').run(compId);
  db.prepare('DELETE FROM opportunities WHERE company_id = ?').run(compId);
  db.prepare('DELETE FROM relationships WHERE company_id = ?').run(compId);
  db.prepare('DELETE FROM companies WHERE id = ?').run(compId);

  console.log('\n=====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
