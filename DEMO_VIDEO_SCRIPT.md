# 🎬 ShipGuard Sentinel: 4-Minute Demo Video Script
**Target Duration:** 3 minutes 50 seconds (Strict Hackathon Rule: Under 5 Minutes)
**Platform:** YouTube (Public)
**Target Rubric:** Presentation (20%), Tech Implementation (20%), Innovation (20%)

---

### Video Structure Breakdown

```
0:00 - 0:35  | ACT 1: The Hook & The Problem ("Deployment Roulette")
0:35 - 1:30  | ACT 2: Jira Dashboard & Teamwork Graph (TWG) Blast Radius
1:30 - 2:20  | ACT 3: Assignable Rovo Agent (@ShipGuard Sentinel) Live Chat
2:20 - 3:10  | ACT 4: Model Context Protocol (MCP) in Cursor / Terminal
3:10 - 3:50  | ACT 5: Architecture, Receipts, & Closing Pitch
```

---

### Shot-by-Shot Walkthrough & Narration

#### 🕒 [0:00 - 0:35] ACT 1: The Hook & The Problem
- **Visual:** Open with a slide or screen showing a failed deployment notification (Slack/Paging alert) or a Jira issue marked "Done".
- **Voiceover:**
  > *"Every engineering team knows the dread of 'Deployment Roulette'. The Jira ticket is marked 'Done', CI is green, yet releasing to production causes a sev-1 outage. Why? Because critical context is fragmented: someone changed an API without updating the Confluence Architecture Record, or the downstream service owner is out of office. AI chatbots can guess, but guessing in production causes outages. Welcome to ShipGuard Sentinel: built for Codegeist 2026."*

#### 🕒 [0:35 - 1:30] ACT 2: Jira Dashboard & Teamwork Graph (TWG)
- **Visual:** Screen shares the ShipGuard Sentinel Jira Project Page (or local live preview at `localhost:3000`). Select `PROJ-1042` from the dropdown. The Blast Radius dial turns Red at 90% (RELEASE BLOCKED).
- **Voiceover:**
  > *"ShipGuard Sentinel transforms Atlassian's Teamwork Graph into an autonomous release auditor. Here on our Jira release dashboard, ShipGuard analyzes ticket PROJ-1042. Instead of AI hallucinations, ShipGuard calculates a deterministic Blast Radius score: 90%, Release Blocked.*
  > *Look at the Connected Context Trail below: via multi-hop Cypher queries, it traversed the issue to Confluence ADR-42, to the Bitbucket PR, and discovered a critical blocker: breaking API changes on Tier-1 microservice 'checkout-api' without an updated contract schema, plus an on-call engineer who is Out-of-Office.*
  > *Every penalty is backed by a verifiable 'Receipt'. And here is an actionable Do-Next checklist to unblock the release."*
- **Action:** Switch dropdown to `PROJ-1088`. The dial animates smoothly to Green (15% - SAFE TO SHIP).
  > *"When an issue is safe, like PROJ-1088, the gauge confirms zero blockers and signs a cryptographic release receipt."*

#### 🕒 [1:30 - 2:20] ACT 3: Rovo Assignable Agent (`@ShipGuard`)
- **Visual:** Click over to the "Rovo Agent" tab or Atlassian Rovo chat window. Click "Test @ShipGuard assess-release Command".
- **Voiceover:**
  > *"Next is our Rovo Assignable Agent: @ShipGuard Sentinel. Using the official `rovo:agent` and reusable `action` modules, developers can chat directly with their releases inside Jira comments or Rovo Chat.*
  > *We ask: `@ShipGuard assess-release PROJ-1042`.*
  > *The agent invokes our deterministic action handlers, executes the Teamwork Graph query, and returns instant receipts with zero hallucinations. It highlights exact blockers and provides clear remediation steps without the engineer ever leaving their conversation."*

#### 🕒 [2:20 - 3:10] ACT 4: Atlassian MCP Server (IDE Integration)
- **Visual:** Switch to the "MCP Developer Tools" tab or open Cursor / VS Code / Terminal. Click "Send JSON-RPC tools/call calculate_blast_radius" to show the live response.
- **Voiceover:**
  > *"Now for the developer experience breakthrough: Atlassian MCP. ShipGuard exposes a full Model Context Protocol server via the `rovo:mcp` module conforming to JSON-RPC 2.0.*
  > *A developer working in Cursor, Claude Code, or Windsurf can query Atlassian Teamwork Graph context straight from their IDE before committing code!*
  > *With one MCP tool call, the developer inspects downstream dependencies, schema contracts, and on-call availability directly in their code editor."*

#### 🕒 [3:10 - 3:50] ACT 5: Architecture, 18 Tests & Closing Pitch
- **Visual:** Show the terminal running `npm test` (all 18 tests passing in green), followed by the architecture diagram in `README.md`.
- **Voiceover:**
  > *"Under the hood, ShipGuard is 100% serverless Forge, backed by an automated test suite with 18 unit and integration tests passing in milliseconds.*
  > *We qualified for the Apps for Software Teams category, and all four bonus prizes: Rovo Assignable Agents, Atlassian MCP, Teamwork Graph, and Marketplace publication.*
  > *ShipGuard Sentinel: Build with context. Ship with confidence. Thank you!"*

---

### Recording Tips
1. Record in 1080p 60fps or 30fps.
2. Use crisp audio (headset or USB mic).
3. Keep screen zooms focused on the Blast Radius Gauge, Rovo Chat response, and MCP JSON output.
4. Upload to YouTube as **Public** and copy the link into Devpost before December 23!
