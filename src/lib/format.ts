const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatMoney = (amount: number) => usd.format(amount);

export const formatPercent = (value: number) => `${Number(value.toFixed(2))}%`;

export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

// Cuts long text at a word boundary for previews, like the project list.
export function truncate(text: string, max = 160) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : max).trimEnd()}…`;
}
