import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, Trash2, ExternalLink, CheckCircle2 } from 'lucide-react';
import {
  fetchEvidence, uploadEvidence, deleteEvidence, getEvidenceUrl,
  type EvidenceRecord,
} from '@/lib/supabase';

interface EvidenceUploaderProps {
  module: string;
  category: string;
  onCountChange?: (count: number) => void;
}

export function useEvidence(module: string) {
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEvidence(module);
      setEvidence(data);
    } catch (err) {
      console.error('Failed to load evidence:', err);
      setEvidence([]);
    } finally {
      setLoading(false);
    }
  }, [module]);

  return { evidence, loading, load, setEvidence };
}

export function EvidenceUploader({ module, category, onCountChange }: EvidenceUploaderProps) {
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadEvidence = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEvidence(module);
      setEvidence(data);
      onCountChange?.(data.length);
    } catch {
      setEvidence([]);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [module, onCountChange]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  const handleUpload = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const title = file.name.replace(/\.[^/.]+$/, '');
      await uploadEvidence(file, title, category, module);
      await loadEvidence();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    try {
      await deleteEvidence(id, filePath);
      await loadEvidence();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف الملف');
    }
  };

  const handleView = async (filePath: string) => {
    try {
      const url = await getEvidenceUrl(filePath);
      window.open(url, '_blank');
    } catch {
      setError('فشل فتح الملف');
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={onFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm text-slate-600">جاري الرفع...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              اضغط لرفع شاهد أو اسحب الملف هنا
            </p>
            <p className="text-xs text-slate-400">صور أو PDF - حد أقصى 10 ميجابايت</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Evidence list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : evidence.length === 0 ? (
        <div className="text-center py-6 text-slate-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">لا توجد شواهد مرفوعة بعد</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            الشواهد المرفوعة ({evidence.length})
          </div>
          {evidence.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-all group"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.file_type === 'image' ? 'bg-sky-50' : 'bg-red-50'
              }`}>
                {item.file_type === 'image'
                  ? <ImageIcon className="w-4 h-4 text-sky-600" />
                  : <FileText className="w-4 h-4 text-red-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                <p className="text-xs text-slate-400">
                  {(item.file_size / 1024).toFixed(0)} KB - {new Date(item.created_at).toLocaleDateString('ar-SA')}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleView(item.file_path)}
                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="عرض"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.file_path)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
