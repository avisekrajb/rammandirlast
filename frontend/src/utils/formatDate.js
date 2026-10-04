/**
 * Date formatting shared by the printable documents and the CSV exports.
 *
 * These deliberately avoid the locale-aware `toLocaleDateString` for anything
 * that ends up in a file: the CSV must stay stable across machines, and the
 * print sheet is read by people who expect an unambiguous numeric date.
 */

const pad = (n) => String(n).padStart(2, '0');

export const toDate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** `YYYY-MM-DD` */
export const formatDateOnly = (value) => {
  const d = toDate(value);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** `YYYY-MM-DD HH:MM` (24h, locale independent) */
export const formatDateTime = (value) => {
  const d = toDate(value);
  if (!d) return '';
  return `${formatDateOnly(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Long form for display, e.g. `4 Oct 2026, 14:05` */
export const formatLongDate = (value) => {
  const d = toDate(value);
  if (!d) return '';
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
