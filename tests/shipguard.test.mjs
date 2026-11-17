/**
 * Comprehensive Hardcore Automated Test Suite for ShipGuard Sentinel
 * Validates:
 * 1. Teamwork Graph (TWG) multi-hop Cypher queries and edge cases
 * 2. Deterministic Blast-Radius scoring algorithm and boundary rules
 * 3. Resolved vs Unresolved blocker handling
 * 4. Model Context Protocol (MCP) JSON-RPC 2.0 specification compliance (single & batch)
 * 5. Atlassian Rovo agent action handlers & receipt verification
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateBlastRadius } from '../src/blast_radius.js';
import { queryTeamworkGraph, queryReleaseGraph, normalizeIssueKey } from '../src/twg_graph.js';
import { handleMcpRequest, MCP_TOOLS } from '../src/mcp_server.js';
import { actionHandler } from '../src/index.js';

// ============================================================================
// 1. INPUT SANITIZATION & TWG GRAPH TRAVERSAL TESTS
// ============================================================================

test('TWG: normalizeIssueKey handles valid, lowercase, and invalid inputs gracefully', () => {
  assert.equal(normalizeIssueKey('PROJ-1042'), 'PROJ-1042');
  assert.equal(normalizeIssueKey('proj-1042'), 'PROJ-1042');
  assert.equal(normalizeIssueKey('  proj-1088  '), 'PROJ-1088');
  assert.equal(normalizeIssueKey(null), 'PROJ-1042');
  assert.equal(normalizeIssueKey(undefined), 'PROJ-1042');
  assert.equal(normalizeIssueKey('invalid-key-format'), 'PROJ-1042');
});

test('TWG: queryTeamworkGraph retrieves comprehensive multi-hop node for PROJ-1042', async () => {
  const data = await queryTeamworkGraph('PROJ-1042');
  
  assert.equal(data.issue.key, 'PROJ-1042');
  assert.equal(data.issue.fixVersion, 'v2.4.0');
  assert.ok(data.documentation.length > 0, 'Must have linked ADR documentation');
  assert.equal(data.documentation[0].freshnessStatus, 'FRESH');
  assert.ok(data.downstreamServices.length >= 2, 'Must identify multiple downstream services');
  assert.ok(data.downstreamServices.some(s => s.service === 'checkout-api' && s.tier === 'Tier-1 Critical'));
  assert.ok(data.downstreamServices.some(s => s.onCallStatus === 'OUT_OF_OFFICE'));
  assert.ok(data.pullRequests.length > 0, 'Must contain linked PR');
  assert.equal(data.pullRequests[0].databaseMigrations, true);
  assert.ok(data.blockers.length > 0, 'Must contain blocker FIN-319');
});

test('TWG: queryTeamworkGraph generates synthetic deterministic node for unknown issue keys', async () => {
  const customKey = 'CUSTOM-7777';
  const data = await queryTeamworkGraph(customKey);

  assert.equal(data.issue.key, customKey);
  assert.ok(data.documentation.length > 0, 'Should synthesize documentation node');
  assert.ok(data.downstreamServices.length > 0, 'Should synthesize default downstream gateway');
  assert.equal(data.blockers.length, 0);
});

test('TWG: queryReleaseGraph aggregates version issues correctly', async () => {
  const release = await queryReleaseGraph('v2.4.0');

  assert.equal(release.releaseVersion, 'v2.4.0');
  assert.ok(release.totalIssues >= 2, 'Should aggregate multiple tracked issues');
  assert.ok(release.issues.some(i => i.key === 'PROJ-1042'));
  assert.ok(release.issues.some(i => i.key === 'PROJ-1088'));
  assert.ok(release.timestamp);
});

// ============================================================================
// 2. DETERMINISTIC BLAST-RADIUS ENGINE TESTS
// ============================================================================

test('Blast Radius: Correctly flags high-risk blockers for PROJ-1042', async () => {
  const result = await calculateBlastRadius('PROJ-1042');

  assert.equal(result.issueKey, 'PROJ-1042');
  assert.ok(result.score >= 65, `Expected score >= 65 for blocked release, got ${result.score}`);
  assert.equal(result.status, 'RELEASE_BLOCKED');
  assert.equal(result.badgeColor, '#FF5630');
  assert.equal(result.blastRadiusCategory, 'High Blast Radius (>65%)');

  // Verify Receipts
  assert.ok(result.receipts.length >= 5, 'Should generate comprehensive receipts');
  const freshDoc = result.receipts.find(r => r.category === 'Documentation');
  assert.ok(freshDoc, 'Must include ADR receipt');
  assert.equal(freshDoc.type, 'VERIFIED_OK');

  const schemaGap = result.receipts.find(r => r.category === 'API Contract');
  assert.ok(schemaGap, 'Must detect missing schema for checkout-api');
  assert.equal(schemaGap.type, 'GAP_CRITICAL');

  const oooRisk = result.receipts.find(r => r.category === 'On-Call Operations');
  assert.ok(oooRisk, 'Must detect out-of-office downstream owner');

  const migrationRisk = result.receipts.find(r => r.category === 'Database Migration');
  assert.ok(migrationRisk, 'Must detect DDL database migration');

  // Verify Blockers and Do-Next
  assert.ok(result.blockers.length >= 2, 'Must contain critical blockers');
  assert.ok(result.doNext.some(d => d.includes('checkout-api')));
  assert.ok(result.doNext.some(d => d.includes('Finance Tech') || d.includes('secondary')));
});

test('Blast Radius: Correctly flags safe low-risk issue PROJ-1088 as SAFE_TO_SHIP', async () => {
  const result = await calculateBlastRadius('PROJ-1088');

  assert.equal(result.issueKey, 'PROJ-1088');
  assert.ok(result.score <= 30, `Expected score <= 30 for safe release, got ${result.score}`);
  assert.equal(result.status, 'SAFE_TO_SHIP');
  assert.equal(result.badgeColor, '#36B37E');
  assert.equal(result.blastRadiusCategory, 'Low Blast Radius (<40%)');
  assert.equal(result.blockers.length, 0, 'Safe issue should have zero unresolved blockers');
  assert.ok(result.doNext.some(d => d.includes('Ready to trigger') || d.includes('All pre-flight')));
});

test('Blast Radius: State-aware blocker triage (Resolved blocker PROJ-1080 does not penalize)', async () => {
  const result = await calculateBlastRadius('PROJ-1088');
  
  // PROJ-1088 has a blocker PROJ-1080 with status 'Done'
  const resolvedReceipt = result.receipts.find(r => r.receiptId === 'REC-BLK-RESOLVED-PROJ-1080');
  assert.ok(resolvedReceipt, 'Must emit VERIFIED_OK receipt for closed blocker PROJ-1080');
  assert.equal(resolvedReceipt.type, 'VERIFIED_OK');
  assert.equal(result.blockers.length, 0, 'Resolved blocker must not be in active blockers array');
});

test('Blast Radius: Handles extreme risk PROJ-2001 (Zero Docs, Broken CI, Blocker)', async () => {
  const result = await calculateBlastRadius('PROJ-2001');

  assert.equal(result.issueKey, 'PROJ-2001');
  assert.ok(result.score >= 80, `Expected severe risk score >= 80, got ${result.score}`);
  assert.equal(result.status, 'RELEASE_BLOCKED');

  // Must identify zero docs gap (+25)
  const docGap = result.receipts.find(r => r.category === 'Documentation' && r.type === 'GAP_CRITICAL');
  assert.ok(docGap, 'Must penalize missing documentation');

  // Must identify failing CI blocker (+30)
  const ciBlocker = result.blockers.find(b => b.severity === 'CI_BLOCKER');
  assert.ok(ciBlocker, 'Must flag failing CI pipeline as blocker');
});

test('Blast Radius: Handles outdated runbook in PROJ-3050 (Freshness penalty)', async () => {
  const result = await calculateBlastRadius('PROJ-3050');

  assert.equal(result.issueKey, 'PROJ-3050');
  const staleDoc = result.receipts.find(r => r.type === 'RISK_DOC');
  assert.ok(staleDoc, 'Must identify stale runbook (>45 days old)');
  assert.ok(result.doNext.some(d => d.includes('re-certify') || d.includes('runbook')));
});

test('Blast Radius: Score boundary invariant (Always strictly between 5 and 100)', async () => {
  const safe = await calculateBlastRadius('PROJ-1088');
  assert.ok(safe.score >= 5 && safe.score <= 100);

  const blocked = await calculateBlastRadius('PROJ-2001');
  assert.ok(blocked.score >= 5 && blocked.score <= 100);
});

// ============================================================================
// 3. MODEL CONTEXT PROTOCOL (MCP) SERVER PROTOCOL TESTS
// ============================================================================

test('MCP: Rejects non-object and invalid jsonrpc version with -32600', async () => {
  const nullRes = await handleMcpRequest(null);
  assert.equal(nullRes.error.code, -32600);

  const badRpcRes = await handleMcpRequest({ jsonrpc: '1.0', method: 'ping' });
  assert.equal(badRpcRes.error.code, -32600);
});

test('MCP: Handles ping and initialize protocol methods', async () => {
  const pingRes = await handleMcpRequest({ jsonrpc: '2.0', id: 'p1', method: 'ping' });
  assert.equal(pingRes.id, 'p1');
  assert.deepEqual(pingRes.result, {});

  const initRes = await handleMcpRequest({ jsonrpc: '2.0', id: 'init-1', method: 'initialize' });
  assert.equal(initRes.id, 'init-1');
  assert.equal(initRes.result.protocolVersion, '2024-11-05');
  assert.equal(initRes.result.serverInfo.name, 'shipguard-mcp-server');
  assert.ok(initRes.result.capabilities.tools);
});

test('MCP: Returns full tools list in tools/list', async () => {
  const listRes = await handleMcpRequest({ jsonrpc: '2.0', id: 'list-1', method: 'tools/list' });
  assert.equal(listRes.id, 'list-1');
  assert.equal(listRes.result.tools.length, MCP_TOOLS.length);

  const names = listRes.result.tools.map(t => t.name);
  assert.ok(names.includes('calculate_blast_radius'));
  assert.ok(names.includes('assess_release_readiness'));
  assert.ok(names.includes('query_teamwork_graph'));
  assert.ok(names.includes('scan_context_gaps'));
});

test('MCP: Handles resources/list and prompts/list cleanly', async () => {
  const resList = await handleMcpRequest({ jsonrpc: '2.0', id: 'res-1', method: 'resources/list' });
  assert.equal(resList.id, 'res-1');
  assert.deepEqual(resList.result.resources, []);

  const promptList = await handleMcpRequest({ jsonrpc: '2.0', id: 'pmt-1', method: 'prompts/list' });
  assert.equal(promptList.id, 'pmt-1');
  assert.deepEqual(promptList.result.prompts, []);
});

test('MCP: tools/call calculate_blast_radius returns structured text and JSON data', async () => {
  const callRes = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 'call-1',
    method: 'tools/call',
    params: {
      name: 'calculate_blast_radius',
      arguments: { issueKey: 'PROJ-1042' }
    }
  });

  assert.equal(callRes.id, 'call-1');
  assert.ok(callRes.result.content[0].text.includes('ShipGuard Blast Radius'));
  assert.equal(callRes.result.data.status, 'RELEASE_BLOCKED');
  assert.equal(callRes.result.data.issueKey, 'PROJ-1042');
});

test('MCP: tools/call assess_release_readiness evaluates entire version', async () => {
  const callRes = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 'call-2',
    method: 'tools/call',
    params: {
      name: 'assess_release_readiness',
      arguments: { releaseVersion: 'v2.4.0' }
    }
  });

  assert.equal(callRes.id, 'call-2');
  assert.ok(callRes.result.content[0].text.includes('Release Readiness Assessment'));
  assert.equal(callRes.result.data.releaseVersion, 'v2.4.0');
  assert.ok(callRes.result.data.assessments.length >= 2);
});

test('MCP: tools/call query_teamwork_graph returns raw graph traversal data', async () => {
  const callRes = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 'call-3',
    method: 'tools/call',
    params: {
      name: 'query_teamwork_graph',
      arguments: { issueKey: 'PROJ-1088' }
    }
  });

  assert.equal(callRes.id, 'call-3');
  assert.equal(callRes.result.data.issue.key, 'PROJ-1088');
});

test('MCP: tools/call scan_context_gaps returns filtered gaps and blockers', async () => {
  const callRes = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 'call-4',
    method: 'tools/call',
    params: {
      name: 'scan_context_gaps',
      arguments: { issueKey: 'PROJ-1042' }
    }
  });

  assert.equal(callRes.id, 'call-4');
  assert.ok(callRes.result.data.gaps.length > 0);
  assert.ok(callRes.result.data.blockers.length > 0);
});

test('MCP: Handles JSON-RPC 2.0 batch requests', async () => {
  const batchRes = await handleMcpRequest([
    { jsonrpc: '2.0', id: 'b1', method: 'ping' },
    { jsonrpc: '2.0', id: 'b2', method: 'tools/list' }
  ]);

  assert.ok(Array.isArray(batchRes), 'Batch response must be an array');
  assert.equal(batchRes.length, 2);
  assert.equal(batchRes[0].id, 'b1');
  assert.equal(batchRes[1].id, 'b2');
  assert.equal(batchRes[1].result.tools.length, MCP_TOOLS.length);
});

test('MCP: Rejects unknown tools and missing params with proper error codes', async () => {
  const missingName = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 'err-1',
    method: 'tools/call',
    params: {}
  });
  assert.equal(missingName.error.code, -32602);

  const unknownTool = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 'err-2',
    method: 'tools/call',
    params: { name: 'non_existent_tool' }
  });
  assert.equal(unknownTool.error.code, -32601);

  const unknownMethod = await handleMcpRequest({
    jsonrpc: '2.0',
    id: 'err-3',
    method: 'unknown/method'
  });
  assert.equal(unknownMethod.error.code, -32601);
});

// ============================================================================
// 4. ROVO ACTION HANDLER & RECEIPT VERIFICATION TESTS
// ============================================================================

test('Rovo: actionHandler dispatches all 4 actions cleanly', async () => {
  // Action 1: calculate-blast-radius
  const res1 = await actionHandler({
    actionKey: 'calculate-blast-radius',
    payload: { issueKey: 'PROJ-1088' }
  });
  assert.equal(res1.status, 'SAFE_TO_SHIP');

  // Action 2: assess-release-readiness
  const res2 = await actionHandler({
    actionKey: 'assess-release-readiness',
    payload: { releaseVersion: 'v2.4.0' }
  });
  assert.equal(res2.releaseVersion, 'v2.4.0');

  // Action 3: scan-context-gaps
  const res3 = await actionHandler({
    actionKey: 'scan-context-gaps',
    payload: { issueKey: 'PROJ-1042' }
  });
  assert.equal(res3.issueKey, 'PROJ-1042');
  assert.ok(res3.gapsDetected.length > 0);
  assert.ok(res3.remediationChecklist.length > 0);

  // Action 4: post-readiness-receipt
  const res4 = await actionHandler({
    actionKey: 'post-readiness-receipt',
    payload: { issueKey: 'PROJ-1042', receiptSummary: 'Verified by Lead SRE' }
  });
  assert.equal(res4.confirmed, true);
  assert.ok(res4.receiptId.startsWith('VERIFIED-'));

  // Unknown action returns informative error
  const resErr = await actionHandler({ actionKey: 'unknown-action' });
  assert.ok(resErr.error);
  assert.ok(resErr.supportedActions.length >= 4);
});
