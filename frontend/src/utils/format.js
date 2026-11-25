// Display formatting for salaries and dates (Canadian English, Canadian dollars).

const currencyFormatter = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });

// 75000 -> "$75,000.00"
export function formatSalary(value) {
  const number = Number(value);
  return Number.isFinite(number) ? currencyFormatter.format(number) : '—';
}

// "2024-01-15T00:00:00.000Z" -> "January 15, 2024"
// The date of joining is stored as midnight UTC. Formatting it in the browser's own time
// zone would show the PREVIOUS day in Toronto (UTC-5), so we format it in UTC.
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

// For created/updated timestamps: a real moment in time, so we show it in local time.
export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
}

export function fullName(employee) {
  return `${employee?.first_name ?? ''} ${employee?.last_name ?? ''}`.trim();
}
