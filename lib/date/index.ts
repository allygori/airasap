export const getDatesInMonthFast = (
  year: number,
  month: number
): Date[] => {
  // Get days in month by selecting the "0th" day of the next month
  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  return Array.from(
    { length: daysInMonth },
    (_, i) => new Date(year, month, i + 1)
  );
};

export const getDatesBetween = (
  startDate: Date,
  endDate: Date
): Date[] => {
  const dates: Date[] = [];

  // Clone the start date to avoid mutating the original object
  const currentDate = new Date(startDate.getTime());

  // Normalize times to midnight to ensure accurate day-by-day comparison
  currentDate.setHours(0, 0, 0, 0);
  const normalizedEndDate = new Date(endDate.getTime());
  normalizedEndDate.setHours(0, 0, 0, 0);

  // Loop until the current date passes the end date
  while (currentDate <= normalizedEndDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1); // Automatically handles month rollovers
  }

  return dates;
};
