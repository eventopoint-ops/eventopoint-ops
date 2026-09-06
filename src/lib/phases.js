// Shared phase config for the run-of-show. Keys must match what the
// AI-import edge function is prompted to return, and what manual task
// creation writes to the `phase` column.
//
// The post-event key MUST stay 'postevent'. The tasks.phase check
// constraint is ARRAY['setup','event','postevent'] and the import
// function's prompt emits 'postevent'. This read 'post' until 2026-09-06,
// which meant manually adding a Post-Event task was rejected by the
// database outright, and AI-imported post-event tasks were written fine
// but then filtered out of this list and never displayed.
export const PHASES = [
  { key: 'setup', label: 'Setup', color: '#888888' },
  { key: 'event', label: 'Event Day', color: '#0D0D0D' },
  { key: 'postevent', label: 'Post-Event', color: '#555555' },
]

export const CATEGORIES = ['Setup', 'Tech', 'F&B', 'Décor', 'Guest']
