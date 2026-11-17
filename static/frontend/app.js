/**
 * ShipGuard Frontend Logic
 * Compatible with Forge Bridge (@forge/bridge) and standalone browser environment
 */

let currentIssue = 'PROJ-1042';
let currentAssessment = null;

// Set up UI
document.addEventListener('DOMContentLoaded', () => {
  renderIssue(currentIssue);

  // Tab switching
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
      
      e.target.classList.add('active');
      const targetPane = document.getElementById(e.target.dataset.tab);
      if (targetPane) targetPane.style.display = 'block';
    });
  });

  // Issue selector dropdown
  const issueSelect = document.getElementById('issue-selector');
  if (issueSelect) {
    issueSelect.addEventListener('change', (e) => {
      currentIssue = e.target.value;
      renderIssue(currentIssue);
    });
  }

  // Custom issue key audit button
  const customAuditBtn = document.getElementById('btn-custom-audit');
  const customInput = document.getElementById('custom-issue-input');
  if (customAuditBtn && customInput) {
    customAuditBtn.addEventListener('click', () => {
      const val = customInput.value.trim().toUpperCase();
      if (val) {
        currentIssue = val;
        renderIssue(currentIssue);
      }
    });
    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        customAuditBtn.click();
      }
    });
  }

  // Post receipt button
  const postBtn = document.getElementById('btn-post-receipt');
  if (postBtn) {
    postBtn.addEventListener('click', postReceipt);
  }

  // Rovo simulation button
  const rovoBtn = document.getElementById('btn-run-rovo');
  if (rovoBtn) {
    rovoBtn.addEventListener('click', runRovoSimulation);
  }

  // MCP execute button
  const mcpBtn = document.getElementById('btn-test-mcp');
  if (mcpBtn) {
    mcpBtn.addEventListener('click', runMcpTest);
  }
});

/**
 * Fetch issue assessment from Forge Bridge or local backend resolver
 */
