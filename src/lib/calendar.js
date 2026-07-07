// Small, dependency-free month-grid calendar helpers. The old build had
// this logic inlined and minified; pulling it out here so it's testable
// and reusable independent of the Dashboard component.

export function toDateString(date) {
  return date.toISOString().split('T')[0]
}

export function todayString() {
  return toDateString(new Date())
}

// Returns a flat array of Date|null cells for a full month grid
// (padding with null for the leading/trailing days of adjacent months).
export function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
