// Static demo data — used when demo mode is enabled so real data is never exposed

export const DEMO_TASKS = [
  { id: 'd1', title: 'Review Q2 investment portfolio', urgency: 'critical', key: true, time_estimate_min: 30, tags: ['finance'], completed_at: null },
  { id: 'd2', title: 'Write weekly reflection', urgency: 'high', key: false, time_estimate_min: 20, tags: ['growth'], completed_at: null },
  { id: 'd3', title: 'Schedule dentist appointment', urgency: 'medium', key: false, time_estimate_min: 5, tags: [], completed_at: null },
  { id: 'd4', title: 'Read chapter 3 of Atomic Habits', urgency: 'low', key: false, time_estimate_min: 45, tags: ['learning'], completed_at: null },
]

export const DEMO_HABITS = [
  {
    id: 'h1', name: 'Gym', icon: '🏋️', category: 'FITNESS', done: true,
    time_estimate_min: 60, sort_order: 1,
    subtasks: [],
  },
  {
    id: 'h2', name: 'Supplements', icon: '💊', category: 'HEALTH', done: false,
    time_estimate_min: undefined, sort_order: 2,
    subtasks: [
      { id: 'h2s1', habit_id: 'h2', name: 'Morning vitamins', sort_order: 1, time_estimate_min: undefined, done: true },
      { id: 'h2s2', habit_id: 'h2', name: 'Protein shake', sort_order: 2, time_estimate_min: undefined, done: false },
      { id: 'h2s3', habit_id: 'h2', name: 'Evening magnesium', sort_order: 3, time_estimate_min: undefined, done: false },
    ],
  },
  {
    id: 'h3', name: 'Creative session', icon: '✨', category: 'OUTPUT', done: false,
    time_estimate_min: undefined, sort_order: 3,
    subtasks: [
      { id: 'h3s1', habit_id: 'h3', name: 'Market research', sort_order: 1, time_estimate_min: 15, done: false },
      { id: 'h3s2', habit_id: 'h3', name: 'Content ideas', sort_order: 2, time_estimate_min: 20, done: false },
      { id: 'h3s3', habit_id: 'h3', name: 'Draft & schedule', sort_order: 3, time_estimate_min: 25, done: false },
    ],
  },
  {
    id: 'h4', name: 'Community session', icon: '🤝', category: 'CRM', done: false,
    time_estimate_min: undefined, sort_order: 4,
    subtasks: [
      { id: 'h4s1', habit_id: 'h4', name: 'Reply to DMs', sort_order: 1, time_estimate_min: 10, done: false },
      { id: 'h4s2', habit_id: 'h4', name: 'Engage with posts', sort_order: 2, time_estimate_min: 10, done: false },
      { id: 'h4s3', habit_id: 'h4', name: 'Post update', sort_order: 3, time_estimate_min: 10, done: false },
      { id: 'h4s4', habit_id: 'h4', name: 'Check referrals', sort_order: 4, time_estimate_min: 5, done: false },
    ],
  },
  {
    id: 'h5', name: 'Finance check', icon: '📊', category: 'OPS', done: false,
    time_estimate_min: 25, sort_order: 5,
    subtasks: [
      { id: 'h5s1', habit_id: 'h5', name: 'Review portfolio', sort_order: 1, time_estimate_min: 10, done: false },
      { id: 'h5s2', habit_id: 'h5', name: 'Check for risks', sort_order: 2, time_estimate_min: 5, done: false },
      { id: 'h5s3', habit_id: 'h5', name: 'Log net worth', sort_order: 3, time_estimate_min: 5, done: false },
      { id: 'h5s4', habit_id: 'h5', name: 'Review spending', sort_order: 4, time_estimate_min: 5, done: false },
      { id: 'h5s5', habit_id: 'h5', name: 'Finance dashboard', sort_order: 5, time_estimate_min: 5, done: false },
    ],
  },
  {
    id: 'h6', name: 'Wind-down session', icon: '🌙', category: 'EVENING', done: false,
    time_estimate_min: undefined, sort_order: 6,
    subtasks: [
      { id: 'h6s1', habit_id: 'h6', name: 'Daily reflection', sort_order: 1, time_estimate_min: 10, done: false },
      { id: 'h6s2', habit_id: 'h6', name: 'Plan tomorrow', sort_order: 2, time_estimate_min: 5, done: false },
      { id: 'h6s3', habit_id: 'h6', name: 'Read 20 min', sort_order: 3, time_estimate_min: 20, done: false },
      { id: 'h6s4', habit_id: 'h6', name: 'No screens 30 min', sort_order: 4, time_estimate_min: 30, done: false },
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
