-- Fix: trigger sebelumnya fire pas INSERT (counts masih NULL).
-- Sekarang fire pas UPDATE setelah counts diisi.
-- WHEN condition: hanya fire sekali saat transisi NULL → value

drop trigger if exists on_audit_report_insert on public.audit_reports;

create trigger on_audit_report_complete
  after update on public.audit_reports
  for each row
  when (old.vulnerability_count is null and new.vulnerability_count is not null)
  execute function notify_audit_complete();
