import { useEffect, useState } from 'react';
import { Award, Trophy, Loader2, Star } from 'lucide-react';
import { Panel } from '@/components/layout/AppShell';
import { Badge, Empty, GhostButton } from '@/components/ui/kit';
import { CouncilPage } from '@/pages/CouncilPage';
import { fetchTalents, updateTalent, type TalentRecord } from '@/lib/supabase';
import { VoiceSurveyCard, HonorReports } from '@/components/StudentVoiceExtras';

/** صوت الطالب: اجتماعات المجلس الطلابي + لوحة الشرف للمتفوقين والموهوبين */
export function StudentVoicePage({ onImport }: { onImport: () => void }) {
  const [talents, setTalents] = useState<TalentRecord[] | null>(null);
  useEffect(() => { fetchTalents().then(setTalents).catch(() => setTalents([])); }, []);

  const honor = async (t: TalentRecord) => {
    const next = t.status === 'showcased' ? { status: 'identified', status_label: 'مكتشفة' } : { status: 'showcased', status_label: 'تم تكريمه' };
    await updateTalent(t.id, next);
    setTalents(l => (l || []).map(x => x.id === t.id ? { ...x, ...next } : x));
  };

  const honored = (talents || []).filter(t => t.status === 'showcased');
  return (
    <>
      <CouncilPage table="guidance_student_council" />
      <div className="px-4 sm:px-6 lg:px-10 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VoiceSurveyCard />
        <HonorReports />
      </div>
      <div className="px-4 sm:px-6 lg:px-10 mt-6">
        <Panel title="لوحة الشرف والتكريم" action={<Badge tone="amber"><Trophy className="w-3.5 h-3.5" /> {honored.length} مُكرَّم</Badge>}>
          {!talents ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
            : talents.length === 0 ? <Empty icon={Award} text="لا يوجد طلاب متفوقون أو موهوبون مسجلون بعد" action={<button onClick={onImport} className="text-sm font-bold text-brand-700">استورد كشف الدرجات لاكتشافهم تلقائيًا</button>} />
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {talents.map(t => (
                  <div key={t.id} className={`rounded-xl border p-4 ${t.status === 'showcased' ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.status === 'showcased' ? 'bg-amber-400 text-white' : 'bg-amber-50 text-amber-600'}`}><Star className="w-5 h-5" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-slate-800 leading-6">{t.title}</p>
                        <p className="text-xs font-bold text-slate-500">{t.student_grade} · {t.talent_type_label}</p>
                        {t.evidence && <p className="text-xs text-slate-600 mt-1">{t.evidence}</p>}
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                      <GhostButton onClick={() => honor(t)}><Trophy className="w-3.5 h-3.5" /> {t.status === 'showcased' ? 'إلغاء التكريم' : 'تكريم'}</GhostButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </Panel>
      </div>
    </>
  );
}
