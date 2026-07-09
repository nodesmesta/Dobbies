# Dobbies - AI Agent Security Auditor

A comprehensive security auditing platform that scans AI agent configurations for vulnerabilities, logic bugs, and missing guardrails using RAG-based static analysis and AI vs AI red-teaming simulation.

## Overview

Dobbies combines LLM-powered static analysis with AI vs AI attack simulations to detect OWASP LLM Top 10 vulnerabilities before they reach production. Built with Next.js 16, powered by Fireworks AI (Minimax M3), and backed by Supabase+PostgreSQL on AMD MI300X infrastructure.

## Features

### 🔍 Security Scanning
- **Configuration Analysis**: Scan agent configurations, prompts, and guardrails
- **Vulnerability Detection**: Identify OWASP LLM Top 10 vulnerabilities
- **Logic Bug Detection**: Find flawed reasoning and insecure coding patterns
- **Dependency Checking**: Analyze external libraries and dependencies

### 🤖 Red Teaming
- **AI vs AI Attacks**: Simulate sophisticated AI attacks using Minimax M3
- **Prompt Injection Tests**: Evaluate prompt engineering resilience
- **Model Evasion**: Test adversarial prompt techniques
- **Social Engineering**: Assess social manipulation resistance

### 📊 Dashboard & Analytics
- **Real-time Monitoring**: Live audit progress and results
- **Audit History**: Complete scan history and reports
- **Risk Scoring**: AI vulnerability risk assessment
- **Compliance Reports**: OWASP compliance verification

## Tech Stack

### Frontend
- **Next.js 16** - React framework with SSR
- **Tailwind CSS** - Utility-first styling
- **HeroUI** - Component library
- **AMD-optimized** - Performance tuned for MI300X

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
/home/nodesemesta/dev/Hackaton/act/
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
└── package.json              # Project dependencies and scripts
```

## Key Components

### Landing Page (`src/app/page.tsx`)
Main application entry point with:
- Hero section showcasing Dobbies capabilities
- Features section with security scanning highlights
- Orchestration timeline showing the audit process
- Capabilities section (Scope)
- FAQ accordion for common questions
- Call to action section
- Footer with partner information

### Global Styles (`src/app/globals.css`)
- Dark theme design system
- Tailwind CSS configuration
- Custom animations (marquee, fade-in-up, streaming-pulse)
- Glassmorphism components
- Gradient text effects
- Badge styles for severity levels

### Navigation (`components/landing/Navbar.tsx`)
- Responsive navigation bar
- GitHub link for repository access
- Clean, professional styling

### Components
Each component is designed with:
- **Responsive layouts** - Mobile-first approach
- **TypeScript** - Full type safety
- **Accessibility** - ARIA labels and keyboard navigation
- **Performance** - Optimized rendering
- **Consistency** - Unified design system

## Recent Changes

### Marquee Component Removal
- Removed `src/components/landing/PoweredMarquee.tsx`
- Deleted marquee animation CSS from `globals.css`
- Cleaned up landing page render chain
- Build successful with all routes functional

### Assets Added
- `public/fireworks_icon-0.png` through `public/fireworks_icon.png`
- `public/lablab_logo.png` - PNG version of logo

## Build Status
✅ **Next.js Build**: Compiled successfully (4.1s)
✅ **TypeScript**: Type safety checks passed
✅ **Static Generation**: 18 pages generated
✅ **All Routes**: Landing, dashboard, login, docs functional

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

## Running Locally

### Development Server
```bash
# Navigate to project directory
cd /home/nodesemesta/dev/Hackaton/act

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Production Build
```bash
# Build for production
cd /home/nodesemesta/dev/Hackaton/act
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run tests
npm test

# Run linting
npm run lint

# Check TypeScript types
npm run type-check
```

## Deployment

### Vercel
- Automatic deployment on push to main branch
- Environment variables configured
- Custom domain support

### Version Control
- Primary branch: `main`
- Commit convention: Conventional commits
- Protected branch: `main`

## Workflow
1. **Development**: Code changes in `src/` directory
2. **Testing**: Unit tests and linting
3. **Building**: `npm run build`
4. **Deployment**: Push to main branch
5. **Monitoring**: Vercel dashboard and Cloudflare Analytics

## Notes

### AMD MI300X Optimization
- Frontend optimized for AMD GPU performance
- Responsible rendering patterns
- Efficient memory usage

### Security Considerations
- Environment variables protected
- API keys stored securely
- CORS properly configured
- Rate limiting implemented

### Performance
- Next.js optimizations enabled
- Static site generation for better performance
- Image optimization for assets
- Caching strategies implemented