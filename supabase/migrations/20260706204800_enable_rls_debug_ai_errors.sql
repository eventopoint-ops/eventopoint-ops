-- Close a public exposure: this table was created with RLS off, so anyone
-- holding the app's public anon key could read it, including partial
-- Anthropic API key prefixes and raw error bodies logged during AI import
-- failures. No client-facing policies are added on purpose — nothing in the
-- app reads this table from the client, only the edge function writes to it
-- via its service-role key, which bypasses RLS entirely.
alter table public._debug_ai_errors enable row level security;
