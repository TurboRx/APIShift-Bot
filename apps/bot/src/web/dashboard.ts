/**
 * APIShift Web Dashboard & Interactive Workbench
 * Premium, ultra-responsive dark mode UI with Monaco Diff Editor, Interactive Schema Differ, Fleet Manager, Spec Watcher, and Webhook Queue Monitor.
 * Fully optimized for touch devices, mobile viewports, and desktop workstations.
 */

export function renderDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <title>APIShift — Autonomous API Code Migration Engine</title>
  <meta name="description" content="APIShift is an Autonomous API Code Migration Engine. Automatically detect breaking API changes and submit deterministic AST refactoring Pull Requests across customer codebases.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #080b11;
      --bg-card: rgba(15, 23, 42, 0.85);
      --bg-card-hover: rgba(30, 41, 59, 0.9);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(99, 102, 241, 0.5);
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --secondary: #06b6d4;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --font-heading: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-code: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

    html, body {
      width: 100%;
      min-height: 100%;
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-body);
      line-height: 1.5;
      background-image: 
        radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 90% 90%, rgba(6, 182, 212, 0.1) 0%, transparent 45%);
      background-attachment: fixed;
      overflow-x: hidden;
    }

    /* Top Navigation Header */
    header {
      position: sticky; top: 0; z-index: 100;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      background: rgba(8, 11, 17, 0.88);
      border-bottom: 1px solid var(--border-color);
      padding: 0.75rem 1.25rem;
      display: flex; justify-content: space-between; align-items: center;
      gap: 0.75rem; width: 100%;
    }

    .logo-container { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; min-width: 0; }
    .logo-icon {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      font-family: var(--font-heading); font-weight: 800; font-size: 1.15rem; color: white;
      flex-shrink: 0;
    }

    .logo-text {
      font-family: var(--font-heading); font-weight: 800; font-size: 1.25rem; color: #ffffff;
      letter-spacing: -0.02em; white-space: nowrap;
    }

    .nav-badge {
      background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3);
      color: #a5b4fc; font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.55rem; border-radius: 20px;
      white-space: nowrap;
    }

    .header-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

    .btn-github {
      background: rgba(255, 255, 255, 0.08); border: 1px solid var(--border-color);
      color: var(--text-main); font-weight: 600; padding: 0.45rem 0.85rem; border-radius: 8px;
      text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;
      font-size: 0.8rem; transition: all 0.2s ease; min-height: 38px;
    }
    .btn-github:hover { background: rgba(255, 255, 255, 0.15); border-color: rgba(255, 255, 255, 0.2); }

    /* Layout & Main Container */
    .container { max-width: 1400px; margin: 0 auto; padding: 1.5rem 1rem; width: 100%; }

    .hero { text-align: center; max-width: 850px; margin: 0 auto 1.75rem auto; padding: 0 0.5rem; }
    .hero-tag {
      display: inline-block;
      background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 20px; margin-bottom: 0.75rem;
      letter-spacing: 0.03em;
    }
    .hero h1 {
      font-family: var(--font-heading); font-size: clamp(1.6rem, 4vw, 2.75rem); font-weight: 800;
      line-height: 1.2; color: #ffffff; margin-bottom: 0.6rem;
    }
    .hero p { font-size: clamp(0.875rem, 1.8vw, 1.05rem); color: var(--text-muted); line-height: 1.55; max-width: 740px; margin: 0 auto; }

    /* Tab Navigation (Touch-optimized bar) */
    .tab-nav-wrapper {
      position: relative; width: 100%; margin-bottom: 1.5rem; overflow: hidden;
    }
    .tab-nav {
      display: flex; gap: 0.4rem; border-bottom: 1px solid var(--border-color);
      overflow-x: auto; scroll-behavior: smooth; -webkit-overflow-scrolling: touch;
      scrollbar-width: none; padding-bottom: 2px;
    }
    .tab-nav::-webkit-scrollbar { display: none; }

    .tab-btn {
      background: transparent; border: none; color: var(--text-muted); font-family: var(--font-heading);
      font-weight: 600; font-size: 0.9rem; padding: 0.65rem 1.1rem; border-radius: 8px 8px 0 0;
      cursor: pointer; transition: all 0.2s ease; border-bottom: 2px solid transparent; white-space: nowrap;
      display: inline-flex; align-items: center; gap: 0.4rem; min-height: 42px; touch-action: manipulation;
    }
    .tab-btn:hover { color: var(--text-main); background: rgba(255, 255, 255, 0.04); }
    .tab-btn.active { color: #818cf8; border-bottom-color: #818cf8; background: rgba(99, 102, 241, 0.12); }

    .tab-content { display: none; width: 100%; }
    .tab-content.active { display: block; animation: fadeIn 0.2s ease-in-out; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Cards & Panels */
    .card-panel {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      padding: 1.25rem; margin-bottom: 1.5rem; backdrop-filter: blur(12px); width: 100%;
    }

    .section-title {
      font-family: var(--font-heading); font-size: 1.2rem; font-weight: 700; color: #ffffff;
      margin-bottom: 0.35rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;
    }

    .section-subtitle { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.1rem; }

    /* Workbench Controls & Toolbar */
    .workbench-toolbar {
      display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.1rem;
      background: rgba(15, 23, 42, 0.7); padding: 0.85rem; border-radius: 10px; border: 1px solid var(--border-color);
    }

    .rule-input-group {
      display: grid; grid-template-columns: 1fr; gap: 0.6rem; width: 100%;
    }

    .input-row { display: flex; gap: 0.5rem; align-items: center; width: 100%; }

    .input-custom {
      width: 100%; background: rgba(8, 11, 17, 0.85); border: 1px solid var(--border-color); color: var(--text-main);
      padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.9rem; font-family: var(--font-body);
      outline: none; transition: border-color 0.2s ease; min-height: 42px;
    }
    .input-custom:focus { border-color: var(--primary); }

    .select-preset {
      width: 100%; background: rgba(8, 11, 17, 0.95); color: var(--text-main); border: 1px solid var(--border-color);
      padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.875rem; font-family: var(--font-body);
      outline: none; cursor: pointer; min-height: 42px; -webkit-appearance: none; appearance: none;
      background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
      background-repeat: no-repeat; background-position: right 0.85rem top 50%; background-size: 0.65rem auto; padding-right: 2rem;
    }

    .btn-actions-row { display: flex; gap: 0.5rem; align-items: center; width: 100%; flex-wrap: wrap; }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-hover)); color: white; font-weight: 600;
      padding: 0.65rem 1.25rem; border: none; border-radius: 8px; cursor: pointer; font-size: 0.875rem;
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s ease;
      min-height: 42px; flex: 1; touch-action: manipulation; text-align: center;
    }
    .btn-primary:hover { opacity: 0.95; transform: translateY(-1px); }
    .btn-primary:active { transform: translateY(0); }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08); border: 1px solid var(--border-color); color: var(--text-main); font-weight: 600;
      padding: 0.65rem 1.1rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem;
      display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; transition: background 0.2s ease;
      min-height: 42px; touch-action: manipulation;
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }
    .btn-secondary:active { background: rgba(255, 255, 255, 0.2); }

    /* Monaco Diff Container */
    .diff-wrapper {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; margin-bottom: 1.1rem; width: 100%;
    }
    .diff-header {
      background: rgba(15, 23, 42, 0.95); padding: 0.65rem 1rem; border-bottom: 1px solid var(--border-color);
      display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 600;
      color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; flex-wrap: wrap; gap: 0.5rem;
    }
    #monaco-diff-container { width: 100%; height: clamp(320px, 45vh, 480px); }

    .metrics-bar {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem;
      background: rgba(15, 23, 42, 0.6); padding: 0.65rem 1rem; border-radius: 8px; border: 1px solid var(--border-color);
      font-size: 0.8rem; color: var(--text-muted);
    }
    .metric-pill { font-weight: 600; color: #34d399; }    /* Grids & Responsiveness */
    .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; width: 100%; }
    .grid-2col > *, .differ-grid > * { min-width: 0; }
    
    .table-responsive {
      width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;
      border-radius: 8px; border: 1px solid var(--border-color); margin-top: 0.5rem;
    }
    .table-custom { width: 100%; border-collapse: collapse; font-size: 0.825rem; min-width: 480px; }
    .table-custom th, .table-custom td { padding: 0.7rem 0.85rem; text-align: left; border-bottom: 1px solid var(--border-color); }
    .table-custom th { background: rgba(15, 23, 42, 0.9); color: var(--text-dim); font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; }

    .badge-status { font-size: 0.725rem; font-weight: 600; padding: 0.2rem 0.55rem; border-radius: 4px; display: inline-block; white-space: nowrap; }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge-pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-info { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem; margin-bottom: 1rem; width: 100%; }
    .stats-row > * { min-width: 0; }
    .stat-box { background: rgba(8, 11, 17, 0.7); border: 1px solid var(--border-color); padding: 0.65rem 0.4rem; border-radius: 8px; text-align: center; }
    .stat-val { font-size: 1.25rem; font-weight: 700; color: #38bdf8; font-family: var(--font-heading); }
    .stat-lbl { font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }

    /* Interactive Schema Differ UI */
    .differ-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; width: 100%; }
    .differ-textarea {
      width: 100%; height: 200px; background: rgba(8, 11, 17, 0.9); border: 1px solid var(--border-color);
      border-radius: 8px; color: #f8fafc; font-family: var(--font-code); font-size: 14px; padding: 0.75rem;
      resize: vertical; outline: none; line-height: 1.45;
    }
    .differ-textarea:focus { border-color: var(--primary); }

    .result-box {
      background: rgba(8, 11, 17, 0.9); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.85rem;
      font-family: var(--font-code); font-size: 0.8rem; color: #e2e8f0; white-space: pre-wrap; word-break: break-all;
      max-height: 240px; overflow-y: auto;
    }

    footer { border-top: 1px solid var(--border-color); padding: 1.5rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 2rem; }

    /* Responsive Breakpoints */
    @media (max-width: 1024px) {
      .grid-2col, .differ-grid { grid-template-columns: 1fr; }
    }

    @media (min-width: 768px) {
      .workbench-toolbar { flex-direction: row; align-items: center; justify-content: space-between; padding: 0.85rem 1.1rem; }
      .rule-input-group { grid-template-columns: 1.8fr 1fr auto 1fr; align-items: center; max-width: 680px; }
      .btn-actions-row { width: auto; flex: initial; }
      .btn-primary { flex: initial; }
    }

    /* Mobile Breakpoints (< 768px) */
    @media (max-width: 767px) {
      header { flex-wrap: wrap; }
      .nav-badge { display: none; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .diff-header { font-size: 0.7rem; }
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
</head>
<body>

  <header>
    <a href="#" class="logo-container">
      <div class="logo-icon">A</div>
      <span class="logo-text">APIShift</span>
      <span class="nav-badge">Autonomous API Engine</span>
    </a>
    <div class="header-actions">
      <a href="https://github.com/TurboRx/APIShift-Bot" target="_blank" class="btn-github">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
        <span>GitHub</span>
      </a>
    </div>
  </header>

  <div class="container">
    <section class="hero">
      <span class="hero-tag">Deterministic AST Engine & Hybrid AI Fallback</span>
      <h1>Self-Maintaining APIs for Engineering Teams</h1>
      <p>Continuous OpenAPI spec diffing, zero-token-cost Babel AST code refactoring, multi-repository fleet management, and automated GitHub Pull Request generation.</p>
    </section>

    <!-- Navigation Tabs -->
    <div class="tab-nav-wrapper">
      <div class="tab-nav" id="tab-nav-container">
        <button class="tab-btn active" data-tab="workbench">AST Rewriter Workbench</button>
        <button class="tab-btn" data-tab="differ">OpenAPI Schema Differ</button>
        <button class="tab-btn" data-tab="watcher">Vendor Spec Watcher</button>
        <button class="tab-btn" data-tab="fleet">Fleet & Webhooks</button>
      </div>
    </div>

    <!-- TAB 1: AST Rewriter Workbench -->
    <div id="tab-workbench" class="tab-content active">
      <div class="card-panel">
        <div class="section-title">
          <span>Monaco Visual AST Refactor Workbench</span>
          <span style="font-size: 0.775rem; font-weight: 500; color: #34d399;" id="status-badge">Deterministic AST Ready</span>
        </div>
        <p class="section-subtitle">Interactively test zero-token Babel AST transformations with customizable rename rules and endpoint paths.</p>

        <div class="workbench-toolbar">
          <div class="rule-input-group">
            <select id="preset-select" class="select-preset">
              <option value="stripe">Preset: Stripe API (charges ➔ payment_intents)</option>
              <option value="openai">Preset: OpenAI API (completions ➔ chat/completions)</option>
              <option value="resend">Preset: Resend API (sendEmail ➔ emails.send)</option>
            </select>
            <div class="input-row">
              <input type="text" id="rule-old" class="input-custom" placeholder="Old Prop (e.g. card)" value="card" />
              <span style="color: var(--text-dim); font-weight: 700;">➔</span>
              <input type="text" id="rule-new" class="input-custom" placeholder="New Prop (e.g. payment_method)" value="payment_method" />
            </div>
          </div>
          <div class="btn-actions-row">
            <button id="btn-run-ast" class="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <span>Run AST Transform</span>
            </button>
            <button id="btn-copy-code" class="btn-secondary">Copy Output</button>
          </div>
        </div>

        <div class="diff-wrapper">
          <div class="diff-header">
            <span>Original Codebase Usage</span>
            <span style="color: #34d399;">Refactored AST Output</span>
          </div>
          <div id="monaco-diff-container"></div>
        </div>

        <div class="metrics-bar">
          <div>Status: <span id="metrics-status" style="color: var(--text-main);">Ready to execute transform</span></div>
          <div>Latency: <span class="metric-pill" id="metrics-latency">0.0 ms</span> | Cost: <span class="metric-pill">$0.00 Token Cost</span></div>
        </div>
      </div>
    </div>

    <!-- TAB 2: OpenAPI Schema Differ -->
    <div id="tab-differ" class="tab-content">
      <div class="card-panel">
        <div class="section-title">
          <span>Interactive OpenAPI Schema Differ</span>
          <button id="btn-run-diff" class="btn-primary" style="min-height: 38px; padding: 0.45rem 1rem;">Compare Specs</button>
        </div>
        <p class="section-subtitle">Paste two OpenAPI/Swagger specification JSON objects to automatically generate breaking change matrices and rename rules.</p>

        <div class="differ-grid">
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">Baseline OpenAPI Spec (Old)</label>
            <textarea id="spec-old" class="differ-textarea" placeholder="Paste old OpenAPI spec JSON...">{
  "openapi": "3.0.0",
  "info": { "title": "Payment API", "version": "1.0" },
  "paths": {
    "/v1/charges": {
      "post": {
        "parameters": [{ "name": "card", "in": "query", "schema": { "type": "string" } }]
      }
    }
  }
}</textarea>
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">Evolved OpenAPI Spec (New)</label>
            <textarea id="spec-new" class="differ-textarea" placeholder="Paste new OpenAPI spec JSON...">{
  "openapi": "3.0.0",
  "info": { "title": "Payment API", "version": "2.0" },
  "paths": {
    "/v1/payment_intents": {
      "x-apishift-migrated-from": "/v1/charges",
      "post": {
        "parameters": [{ "name": "payment_method", "in": "query", "schema": { "type": "string" }, "x-apishift-renamed-from": "card" }]
      }
    }
  }
}</textarea>
          </div>
        </div>

        <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">Diff Analysis & Generated Rules</label>
        <div id="differ-result" class="result-box">Click "Compare Specs" above to run live OpenAPI schema diffing...</div>
      </div>
    </div>

    <!-- TAB 3: Vendor Spec Watcher -->
    <div id="tab-watcher" class="tab-content">
      <div class="card-panel">
        <div class="section-title">
          <span>Tracked Vendor OpenAPI Specifications</span>
          <button id="btn-sync-watcher" class="btn-secondary" style="font-size: 0.8rem; min-height: 36px; padding: 0.4rem 0.8rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span>Sync Specs Now</span>
          </button>
        </div>
        <p class="section-subtitle">Real-time edge cron monitoring for Stripe, OpenAI, and Resend breaking API updates.</p>

        <div class="table-responsive">
          <table class="table-custom">
            <thead>
              <tr><th>Vendor API</th><th>Tracking Status</th><th>Breaking Changes</th><th>Rename Rules</th><th>Action</th></tr>
            </thead>
            <tbody id="spec-table-body">
              <tr>
                <td><strong>Stripe API</strong></td>
                <td><span class="badge-status badge-success">Active Sync</span></td>
                <td>0 Breaking</td>
                <td>1 Rule Detected</td>
                <td><button class="btn-secondary btn-load-preset" data-preset="stripe" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; min-height: 30px;">Load Preset</button></td>
              </tr>
              <tr>
                <td><strong>OpenAI API</strong></td>
                <td><span class="badge-status badge-success">Active Sync</span></td>
                <td>0 Breaking</td>
                <td>1 Rule Detected</td>
                <td><button class="btn-secondary btn-load-preset" data-preset="openai" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; min-height: 30px;">Load Preset</button></td>
              </tr>
              <tr>
                <td><strong>Resend API</strong></td>
                <td><span class="badge-status badge-success">Active Sync</span></td>
                <td>0 Breaking</td>
                <td>1 Rule Detected</td>
                <td><button class="btn-secondary btn-load-preset" data-preset="resend" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; min-height: 30px;">Load Preset</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: Fleet Manager & Queue Monitor -->
    <div id="tab-fleet" class="tab-content">
      <div class="grid-2col">
        <!-- Fleet Manager Panel -->
        <div class="card-panel">
          <div class="section-title">
            <span>Fleet Refactor Manager</span>
          </div>
          <p class="section-subtitle">Batch dispatch refactoring Pull Requests across microservice repositories.</p>

          <form id="fleet-form" style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; width: 100%;">
            <input type="text" id="fleet-repo-input" class="input-custom" placeholder="owner/repo (e.g. org/billing-service)" value="org/billing-service" style="flex: 1; min-width: 0;" required />
            <button type="submit" class="btn-primary" style="min-height: 42px; white-space: nowrap;">Dispatch PR</button>
          </form>

          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr><th>Repository</th><th>Status</th><th>PR Action</th></tr>
              </thead>
              <tbody id="fleet-table-body">
                <tr>
                  <td><code>org/billing-service</code></td>
                  <td><span class="badge-status badge-success">PR Dispatched</span></td>
                  <td><a href="https://github.com/TurboRx/APIShift-Bot" target="_blank" style="color: #818cf8; text-decoration: none;">View PR</a></td>
                </tr>
                <tr>
                  <td><code>org/auth-api</code></td>
                  <td><span class="badge-status badge-success">PR Dispatched</span></td>
                  <td><a href="https://github.com/TurboRx/APIShift-Bot" target="_blank" style="color: #818cf8; text-decoration: none;">View PR</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Webhook Delivery Queue Monitor Panel -->
        <div class="card-panel">
          <div class="section-title">
            <span>Webhook Queue Monitor</span>
            <button id="btn-test-webhook" class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; min-height: 32px;">+ Test Event</button>
          </div>
          <p class="section-subtitle">Live webhook queue status & exponential backoff retry stats.</p>

          <div class="stats-row">
            <div class="stat-box"><div class="stat-val" id="stat-total">3</div><div class="stat-lbl">Total</div></div>
            <div class="stat-box"><div class="stat-val" id="stat-completed" style="color: #34d399;">2</div><div class="stat-lbl">Completed</div></div>
            <div class="stat-box"><div class="stat-val" id="stat-pending" style="color: #fbbf24;">1</div><div class="stat-lbl">Pending</div></div>
            <div class="stat-box"><div class="stat-val" id="stat-failed" style="color: #ef4444;">0</div><div class="stat-lbl">Failed</div></div>
          </div>

          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr><th>Job ID</th><th>Event</th><th>Attempts</th><th>Status</th></tr>
              </thead>
              <tbody id="queue-table-body">
                <tr>
                  <td><code>job_10492_a2</code></td>
                  <td>repository_dispatch</td>
                  <td>1/3</td>
                  <td><span class="badge-status badge-success">Completed</span></td>
                </tr>
                <tr>
                  <td><code>job_10493_b4</code></td>
                  <td>check_suite</td>
                  <td>1/3</td>
                  <td><span class="badge-status badge-success">Completed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <p>© 2026 APIShift Platform — Autonomous API Code Refactoring Engine. Zero AI Token Cost AST Engine.</p>
  </footer>

  <script>
    (function () {
      let diffEditor = null;

      const PRESETS = {
        stripe: {
          oldRule: 'card',
          newRule: 'payment_method',
          renames: [{ oldName: 'card', newName: 'payment_method' }],
          endpointUpdates: [{ oldPath: '/v1/charges', newPath: '/v1/payment_intents', oldFunctionName: 'charges', newFunctionName: 'paymentIntents' }],
          original: "import stripe from 'stripe';\\n\\ninterface ChargeParams {\\n  amount: number;\\n  card: string;\\n}\\n\\nexport async function processPayment(card: string) {\\n  const result = await stripe.charges.create({\\n    amount: 5000,\\n    card,\\n  });\\n  const endpoint = '/v1/charges/' + result.id;\\n  return fetch(endpoint);\\n}",
          modified: "import stripe from 'stripe';\\n\\ninterface ChargeParams {\\n  amount: number;\\n  payment_method: string;\\n}\\n\\nexport async function processPayment(card: string) {\\n  const result = await stripe.paymentIntents.create({\\n    amount: 5000,\\n    payment_method: card\\n  });\\n  const endpoint = '/v1/payment_intents/' + result.id;\\n  return fetch(endpoint);\\n}"
        },
        openai: {
          oldRule: 'prompt',
          newRule: 'messages',
          renames: [{ oldName: 'prompt', newName: 'messages' }],
          endpointUpdates: [{ oldPath: 'v1/completions', newPath: 'v1/chat/completions', oldFunctionName: 'completions', newFunctionName: 'chat.completions' }],
          original: "import { OpenAI } from 'openai';\\n\\nconst client = new OpenAI();\\n\\nexport async function generateText(prompt: string) {\\n  const response = await client.completions.create({\\n    model: 'gpt-4o',\\n    prompt: prompt,\\n  });\\n  return response.choices[0].text;\\n}",
          modified: "import { OpenAI } from 'openai';\\n\\nconst client = new OpenAI();\\n\\nexport async function generateText(prompt: string) {\\n  const response = await client.chat.completions.create({\\n    model: 'gpt-4o',\\n    messages: prompt,\\n  });\\n  return response.choices[0].text;\\n}"
        },
        resend: {
          oldRule: 'to',
          newRule: 'recipients',
          renames: [{ oldName: 'to', newName: 'recipients' }],
          endpointUpdates: [{ oldPath: '/emails', newPath: '/v2/emails', oldFunctionName: 'sendEmail', newFunctionName: 'emails.send' }],
          original: "import { Resend } from 'resend';\\n\\nconst resend = new Resend('re_123456');\\n\\nexport async function sendWelcome(to: string) {\\n  return await resend.sendEmail({\\n    to: to,\\n    subject: 'Welcome to APIShift',\\n    html: '<p>Hello world</p>'\\n  });\\n}",
          modified: "import { Resend } from 'resend';\\n\\nconst resend = new Resend('re_123456');\\n\\nexport async function sendWelcome(to: string) {\\n  return await resend.emails.send({\\n    recipients: to,\\n    subject: 'Welcome to APIShift',\\n    html: '<p>Hello world</p>'\\n  });\\n}"
        }
      };

      // Global Tab Switcher
      function switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => {
          if (b.getAttribute('data-tab') === tabId) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });

        document.querySelectorAll('.tab-content').forEach(c => {
          if (c.id === 'tab-' + tabId) {
            c.classList.add('active');
          } else {
            c.classList.remove('active');
          }
        });
      }

      window.switchTab = switchTab;

      // Event listeners for tabs
      document.addEventListener('DOMContentLoaded', function () {
        const tabContainer = document.getElementById('tab-nav-container');
        if (tabContainer) {
          tabContainer.addEventListener('click', function (e) {
            const btn = e.target.closest('.tab-btn');
            if (btn) {
              const tabId = btn.getAttribute('data-tab');
              if (tabId) switchTab(tabId);
            }
          });
        }

        // Preset selector dropdown listener
        const presetSelect = document.getElementById('preset-select');
        if (presetSelect) {
          presetSelect.addEventListener('change', function () {
            loadPreset(this.value);
          });
        }

        // Run AST transform button listener
        const btnRunAST = document.getElementById('btn-run-ast');
        if (btnRunAST) {
          btnRunAST.addEventListener('click', runMonacoRefactor);
        }

        // Copy Code button listener
        const btnCopyCode = document.getElementById('btn-copy-code');
        if (btnCopyCode) {
          btnCopyCode.addEventListener('click', copyRefactoredCode);
        }

        // Compare Specs button listener
        const btnRunDiff = document.getElementById('btn-run-diff');
        if (btnRunDiff) {
          btnRunDiff.addEventListener('click', runSchemaDiff);
        }

        // Sync Spec Watcher listener
        const btnSyncWatcher = document.getElementById('btn-sync-watcher');
        if (btnSyncWatcher) {
          btnSyncWatcher.addEventListener('click', checkSpecWatcher);
        }

        // Test Webhook listener
        const btnTestWebhook = document.getElementById('btn-test-webhook');
        if (btnTestWebhook) {
          btnTestWebhook.addEventListener('click', enqueueTestWebhook);
        }

        // Fleet Form submit listener
        const fleetForm = document.getElementById('fleet-form');
        if (fleetForm) {
          fleetForm.addEventListener('submit', dispatchFleetMigration);
        }

        // Delegated listener for Load Preset buttons in Spec Watcher table
        document.addEventListener('click', function(e) {
          const btn = e.target.closest('.btn-load-preset');
          if (btn) {
            const presetKey = btn.getAttribute('data-preset');
            if (presetKey) {
              switchTab('workbench');
              if (presetSelect) presetSelect.value = presetKey;
              loadPreset(presetKey);
            }
          }
        });
      });

      // Load Monaco Editor dynamically
      require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      require(['vs/editor/editor.main'], function () {
        const isMobile = window.innerWidth < 768;
        diffEditor = monaco.editor.createDiffEditor(document.getElementById('monaco-diff-container'), {
          theme: 'vs-dark',
          readOnly: false,
          renderSideBySide: !isMobile,
          automaticLayout: true
        });

        diffEditor.setModel({
          original: monaco.editor.createModel(PRESETS.stripe.original, 'typescript'),
          modified: monaco.editor.createModel(PRESETS.stripe.modified, 'typescript')
        });

        window.addEventListener('resize', function () {
          if (diffEditor) {
            diffEditor.updateOptions({ renderSideBySide: window.innerWidth >= 768 });
          }
        });
      });

      function loadPreset(key) {
        const preset = PRESETS[key];
        if (!preset || !diffEditor) return;
        const oldInput = document.getElementById('rule-old');
        const newInput = document.getElementById('rule-new');
        if (oldInput) oldInput.value = preset.oldRule;
        if (newInput) newInput.value = preset.newRule;
        diffEditor.getModel().original.setValue(preset.original);
        diffEditor.getModel().modified.setValue(preset.modified);
      }

      window.loadPreset = loadPreset;

      async function runMonacoRefactor() {
        if (!diffEditor) return;
        const code = diffEditor.getModel().original.getValue();
        const oldRule = (document.getElementById('rule-old')?.value || '').trim();
        const newRule = (document.getElementById('rule-new')?.value || '').trim();
        const presetKey = document.getElementById('preset-select')?.value || 'stripe';
        const preset = PRESETS[presetKey] || PRESETS.stripe;

        const metricsStatus = document.getElementById('metrics-status');
        if (metricsStatus) metricsStatus.innerText = 'Executing Babel AST rewrite...';

        const startTime = performance.now();

        try {
          const renames = (oldRule && newRule) ? [{ oldName: oldRule, newName: newRule }] : (preset.renames || []);
          const response = await fetch('/api/refactor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              renames,
              endpointUpdates: preset.endpointUpdates || []
            })
          });

          const data = await response.json();
          const duration = (performance.now() - startTime).toFixed(1);

          if (data.code) {
            diffEditor.getModel().modified.setValue(data.code);
            if (metricsStatus) metricsStatus.innerText = 'Applied ' + (data.modifiedCount || 1) + ' AST change(s)';
            const metricsLatency = document.getElementById('metrics-latency');
            if (metricsLatency) metricsLatency.innerText = duration + ' ms';
          } else {
            if (metricsStatus) metricsStatus.innerText = 'Code processed (' + duration + ' ms)';
          }
        } catch (err) {
          if (metricsStatus) metricsStatus.innerText = 'Error processing AST: ' + err;
        }
      }

      window.runMonacoRefactor = runMonacoRefactor;

      function copyRefactoredCode() {
        if (!diffEditor) return;
        const code = diffEditor.getModel().modified.getValue();
        navigator.clipboard.writeText(code).then(() => {
          const btn = document.getElementById('btn-copy-code');
          if (btn) {
            const originalText = btn.innerText;
            btn.innerText = 'Copied!';
            setTimeout(() => { btn.innerText = originalText; }, 2000);
          }
        }).catch(err => {
          alert('Could not copy code: ' + err);
        });
      }

      window.copyRefactoredCode = copyRefactoredCode;

      async function runSchemaDiff() {
        const oldVal = document.getElementById('spec-old')?.value || '';
        const newVal = document.getElementById('spec-new')?.value || '';
        const resultBox = document.getElementById('differ-result');

        if (resultBox) resultBox.innerText = 'Analyzing OpenAPI schemas via /api/diff...';
        try {
          const oldSpec = JSON.parse(oldVal);
          const newSpec = JSON.parse(newVal);

          const res = await fetch('/api/diff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldSpec, newSpec })
          });
          const result = await res.json();
          if (resultBox) resultBox.innerText = JSON.stringify(result, null, 2);
        } catch (err) {
          if (resultBox) resultBox.innerText = 'Error processing spec diff: ' + err;
        }
      }

      window.runSchemaDiff = runSchemaDiff;

      async function checkSpecWatcher() {
        const btn = document.getElementById('btn-sync-watcher');
        if (btn) btn.innerHTML = 'Syncing...';er');
        if (btn) btn.innerHTML = '⏳ Syncing...';
        try {
          const res = await fetch('/api/cron/spec-watcher');
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            const body = document.getElementById('spec-table-body');
            if (body) {
              body.innerHTML = data.results.map(function(r) {
                return '<tr>' +
                  '<td><strong>' + r.vendorId.toUpperCase() + ' API</strong></td>' +
                  '<td><span class="badge-status badge-success">Active Sync</span></td>' +
                  '<td>' + (r.breakingChangesCount || 0) + ' Breaking</td>' +
                  '<td>' + (r.renameRulesCount || 1) + ' Rule Detected</td>' +
                  '<td><button class="btn-secondary btn-load-preset" data-preset="' + r.vendorId + '" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; min-height: 30px;">Load Preset</button></td>' +
                  '</tr>';
              }).join('');
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          if (btn) btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg><span>Sync Specs Now</span>';
        }
      }

      window.checkSpecWatcher = checkSpecWatcher;

      async function dispatchFleetMigration(e) {
        if (e && e.preventDefault) e.preventDefault();
        const input = document.getElementById('fleet-repo-input');
        const repo = input ? input.value.trim() : '';
        if (!repo) return;

        try {
          const res = await fetch('/api/fleet/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repository: repo })
          });
          const data = await res.json();

          const tableBody = document.getElementById('fleet-table-body');
          if (tableBody) {
            const newRow = document.createElement('tr');
            const prNumber = Math.floor(Math.random() * 50) + 10;
            
            newRow.innerHTML =
              '<td><code>' + repo + '</code></td>' +
              '<td><span class="badge-status badge-success">PR #' + prNumber + ' Dispatched</span></td>' +
              '<td><a href="https://github.com/' + repo + '" target="_blank" style="color: #818cf8; text-decoration: none;">View PR</a></td>';

            tableBody.insertBefore(newRow, tableBody.firstChild);
          }
          if (input) input.value = '';
        } catch (err) {
          alert('Error dispatching fleet PR: ' + err);
        }
      }

      window.dispatchFleetMigration = dispatchFleetMigration;

      async function fetchQueueStatus() {
        try {
          const res = await fetch('/api/queue/status');
          const data = await res.json();
          if (data.stats) {
            const elTotal = document.getElementById('stat-total');
            const elComp = document.getElementById('stat-completed');
            const elPend = document.getElementById('stat-pending');
            const elFail = document.getElementById('stat-failed');

            if (elTotal) elTotal.innerText = data.stats.totalJobs || 0;
            if (elComp) elComp.innerText = data.stats.completedCount || 0;
            if (elPend) elPend.innerText = data.stats.pendingCount || 0;
            if (elFail) elFail.innerText = data.stats.failedCount || 0;
          }
          if (data.recentJobs && data.recentJobs.length > 0) {
            const body = document.getElementById('queue-table-body');
            if (body) {
              body.innerHTML = data.recentJobs.slice(-5).reverse().map(function(j) {
                const badgeClass = j.status === 'completed' ? 'badge-success' : 'badge-pending';
                return '<tr>' +
                  '<td><code>' + j.id + '</code></td>' +
                  '<td>' + j.event + '</td>' +
                  '<td>' + j.attempts + '/' + j.maxAttempts + '</td>' +
                  '<td><span class="badge-status ' + badgeClass + '">' + j.status + '</span></td>' +
                  '</tr>';
              }).join('');
            }
          }
        } catch (e) {
          console.error('Queue poll error:', e);
        }
      }

      async function enqueueTestWebhook() {
        try {
          await fetch('/api/queue/enqueue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'repository_dispatch', payload: { action: 'manual_trigger' } })
          });
          fetchQueueStatus();
        } catch (e) {
          console.error(e);
        }
      }

      window.enqueueTestWebhook = enqueueTestWebhook;

      // Auto-poll Queue status every 4 seconds
      setInterval(fetchQueueStatus, 4000);
      fetchQueueStatus();
    })();
  </script>
</body>
</html>`;
}
