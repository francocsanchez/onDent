export const isDateOnlyString = (value?: string | Date): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());

export const parseDateOnlyString = (value?: string | Date) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (!isDateOnlyString(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getDateOnlyParts = (value?: string | Date) => {
  if (!isDateOnlyString(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
};
