-- Fix: trigger sebelumnya fire pas INSERT (counts masih NULL).
-- Sekarang fire pas UPDATE setelah counts diisi oleh post-simulation verdict.
-- WHEN condition: hanya fire sekali saat transisi NULL → value
--
-- Trigger → net.http_post() → Edge Function → Resend API → ✉️ User

-- Konfigurasi: ganti URL ini kalau project Supabase berubah
-- Cek di: https://supabase.com/dashboard/project/exylpvfkundajdixodwm/settings/api
do $$
declare
  v_edge_fn_url constant text := 'https://exylpvfkundajdixodwm.supabase.co/functions/v1/send-audit-notification';
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

      -- Logging: job_id bisa dicek di net._http_response
      raise log '[notify_audit_complete] edge function job=% for report=% user=%',
        v_job_id, new.id, new.user_id;

      return new;
    end;
    $body$
    $func$,
    v_edge_fn_url
  );
end;
$$;

-- Drop dulu trigger lama (INSERT) kalau masih ada
drop trigger if exists on_audit_report_insert on public.audit_reports;
drop trigger if exists on_audit_report_complete on public.audit_reports;

-- Pasang trigger baru (UPDATE, bukan INSERT)
create trigger on_audit_report_complete
  after update on public.audit_reports
  for each row
  when (old.vulnerability_count is null and new.vulnerability_count is not null)
  execute function notify_audit_complete();
