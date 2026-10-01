export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '₹0';

  let num: number;
  if (typeof amount === 'number') {
    num = amount;
  } else {
    // Clean any previous currency symbols, commas, or text
    const cleaned = String(amount).replace(/[^0-9.-]+/g, '');
    if (!cleaned) return '₹0';
    num = parseFloat(cleaned);
  }

  if (isNaN(num)) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);
}

export function normalizeDomain(urlOrDomain: string | null | undefined): string {
  if (!urlOrDomain) return '';
  let str = urlOrDomain.trim().toLowerCase();
  str = str.replace(/^https?:\/\//, '');
  str = str.replace(/^www\./, '');
  str = str.split('/')[0];
  str = str.split('?')[0];
  str = str.split('#')[0];
  return str.trim();
}

export function formatDisplayDate(dateInput: string | Date | number | null | undefined, fallback: string = ''): string {
  if (dateInput === null || dateInput === undefined) return fallback;

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return fallback;

    // Already in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Match YYYY-MM-DD or YYYY/MM/DD (with optional time component)
    const ymdMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/.exec(trimmed);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      const dd = d.padStart(2, '0');
      const mm = m.padStart(2, '0');
      return `${dd}-${mm}-${y}`;
    }

    // Match MM/DD/YYYY or DD/MM/YYYY if any
    const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (slashMatch) {
      const [, p1, p2, y] = slashMatch;
      const dd = p1.padStart(2, '0');
      const mm = p2.padStart(2, '0');
      return `${dd}-${mm}-${y}`;
    }
  }

  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput : fallback;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return typeof dateInput === 'string' ? dateInput : fallback;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return formatDisplayDate(dateStr, 'N/A');

    const datePart = formatDisplayDate(dateStr, 'N/A');
    const hasTime = dateStr.includes('T') || dateStr.includes(':');
    if (hasTime) {
      const timePart = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${datePart}, ${timePart}`;
    }
    return datePart;
  } catch {
    return formatDisplayDate(dateStr, 'N/A');
  }
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}


