# Dobbies — AI Agent Security Auditor

<p align="center">
  <img src="public/dobbies.png" alt="Dobbies Logo" width="200"/>
</p>

**A README-driven security scanner for AI agents.** Dobbies reads your repo's `## Agent Scan Scope` section, fetches the declared files, and runs LLM-powered static analysis + AI-vs-AI red-teaming to detect OWASP LLM Top 10 vulnerabilities before they reach production.

Built with Next.js 16, powered by Fireworks AI (Minimax M3), backed by Supabase+PostgreSQL on AMD MI300X infrastructure.

---

## Agent Scan Scope

- sample/vulnerableAgent.ts

The `## Agent Scan Scope` section declares which files Dobbies scans in your repository. Only files listed here are analyzed — nothing more, nothing less.

For detailed documentation on how to configure scan scope for your own AI agent project, see the [Scan Scope Guide](https://dobbies.nodesemesta.com/docs#scan-scope).

---

## Sample Vulnerable Agent

This repo includes a deliberately vulnerable AI agent for demo scans:

```
sample/vulnerableAgent.ts
```

It contains common OWASP LLM Top 10 issues — prompt injection surfaces, excessive agency, insecure output handling, and hardcoded credentials. Use it to see Dobbies in action without setting up your own project.

---

## Features

### 🔍 Security Scanning
- **Configuration Analysis** — Scan agent configs, prompts, and guardrails
- **Vulnerability Detection** — Identify OWASP LLM Top 10 vulnerabilities
- **Logic Bug Detection** — Find flawed reasoning and insecure coding patterns

### 🤖 Red Teaming
- **AI vs AI Attacks** — Simulate AI attacks using Minimax M3
- **Prompt Injection Tests** — Evaluate prompt engineering resilience
- **Model Evasion** — Test adversarial prompt techniques
- **Social Engineering** — Assess social manipulation resistance

### 📊 Dashboard & Analytics
- **Real-time Monitoring** — Live audit progress and results
- **Audit History** — Complete scan history with detailed reports
- **Risk Scoring** — AI vulnerability risk scoring and prioritization

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, Tailwind CSS |
| AI Engine | Fireworks AI (Minimax M3), RAG |
| Backend | Supabase (PostgreSQL, Edge Functions, JWT Auth) |
| Infrastructure | AMD MI300X, Vercel, Cloudflare |

---

## Getting Started

### Prerequisites
```bash
- Node.js 18+
- PostgreSQL database (Supabase managed)
- Fireworks AI API key
- AMD MI300X hardware (optional for local development)
```

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=your_cf_token
FIREWORKS_API_KEY=your_fireworks_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Project Structure

```
Dobbies/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx            # Landing page
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── landing/            # Landing page components
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── Orchestration.tsx
│   │   │   ├── Scope.tsx
│   │   │   ├── FAQ.tsx
│   │   │   ├── CTA.tsx
│   │   │   └── Footer.tsx
│   │   └── Navbar.tsx
│   ├── lib/
│   │   └── landing-data.ts
│   └── globals.css
├── public/
│   ├── amd_logo_white.svg
│   ├── fireworks_logo.svg
│   ├── lablab_logo.svg
│   └── dobbies.png
├── sample/
│   └── vulnerableAgent.ts      # Demo target for Dobbies scans
└── package.json
```

---

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/audit/history` | Audit history |
| `GET /api/audit/report/{id}` | Report download |
| `GET /api/audit/vulnerabilities` | Vulnerability data |
| `GET /api/audit/stream` | Real-time updates |
| `GET /api/chat` | Chat interface |
| `GET /api/notify/send` | Notifications |
| `GET /api/repo/list` | Repository list |
| `GET /api/repo/save` | Save repository |
| `GET /api/repo/scan` | Repository scan |
| `GET /api/repo/scan/stream` | Scan stream |
| `GET /api/auth/callback` | Auth callback |

---

## Deployment

### Vercel
- Automatic deployment on push to main branch
- Environment variables configured in Vercel dashboard

---

## Recent Changes

### Agent Scan Scope Restoration
- Restored `## Agent Scan Scope` section in README.md (removed during docs rewrite)
- Declares `sample/vulnerableAgent.ts` as the default audit target
- Added documentation explaining the scan scope workflow for end users
- `POST /api/repo/scan` uses `parseScanScope()` to read this section and fetch declared files

### Marquee Component Removal
- Removed `src/components/landing/PoweredMarquee.tsx`
- Deleted marquee animation CSS from `globals.css`
- Cleaned up landing page render chain
