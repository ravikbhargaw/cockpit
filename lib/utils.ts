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

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const datePart = `${day} ${month} ${year}`;
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
    return dateStr;
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


