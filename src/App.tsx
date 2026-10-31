import { useState, useEffect, useCallback } from 'react';
import { Loader2, FileDown } from 'lucide-react';
import { fetchZadResources } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { AuthGate } from '@/components/AuthGate';
import { MigrateDataPage } from '@/components/MigrateDataPage';
import { PublicSurveyPage } from '@/components/PublicSurveyPage';
import { PublicEvidencePage } from '@/components/PublicEvidencePage';
import { StandaloneSpecSurvey } from '@/components/SurveyEngineSection';
import { DigitalClinic } from '@/components/DigitalClinic';
import { AppShell, Panel, useHashPage, type PageId } from '@/components/layout/AppShell';
import { DashboardPage } from '@/pages/DashboardPage';
import { EvidencePage } from '@/pages/EvidencePage';
import { ClinicPage } from '@/pages/ClinicPage';
import { SurveyAdminSection } from '@/components/SurveyAdminSection';
import { SurveyAnalysisSection } from '@/components/SurveyAnalysisSection';
import { CaseRegistrySection } from '@/components/CaseRegistrySection';
import { Phase3MonitoringSection } from '@/components/Phase3MonitoringSection';
import { NoorImport } from '@/components/NoorImport';
import { NoorStatsCard } from '@/components/NoorStatsCard';
import { PrePostPanel } from '@/components/PrePostPanel';
import { ReadinessByDomain } from '@/components/ReadinessByDomain';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProgramsPage } from '@/pages/ProgramsPage';
import { PerformancePage } from '@/pages/PerformancePage';
import { CouncilPage } from '@/pages/CouncilPage';
import { StudentVoicePage } from '@/pages/StudentVoicePage';
import { SatisfactionPage } from '@/pages/SatisfactionPage';
import { ValuesPage } from '@/pages/ValuesPage';
import { CoverageMapSection } from '@/components/CoverageMapSection';
import { ZadLibrarySection } from '@/components/ZadLibrarySection';
import { DataExportSection } from '@/components/DataExportSection';
import { downloadFinalReport } from '@/lib/finalReport';
import { FOUNDER_NAME } from '@/lib/brand';

type PublicRoute =
  | { kind: 'survey'; slug: string }
  | { kind: 'spec-survey'; id: string }
  | { kind: 'zad'; slug: string }
  | { kind: 'evidence'; token: string }
  | { kind: 'clinic' }
  | { kind: 'migrate' }
  | null;

/** روابط الاستبيانات والموارد والشواهد والعيادة تفتح صفحة مستقلة بدون تسجيل دخول */
function readPublicRoute(): PublicRoute {
  const params = new URLSearchParams(window.location.search);
  const r = params.get('r');
  if (r) return { kind: 'survey', slug: r };
  const survey = params.get('survey');
  if (survey) return { kind: 'spec-survey', id: survey };
  const s = params.get('s');
  if (s) return { kind: 'zad', slug: s };
  const e = params.get('e');
  if (e) return { kind: 'evidence', token: e };
  if (params.has('clinic') || window.location.hash === '#clinic') return { kind: 'clinic' };
  if (params.has('migrate')) return { kind: 'migrate' };
  return null;
}

function clearPublicRoute() {
  const url = new URL(window.location.href);
  ['r', 's', 'survey', 'clinic', 'e', 'migrate'].forEach(key => url.searchParams.delete(key));
  if (url.hash === '#clinic') url.hash = '';
  window.history.replaceState({}, '', url);
}

function ZadResourceRedirect({ slug, onFallback, onClose }: { slug: string; onFallback: () => void; onClose: () => void }) {
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchZadResources()
      .then(list => {
        if (cancelled) return;
        const resource = list.find(item => item.slug === slug);
        const target = resource?.drive_url || resource?.qr_url;
        if (target) window.location.replace(target);
        else onFallback();
      })
      .catch(() => { if (!cancelled) setNotFound(true); });
    return () => { cancelled = true; };
  }, [slug, onFallback]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
      <div className="max-w-md text-center">
        {notFound ? (
          <>
            <p className="text-slate-700">تعذر فتح المورد، تحقق من الاتصال ثم أعد المحاولة</p>
            <button onClick={onClose} className="mt-4 text-sm text-cyan-700 hover:underline">الذهاب إلى الصفحة الرئيسية</button>
          </>
        ) : (
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
        )}
      </div>
    </div>
  );
}

