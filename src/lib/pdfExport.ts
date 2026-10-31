import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FOUNDER_NAME } from './brand';

/**
 * تحويل قالب HTML عربي إلى ملف PDF بصفحات A4.
 *
 * - ينتظر تحميل الخطوط والصور قبل الالتقاط حتى لا تظهر الحروف بخط بديل.
 * - يقسم الصفحات عند حدود العناصر (الأقسام، البطاقات، صفوف الجداول) بدل قص المحتوى في المنتصف.
 * - يستخدم JPEG بدل PNG لتصغير حجم الملف بشكل كبير.
 */

const PAGE_W_PX = 794; // عرض A4 عند 96dpi
const PAGE_H_PX = Math.round((PAGE_W_PX * 297) / 210); // 1123
const MARGIN_Y_PX = 28;
const FOOTER_PX = 24;
const CONTENT_H_PX = PAGE_H_PX - MARGIN_Y_PX * 2 - FOOTER_PX;
const SCALE = 2;

export const PDF_BASE_CSS = `
  .pdf-root, .pdf-root * { box-sizing: border-box; letter-spacing: 0 !important; word-spacing: normal; }
  .pdf-root { font-family: 'Tajawal', Arial, sans-serif; direction: rtl; text-align: right; color: #1b2a38; font-size: 13px; line-height: 1.75; font-weight: 500; }
  .pdf-root table { width: 100%; border-collapse: collapse; }
  .pdf-root th, .pdf-root td { vertical-align: middle; }
  .pdf-root .ltr { direction: ltr; unicode-bidi: isolate; display: inline-block; }
  .pdf-root .num { font-variant-numeric: tabular-nums; }
`;

export interface PdfOptions {
  /** نص يكتب أسفل كل صفحة (أرقام/لاتيني فقط لأن خطوط jsPDF لا تدعم العربية) */
  footerLatin?: string;
}

/** حساب مواضع القص بحيث لا ينقسم عنصر بين صفحتين إلا إذا كان أطول من صفحة كاملة */
export function computePageBreaks(totalHeight: number, candidates: number[], pageHeight: number): number[] {
  const sorted = Array.from(new Set(candidates.filter(c => c > 0 && c < totalHeight).map(Math.round))).sort((a, b) => a - b);
  const breaks: number[] = [0];
  let start = 0;
  while (totalHeight - start > pageHeight) {
    const limit = start + pageHeight;
    let best = -1;
    for (const c of sorted) {
      if (c > start + pageHeight * 0.25 && c <= limit) best = c;
      if (c > limit) break;
    }
    const next = best > start ? best : limit;
    breaks.push(next);
    start = next;
  }
  breaks.push(totalHeight);
  return breaks;
}

/**
 * يغلّف كل كلمة في عنصر span مستقل.
 * html2canvas يرسم النص كلمةً كلمة ويحسب موضع كل كلمة بقياس جزء من العقدة النصية،
 * وهذا القياس غير دقيق للنص العربي في بعض المتصفحات (خصوصًا Safari على الجوال)
 * فتتداخل الكلمات أو تلتصق. عندما تكون كل كلمة عقدة مستقلة يصبح القياس دقيقًا.
 */
function isolateWords(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    if (!parent || parent.tagName === 'STYLE' || parent.dataset.pdfWord !== undefined) continue;
    if (/\s/.test(node.data.trim())) nodes.push(node);
  }
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    for (const part of node.data.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
      const span = document.createElement('span');
      span.dataset.pdfWord = '';
      span.textContent = part;
      frag.appendChild(span);
    }
    node.parentNode?.replaceChild(frag, node);
  }
}

async function waitForAssets(root: HTMLElement): Promise<void> {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (fonts) {
    try {
      await Promise.all(
        ['400', '500', '700', '800'].flatMap(w => [
          fonts.load(`${w} 14px Tajawal`, 'بوصلة'),
        ]),
      );
      await fonts.ready;
    } catch { /* نكمل بالخط المتاح */ }
  }
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(imgs.map(img => (img.complete && img.naturalWidth > 0)
    ? Promise.resolve()
    : new Promise<void>(resolve => { img.onload = () => resolve(); img.onerror = () => resolve(); })));
}

