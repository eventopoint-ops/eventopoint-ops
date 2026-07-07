// Shared phase config for the run-of-show. Keys must match what the
// AI-import edge function is prompted to return, and what manual task
// creation writes to the `phase` column.
export const PHASES = [
  { key: 'setup', label: 'Setup', color: '#888888' },
  { key: 'event', label: 'Event Day', color: '#0D0D0D' },
  { key: 'post', label: 'Post-Event', color: '#555555' },
]

export const CATEGORIES = ['Setup', 'Tech', 'F&B', 'Décor', 'Guest']
