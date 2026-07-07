/**
 * Shared type definitions for GitHub integration.
 * Centralized here to avoid coupling between components that consume this type.
 */

export interface GitHubConnectionInfo {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  connectedAt?: string;
}
