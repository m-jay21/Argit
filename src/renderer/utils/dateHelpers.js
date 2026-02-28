// Helper functions for date calculations and formatting

export function getNextBillDate(billDay) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const todayDate = today.getDate();

  let nextBillDate;

  if (todayDate < billDay) {
    // Bill hasn't occurred this month
    nextBillDate = new Date(currentYear, currentMonth, billDay);
  } else {
    // Bill has passed, next one is next month
    nextBillDate = new Date(currentYear, currentMonth + 1, billDay);
  }

  return nextBillDate.toISOString().split('T')[0];
}

export function getDaysUntilBill(nextBillDate) {
  const today = new Date();
  const billDate = new Date(nextBillDate);
  const diffTime = billDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function formatDateShort(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateLong(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getCurrentMonth() {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
}

export function isCurrentMonth(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() &&
         date.getFullYear() === now.getFullYear();
}

/**
 * Returns the current pay period range (inclusive) when pay day is set.
 * E.g. payDay 15: period is 15th of last month through 14th of this month (or 15th this month through 14th next month).
 * payDay 1: period is calendar month (1st through last day of month).
 * @param {number} payDay - Day of month (1-31)
 * @returns {{ start: Date, end: Date } | null} - Start and end of period (start/end of day), or null if invalid payDay
 */
export function getPayPeriodRange(payDay) {
  if (typeof payDay !== 'number' || payDay < 1 || payDay > 31) return null;
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const dayOfMonth = today.getDate();

  let start;
  let end;

  if (dayOfMonth >= payDay) {
    // Current period started this month on payDay
    start = new Date(year, month, payDay);
    end = new Date(year, month + 1, payDay - 1);
  } else {
    // Current period started last month on payDay
    start = new Date(year, month - 1, payDay);
    end = new Date(year, month, payDay - 1);
  }

  // Clamp start to actual month when month has fewer days (e.g. payDay 31 in Feb -> last day of Feb)
  const startTargetMonth = dayOfMonth >= payDay ? month : (month === 0 ? 11 : month - 1);
  const startTargetYear = dayOfMonth >= payDay ? year : (month === 0 ? year - 1 : year);
  if (start.getMonth() !== startTargetMonth) {
    start = new Date(startTargetYear, startTargetMonth + 1, 0);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Returns true if the given date (Date or ISO date string) falls within the pay period. */
export function isDateInPayPeriod(dateOrString, payDay) {
  const range = getPayPeriodRange(payDay);
  if (!range) return false;
  const d = typeof dateOrString === 'string' ? new Date(dateOrString) : new Date(dateOrString.getTime());
  d.setHours(0, 0, 0, 0);
  const start = new Date(range.start.getTime());
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.end.getTime());
  end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}