/** يحوّل HTML إلى كائن jsPDF. العناصر ذات data-pdf-block أو أبناء الجذر المباشرون أو صفوف الجداول تعتبر نقاط قص آمنة. */
export async function renderHtmlToPdf(html: string, options: PdfOptions = {}): Promise<jsPDF> {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:absolute; left:-10000px; top:0; width:${PAGE_W_PX}px; background:#fff; z-index:-1;`;
  host.innerHTML = `<style>${PDF_BASE_CSS}</style><div class="pdf-root" dir="rtl" lang="ar" style="width:${PAGE_W_PX}px; padding:0 40px 28px; background:#fff;">${html}</div>`;
  document.body.appendChild(host);
  const root = host.querySelector('.pdf-root') as HTMLElement;

  try {
    isolateWords(root);
    await waitForAssets(root);

    const rootTop = root.getBoundingClientRect().top;
    const candidateEls = [
      ...Array.from(root.children),
      ...Array.from(root.querySelectorAll('[data-pdf-block], tr, li')),
    ] as HTMLElement[];
    // لا نقص الصفحة مباشرة بعد عنوان قسم (حتى لا يبقى العنوان وحيدًا أسفل الصفحة)
    const forbidden: (readonly [number, number])[] = (Array.from(root.querySelectorAll('h1, h2, h3, thead')) as HTMLElement[]).map(h => {
      const r = h.getBoundingClientRect();
      return [r.top - rootTop + 1, r.bottom - rootTop + 60] as const;
    });
    // البطاقات (data-pdf-block) لا تُقسم من الداخل ما دامت أقصر من صفحة
    for (const el of Array.from(root.querySelectorAll('[data-pdf-block]')) as HTMLElement[]) {
      const r = el.getBoundingClientRect();
      if (r.height < CONTENT_H_PX) forbidden.push([r.top - rootTop + 1, r.bottom - rootTop - 1] as const);
    }
    const candidates: number[] = [];
    for (const el of candidateEls) {
      const rect = el.getBoundingClientRect();
      for (const y of [rect.top - rootTop, rect.bottom - rootTop]) {
        if (!forbidden.some(([a, b]) => y > a && y < b)) candidates.push(y);
      }
    }
    const totalHeight = Math.ceil(root.scrollHeight);

    const canvas = await html2canvas(root, {
      scale: SCALE,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: PAGE_W_PX,
      width: PAGE_W_PX,
      height: totalHeight,
      logging: false,
    });

    const breaks = computePageBreaks(totalHeight, candidates, CONTENT_H_PX);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const pxToMm = 210 / PAGE_W_PX;
    const pageCount = breaks.length - 1;

    for (let i = 0; i < pageCount; i++) {
      const from = breaks[i];
      const to = breaks[i + 1];
      const sliceH = to - from;
      const page = document.createElement('canvas');
      page.width = PAGE_W_PX * SCALE;
      page.height = Math.ceil(sliceH * SCALE);
      const ctx = page.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, page.width, page.height);
      ctx.drawImage(canvas, 0, from * SCALE, canvas.width, sliceH * SCALE, 0, 0, page.width, sliceH * SCALE);

      if (i > 0) pdf.addPage();
      pdf.addImage(page.toDataURL('image/jpeg', 0.92), 'JPEG', 0, MARGIN_Y_PX * pxToMm, 210, sliceH * pxToMm, undefined, 'FAST');

      if (pageCount > 1) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`${i + 1} / ${pageCount}`, 105, 297 - 6, { align: 'center' });
      }
      if (options.footerLatin) pdf.text(options.footerLatin, 15, 297 - 6);
    }
    return pdf;
  } finally {
    document.body.removeChild(host);
  }
}

