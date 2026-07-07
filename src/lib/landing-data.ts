export interface Feature {
  iconClass: string;
  label: string;
  title: string;
  desc: string;
}

export type StatusType = "success" | "danger" | "warning";

export interface OrchestrationStep {
  index: string;
  title: string;
  shortDesc: string;
  desc: string;
  statusType: StatusType;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export const features: Feature[] = [
  {
    iconClass: "iconBlue",
    label: "GIT",
    title: "GitHub Repo Scanner",
    desc: "Paste your public GitHub repo URL — the system automatically detects all agent files, extracts system prompts and tool definitions, and surfaces them as an audit-ready list.",
  },
  {
    iconClass: "iconPurple",
    label: "RAG",
    title: "Static Vulnerability Scan",
    desc: "Each agent's system prompt and tool definitions are matched against a local OWASP LLM Top 10 knowledge base using keyword retrieval — flagging injection risks, secret leakage, and over-privileged tools.",
  },
  {
    iconClass: "iconCyan",
    label: "RED",
    title: "AI vs AI Red Teaming",
    desc: "A dedicated Attacker LLM engages in a multi-turn battle with a dynamically spawned Agent LLM initialized with your agent's actual prompt guidelines and tools.",
  },
  {
    iconClass: "iconGreen",
    label: "GRD",
    title: "Guardrail Generator",
    desc: "Produces ready-to-use guardrail configurations — Llama Guard rules, NeMo Guardrails configs, and regex output filters — tailored to the exact vulnerabilities found in your agent.",
  },
];

export const orchestrationSteps: OrchestrationStep[] = [
  {
    index: "01",
    title: "Agent Config Ingestion",
    shortDesc: "Scan your GitHub repo and detect all agent definitions",
    desc: "Connect your public GitHub repository by pasting its URL. The system calls the GitHub API — authenticated via your GitHub login — to recursively scan all files. It detects agent definitions by matching filename patterns and scanning file content for system prompts, tool schemas, and agent configuration structures. Every detected agent is surfaced as a card in your dashboard, ready to audit.",
    statusType: "success",
  },
  {
    index: "02",
    title: "RAG-Based Static Analysis",
    shortDesc: "Match agent config against OWASP LLM Top 10 security rules",
    desc: "The selected agent's system prompt and tool definitions are scanned against a curated OWASP LLM Top 10 knowledge base using keyword and pattern retrieval. Each matched rule raises a finding — flagging issues like hardcoded secrets in system prompts, unrestricted tool permissions, missing output filters, or prompt injection exposure — with a severity level and a concrete remediation step.",
    statusType: "success",
  },
  {
    index: "03",
    title: "AI vs AI Red-Teaming",
    shortDesc: "Attacker LLM probes a dynamically spawned Agent LLM",
    desc: "A specialized Attacker LLM sends adversarial multi-turn messages to a dynamically spawned Agent LLM initialized with your agent's system prompt and tool definitions. This AI vs AI simulation runs in real-time, capturing every turn, and dynamically flags the exact point where the agent leaks credentials, executes unsafe simulated tool calls, or fails safety constraints.",
    statusType: "danger",
  },
  {
    index: "04",
    title: "Scoring & Guardrail Generation",
    shortDesc: "Score security posture and generate ready-to-use guardrail configs",
    desc: "An Evaluator LLM reviews the full simulation transcript and produces two scores: a static score based on configuration analysis, and a dynamic score based on how many adversarial attacks the agent successfully repelled. Each detected vulnerability is paired with a specific remediation and a ready-to-download guardrail configuration — Llama Guard rules, NeMo Guardrails configs, and regex output filters.",
    statusType: "success",
  },
];

export const faqs: FAQ[] = [
  {
    id: "faq-0",
    question: "What is Dobbies?",
    answer: "Dobbies is an automated security auditor for AI Agents. It scans system prompts, tool schemas, and agentic workflows for vulnerabilities, logic bugs, and missing guardrails before they reach production.",
  },
  {
    id: "faq-1",
    question: "How does the audit process work?",
    answer: "Dobbies runs a dual-stage audit: a static vulnerability scan using RAG (retrieving relevant OWASP LLM Top 10 rules) followed by an automated dynamic AI vs AI red-teaming simulation where an adversarial Attacker LLM probes a dynamically spawned Agent LLM to test its compliance.",
  },
  {
    id: "faq-2",
    question: "Is my prompt data secure?",
    answer: "Absolutely. We prioritize your privacy. Dobbies runs audits in stateless, secure environments. Your configurations, prompts, and tool definitions are only used during the active audit, stored securely in your private history, and never used to train models.",
  },
  {
    id: "faq-3",
    question: "How does the AI vs AI simulation work?",
    answer: "To safely test tool access and prompt compliance without risking your infrastructure, Dobbies spins up an Agent LLM preloaded with your instructions and tools. The Attacker LLM then probes this agent, evaluating if it complies or refuses under pressure, without actual risk to your production systems.",
  },
  {
    id: "faq-4",
    question: "What integrations are supported?",
    answer: "Dobbies is framework-agnostic. You can audit system prompts and tools from LangChain, LlamaIndex, CrewAI, AutoGen, or any custom API-driven agentic architectures by simply pasting your prompts and tool specifications.",
  },
];
