import { useEffect, useState, useCallback } from 'react';
import { BookOpen, ExternalLink, Loader2, Printer, Search, QrCode as QrIcon, FileText, Filter } from 'lucide-react';
import QRCode from 'qrcode';
import { downloadHtmlAsPdf, brandHeader, qrCardsHtml } from '@/lib/pdfExport';
import { fetchZadResources, type ZadResource } from '@/lib/supabase';

const categoryColors: Record<string, string> = {
  'الأدلة التنظيمية': 'bg-emerald-600',
  'الدورات التأسيسية': 'bg-amber-600',
  'نظام نور': 'bg-sky-600',
  'أدلة التوجيه الطلابي': 'bg-teal-600',
  'أدلة برامج التوجيه الطلابي': 'bg-rose-600',
};

const categoryBadge: Record<string, string> = {
  'الأدلة التنظيمية': 'bg-emerald-100 text-emerald-700',
  'الدورات التأسيسية': 'bg-amber-100 text-amber-700',
  'نظام نور': 'bg-sky-100 text-sky-700',
  'أدلة التوجيه الطلابي': 'bg-teal-100 text-teal-700',
  'أدلة برامج التوجيه الطلابي': 'bg-rose-100 text-rose-700',
};

function shortLink(slug: string): string {
  return `${window.location.origin}${window.location.pathname}?s=${slug}`;
}

export function ZadLibrarySection() {
  const [resources, setResources] = useState<ZadResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [qrCache, setQrCache] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchZadResources();
      setResources(data);
      const cache: Record<string, string> = {};
      await Promise.all(data.map(async (r) => {
        try { cache[r.slug] = await QRCode.toDataURL(shortLink(r.slug), { width: 200, margin: 1 }); } catch { /* skip */ }
      }));
      setQrCache(cache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل المكتبة');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = Array.from(new Set(resources.map(r => r.category)));
  const filtered = resources.filter(r => {
    const matchCat = filterCat === 'all' || r.category === filterCat;
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const printPdfCards = async () => {
    const items = filtered.length > 0 ? filtered : resources;
    const html = brandHeader('بطاقات موارد مكتبة زاد', 'امسح الرمز لفتح المورد') + qrCardsHtml(items.map(r => ({
      title: r.title,
      subtitle: r.category,
      qrDataUrl: qrCache[r.slug],
      url: shortLink(r.slug),
      note: r.page ? `صفحة ${r.page}` : undefined,
    })));
    await downloadHtmlAsPdf(html, 'zad-library-cards.pdf');
  };


  if (loading) return (
    <section id="zad-library" className="py-12 bg-slate-50 scroll-mt-20">
      <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
    </section>
  );

  if (error) return (
    <section id="zad-library" className="py-12 bg-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 text-red-700">{error}</div>
    </section>
  );

  return (
    <section id="zad-library" className="py-12 bg-slate-50 scroll-mt-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-cairo">رفّ زاد الموجه</h2>
              <p className="text-sm text-slate-500">{resources.length} مورداً توجيهياً بباركود محلي وروابط قصيرة</p>
            </div>
          </div>
          <button onClick={printPdfCards} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors">
            <Printer className="w-4 h-4" />
            طباعة بطاقات PDF
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في الموارد..."
              className="w-full pr-10 pl-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20">
              <option value="all">كل الفئات</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Resource cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[11px] rounded-full px-2.5 py-1 ${categoryBadge[r.category] || 'bg-slate-100 text-slate-600'}`}>{r.category}</span>
                {r.page && <span className="text-[11px] text-slate-400">ص{r.page}</span>}
              </div>
              <h3 className="text-sm font-bold text-slate-800 font-cairo leading-6 mb-3 flex-1">{r.title}</h3>
              <div className="flex items-center gap-3">
                {qrCache[r.slug] && (
                  <img src={qrCache[r.slug]} alt={`باركود ${r.title}`} className="w-16 h-16 rounded-lg border border-slate-100" />
                )}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <a href={shortLink(r.slug)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-teal-700 hover:bg-teal-50 px-2 py-1.5 rounded-lg transition-colors">
                    <QrIcon className="w-3.5 h-3.5" /> رابط قصير
                  </a>
                  {r.drive_url && (
                    <a href={r.drive_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-sky-700 hover:bg-sky-50 px-2 py-1.5 rounded-lg transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> فتح الملف
                    </a>
                  )}
                </div>
              </div>
              {r.qr_note && <p className="text-[11px] text-amber-600 mt-2 leading-5">{r.qr_note}</p>}
              {r.qr_url && <p className="text-[10px] text-slate-300 mt-1" dir="ltr">مرجع QR: {r.qr_url}</p>}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد موارد مطابقة</p>
          </div>
        )}
      </div>
    </section>
  );
}

