-- Fix: public._debug_ai_errors was publicly readable by anyone with the
-- app's anon key (RLS was disabled on this table). The edge function
-- parse-run-of-show writes to it on errors, including partial Anthropic
-- API key prefixes and raw error text — this table should never be
-- client-readable.
--
-- No policies are added intentionally: the edge function writes via its
-- service-role key, which bypasses RLS entirely. Enabling RLS with zero
-- policies blocks all anon/authenticated access while leaving the
-- service-role write path untouched.

alter table public._debug_ai_errors enable row level security;