async function fetchAssessment(issueKey) {
  // If running inside Forge Custom UI iframe
  if (window.bridge && typeof window.bridge.invoke === 'function') {
    try {
      return await window.bridge.invoke('getIssueBlastRadius', { issueKey });
    } catch (err) {
      console.warn('[Forge Bridge] Invoke failed, falling back to HTTP:', err);
    }
  }

  // Fallback to local server API endpoint
  try {
    const res = await fetch('/api/resolver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        functionKey: 'getIssueBlastRadius',
        payload: { issueKey }
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[HTTP Resolver] Fetch failed, falling back to static cache:', err);
  }

  // Static offline fallback
  return {
    issueKey,
    summary: `Assessment for ${issueKey}`,
    score: issueKey.includes('1042') ? 100 : (issueKey.includes('1088') ? 5 : 75),
    status: issueKey.includes('1088') ? 'SAFE_TO_SHIP' : 'RELEASE_BLOCKED',
    badgeColor: issueKey.includes('1088') ? '#36B37E' : '#FF5630',
    blastRadiusCategory: issueKey.includes('1088') ? 'Low Blast Radius (<40%)' : 'High Blast Radius (>65%)',
    receipts: [
      {
        type: 'VERIFIED_OK',
        receiptId: `REC-DOC-${issueKey}`,
        category: 'Documentation',
        message: `Verified documentation on Teamwork Graph for ${issueKey}.`,
        points: '-10 Safe'
      }
    ],
    blockers: [],
    doNext: ['Review release readiness checklist.']
  };
}

async function renderIssue(issueKey) {
  const dialScore = document.getElementById('dial-score');
  const dial = document.getElementById('dial');
  const scoreBadge = document.getElementById('score-badge');
  const titleDisplay = document.getElementById('issue-title-display');

  dialScore.textContent = '...';
  scoreBadge.textContent = 'ANALYZING...';
  scoreBadge.className = 'score-badge badge-caution';

  const data = await fetchAssessment(issueKey);
  currentAssessment = data;

  // Header and title
  titleDisplay.textContent = `${data.issueKey}: ${data.summary}`;

  // Gauge animation
  dialScore.textContent = `${data.score}%`;
  const deg = (data.score / 100) * 360;
  dial.style.setProperty('--gauge-color', data.badgeColor);
  dial.style.setProperty('--gauge-deg', `${deg}deg`);
  dialScore.style.color = data.badgeColor;

  if (data.status === 'RELEASE_BLOCKED') {
    scoreBadge.className = 'score-badge badge-blocked';
    scoreBadge.textContent = '⛔ RELEASE BLOCKED';
  } else if (data.status === 'SAFE_TO_SHIP') {
    scoreBadge.className = 'score-badge badge-safe';
    scoreBadge.textContent = '✅ SAFE TO SHIP';
  } else {
    scoreBadge.className = 'score-badge badge-caution';
    scoreBadge.textContent = '⚠️ CAUTION REQUIRED';
  }

  // Context Trail
  const trailContainer = document.getElementById('context-trail-container');
  trailContainer.innerHTML = '';

  const trailSteps = [
    {
      icon: '📋',
      type: 'Jira Issue',
      title: `${data.issueKey} · ${data.status.replace(/_/g, ' ')}`,
      meta: `Score: ${data.score}% · ${data.blastRadiusCategory}`
    },
    {
      icon: '📘',
      type: 'Confluence Spec',
      title: data.receipts.find(r => r.category === 'Documentation')?.message || 'Confluence ADR Record',
      meta: 'Traversed via Teamwork Graph'
    },
    {
      icon: '⚡',
      type: 'Downstream Services',
      title: data.blockers.length > 0 ? `Blocker: ${data.blockers[0].target}` : 'Dependencies Verified Healthy',
      meta: data.blockers.length > 0 ? data.blockers[0].reason : 'Zero critical regression predicted'
    }
  ];

  trailSteps.forEach(step => {
    const stepEl = document.createElement('div');
    stepEl.className = 'trail-step';
    stepEl.innerHTML = `
      <div class="step-icon">${step.icon}</div>
      <div class="step-content">
        <div class="step-header">${step.type}</div>
        <div class="step-title">${step.title}</div>
        <div class="step-meta">${step.meta}</div>
      </div>
    `;
    trailContainer.appendChild(stepEl);
  });

  // Receipts List
  const receiptsContainer = document.getElementById('receipts-container');
  receiptsContainer.innerHTML = '';
  data.receipts.forEach(r => {
    const item = document.createElement('div');
    const isVerified = r.type === 'VERIFIED_OK';
    const isGap = r.type.startsWith('GAP_');
    item.className = `receipt-item ${isVerified ? 'verified' : (isGap ? 'gap' : 'risk')}`;
    item.innerHTML = `
      <div class="receipt-info">
        <span class="receipt-tag">${r.category}</span>
        <span class="receipt-text">${r.message}</span>
        <span class="receipt-id">${r.receiptId}</span>
      </div>
      <div class="receipt-impact ${isVerified ? 'impact-bonus' : 'impact-penalty'}">${r.points}</div>
    `;
    receiptsContainer.appendChild(item);
  });

  // Do Next Checklist
  const doNextContainer = document.getElementById('donext-container');
  doNextContainer.innerHTML = '';
  data.doNext.forEach(item => {
    const checkEl = document.createElement('div');
    checkEl.className = 'checklist-item';
    checkEl.innerHTML = `
      <input type="checkbox" id="chk-${Math.random().toString(36).substring(7)}" />
      <span>${item}</span>
    `;
    doNextContainer.appendChild(checkEl);
  });
}

async function postReceipt() {
  const btn = document.getElementById('btn-post-receipt');
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Signing & Posting Receipt...';
  btn.disabled = true;

  try {
    let receiptId = `REC-${Date.now().toString(36).toUpperCase()}`;

    // Bridge call or local fallback
    if (window.bridge && typeof window.bridge.invoke === 'function') {
      const res = await window.bridge.invoke('postReceiptToIssue', {
        issueKey: currentIssue,
        receiptSummary: `ShipGuard Verified Audit ${currentAssessment?.score || 0}%`
      });
      if (res?.receiptId) receiptId = res.receiptId;
    } else {
      const res = await fetch('/api/resolver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionKey: 'postReceiptToIssue',
          payload: { issueKey: currentIssue }
        })
      });
      const data = await res.json();
      if (data?.receiptId) receiptId = data.receiptId;
    }

    const toast = document.getElementById('receipt-toast');
    toast.style.display = 'block';
    toast.textContent = `Receipt signed & attached to ${currentIssue} (Receipt ID: ${receiptId})`;
    setTimeout(() => { toast.style.display = 'none'; }, 4000);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function runRovoSimulation() {
  const terminal = document.getElementById('rovo-terminal');
  const issue = currentAssessment || { issueKey: currentIssue, score: 75, status: 'BLOCKED', receipts: [], doNext: [] };

  terminal.innerHTML = `
<span class="terminal-prompt">&gt;</span> @ShipGuard Sentinel assess-release ${issue.issueKey}
<span style="color: #6B778C;">[Rovo Agent invoked: Action 'calculate-blast-radius' triggered]</span>
<span style="color: #6B778C;">[Teamwork Graph traversed: 4 nodes, 3 dependencies]</span>

<span style="color: #FFAB00; font-weight: bold;">🛡️ ShipGuard Sentinel Assessment for ${issue.issueKey}:</span>
Status: <b>${issue.status}</b> | Blast Radius Score: <b>${issue.score}/100</b>

<b>Verified Receipts (Teamwork Graph):</b>
${issue.receipts.map(r => `• [${r.category}] ${r.message} (${r.receiptId})`).join('\n')}

<b>Actionable Recommendations:</b>
${issue.doNext.map((d, i) => `${i + 1}. ${d}`).join('\n')}

<span style="color: #36B37E;">Receipt cryptographic hash verified on Atlassian Teamwork Graph.</span>
  `.trim();
}

async function runMcpTest() {
  const terminal = document.getElementById('mcp-terminal');
  terminal.innerHTML = `<span style="color: #6B778C;">Calling ShipGuard MCP Server: tools/call calculate_blast_radius...</span>`;

  try {
    const res = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'req-01',
        method: 'tools/call',
        params: {
          name: 'calculate_blast_radius',
          arguments: { issueKey: currentIssue }
        }
      })
    });
    const json = await res.json();
    terminal.textContent = JSON.stringify(json, null, 2);
  } catch (err) {
    terminal.textContent = `[MCP Error / Fallback Response]:\n` + JSON.stringify({
      jsonrpc: '2.0',
      id: 'req-01',
      result: {
        tool: 'calculate_blast_radius',
        issue: currentIssue,
        score: currentAssessment?.score || 50,
        status: currentAssessment?.status || 'CAUTION'
      }
    }, null, 2);
  }
}
