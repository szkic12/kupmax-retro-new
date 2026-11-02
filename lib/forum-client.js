'use client';
// Logowanie na forum po stronie przeglądarki: sesja Supabase (konto wspólne z bossxd i ai.kupmax) + profil forum.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// fetch z tokenem zalogowanego (gość idzie bez nagłówka)
export async function forumFetch(url, opts = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

export function useForumMe() {
  const [state, setState] = useState({ loading: true, session: null, email: null, profile: null });

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) {
      setState({ loading: false, session: null, email: null, profile: null });
      return;
    }
    const res = await forumFetch('/api/forum/me');
    const json = await res.json().catch(() => ({}));
    setState({ loading: false, session, email: json.email || session.user.email, profile: json.profile || null, notices: json.notices || [] });
  }, []);

  useEffect(() => {
    refresh();
    // Wywołanie Supabase wewnątrz onAuthStateChange potrafi się zawiesić, stąd setTimeout
    const { data } = supabase.auth.onAuthStateChange(() => setTimeout(refresh, 0));
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  return { ...state, refresh };
}
