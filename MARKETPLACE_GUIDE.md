# 🏪 ShipGuard Sentinel: Atlassian Marketplace & Deployment Guide
**Atlassian Codegeist 2026: Official Bonus Prize Strategy & Distribution Walkthrough**

This guide provides complete instructions for deploying **ShipGuard Sentinel** on the Atlassian Forge platform and listing it on the **Atlassian Marketplace** to claim the **$1,500 "Best Marketplace Published App"** bonus prize.

---

## 🏆 Bonus Prize Requirement & Rules

According to the official Codegeist 2026 Hackathon Rules:
> **6 Best Marketplace published app ($1,500 to 6 projects):**  
> *"Must be published to the Marketplace or submitted for listing. Provide either the link to the listing or link to the Marketplace review ticket."*

You do **not** need to wait for Atlassian's manual certification review to finish before the hackathon deadline. Submitting the app and pasting the resulting **Marketplace Review Ticket URL (`AMKTP-XXXXX` / `ECOS-XXXXX`)** into your Devpost entry locks in your eligibility!

---

## 1. Prerequisites

Before deploying, ensure you have:
1. **Atlassian Cloud Development Tenant:** A developer cloud instance with Jira Software and Confluence enabled. (Get one free at [go.atlassian.com/cloud-dev](https://go.atlassian.com/cloud-dev)).
2. **Atlassian Developer Account:** Log in at [developer.atlassian.com](https://developer.atlassian.com).
3. **Node.js LTS:** Node.js v20.x or v22.x with npm 10+.
4. **Forge CLI:** Installed globally or via npx:
   ```bash
   npm install -g @forge/cli
   forge --version # Ensure v14.x or later
   ```
5. **Docker Desktop (Optional):** Required only if running live code tunnels with `forge tunnel`.

---

## 2. Forge CLI Setup & Deployment Lifecycle

### Step 2.1: Authenticate with Atlassian
Run the login command in your terminal. This generates a secure API token through your default web browser:
```bash
forge login
```
*Headless/CI Alternative:* Set environment variables:
```bash
export FORGE_EMAIL="your-email@example.com"
export FORGE_API_TOKEN="your_atlassian_api_token"
```

### Step 2.2: Register the App ID
In the project root directory (`shipguard-forge/`), register your app with your Atlassian developer tenant:
```bash
forge register
```
*Tip: Give your app a recognizable name when prompted, e.g., `ShipGuard-Sentinel`.*

### Step 2.3: Verify Code & Manifest Integrity
Run the built-in Forge linter to validate manifest modules (`rovo:agent`, `rovo:mcp`, `jira:projectPage`, `jira:issuePanel`) and permissions:
```bash
forge lint
```
*Expected output: `✔ 0 issues found`.*

### Step 2.4: Deploy to Development Environment
Compile and upload your backend functions and Custom UI static bundle to Atlassian's serverless cloud:
```bash
forge deploy -e development
```

### Step 2.5: Install App onto Your Development Tenant
Authorize and mount ShipGuard Sentinel onto your Jira Cloud site:
```bash
forge install -e development
```
- Select **Jira** as the product.
- Enter your tenant URL (e.g., `https://your-team.atlassian.net`).
- Confirm OAuth permission scopes.

### Step 2.6: Deploy to Production for Marketplace Listing
Before listing on the Marketplace, deploy a production build:
```bash
forge deploy -e production
forge install -e production --site your-team.atlassian.net
```

---

## 3. Atlassian Marketplace Listing Specification

Use the pre-written copy below when creating your listing in the [Atlassian Marketplace Vendor Portal](https://marketplace.atlassian.com/manage/plugins):

### 3.1 Listing Metadata
- **App Name:** `ShipGuard Sentinel: Release Context & Blast-Radius Auditor`
- **Hosting Type:** `Cloud (Forge)`
- **Categories:** `Project Management`, `Code & Development`, `Continuous Integration`
- **App Tagline:** `Autonomous release readiness and Teamwork Graph blast-radius sentinel with receipts.`

### 3.2 Key User Benefits
1. **Eliminate Deployment Outages:** Calculates a deterministic 0–100% blast radius before merging code, uncovering hidden API breaking changes and missing contract schemas.
2. **"Receipts Over Hallucinations":** Every risk score, warning, and blocker cites concrete Jira issue keys, Confluence ADR titles, and Bitbucket PR commit diffs.
3. **Conversational Release Auditing (@ShipGuard):** Mention `@ShipGuard assess-release` directly inside Jira comments or Rovo Chat for instant context without leaving your workflow.
4. **IDE-Connected Context via MCP:** External developer AI tools (Cursor, Claude Code, Windsurf) connect to Atlassian Teamwork Graph via Model Context Protocol (MCP).

### 3.3 Marketplace Overview Copy (Markdown)
```markdown
### Ship with Context. Deploy with Confidence.

Modern engineering teams face a critical challenge: Jira tickets are marked "Done", CI builds pass, yet production releases trigger outages due to fragmented context. 

**ShipGuard Sentinel** bridges that gap using Atlassian's **Teamwork Graph (TWG)**:
- **Blast Radius Dial:** Real-time visual gauge inside Jira releases showing 0-100% risk exposure.
- **Connected Context Trail:** Visualizes multi-hop dependencies: Jira Issue -> Confluence Specs -> Bitbucket PRs -> Downstream Services -> Opsgenie On-Call.
- **Do-Next Remediation:** Actionable checklist identifying unassigned on-call engineers, unreviewed database migrations, and stale architecture records.
- **Model Context Protocol (MCP) Server:** Query Jira and Teamwork Graph dependencies straight from Cursor or Claude Code.
```

---

## 4. Submitting for Approval & Grabbing the Review Ticket

1. Log in to the [Atlassian Marketplace Vendor Portal](https://marketplace.atlassian.com/manage/plugins).
2. Click **"Create app"** and paste your Forge app ARI (found via `forge settings list` or generated during `forge register`).
3. Fill in the listing details using the copy from Section 3 above.
4. Upload app icons (`assets/` or 144x144 png) and at least 2 screenshots of the dashboard.
5. Click **"Submit for Review"**.
6. Immediately upon submission, Atlassian generates a public/vendor Jira Service Management ticket URL:
   `https://ecosystem.atlassian.net/browse/AMKTP-XXXXX`

---

## 5. Devpost Hackathon Form Final Checklist

In your Devpost submission form for **Codegeist 2026**:
- [x] Check the bonus prize: **"Best Marketplace published app"**.
- [x] Paste your Marketplace listing URL or review ticket: `https://ecosystem.atlassian.net/browse/AMKTP-XXXXX`.
- [x] Include your Forge installation sharing link (generated via `forge install --share`).
- [x] Include public YouTube video demo URL (under 5 minutes).