export async function renderHtmlToPdfBlob(html: string, options?: PdfOptions): Promise<Blob> {
  const pdf = await renderHtmlToPdf(html, options);
  return pdf.output('blob');
}

export async function downloadHtmlAsPdf(html: string, fileName: string, options?: PdfOptions): Promise<void> {
  const pdf = await renderHtmlToPdf(html, options);
  pdf.save(fileName);
}

/** تهريب النص قبل وضعه في القالب */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function logoUrl(): string {
  return `${window.location.origin}/brand/bawsala-lockup.png`;
}

/** ترويسة موحدة لكل التقارير مع الشعار */
export function brandHeader(title: string, subtitle = ''): string {
  const date = new Date().toLocaleDateString('ar-SA-u-ca-islamic-umalqura', { year: 'numeric', month: 'long', day: 'numeric' });
  const greg = new Date().toLocaleDateString('ar-SA-u-ca-gregory', { year: 'numeric', month: 'long', day: 'numeric' });
  return `
    <div data-pdf-block style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:8px 0 14px; border-bottom:3px solid #0e7490; margin-bottom:22px;">
      <div style="text-align:center;"><img src="${logoUrl()}" alt="بوصلة" style="height:60px; width:auto; display:block;" /><div style="font-size:10.5px; font-weight:800; color:#10324a; margin-top:2px;">${esc(FOUNDER_NAME)}</div></div>
      <div style="text-align:left; direction:rtl;">
        <div style="font-size:17px; font-weight:800; color:#10324a; line-height:1.4;">${esc(title)}</div>
        ${subtitle ? `<div style="font-size:12px; color:#0e7490; margin-top:2px;">${esc(subtitle)}</div>` : ''}
        <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${esc(date)} — ${esc(greg)}</div>
      </div>
    </div>`;
}

export function sectionTitle(num: string, title: string): string {
  return `<h2 data-pdf-block style="font-size:15px; font-weight:800; color:#10324a; border-right:4px solid #0e7490; padding:2px 10px 2px 0; margin:22px 0 10px; line-height:1.6;">${esc(num)}. ${esc(title)}</h2>`;
}

export interface QrCard {
  title: string;
  subtitle?: string;
  qrDataUrl?: string;
  url: string;
  note?: string;
}

/** بطاقات باركود للطباعة: بطاقتان في كل صف */
export function qrCardsHtml(cards: QrCard[]): string {
  const card = (c: QrCard) => `
    <td style="width:50%; padding:0; vertical-align:top;">
      <div style="border:1px dashed #cbd5e1; border-radius:12px; padding:12px; min-height:150px; background:#fff;">
        <table><tr>
          <td style="vertical-align:top; padding-left:10px;">
            ${c.subtitle ? `<div style="font-size:10.5px; color:#64748b; margin-bottom:4px;">${esc(c.subtitle)}</div>` : ''}
            <div style="font-size:13px; font-weight:700; color:#0f172a; line-height:1.6; max-height:126px; overflow:hidden;">${esc(c.title)}</div>
            ${c.note ? `<div style="font-size:10.5px; color:#0e7490; margin-top:4px;">${esc(c.note)}</div>` : ''}
          </td>
          <td style="width:112px; vertical-align:top; text-align:center;">
            ${c.qrDataUrl ? `<img src="${c.qrDataUrl}" style="width:108px; height:108px; display:block;" />` : ''}
          </td>
        </tr></table>
        <div style="font-size:9px; color:#94a3b8; direction:ltr; text-align:left; word-break:break-all; line-height:1.4; margin-top:6px;">${esc(c.url)}</div>
      </div>
    </td>`;
  const rows: string[] = [];
  for (let i = 0; i < cards.length; i += 2) {
    rows.push(`<tr data-pdf-block>${card(cards[i])}${cards[i + 1] ? card(cards[i + 1]) : '<td style="width:50%;"></td>'}</tr>`);
  }
  return `<table style="border-collapse:separate; border-spacing:10px; margin:0 -10px; width:calc(100% + 20px);">${rows.join('')}</table>`;
}
