# APIShift Bot 🚀

> Enterprise API Auto-Migration Engine & GitHub Bot. Automatically detect breaking API changes, diff OpenAPI/Swagger specifications, and open refactoring Pull Requests with high-performance AST code transformations and Hybrid AI fallback.

---

## 🌟 Overview

APIShift Bot streamlines code migrations when upstream APIs (like Stripe, Twilio, or internal microservices) introduce breaking changes—such as parameter renames (`card` → `payment_method`) or endpoint migrations (`/v1/charges` → `/v1/payment_intents`).

### Key Capabilities
- ⚡ **High-Performance AST Engine**: Instant, 100% type-safe Babel-powered AST code transformations.
- 🤖 **Hybrid AI Fallback**: Optional LLM provider integration (OpenAI, Anthropic, Gemini) for handling complex semantic adaptations.
- 🔍 **OpenAPI Spec Differ**: Automated diffing matrix that tracks schema property renames, parameter removals, and path updates.
- ☁️ **Cloudflare Edge Runtime**: Low-latency edge worker deployment using Hono and Octokit for automated Pull Request generation.

---

## 🏗 Architecture & Migration Flow

```mermaid
graph TD
    A[OpenAPI Spec Update / Webhook] --> B[apps/bot Cloudflare Worker]
    B --> C[HMAC Signature Verification]
    C --> D[packages/core Schema Differ]
    D --> E[Breaking Change Matrix Generation]
    E --> F[packages/core Hybrid AST Engine]
    F -->|Deterministic Transform| G[Babel AST Code Rewriter]
    F -.->|Optional AI Fallback| H[LLM Provider OpenAI / Anthropic / Gemini]
    G --> I[apps/bot Octokit Git Engine]
    H --> I
    I --> J[Automated Refactoring Pull Request]
```

---

## 📁 Repository Modules

```
apishift/
├── pnpm-workspace.yaml          # Workspace module configuration
├── package.json                 # Workspace root package configuration
├── LICENSE                      # MIT License
├── README.md                    # Platform documentation
├── packages/
│   ├── core/                    # Core schema differ & Hybrid AST engine
│   │   ├── src/
│   │   │   ├── index.ts         # Engine exports
│   │   │   ├── ingester/        # OpenAPI spec diffing engine
│   │   │   │   └── schema-differ.ts
│   │   │   ├── ast/             # AST Babel rewriter & Hybrid AI engine
│   │   │   │   ├── babel-rewriter.ts
│   │   │   │   └── hybrid-ai-rewriter.ts
│   │   │   └── types/           # Shared TypeScript types
│   │   │       └── index.ts
│   │   └── package.json
│   └── cli/                     # Developer CLI (`apishift`)
│       ├── bin/
│       │   └── apishift.js      # Executable CLI wrapper
│       ├── src/
│       │   ├── index.ts         # CLI entry point
│       │   └── commands/
│       │       └── init.ts      # Config init command
│       └── package.json
└── apps/
    └── bot/                     # Cloudflare Edge GitHub Bot
        ├── wrangler.toml        # Cloudflare Workers configuration
        ├── src/
        │   ├── index.ts         # Hono web server & Webhook handler
        │   └── github/
        │       └── pr.ts        # Octokit PR generator
        └── package.json
```

---

## 🛠 Quickstart & Setup

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Installation & Build

```bash
# Clone repository
git clone https://github.com/TurboRx/APIShift-Bot.git
cd APIShift-Bot

# Install dependencies across packages
pnpm install

# Build all packages and applications
pnpm build

# Run test suite
pnpm test
```

---

## 💻 CLI Usage (`@apishift/cli`)

The `apishift` CLI enables local repository setup and manual AST code refactoring.

```bash
# Initialize APIShift configuration
apishift init
```

This generates `apishift.config.json` in your project root:

```json
{
  "$schema": "https://apishift.dev/schema.json",
  "version": "1.0",
  "openapi": {
    "specPath": "./schemas/openapi.json"
  },
  "targetFiles": [
    "src/**/*.ts",
    "src/**/*.js"
  ],
  "autoPr": true
}
```

### Comparing OpenAPI Specs

```bash
apishift diff old-openapi.json new-openapi.json
```

### Running AST Code Rewriter

```bash
apishift rewrite --file src/api.ts --rules '[{"oldName":"card","newName":"payment_method"}]'
```

---

## ☁️ Deploying the Edge GitHub Bot (`apps/bot`)

The bot runtime is deployed as a low-latency Cloudflare Worker using **Hono**.

### Environment Configuration

Set required secrets via Wrangler:

```bash
cd apps/bot
npx wrangler secret put WEBHOOK_SECRET
npx wrangler secret put GITHUB_TOKEN
```

### Deploy to Cloudflare Workers

```bash
npx wrangler deploy
```

---

## 🧪 Testing & Quality Assurance

Run unit tests via Vitest:

```bash
pnpm test
```

Tests validate:
1. **Schema Differ**: Property rename detection, parameter removal tracking, and endpoint path migrations.
2. **AST Engine**: Type-safe AST parsing, shorthand object transformations, method call renaming, and hybrid AI execution paths.

---

## 📜 License

Distributed under the [MIT License](https://github.com/TurboRx/APIShift-Bot/blob/main/LICENSE).