function Page({ page, go }: { page: PageId; go: (p: PageId) => void }) {
  switch (page) {
    case 'home': return <DashboardPage onNavigate={go} />;
    case 'profile': return <ProfilePage />;
    case 'programs': return <ProgramsPage />;
    case 'surveys': return <SurveyAdminSection />;
    case 'analysis': return <><SurveyAnalysisSection /><PrePostPanel /></>;
    case 'evidence': return <EvidencePage />;
    case 'monitoring': return <MonitoringPage />;
    case 'cases': return <CaseRegistrySection />;
    case 'clinic': return <ClinicPage />;
    case 'students': return <StudentVoicePage onImport={() => go('monitoring')} />;
    case 'councils': return <CouncilPage table="guidance_parent_council" />;
    case 'satisfaction': return <SatisfactionPage onManage={() => go('surveys')} />;
    case 'indicators': return <><ReadinessByDomain /><CoverageMapSection /></>;
    case 'performance': return <PerformancePage />;
    case 'values': return <ValuesPage />;
    case 'zad': return <ZadLibrarySection />;
    case 'export': return <ExportPage />;
  }
}

function MonitoringPage() {
  const [key, setKey] = useState(0);
  return (
    <>
      <div className="px-4 sm:px-6 lg:px-10 mt-6"><NoorImport onSaved={() => setKey(k => k + 1)} /></div>
      <Phase3MonitoringSection key={key} />
      <div className="px-4 sm:px-6 lg:px-10 mt-2"><NoorStatsCard /></div>
    </>
  );
}

function ExportPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <div className="px-4 sm:px-6 lg:px-10 mt-6">
        <Panel title="التقرير الختامي">
          <p className="text-sm text-slate-600 mb-4">تقرير PDF شامل من بياناتك الفعلية: تغطية المؤشرات، الاستبيانات، الشواهد، الحالات والمتابعة، ومجلس الآباء.</p>
          <button
            onClick={async () => { setBusy(true); setError(''); try { await downloadFinalReport(); } catch { setError('تعذر إنشاء التقرير'); } finally { setBusy(false); } }}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-leaf-500 text-white px-5 py-3 text-sm font-extrabold shadow-md disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} تنزيل التقرير الختامي
          </button>
          {error && <p className="text-sm text-rose-700 mt-2">{error}</p>}
        </Panel>
      </div>
      <DataExportSection />
    </>
  );
}

function Dashboard() {
  const [page, go] = useHashPage();
  return (
    <AppShell page={page} onNavigate={go}>
      <Page page={page} go={go} />
    </AppShell>
  );
}

function App() {
  const [route, setRoute] = useState<PublicRoute>(() => readPublicRoute());
  const closeRoute = useCallback(() => { clearPublicRoute(); setRoute(null); }, []);
  const zadFallback = useCallback(() => {
    setRoute(current => (current?.kind === 'zad' ? { kind: 'survey', slug: current.slug } : current));
  }, []);

  if (route?.kind === 'survey') return <PublicSurveyPage slug={route.slug} onClose={closeRoute} />;
  if (route?.kind === 'spec-survey') return <StandaloneSpecSurvey surveyId={route.id} onClose={closeRoute} />;
  if (route?.kind === 'zad') return <ZadResourceRedirect slug={route.slug} onFallback={zadFallback} onClose={closeRoute} />;
  if (route?.kind === 'evidence') return <PublicEvidencePage token={route.token} />;
  if (route?.kind === 'migrate') return <AuthGate><MigrateDataPage onClose={() => { window.location.href = '/'; }} /></AuthGate>;
  if (route?.kind === 'clinic') {
    return (
      <div className="min-h-screen bg-[#f3f8fb]" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 pt-6 flex justify-center"><Logo variant="full" size={56} withFounder /></div>
        <DigitalClinic publicMode />
        <p className="text-center text-xs text-slate-500 pb-6">بوصلة — منصة الموجّه الطلابي · {FOUNDER_NAME}</p>
      </div>
    );
  }

  return <AuthGate><Dashboard /></AuthGate>;
}

export default App;
