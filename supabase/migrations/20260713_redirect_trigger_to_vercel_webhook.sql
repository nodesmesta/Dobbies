-- Redirect trigger dari Supabase Edge Function ke Vercel webhook proxy.
--
-- Latar belakang:
--   Sebelumnya: DB trigger → net.http_post → Supabase Edge Function (verify_jwt: false)
--   Sekarang:   DB trigger → net.http_post → Vercel /api/notify/send → sign JWT → Supabase EF (verify_jwt: true)
--
-- Alasan: JWT signing secret (SUPABASE_JWT_SECRET) hanya hidup di Vercel env,
-- tidak bocor ke PostgreSQL atau Supabase secrets.
-- Edge Function di-set verify_jwt: true — hanya terima request dengan JWT valid.

do $$
declare
  v_edge_fn_url constant text := 'https://act-henna.vercel.app/api/notify/send';
begin
  execute format(
    $func$
    create or replace function notify_audit_complete()
    returns trigger
    language plpgsql
    security definer
    as $body$
    declare
      v_body jsonb;
      v_job_id bigint;
    begin
      v_body := jsonb_build_object(
        'report_id',           new.id,
        'user_id',             new.user_id,
        'agent_name',          new.agent_name,
        'overall_score',       new.overall_score,
        'vulnerability_count', new.vulnerability_count,
        'critical_count',      new.critical_count,
        'high_count',          new.high_count,
        'medium_count',        new.medium_count,
        'low_count',           new.low_count,
        'compromised_count',   new.compromised_count
      );

      select net.http_post(
        url    => %L,
        body   => v_body,
        params => '{}'::jsonb,
        headers => jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        timeout_milliseconds => 5000
      ) into v_job_id;

      raise log '[notify_audit_complete] vercel webhook job=%% for report=%% user=%%',
        v_job_id, new.id, new.user_id;

      return new;
    end;
    $body$
    $func$,
    v_edge_fn_url
  );
end;
$$;
