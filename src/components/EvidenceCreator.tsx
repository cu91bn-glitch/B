import { useState, useRef, useMemo } from 'react';
import {
  Upload, X, FileText, Image as ImageIcon, Loader2,
  Link2, Copy, CheckCircle2, QrCode, Calendar, Target, Tag,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  createEvidence, buildPublicEvidenceUrl,
  type EvidenceRecord,
} from '@/lib/supabase';
import {
  accreditationDomains, allIndicators, indicatorColorMap, findIndicator,
} from '@/data/accreditationIndicators';

interface EvidenceCreatorProps {
  module: string;
  category: string;
  activityId?: string;
  activityTitle?: string;
  presetIndicatorCode?: string;
  onCreated?: (record: EvidenceRecord) => void;
  onClose?: () => void;
}

export function EvidenceCreator({
  module, category, activityId, activityTitle, presetIndicatorCode, onCreated, onClose,
}: EvidenceCreatorProps) {
  const [title, setTitle] = useState(activityTitle || '');
  const [dateHijri, setDateHijri] = useState('');
  const [dateGregorian, setDateGregorian] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    presetIndicatorCode ? [presetIndicatorCode] : []
  );
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<EvidenceRecord | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presetIndicator = presetIndicatorCode ? findIndicator(presetIndicatorCode) : undefined;

  const toggleCode = (code: string) => {
    setSelectedCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const publicUrl = useMemo(
    () => created ? buildPublicEvidenceUrl(created.public_token) : '',
    [created]
  );

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) { setError('يرجى إدخال عنوان الشاهد'); return; }
    if (!file) { setError('يرجى اختيار ملف الشاهد'); return; }
    setSubmitting(true);
    try {
      const record = await createEvidence({
        file,
        title: title.trim(),
        category,
        module,
        activityId: activityId || undefined,
        activityTitle: activityTitle || title.trim(),
        indicatorCodes: selectedCodes,
        dateHijri: dateHijri || undefined,
        dateGregorian: dateGregorian || undefined,
      });
      setCreated(record);
      const url = buildPublicEvidenceUrl(record.public_token);
      const qr = await QRCode.toDataURL(url, { width: 200, margin: 1 });
      setQrDataUrl(qr);
      onCreated?.(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء الشاهد');
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (created) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-800 font-cairo">تم إنشاء الشاهد بنجاح</h4>
          <p className="text-sm text-slate-500 mt-1">«{created.title}»</p>
        </div>

        {qrDataUrl && (
          <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-48 h-48 bg-white rounded-xl p-2 border border-slate-200">
              <img src={qrDataUrl} alt="QR Code" className="w-full h-full" />
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              امسح الرمز للوصول إلى الشاهد
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
          <Link2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            readOnly
            value={publicUrl}
            className="flex-1 bg-transparent text-xs text-slate-600 outline-none truncate"
          />
          <button
            onClick={copyLink}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'تم النسخ' : 'نسخ'}
          </button>
        </div>

        {created.indicator_codes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {created.indicator_codes.map(code => {
              const ind = findIndicator(code);
              return (
                <span key={code} className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                  {code} - {ind?.title || ''}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setCreated(null);
              setQrDataUrl('');
              setTitle(activityTitle || '');
              setDateHijri('');
              setDateGregorian('');
              setSelectedCodes(presetIndicatorCode ? [presetIndicatorCode] : []);
              setFile(null);
            }}
            className="flex-1 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            إنشاء شاهد آخر
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              تم
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {presetIndicator && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
          <Target className="w-4 h-4 flex-shrink-0" />
          مرتبط بالمؤشر: <strong>{presetIndicator.code}</strong> - {presetIndicator.title}
        </div>
      )}

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
          <Tag className="w-4 h-4 text-slate-400" />
          عنوان الشاهد
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="مثال: صورة تنفيذ ورشة الوقاية من التنمر"
          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            التاريخ الهجري
          </label>
          <input
            value={dateHijri}
            onChange={e => setDateHijri(e.target.value)}
            placeholder="مثال: 15 صفر 1448هـ"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            التاريخ الميلادي
          </label>
          <input
            type="date"
            value={dateGregorian}
            onChange={e => setDateGregorian(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
          <Target className="w-4 h-4 text-slate-400" />
          مؤشرات الاعتماد المرتبطة
        </label>
        <div className="max-h-44 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
          {accreditationDomains.map(domain => {
            const colors = indicatorColorMap[domain.color];
            return (
              <div key={domain.id}>
                <p className={`text-xs font-bold ${colors.text} px-1 py-1`}>{domain.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {domain.indicators.map(ind => {
                    const active = selectedCodes.includes(ind.code);
                    return (
                      <button
                        key={ind.code}
                        onClick={() => toggleCode(ind.code)}
                        className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                          active
                            ? `${colors.bg} ${colors.text} ${colors.border} font-medium`
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                        title={ind.description}
                      >
                        {ind.code}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {selectedCodes.length > 0 && (
          <p className="text-xs text-slate-500 mt-1.5">
            تم اختيار {selectedCodes.length} مؤشر
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">ملف الشاهد</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); }}
          onDrop={onDrop}
          className="relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={onFileSelect}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              {file.type.startsWith('image/')
                ? <ImageIcon className="w-5 h-5 text-sky-600" />
                : <FileText className="w-5 h-5 text-red-600" />}
              <span className="text-sm font-medium text-slate-700">{file.name}</span>
              <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">اختر ملفاً أو اسحبه هنا</p>
              <p className="text-xs text-slate-400">صور أو PDF - حد أقصى 10 ميجابايت</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</>
        ) : (
          <><CheckCircle2 className="w-4 h-4" /> إنشاء الشاهد</>
        )}
      </button>
    </div>
  );
}

export { allIndicators };
