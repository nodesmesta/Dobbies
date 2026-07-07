/**
 * Shared types for GitHub repo scanning and agent detection.
 */

export interface DetectedAgentTool {
  name: string;
  description: string;
}

export interface DetectedAgent {
  id: string;
  name: string;
  repoUrl?: string;
  filePath?: string;
  content?: string;
  systemPrompt?: string;
  tools?: DetectedAgentTool[];
  language?: string;
  riskHints?: string[];
}
