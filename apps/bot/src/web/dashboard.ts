/**
 * APIShift Web Dashboard & Interactive Workbench
 * Premium dark mode UI with Monaco Diff Editor, Fleet Manager, and Queue Monitor
 */

export function renderDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>APIShift — Self-Maintaining APIs Platform</title>
  <meta name="description" content="APIShift is Dependabot for API Code Usages. Automatically detect breaking API changes and submit deterministic AST refactoring Pull Requests across customer codebases.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #07090e;
      --bg-card: rgba(15, 23, 42, 0.8);
      --border-color: rgba(255, 255, 255, 0.1);
      --border-accent: rgba(99, 102, 241, 0.4);
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.4);
      --secondary: #06b6d4;
      --accent: #10b981;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --font-heading: 'Outfit', sans-serif;
      --font-body: 'Inter', sans-serif;
      --font-code: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-body);
      line-height: 1.6;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.12) 0%, transparent 40%);
      background-attachment: fixed;
    }

    header {
      position: sticky; top: 0; z-index: 100;
      backdrop-filter: blur(16px);
      background: rgba(7, 9, 14, 0.85);
      border-bottom: 1px solid var(--border-color);
      padding: 1rem 2rem;
      display: flex; justify-content: space-between; align-items: center;
    }

    .logo-container { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
    .logo-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      font-family: var(--font-heading); font-weight: 800; font-size: 1.25rem; color: white;
      box-shadow: 0 0 15px var(--primary-glow);
    }

    .logo-text {
      font-family: var(--font-heading); font-weight: 800; font-size: 1.4rem;
      background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .nav-badge {
      background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4);
      color: #818cf8; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 20px;
    }

    .btn-github {
      background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white; font-weight: 600;
      padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; display: flex; align-items: center; gap: 0.5rem;
    }

    .container { max-width: 1380px; margin: 0 auto; padding: 3rem 1.5rem; }

    .hero { text-align: center; max-width: 900px; margin: 0 auto 3rem auto; }
    .hero-pill {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399; font-size: 0.875rem; font-weight: 500; padding: 0.4rem 1rem; border-radius: 30px; margin-bottom: 1.5rem;
    }

    .hero h1 { font-family: var(--font-heading); font-size: 3.25rem; font-weight: 800; line-height: 1.1; margin-bottom: 1rem; }
    .hero h1 span { background: linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #34d399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

    .section-title { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem; }

    /* Monaco Diff Container */
    .diff-wrapper {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; margin-bottom: 3rem;
    }
    .diff-header {
      background: rgba(15, 23, 42, 0.95); padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--border-color);
      display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; font-weight: 600;
    }
    #monaco-diff-container { width: 100%; height: 480px; }

    .btn-run {
      background: linear-gradient(135deg, #10b981, #059669); color: white; font-weight: 600;
      padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem;
    }
    .btn-run:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); }

    /* Fleet Manager & Queue Grid */
    .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 3rem; }
    @media (max-width: 900px) { .grid-2col { grid-template-columns: 1fr; } }

    .card-panel {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.5rem;
    }

    .table-custom { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; }
    .table-custom th, .table-custom td { padding: 0.65rem 0.85rem; text-align: left; border-bottom: 1px solid var(--border-color); }
    .table-custom th { color: var(--text-muted); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }

    .badge-status { font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block; }
    .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge-pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

    footer { border-top: 1px solid var(--border-color); padding: 2.5rem 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.9rem; }
  </style>

  <!-- Load Monaco Editor -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
