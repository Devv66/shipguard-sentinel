# 🛡️ ShipGuard Sentinel
### Autonomous Release Readiness & Blast-Radius Sentinel for Atlassian Forge
**Built for Codegeist 2026: Build with context. Ship with confidence.**

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](tests/)
[![Forge](https://img.shields.io/badge/Atlassian-Forge%20CLI%2014.2+-blue.svg)](https://developer.atlassian.com/platform/forge/)
[![Rovo Agent](https://img.shields.io/badge/Rovo-Assignable%20Agent-purple.svg)](manifest.yml)
[![MCP](https://img.shields.io/badge/Protocol-MCP%20JSON--RPC%202.0-0052CC.svg)](src/mcp_server.js)
[![Teamwork Graph](https://img.shields.io/badge/TWG-Cypher%20Traversal-00875A.svg)](src/twg_graph.js)

---

## 🌟 What is ShipGuard Sentinel?

Modern engineering teams face a critical challenge: Jira tickets are marked "Done", CI builds pass, yet deployments trigger outages due to hidden dependency gaps. 

**ShipGuard Sentinel** transforms Atlassian's **Teamwork Graph (TWG)** into an active, autonomous release guardian:
1. **Deterministic Blast-Radius Score (0–100%):** Replaces subjective "vibes" with mathematical risk evaluation across linked Jira issues, Confluence ADRs, Bitbucket PRs, and Opsgenie on-call schedules.
2. **Audit Receipts ("Receipts over Hallucinations"):** Every score penalty or bonus is backed by a verifiable entity ID (e.g. `REC-DOC-conf-8821`, `REC-SCHEMA-checkout-api`).
3. **Assignable Rovo Agent (`@ShipGuard Sentinel`):** Chat with your release directly in Jira or Rovo chat.
4. **Model Context Protocol (MCP) Server:** Exposes Teamwork Graph context to Cursor, Claude Code, and Windsurf IDEs.

---

## 🏗️ Architecture & Stack

```
                     ┌─────────────────────────────────────────┐
                     │          ATLASSIAN FORGE APP            │
                     └────────────────────┬────────────────────┘
                                          │
       ┌───────────────────┬──────────────┴───────┬────────────────────┐
       ▼                   ▼                      ▼                    ▼
┌──────────────┐   ┌───────────────┐     ┌──────────────────┐   ┌─────────────┐
│  Jira Custom │   │  Rovo Agent   │     │ Forge MCP Server │   │  Teamwork   │
│  UI / Panel  │   │  (@ShipGuard) │     │  (JSON-RPC 2.0)  │   │ Graph (TWG) │
│  (Atlaskit)  │   │ (rovo:agent)  │     │   (rovo:mcp)     │   │  (Cypher)   │
└──────────────┘   └───────────────┘     └──────────────────┘   └─────────────┘
       │                   │                      │                    │
       └───────────────────┴──────────────┬───────┴────────────────────┘
                                          ▼
                         ┌─────────────────────────────────┐
                         │   Deterministic Blast-Radius    │
                         │    & Receipts Audit Engine      │
                         └─────────────────────────────────┘
```

---

## 🚀 Quick Start (Local Simulator & Forge)

### 1. Run Automated Test Suite
```bash
npm test
```
All 6 tests validate the deterministic scoring engine, Teamwork Graph Cypher traversal, and MCP server protocol.

### 2. Start Live Interactive Preview Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) to access the interactive Atlaskit UI dashboard, run Rovo Agent simulations, and execute live MCP JSON-RPC calls.

### 3. Deploy to Atlassian Forge Environment
```bash
# 1. Login to your Atlassian developer account
forge login

# 2. Register your app ID
forge register

# 3. Deploy to development environment
forge deploy

# 4. Install onto your development Jira site
forge install
```

---

## 🔌 Model Context Protocol (MCP) Integration

ShipGuard implements the Model Context Protocol (MCP) standard. Developers using **Cursor**, **Claude Desktop**, or **Claude Code** can add ShipGuard to their `mcpServers` configuration:

```json
{
  "mcpServers": {
    "shipguard": {
      "command": "node",
      "args": ["/path/to/shipguard-forge/src/mcp_server.js"],
      "env": {
        "ATLASSIAN_SITE_URL": "https://your-domain.atlassian.net"
      }
    }
  }
}
```

### Available Tools:
- `calculate_blast_radius(issueKey)`: Computes 0-100 score, audit receipts, and blockers.
- `assess_release_readiness(releaseVersion)`: Audits all issues in a FixVersion.
- `query_teamwork_graph(issueKey)`: Returns raw multi-hop Cypher traversal data.

---

## 🏆 Bonus Prize Mapping

| Bonus Category | Module | Status |
| :--- | :--- | :--- |
| **Best Agents - Rovo** ($1,500) | `rovo:agent` + reusable `action`s | ✅ Implemented |
| **Best app with Atlassian MCP** ($1,500) | `rovo:mcp` + JSON-RPC handler | ✅ Implemented |
| **Teamwork Graph integration** ($1,500) | `requestTeamworkGraph` Cypher queries | ✅ Implemented |
| **Marketplace published app** ($1,500) | Listing package & ticket workflow | ✅ Ready (See guide) |

---

## 📄 License
Apache-2.0
