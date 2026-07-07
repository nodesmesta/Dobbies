"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import type { GitHubConnectionInfo } from "@/types/github";

interface UseGitHubConnectionReturn {
  githubConnection: GitHubConnectionInfo;
  connecting: boolean;
  disconnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Centralizes GitHub connection state via Supabase Auth.
 *
 * - connect() → tries Supabase signInWithOAuth (GitHub)
 * - disconnect() → signs out of Supabase
 */
export function useGitHubConnection(): UseGitHubConnectionReturn {
  const [githubConnection, setGithubConnection] = useState<GitHubConnectionInfo>({
    connected: false,
  });
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Try to restore session on mount
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return;
    }

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.user_name) {
        setGithubConnection({
          connected: true,
          username: session.user.user_metadata.user_name as string,
          avatarUrl: session.user.user_metadata.avatar_url as string,
          connectedAt: session.user.created_at,
        });
      }
    }).catch(() => {
      // Ignore — stay disconnected
    });
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "github",
          options: {
            scopes: "repo read:user",
            redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });

        if (error) {
          console.error("Supabase OAuth error:", error.message);
        } else {
          // OAuth redirects away — this line won't normally execute
          return;
        }
      } catch (err) {
        console.error("Supabase OAuth exception:", err);
      }
    }

    // No Supabase or OAuth failed — stay disconnected
    setConnecting(false);
  }, []);

  const disconnect = useCallback(async () => {
    setDisconnecting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Supabase signOut error:", err);
      }
    }

    setGithubConnection({ connected: false });
    setDisconnecting(false);
  }, []);

  return { githubConnection, connecting, disconnecting, connect, disconnect };
}
