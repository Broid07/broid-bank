let currency = '$';
let numberFormat: Intl.NumberFormat | null = null;
let dateFormat: Intl.DateTimeFormat | null = null;

export function configureFormat(locale: string, symbol: string) {
  currency = symbol;

  try {
    numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    dateFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    numberFormat = null;
    dateFormat = null;
  }
}

export function formatNumber(value: number): string {
  const rounded = Math.floor(Number(value) || 0);
  return numberFormat ? numberFormat.format(rounded) : String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function money(value: number): string {
  return currency + formatNumber(value);
}

export function currencySymbol(): string {
  return currency;
}

export function formatDate(seconds: number): string {
  const date = new Date(Number(seconds) * 1000);
  return dateFormat ? dateFormat.format(date) : date.toLocaleString();
}