</head>
<body>

  <header>
    <a href="#" class="logo-container">
      <div class="logo-icon">A</div>
      <div class="logo-text">APIShift</div>
      <span class="nav-badge">Fleet & Monaco Edition</span>
    </a>
    <a href="https://github.com/TurboRx/APIShift-Bot" target="_blank" class="btn-github">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
      GitHub App
    </a>
  </header>

  <div class="container">
    <section class="hero">
      <div class="hero-pill">
        <span>✨ Self-Maintaining API Platform</span>
      </div>
      <h1>Dependabot for <span>API Code Usages</span></h1>
      <p>Continuous OpenAPI spec diffing, zero-token-cost Babel AST refactoring, multi-repository fleet management, and automated GitHub Pull Request generation.</p>
    </section>

    <!-- Monaco Diff Viewer Section -->
    <h2 class="section-title">
      <span>🎨 Monaco Visual Diff Editor</span>
    </h2>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
      <span style="color: var(--text-muted); font-size: 0.9rem;" id="diff-status">Rule: card ➔ payment_method | /v1/charges ➔ /v1/payment_intents</span>
      <button class="btn-run" onclick="runMonacoRefactor()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        Re-Run AST Transformation
      </button>
    </div>

    <div class="diff-wrapper">
      <div class="diff-header">
        <span>ORIGINAL SOURCE CODE</span>
        <span style="color: #34d399;">REFACTORED AST CODE</span>
      </div>
      <div id="monaco-diff-container"></div>
    </div>

    <!-- Fleet Manager & Webhook Queue Grid -->
    <div class="grid-2col">
      <!-- Fleet Manager Panel -->
      <div class="card-panel">
        <h2 class="section-title" style="font-size: 1.4rem;">
          <span>🌐 Fleet Migration Manager</span>
        </h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">Batch dispatch refactoring PRs across microservice repositories.</p>
        <table class="table-custom">
          <thead>
            <tr><th>Repository</th><th>Branch</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><code>org/billing-service</code></td>
              <td>main</td>
              <td><span class="badge-status badge-success">PR #42 Created</span></td>
              <td><a href="#" style="color: var(--primary);">View PR</a></td>
            </tr>
            <tr>
              <td><code>org/auth-api</code></td>
              <td>main</td>
              <td><span class="badge-status badge-success">PR #18 Created</span></td>
              <td><a href="#" style="color: var(--primary);">View PR</a></td>
            </tr>
            <tr>
              <td><code>org/checkout-web</code></td>
              <td>main</td>
              <td><span class="badge-status badge-pending">Queued</span></td>
              <td><a href="#" style="color: var(--text-muted);">Syncing</a></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Webhook Delivery Queue Monitor Panel -->
      <div class="card-panel">
        <h2 class="section-title" style="font-size: 1.4rem;">
          <span>🔄 Webhook Queue & Retry Monitor</span>
        </h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">Live background job queue status & exponential backoff retries.</p>
        <table class="table-custom">
          <thead>
            <tr><th>Job ID</th><th>Event</th><th>Attempts</th><th>Status</th></tr>
          </thead>
          <tbody>
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
            <tr>
              <td><code>job_10494_c8</code></td>
              <td>push</td>
              <td>0/3</td>
              <td><span class="badge-status badge-pending">Pending</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <footer>
    <p>© 2026 APIShift Platform — Self-Maintaining APIs for Engineering Teams. Powered by Microsoft Monaco Editor & Cloudflare Worker Edge Engine.</p>
  </footer>

  <script>
    let diffEditor;
    const initialOriginalCode = \`import stripe from 'stripe';

interface ChargeParams {
  amount: number;
  card: string;
}

export async function processPayment(card: string) {
  const result = await stripe.charges.create({
    amount: 5000,
    card,
  });
  const endpoint = \\\`/v1/charges/\${result.id}\\\`;
  return fetch(endpoint);
}\`;

    const initialModifiedCode = \`import stripe from 'stripe';

interface ChargeParams {
  amount: number;
  payment_method: string;
}

export async function processPayment(card: string) {
  const result = await stripe.paymentIntents.create({
    amount: 5000,
    payment_method: card
  });
  const endpoint = \\\`/v1/payment_intents/\${result.id}\\\`;
  return fetch(endpoint);
}\`;

    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
    require(['vs/editor/editor.main'], function () {
      diffEditor = monaco.editor.createDiffEditor(document.getElementById('monaco-diff-container'), {
        theme: 'vs-dark',
        readOnly: false,
        renderSideBySide: true,
        automaticLayout: true
      });

      diffEditor.setModel({
        original: monaco.editor.createModel(initialOriginalCode, 'typescript'),
        modified: monaco.editor.createModel(initialModifiedCode, 'typescript')
      });
    });

    async function runMonacoRefactor() {
      if (!diffEditor) return;
      const code = diffEditor.getModel().original.getValue();
      document.getElementById('diff-status').innerText = 'Refactoring AST...';

      try {
        const response = await fetch('/api/refactor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            renames: [{ oldName: 'card', newName: 'payment_method' }],
            endpointUpdates: [{ oldPath: '/v1/charges', newPath: '/v1/payment_intents', oldFunctionName: 'charges', newFunctionName: 'paymentIntents' }]
          })
        });

        const data = await response.json();
        if (data.code) {
          diffEditor.getModel().modified.setValue(data.code);
          document.getElementById('diff-status').innerText = '✅ Applied ' + data.modifiedCount + ' AST refactorings in < 15ms!';
        }
      } catch (err) {
        document.getElementById('diff-status').innerText = 'Error refactoring: ' + err;
      }
    }
  </script>
</body>
</html>`;
}
