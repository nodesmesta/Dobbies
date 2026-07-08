-- Fix: trigger sebelumnya tidak pernah fire karena vulnerability_count 
-- memiliki DEFAULT 0, sehingga tidak pernah berubah dari NULL ke NOT NULL.
-- 
-- Sekarang trigger bereaksi pada perubahan status dari 'running' menjadi 'completed'.

create or replace trigger on_audit_report_complete
  after update on public.audit_reports
  for each row
  when (old.status = 'running' and new.status = 'completed')
  execute function notify_audit_complete();
