// Static demo data — used when demo mode is enabled so real data is never exposed

export const DEMO_TASKS = [
  { id: 'd1', title: 'Review Q2 investment portfolio', urgency: 'critical', key: true, time_estimate_min: 30, tags: ['finance'], completed_at: null },
  { id: 'd2', title: 'Write weekly reflection', urgency: 'high', key: false, time_estimate_min: 20, tags: ['growth'], completed_at: null },
  { id: 'd3', title: 'Schedule dentist appointment', urgency: 'medium', key: false, time_estimate_min: 5, tags: [], completed_at: null },
  { id: 'd4', title: 'Read chapter 3 of Atomic Habits', urgency: 'low', key: false, time_estimate_min: 45, tags: ['learning'], completed_at: null },
]

export const DEMO_HABITS = [
  {
    id: 'h1', name: 'Morning workout', icon: '🏋️', done: true,
    time_estimate_min: undefined, sort_order: 1,
    subtasks: [
      { id: 'h1s1', habit_id: 'h1', name: 'Warm-up stretches', sort_order: 1, time_estimate_min: 10, done: true },
      { id: 'h1s2', habit_id: 'h1', name: 'Strength training', sort_order: 2, time_estimate_min: 35, done: true },
      { id: 'h1s3', habit_id: 'h1', name: 'Cardio cooldown', sort_order: 3, time_estimate_min: 10, done: true },
    ],
  },
  {
    id: 'h2', name: 'Read 30 min', icon: '📚', done: false,
    time_estimate_min: undefined, sort_order: 2,
    subtasks: [
      { id: 'h2s1', habit_id: 'h2', name: 'Non-fiction chapter', sort_order: 1, time_estimate_min: 20, done: true },
      { id: 'h2s2', habit_id: 'h2', name: 'Highlight & notes', sort_order: 2, time_estimate_min: 10, done: false },
    ],
  },
  {
    id: 'h3', name: 'Cold shower', icon: '🚿', done: false,
    time_estimate_min: 5, sort_order: 3,
    subtasks: [],
  },
  {
    id: 'h4', name: 'Journaling', icon: '✍️', done: true,
    time_estimate_min: 15, sort_order: 4,
    subtasks: [],
  },
  {
    id: 'h5', name: 'Supplements', icon: '💊', done: true,
    time_estimate_min: undefined, sort_order: 5,
    subtasks: [
      { id: 'h5s1', habit_id: 'h5', name: 'Morning stack', sort_order: 1, time_estimate_min: undefined, done: true },
      { id: 'h5s2', habit_id: 'h5', name: 'Evening magnesium', sort_order: 2, time_estimate_min: undefined, done: true },
    ],
  },
]

export const DEMO_NUTRITION = {
  meals: [
    { id: 'm1', name: 'Greek yogurt + berries', kcal: 280, protein_g: 18, carbs_g: 32, fat_g: 8, created_at: todayAt(7, 30) },
    { id: 'm2', name: 'Chicken & rice bowl', kcal: 520, protein_g: 42, carbs_g: 55, fat_g: 12, created_at: todayAt(12, 15) },
    { id: 'm3', name: 'Protein shake', kcal: 180, protein_g: 30, carbs_g: 10, fat_g: 4, created_at: todayAt(15, 45) },
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
