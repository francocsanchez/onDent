export const isDateOnlyString = (value?: string) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());

export const parseDateOnlyString = (value?: string) => {
  if (!isDateOnlyString(value)) {
    return null;
  }

  const normalizedValue = typeof value === "string" ? value.trim() : "";
  const [year, month, day] = normalizedValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateOnly = (value?: string, locale = "es-AR") => {
  const date = parseDateOnlyString(value);
  if (!date) {
    return value ?? "";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const getTodayDateLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getYearMonthFromDateOnly = (value?: string) => {
  if (!isDateOnlyString(value)) {
    return null;
  }

  const normalizedValue = typeof value === "string" ? value.trim() : "";
  const [year, month] = normalizedValue.split("-").map(Number);
  return { year, month };
};
