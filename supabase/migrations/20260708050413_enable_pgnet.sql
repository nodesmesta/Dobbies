-- Enable pg_net extension for async HTTP requests from triggers
create extension if not exists pg_net with schema extensions;

-- Grant execute to authenticated / anon so the trigger function can call it
grant usage on schema extensions to anon, authenticated, service_role;
grant all on function net.http_post to anon, authenticated, service_role;
