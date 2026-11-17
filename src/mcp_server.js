/**
 * ShipGuard Model Context Protocol (MCP) Server Module
 * Implements JSON-RPC 2.0 / MCP spec for external developer AI clients (Cursor, Claude Code, Windsurf)
 * Integrates directly with Atlassian Teamwork Graph and Forge runtime.
 */

import { calculateBlastRadius } from './blast_radius.js';
import { queryTeamworkGraph, queryReleaseGraph, normalizeIssueKey } from './twg_graph.js';

export const MCP_TOOLS = [
  {
    name: 'calculate_blast_radius',
    description: 'Calculates a deterministic 0-100 blast radius score for a Jira issue based on Teamwork Graph context, ADR presence, downstream services, and on-call coverage.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The Jira issue key to audit, e.g. PROJ-1042'
        }
      },
      required: ['issueKey']
    }
  },
  {
    name: 'assess_release_readiness',
    description: 'Audits all tickets and context within a target release version/FixVersion and flags critical release blockers.',
    inputSchema: {
      type: 'object',
      properties: {
        releaseVersion: {
          type: 'string',
          description: 'The release version string, e.g. v2.4.0'
        }
      },
      required: ['releaseVersion']
    }
  },
  {
    name: 'query_teamwork_graph',
    description: 'Traverses Atlassian Teamwork Graph Cypher relationships for an issue, returning linked Confluence specs, downstream services, and PRs.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The Jira issue key'
        }
      },
      required: ['issueKey']
    }
  },
  {
    name: 'scan_context_gaps',
    description: 'Scans for missing Architectural Decision Records (ADRs), unlinked PRs, and out-of-office downstream service owners.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The Jira issue key'
        }
      },
      required: ['issueKey']
    }
  }
];

/**
 * Handle a single JSON-RPC 2.0 request
 */
async function handleSingleMcpRequest(requestBody) {
  if (!requestBody || typeof requestBody !== 'object') {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Invalid Request: payload must be an object' }
    };
  }

  const { jsonrpc, id, method, params } = requestBody;

  if (jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      id: id || null,
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' }
    };
  }

  // MCP Ping
  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  // MCP Initialize
  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false },
          prompts: { listChanged: false }
        },
        serverInfo: {
          name: 'shipguard-mcp-server',
          version: '1.0.0'
        }
      }
    };
  }

  // MCP Initialized Notification (no response needed if no ID)
  if (method === 'notifications/initialized') {
    return id ? { jsonrpc: '2.0', id, result: {} } : null;
  }

  // MCP List Tools
  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: MCP_TOOLS }
    };
  }

  // MCP List Resources (Clean capability support)
  if (method === 'resources/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { resources: [] }
    };
  }

  // MCP List Prompts (Clean capability support)
  if (method === 'prompts/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { prompts: [] }
    };
  }

  // MCP Call Tool
  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};

    if (!name || typeof name !== 'string') {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: 'Invalid params: tool "name" is required' }
      };
    }

    try {
      if (name === 'calculate_blast_radius') {
        const issueKey = normalizeIssueKey(args?.issueKey);
        const assessment = await calculateBlastRadius(issueKey);
        const formattedMarkdown = [
          `### 🛡️ ShipGuard Blast Radius: ${assessment.issueKey} (${assessment.score}/100 - ${assessment.status})`,
          `**Summary:** ${assessment.summary}`,
          `**Risk Category:** ${assessment.blastRadiusCategory}`,
          '',
          '#### 🧾 Audit Receipts (Teamwork Graph):',
          ...assessment.receipts.map(r => `- \`[${r.category}]\` ${r.message} (${r.receiptId}) [${r.points}]`),
          '',
          assessment.blockers.length > 0 ? `#### ⚠️ Critical Blockers:\n${assessment.blockers.map(b => `- **[${b.severity}]** ${b.reason}`).join('\n')}\n` : '',
          '#### 📋 Do Next Remediation Checklist:',
          ...assessment.doNext.map(d => `1. ${d}`)
        ].join('\n');

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: formattedMarkdown }],
            data: assessment
          }
        };
      }

      if (name === 'assess_release_readiness') {
        const version = args?.releaseVersion || 'v2.4.0';
        const release = await queryReleaseGraph(version);
        const assessments = await Promise.all(
          release.issues.map(iss => calculateBlastRadius(iss.key))
        );
        const avgScore = Math.round(assessments.reduce((acc, curr) => acc + curr.score, 0) / assessments.length);
        const blockedCount = assessments.filter(a => a.status === 'RELEASE_BLOCKED').length;

        const summaryText = [
          `### 📦 Release Readiness Assessment: ${release.releaseVersion}`,
          `- **Total Tracked Issues:** ${release.totalIssues}`,
          `- **Average Blast Radius:** ${avgScore}/100`,
          `- **Critical Blockers Detected:** ${blockedCount}`,
          `- **Overall Verdict:** ${blockedCount > 0 ? '⛔ BLOCKED' : '✅ READY TO SHIP'}`,
          '',
          '#### Issues Breakdown:',
          ...assessments.map(a => `- **${a.issueKey}**: ${a.summary} (${a.score}% - ${a.status})`)
        ].join('\n');

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: summaryText }],
            data: { releaseVersion: release.releaseVersion, avgScore, blockedCount, assessments }
          }
        };
      }

      if (name === 'query_teamwork_graph') {
        const issueKey = normalizeIssueKey(args?.issueKey);
        const rawGraph = await queryTeamworkGraph(issueKey);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(rawGraph, null, 2)
              }
            ],
            data: rawGraph
          }
        };
      }

      if (name === 'scan_context_gaps') {
        const issueKey = normalizeIssueKey(args?.issueKey);
        const assessment = await calculateBlastRadius(issueKey);
        const gaps = assessment.receipts.filter(r => r.type.startsWith('GAP_') || r.type.startsWith('RISK_'));
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `Identified ${gaps.length} context gaps for ${issueKey}.`
              }
            ],
            data: { issueKey, gaps, blockers: assessment.blockers }
          }
        };
      }

      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool not found: ${name}` }
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: `Execution error: ${err.message}` }
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not supported: ${method}` }
  };
}

/**
 * Handle MCP Request with Batch support
 */
export async function handleMcpRequest(requestBody) {
  if (Array.isArray(requestBody)) {
    return await Promise.all(requestBody.map(req => handleSingleMcpRequest(req)));
  }
  return await handleSingleMcpRequest(requestBody);
}
