# Dobbies - AI Agent Security Auditor

<p align="center">
  <img src="public/dobbies.png" alt="Dobbies Logo" width="200"/>
</p>

A comprehensive security auditing platform that scans AI agent configurations for vulnerabilities, logic bugs, and missing guardrails using RAG-based static analysis and AI vs AI red-teaming simulation.

## Overview

Dobbies combines LLM-powered static analysis with AI vs AI attack simulations to detect OWASP LLM Top 10 vulnerabilities before they reach production. Built with Next.js 16, powered by Fireworks AI (Minimax M3), and backed by Supabase+PostgreSQL on AMD MI300X infrastructure.

## Agent Scan Scope

The `## Agent Scan Scope` section in a repository's README.md is the **source of truth** for Dobbies scanning. When you submit a GitHub repo URL, Dobbies:

1. Fetches the repo's README.md
2. Parses the `## Agent Scan Scope` section to find which files define AI agent behavior
3. Downloads those files
4. Runs static analysis + AI-vs-AI red-teaming simulation
5. Generates a comprehensive vulnerability report

This project includes a sample vulnerable agent for demonstration:

- sample/vulnerableAgent.ts

To scan your own AI agent repository, add a similar section to your project's README.md:

```markdown
## Agent Scan Scope

- src/agent-config.ts
- prompts/system.md
- .cursorrules
```

> **Note:** Only files listed under this section are scanned. The section ends at the next `##` heading — sub-headings (`###`) are allowed inside.

## Features

### 🔍 Security Scanning
- **Configuration Analysis**: Scan agent configurations, prompts, and guardrails
- **Vulnerability Detection**: Identify OWASP LLM Top 10 vulnerabilities
- **Logic Bug Detection**: Find flawed reasoning and insecure coding patterns

### 🤖 Red Teaming
- **AI vs AI Attacks**: Simulate sophisticated AI attacks using Minimax M3
- **Prompt Injection Tests**: Evaluate prompt engineering resilience
- **Model Evasion**: Test adversarial prompt techniques
- **Social Engineering**: Assess social manipulation resistance

### 📊 Dashboard & Analytics
- **Real-time Monitoring**: Live audit progress and results
- **Audit History**: Complete scan history and reports
- **Risk Scoring**: AI vulnerability risk assessment

## Tech Stack

### Frontend
- **Next.js 16** - React framework with SSR
- **Tailwind CSS** - Utility-first styling

### AI & Security
- **Fireworks AI (Minimax M3)** - LLM inference
- **RAG Systems** - Knowledge retrieval
- **Static Analysis** - Vulnerability detection
- **AI Red-Teaming** - Attack simulation

### Backend & Database
- **Supabase** - BaaS with PostgreSQL
- **Edge Functions** - Serverless computing
- **JWT Auth** - Secure authentication
- **Real-time Updates** - WebSocket connections

### Infrastructure
- **AMD MI300X** - GPU-accelerated computing
- **Cloudflare Analytics** - Performance monitoring
- **Vercel** - Deployment platform

## Getting Started

### Prerequisites
```bash
# Required
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
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=your_cf_token
FIREWORKS_API_KEY=your_fireworks_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure
```
Dobbies/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx          # Landing page (index route)
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── landing/          # Landing page components
│   │   │   ├── Hero.tsx      # Hero section
│   │   │   ├── Features.tsx  # Features section
│   │   │   ├── Orchestration.tsx # Features timeline
│   │   │   ├── Scope.tsx     # Capabilities section
│   │   │   ├── FAQ.tsx       # FAQ accordion
│   │   │   ├── CTA.tsx       # Call to action section
│   │   │   └── Footer.tsx     # Footer
│   │   └── Navbar.tsx         # Navigation bar
│   ├── lib/                   # Library code
│   │   └── landing-data.ts    # Landing page data
│   └── globals.css           # Global styles
├── public/                    # Static assets
│   ├── amd_logo_white.svg     # AMD logo
│   ├── fireworks_logo.svg     # Fireworks AI logo
│   ├── lablab_logo.svg        # LabLab AI logo
│   └── dobbies.png            # Favicon
├── sample/                    # Sample vulnerable agent for demo audits
│   └── vulnerableAgent.ts     # Intentionally vulnerable AI agent config
└── package.json              # Project dependencies and scripts
```

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
- Build successful with all routes functional

## API Endpoints
- `GET /api/audit/history` - Audit history
- `GET /api/audit/report/{id}` - Report download
- `GET /api/audit/vulnerabilities` - Vulnerability data
- `GET /api/audit/stream` - Real-time updates
- `GET /api/chat` - Chat interface
- `GET /api/notify/send` - Notifications
- `GET /api/repo/list` - Repository list
- `GET /api/repo/save` - Save repository
- `GET /api/repo/scan` - Repository scan
- `GET /api/repo/scan/stream` - Scan stream
- `GET /auth/callback` - Auth callback

## Deployment

### Vercel
- Automatic deployment on push to main branch
- Environment variables configured in Vercel dashboard
