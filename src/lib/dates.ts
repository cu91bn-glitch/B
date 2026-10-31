/** تحويل تاريخ ميلادي (YYYY-MM-DD) إلى هجري أم القرى نصًا، مثل: 15 ربيع الأول 1448هـ */
export function toHijri(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  try {
    const parts = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(d);
    const get = (t: string) => parts.find(p => p.type === t)?.value || '';
    return `${get('day')} ${get('month')} ${get('year')}هـ`;
  } catch {
    return d.toLocaleDateString('ar-SA');
  }
}

export function todayIso(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** عرض التاريخ المخزن: الهجري إن وجد وإلا الميلادي */
export function displayDate(hijri?: string | null, gregorian?: string | null, fallback?: string): string {
  if (hijri) return hijri;
  if (gregorian) return toHijri(gregorian);
  return fallback ? new Date(fallback).toLocaleDateString('ar-SA') : '—';
}
