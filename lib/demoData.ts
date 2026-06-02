// Static demo data — used when demo mode is enabled so real data is never exposed

export const DEMO_TASKS = [
  { id: 'd1', title: 'Review Q2 investment portfolio', urgency: 'critical', key: true, time_estimate_min: 30, tags: ['finance'], completed_at: null },
  { id: 'd2', title: 'Write weekly reflection', urgency: 'high', key: false, time_estimate_min: 20, tags: ['growth'], completed_at: null },
  { id: 'd3', title: 'Schedule dentist appointment', urgency: 'medium', key: false, time_estimate_min: 5, tags: [], completed_at: null },
  { id: 'd4', title: 'Read chapter 3 of Atomic Habits', urgency: 'low', key: false, time_estimate_min: 45, tags: ['learning'], completed_at: null },
]

export const DEMO_HABITS = [
  { id: 'h1', name: 'Morning workout', icon: '💪', done: true },
  { id: 'h2', name: 'Read 30 min', icon: '📚', done: true },
  { id: 'h3', name: 'Cold shower', icon: '🚿', done: false },
  { id: 'h4', name: 'No social media before noon', icon: '📵', done: true },
  { id: 'h5', name: 'Journaling', icon: '✍️', done: false },
  { id: 'h6', name: 'Supplements', icon: '💊', done: true },
]

export const DEMO_NUTRITION = {
  meals: [
    { id: 'm1', name: 'Greek yogurt + berries', kcal: 280, protein: 18, carbs: 32, fat: 8 },
    { id: 'm2', name: 'Chicken & rice bowl', kcal: 520, protein: 42, carbs: 55, fat: 12 },
    { id: 'm3', name: 'Protein shake', kcal: 180, protein: 30, carbs: 10, fat: 4 },
  ],
  target: { kcal: 2200, protein: 150, carbs: 200, fat: 70 },
}

export const DEMO_CALENDAR = [
  { id: 'c1', title: 'Morning run', start: todayAt(7, 0), end: todayAt(7, 45), location: null, allDay: false },
  { id: 'c2', title: 'Team standup', start: todayAt(9, 0), end: todayAt(9, 30), location: 'Zoom', allDay: false },
  { id: 'c3', title: 'Deep work block', start: todayAt(10, 0), end: todayAt(12, 0), location: null, allDay: false },
  { id: 'c4', title: 'Lunch with Alex', start: todayAt(12, 30), end: todayAt(13, 30), location: 'True Food Kitchen', allDay: false },
  { id: 'c5', title: 'Investor call', start: todayAt(15, 0), end: todayAt(16, 0), location: null, allDay: false },
]

export const DEMO_FINANCE = {
  netWorth: 142_350,
  change: +4_820,
  categories: [
    { label: 'Investments', value: 96_400, pct: 68, color: 'var(--accent)' },
    { label: 'Cash',        value: 28_600, pct: 20, color: 'var(--ok)' },
    { label: 'Crypto',      value: 17_350, pct: 12, color: 'var(--warn)' },
  ],
}

export const DEMO_GOALS = {
  week: [
    { id: 'g1', title: 'Ship new feature', completed_at: new Date().toISOString() },
    { id: 'g2', title: 'Run 3× this week', completed_at: null },
  ],
  month: [
    { id: 'g3', title: 'Reach 180 lbs', completed_at: null },
    { id: 'g4', title: 'Save $5k', completed_at: null },
  ],
  quarter: [
    { id: 'g5', title: 'Launch side project beta', completed_at: null },
  ],
}

function todayAt(h: number, m: number): string {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
