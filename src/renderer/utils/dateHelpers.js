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