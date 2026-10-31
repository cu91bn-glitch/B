import { createClient } from '@supabase/supabase-js';
import { indicatorsForPrograms } from './autoIndicators';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface EvidenceRecord {
  id: string;
  title: string;
  category: string;
  module: string;
  file_path: string;
  file_name: string;
  file_type: 'image' | 'pdf';
  file_size: number;
  created_at: string;
  activity_id: string | null;
  activity_title: string | null;
  indicator_codes: string[];
  evidence_date_hijri: string | null;
  evidence_date_gregorian: string | null;
  public_token: string;
}

export async function fetchEvidence(module?: string): Promise<EvidenceRecord[]> {
  let query = supabase
    .from('guidance_evidence')
    .select('*')
    .order('created_at', { ascending: false });
  if (module) query = query.eq('module', module);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as EvidenceRecord[];
}

export async function fetchEvidenceCount(module?: string): Promise<number> {
  let query = supabase
    .from('guidance_evidence')
    .select('id', { count: 'exact', head: true });
  if (module) query = query.eq('module', module);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export interface CreateEvidenceInput {
  file: File;
  title: string;
  category: string;
  module: string;
  activityId?: string;
  activityTitle?: string;
  indicatorCodes?: string[];
  dateHijri?: string;
  dateGregorian?: string;
}

export async function uploadEvidence(
  file: File,
  title: string,
  category: string,
  module: string,
): Promise<EvidenceRecord> {
  return createEvidence({ file, title, category, module });
}

export async function createEvidence(input: CreateEvidenceInput): Promise<EvidenceRecord> {
  const { file, title, category, module } = input;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';
  if (!isImage && !isPdf) throw new Error('نوع الملف غير مدعوم. يرجى رفع صورة أو ملف PDF');

  if (file.size > 10 * 1024 * 1024) throw new Error('حجم الملف يتجاوز 10 ميجابايت');

  const fileName = `${module}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('guidance-evidence')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw new Error('فشل رفع الملف');

  const { data, error } = await supabase
    .from('guidance_evidence')
    .insert({
      title,
      category,
      module,
      file_path: fileName,
      file_name: file.name,
      file_type: isImage ? 'image' : 'pdf',
      file_size: file.size,
      activity_id: input.activityId ?? null,
      activity_title: input.activityTitle ?? null,
      indicator_codes: input.indicatorCodes ?? [],
      evidence_date_hijri: input.dateHijri ?? null,
      evidence_date_gregorian: input.dateGregorian ?? null,
    })
    .select()
    .single();
  if (error) {
    await supabase.storage.from('guidance-evidence').remove([fileName]);
    throw new Error('فشل حفظ بيانات الشاهد');
  }
  return data as EvidenceRecord;
}

export async function deleteEvidence(id: string, filePath: string): Promise<void> {
  const { error: dbError } = await supabase
    .from('guidance_evidence')
    .delete()
    .eq('id', id);
  if (dbError) throw new Error('فشل حذف السجل: ' + dbError.message);

  const { error: storageError } = await supabase.storage
    .from('guidance-evidence')
    .remove([filePath]);
  if (storageError) console.error('Storage cleanup failed:', storageError.message);
}

export async function getEvidenceUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('guidance-evidence')
    .createSignedUrl(filePath, 3600);
  if (error) throw new Error('فشل إنشاء رابط الملف');
  return data.signedUrl;
}

export interface ReadinessStat {
  code: string;
  count: number;
}

export async function fetchReadinessStats(): Promise<ReadinessStat[]> {
  const { data, error } = await supabase
    .from('guidance_evidence')
    .select('indicator_codes');
  if (error) return [];
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const codes: string[] = row.indicator_codes || [];
    for (const code of codes) {
      if (code) counts[code] = (counts[code] || 0) + 1;
    }
  }
  return Object.entries(counts).map(([code, count]) => ({ code, count }));
}

export function buildPublicEvidenceUrl(publicToken: string): string {
  return `${window.location.origin}/?e=${publicToken}`;
}

export interface PublicEvidence {
  title: string;
  category: string;
  file_type: 'image' | 'pdf';
  indicator_codes: string[];
  evidence_date_hijri: string | null;
  created_at: string;
  url: string;
}

/** عرض شاهد عبر باركود التحقق (بدون تسجيل دخول) */
export async function fetchPublicEvidence(token: string): Promise<PublicEvidence | null> {
  const { data, error } = await supabase.functions.invoke('public-evidence', { body: { token } });
  if (error) return null;
  return (data as PublicEvidence) || null;
}

// ============ Consultations ============

export interface ConsultationRecord {
  id: string;
  requester_name: string | null;
  consultation_type: string;
  privacy_level: string;
  message: string;
  created_at: string;
  tracking_code: string | null;
  contact: string | null;
  reply: string | null;
  replied_at: string | null;
  status: string;
}

/** رمز متابعة قصير يسهل كتابته (بدون أحرف متشابهة) */
export function makeTrackingCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export async function replyConsultation(id: string, reply: string): Promise<void> {
  const { error } = await supabase.from('guidance_consultations').update({ reply, replied_at: new Date().toISOString(), status: 'replied' }).eq('id', id);
  if (error) throw new Error('تعذر حفظ الرد');
}

export type ClinicLookup =
  | { kind: 'consultation'; type: string; status: string; reply: string | null; replied_at: string | null; created_at: string }
  | { kind: 'appointment'; date: string; hijri: string | null; slot: string; status: string; note: string | null };

export async function clinicLookup(code: string): Promise<ClinicLookup | null> {
  const { data, error } = await supabase.rpc('clinic_lookup', { p_code: code.trim().toUpperCase() });
  if (error) return null;
  return (data as ClinicLookup) || null;
}

export interface AppointmentRecord {
  id: string; tracking_code: string; student_name: string | null; student_grade: string | null; appointment_date: string;
  appointment_hijri: string | null; slot: string; reason: string | null; status: string; staff_note: string | null; created_at: string;
}

export async function bookAppointment(a: { student_name?: string; student_grade?: string; appointment_date: string; appointment_hijri: string; slot: string; reason?: string }): Promise<string> {
  const code = makeTrackingCode();
  const { error } = await supabase.from('guidance_appointments').insert({ ...a, tracking_code: code, status: 'pending' });
  if (error) throw new Error('تعذر حجز الموعد');
  return code;
}

export async function fetchAppointments(): Promise<AppointmentRecord[]> {
  const { data, error } = await supabase.from('guidance_appointments').select('*').order('appointment_date', { ascending: true });
  if (error) throw new Error('تعذر تحميل المواعيد');
  return (data || []) as AppointmentRecord[];
}

export async function updateAppointment(id: string, patch: Partial<Pick<AppointmentRecord, 'status' | 'staff_note'>>): Promise<void> {
  const { error } = await supabase.from('guidance_appointments').update(patch).eq('id', id);
  if (error) throw new Error('تعذر تحديث الموعد');
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('guidance_appointments').delete().eq('id', id);
  if (error) throw new Error('تعذر حذف الموعد');
}

export async function submitConsultation(data: {
  requester_name?: string;
  consultation_type: string;
  privacy_level: string;
  message: string;
  contact?: string;
}): Promise<string> {
  const code = makeTrackingCode();
  const { error } = await supabase.from('guidance_consultations').insert({
    requester_name: data.requester_name || null,
    consultation_type: data.consultation_type,
    privacy_level: data.privacy_level,
    message: data.message,
    contact: data.contact || null,
    tracking_code: code,
  });
  if (error) throw new Error('فشل إرسال الاستشارة');
  return code;
}

export async function fetchConsultations(): Promise<ConsultationRecord[]> {
  const { data, error } = await supabase.from('guidance_consultations').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error('تعذر تحميل الاستشارات');
  return (data || []) as ConsultationRecord[];
}

export async function deleteConsultation(id: string): Promise<void> {
  const { error } = await supabase.from('guidance_consultations').delete().eq('id', id);
  if (error) throw new Error('تعذر حذف الاستشارة');
}

export async function fetchConsultationStats(): Promise<{
  byType: Record<string, number>;
  byPrivacy: Record<string, number>;
  total: number;
}> {
  const { data, error } = await supabase
    .from('guidance_consultations')
    .select('consultation_type, privacy_level');
  if (error) return { byType: {}, byPrivacy: {}, total: 0 };
  const byType: Record<string, number> = {};
  const byPrivacy: Record<string, number> = {};
  for (const row of data || []) {
    byType[row.consultation_type] = (byType[row.consultation_type] || 0) + 1;
    byPrivacy[row.privacy_level] = (byPrivacy[row.privacy_level] || 0) + 1;
  }
  return { byType, byPrivacy, total: (data || []).length };
}

// ============ Career Survey Results ============

export interface CareerResultRecord {
  id: string;
  answers: number[];
  result_track: string;
  scores: { scientific: number; literary: number; technical: number };
  created_at: string;
}

export async function saveCareerResult(data: {
  answers: number[];
  result_track: string;
  scores: { scientific: number; literary: number; technical: number };
}): Promise<void> {
  const { error } = await supabase.from('guidance_career_results').insert({
    answers: data.answers,
    result_track: data.result_track,
    scores: data.scores,
  });
  if (error) throw new Error('فشل حفظ نتيجة المقياس');
}

export async function fetchCareerStats(): Promise<{
  byTrack: Record<string, number>;
  total: number;
}> {
  const { data, error } = await supabase
    .from('guidance_career_results')
    .select('result_track');
  if (error) return { byTrack: {}, total: 0 };
  const byTrack: Record<string, number> = {};
  for (const row of data || []) {
    byTrack[row.result_track] = (byTrack[row.result_track] || 0) + 1;
  }
  return { byTrack, total: (data || []).length };
}

// ============ Parent Council ============

export interface ParentCouncilRecord {
  id: string;
  meeting_date_hijri: string;
  meeting_date_gregorian: string | null;
  topic: string;
  attendees_count: number;
  recommendations: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  status_label: string;
  indicator_codes: string[];
  created_at: string;
}

export async function fetchParentCouncil(): Promise<ParentCouncilRecord[]> {
  const { data, error } = await supabase
    .from('guidance_parent_council')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error('فشل تحميل اجتماعات مجلس الآباء');
  return (data || []) as ParentCouncilRecord[];
}

export async function createParentCouncilMeeting(input: {
  meeting_date_hijri: string;
  meeting_date_gregorian?: string;
  topic: string;
  attendees_count: number;
  recommendations?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  status_label: string;
  indicator_codes?: string[];
}): Promise<ParentCouncilRecord> {
  const { data, error } = await supabase
    .from('guidance_parent_council')
    .insert({
      meeting_date_hijri: input.meeting_date_hijri,
      meeting_date_gregorian: input.meeting_date_gregorian || null,
      topic: input.topic,
      attendees_count: input.attendees_count,
      recommendations: input.recommendations || null,
      status: input.status,
      status_label: input.status_label,
      indicator_codes: input.indicator_codes || [],
    })
    .select()
    .single();
  if (error) throw new Error('فشل إضافة اجتماع مجلس الآباء');
  return data as ParentCouncilRecord;
}

export async function updateParentCouncilMeeting(id: string, input: Partial<{
  status: string;
  status_label: string;
  attendees_count: number;
  recommendations: string;
}>): Promise<void> {
  const { error } = await supabase
    .from('guidance_parent_council')
    .update(input)
    .eq('id', id);
  if (error) throw new Error('فشل تحديث الاجتماع');
}

export async function deleteParentCouncilMeeting(id: string): Promise<void> {
  const { error } = await supabase
    .from('guidance_parent_council')
    .delete()
    .eq('id', id);
  if (error) throw new Error('فشل حذف الاجتماع');
}

// ============ Satisfaction Surveys ============

export interface SatisfactionSurveyArea {
  area: string;
  score: number;
}

export interface SatisfactionSurveyRecord {
  id: string;
  survey_type: 'program' | 'service' | 'parent' | 'student';
  survey_type_label: string;
  target_group: string;
  total_responses: number;
  satisfaction_score: number;
  areas: SatisfactionSurveyArea[];
  indicator_codes: string[];
  conducted_date_hijri: string | null;
  conducted_date_gregorian: string | null;
  created_at: string;
}

export async function fetchSatisfactionSurveys(): Promise<SatisfactionSurveyRecord[]> {
  const { data, error } = await supabase
    .from('guidance_satisfaction_surveys')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error('فشل تحميل استبيانات الرضا');
  return (data || []) as SatisfactionSurveyRecord[];
}

export async function createSatisfactionSurvey(input: {
  survey_type: 'program' | 'service' | 'parent' | 'student';
  survey_type_label: string;
  target_group: string;
  total_responses: number;
  satisfaction_score: number;
  areas: SatisfactionSurveyArea[];
  indicator_codes?: string[];
  conducted_date_hijri?: string;
  conducted_date_gregorian?: string;
}): Promise<SatisfactionSurveyRecord> {
  const { data, error } = await supabase
    .from('guidance_satisfaction_surveys')
    .insert({
      survey_type: input.survey_type,
      survey_type_label: input.survey_type_label,
      target_group: input.target_group,
      total_responses: input.total_responses,
      satisfaction_score: input.satisfaction_score,
      areas: input.areas,
      indicator_codes: input.indicator_codes || [],
      conducted_date_hijri: input.conducted_date_hijri || null,
      conducted_date_gregorian: input.conducted_date_gregorian || null,
    })
    .select()
    .single();
  if (error) throw new Error('فشل إضافة الاستبيان');
  return data as SatisfactionSurveyRecord;
}

export async function deleteSatisfactionSurvey(id: string): Promise<void> {
  const { error } = await supabase
    .from('guidance_satisfaction_surveys')
    .delete()
    .eq('id', id);
  if (error) throw new Error('فشل حذف الاستبيان');
}

// ============ Case Registry ============

export interface CaseRegistryRecord {
  id: string;
  case_number: string;
  student_grade: string;
  case_type: 'psychological' | 'social' | 'academic' | 'behavioral';
  case_type_label: string;
  classification: 'mild' | 'moderate' | 'severe';
  classification_label: string;
  intervention_plan: string | null;
  sessions_count: number;
  status: 'open' | 'in_progress' | 'improved' | 'referred' | 'closed';
  status_label: string;
  open_date_hijri: string | null;
  open_date_gregorian: string | null;
  close_date_hijri: string | null;
  close_date_gregorian: string | null;
  indicator_codes: string[];
  created_at: string;
}

export async function fetchCaseRegistry(): Promise<CaseRegistryRecord[]> {
  const { data, error } = await supabase
    .from('guidance_case_registry')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error('فشل تحميل سجل الحالات');
  return (data || []) as CaseRegistryRecord[];
}

export async function createCase(input: {
  case_number: string;
  student_grade: string;
  case_type: 'psychological' | 'social' | 'academic' | 'behavioral';
  case_type_label: string;
  classification: 'mild' | 'moderate' | 'severe';
  classification_label: string;
  intervention_plan?: string;
  sessions_count?: number;
  status: 'open' | 'in_progress' | 'improved' | 'referred' | 'closed';
  status_label: string;
  open_date_hijri?: string;
  open_date_gregorian?: string;
  indicator_codes?: string[];
}): Promise<CaseRegistryRecord> {
  const { data, error } = await supabase
    .from('guidance_case_registry')
    .insert({
      case_number: input.case_number,
      student_grade: input.student_grade,
      case_type: input.case_type,
      case_type_label: input.case_type_label,
      classification: input.classification,
      classification_label: input.classification_label,
      intervention_plan: input.intervention_plan || null,
      sessions_count: input.sessions_count || 0,
      status: input.status,
      status_label: input.status_label,
      open_date_hijri: input.open_date_hijri || null,
      open_date_gregorian: input.open_date_gregorian || null,
      indicator_codes: input.indicator_codes || [],
    })
    .select()
    .single();
  if (error) throw new Error('فشل إضافة الحالة');
  return data as CaseRegistryRecord;
}

export async function updateCase(id: string, input: Partial<{
  status: string;
  status_label: string;
  sessions_count: number;
  intervention_plan: string;
  classification: string;
  classification_label: string;
  close_date_hijri: string;
  close_date_gregorian: string;
}>): Promise<void> {
  const { error } = await supabase
    .from('guidance_case_registry')
    .update(input)
    .eq('id', id);
  if (error) throw new Error('فشل تحديث الحالة');
}

export async function deleteCase(id: string): Promise<void> {
  const { error } = await supabase
    .from('guidance_case_registry')
    .delete()
    .eq('id', id);
  if (error) throw new Error('فشل حذف الحالة');
}

// ============ Phase 3 Monitoring ============

export interface AttendanceRecord {
  id: string; student_code: string; student_grade: string;
  attendance_date_hijri: string; attendance_date_gregorian: string | null;
  status: 'present' | 'late' | 'absent' | 'excused'; status_label: string;
  minutes_late: number; notes: string | null; indicator_codes: string[]; created_at: string;
}

export interface DisciplineRecord {
  id: string; student_code: string; student_grade: string;
  incident_date_hijri: string; incident_date_gregorian: string | null;
  incident_type: string; incident_type_label: string; severity: string; severity_label: string;
  action_taken: string | null; status: string; status_label: string; notes: string | null;
  indicator_codes: string[]; created_at: string;
}

export interface TalentRecord {
  id: string; student_code: string; student_grade: string;
  talent_type: string; talent_type_label: string; title: string; evidence: string | null;
  development_plan: string | null; status: string; status_label: string;
  indicator_codes: string[]; created_at: string;
}

export interface EarlyAlertRecord {
  id: string; student_code: string; student_grade: string;
  alert_type: string; alert_type_label: string; severity: string; severity_label: string;
  score: number; trigger_summary: string; recommended_action: string | null;
  status: string; status_label: string; created_at: string;
}

export async function fetchAttendance(): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase.from('guidance_attendance').select('*').order('created_at', { ascending: false });
  if (error) throw new Error('فشل تحميل سجل الحضور');
  return (data || []) as AttendanceRecord[];
}

export async function createAttendance(input: Omit<AttendanceRecord, 'id' | 'created_at'>): Promise<AttendanceRecord> {
  const { data, error } = await supabase.from('guidance_attendance').insert(input).select().maybeSingle();
  if (error || !data) throw new Error('فشل حفظ سجل الحضور');
  return data as AttendanceRecord;
}

export async function fetchDiscipline(): Promise<DisciplineRecord[]> {
  const { data, error } = await supabase.from('guidance_discipline').select('*').order('created_at', { ascending: false });
  if (error) throw new Error('فشل تحميل سجل الانضباط');
  return (data || []) as DisciplineRecord[];
}

export async function createDiscipline(input: Omit<DisciplineRecord, 'id' | 'created_at'>): Promise<DisciplineRecord> {
  const { data, error } = await supabase.from('guidance_discipline').insert(input).select().maybeSingle();
  if (error || !data) throw new Error('فشل حفظ سجل الانضباط');
  return data as DisciplineRecord;
}

export async function updateDiscipline(id: string, input: Partial<Pick<DisciplineRecord, 'status' | 'status_label' | 'action_taken' | 'notes'>>): Promise<void> {
  const { error } = await supabase.from('guidance_discipline').update(input).eq('id', id);
  if (error) throw new Error('فشل تحديث سجل الانضباط');
}

export async function deleteEarlyAlert(id: string): Promise<void> {
  const { error } = await supabase.from('guidance_early_alerts').delete().eq('id', id);
  if (error) throw new Error('تعذر حذف الإنذار');
}

export async function deleteAllEarlyAlerts(): Promise<void> {
  const { error } = await supabase.from('guidance_early_alerts').delete().not('id', 'is', null);
  if (error) throw new Error('تعذر حذف الإنذارات');
}

export async function deleteAttendance(id: string): Promise<void> {
  const { error } = await supabase.from('guidance_attendance').delete().eq('id', id);
  if (error) throw new Error('تعذر حذف السجل');
}

export async function deleteDiscipline(id: string): Promise<void> {
  const { error } = await supabase.from('guidance_discipline').delete().eq('id', id);
  if (error) throw new Error('فشل حذف سجل الانضباط');
}

export async function fetchTalents(): Promise<TalentRecord[]> {
  const { data, error } = await supabase.from('guidance_talents').select('*').order('created_at', { ascending: false });
  if (error) throw new Error('فشل تحميل سجل المواهب');
  return (data || []) as TalentRecord[];
}

export async function createTalent(input: Omit<TalentRecord, 'id' | 'created_at'>): Promise<TalentRecord> {
  const { data, error } = await supabase.from('guidance_talents').insert(input).select().maybeSingle();
  if (error || !data) throw new Error('فشل حفظ الموهبة');
  return data as TalentRecord;
}

export async function updateTalent(id: string, input: Partial<Pick<TalentRecord, 'status' | 'status_label' | 'development_plan'>>): Promise<void> {
  const { error } = await supabase.from('guidance_talents').update(input).eq('id', id);
  if (error) throw new Error('فشل تحديث الموهبة');
}

export async function deleteTalent(id: string): Promise<void> {
  const { error } = await supabase.from('guidance_talents').delete().eq('id', id);
  if (error) throw new Error('فشل حذف الموهبة');
}

export async function fetchEarlyAlerts(): Promise<EarlyAlertRecord[]> {
  const { data, error } = await supabase.from('guidance_early_alerts').select('*').order('created_at', { ascending: false });
  if (error) throw new Error('فشل تحميل تنبيهات الإنذار المبكر');
  return (data || []) as EarlyAlertRecord[];
}

export async function createEarlyAlert(input: Omit<EarlyAlertRecord, 'id' | 'created_at'>): Promise<EarlyAlertRecord> {
  const { data, error } = await supabase.from('guidance_early_alerts').insert(input).select().maybeSingle();
  if (error || !data) throw new Error('فشل إنشاء التنبيه');
  return data as EarlyAlertRecord;
}

export async function updateEarlyAlert(id: string, input: Partial<Pick<EarlyAlertRecord, 'status' | 'status_label' | 'recommended_action'>>): Promise<void> {
  const { error } = await supabase.from('guidance_early_alerts').update(input).eq('id', id);
  if (error) throw new Error('فشل تحديث التنبيه');
}

export interface AnonymousSurveyResponseInput {
  survey_id: string;
  wave: 'pre' | 'post' | 'single';
  grade: string;
  response_fingerprint: string;
  answers: Record<string, number>;
  section_scores: Record<string, number>;
  extra_answers?: Record<string, string | string[]>;
}

export async function submitAnonymousSurveyResponse(input: AnonymousSurveyResponseInput): Promise<void> {
  const { error } = await supabase.from('guidance_survey_responses').insert({
    survey_id: input.survey_id,
    wave: input.wave,
    grade: input.grade,
    response_fingerprint: input.response_fingerprint,
    answers: input.answers,
    section_scores: input.section_scores,
    extra_answers: input.extra_answers || {},
  });
  if (error) {
    if (error.code === '23505') throw new Error('تم تسجيل إجابتك لهذا الاستبيان من هذا المتصفح مسبقًا');
    throw new Error('تعذر حفظ الإجابة المجهولة');
  }
}

// ============ Zad Reference Data ============

export interface ZadResource {
  id: string;
  slug: string;
  title: string;
  category: string;
  page: number | null;
  drive_url: string | null;
  qr_url: string | null;
  qr_note: string | null;
}

export interface ZadIndicator {
  code: string;
  text: string;
  domain: string;
  standard: string;
}

export interface ZadProgram {
  id: string;
  name: string;
}

export interface ZadOccasion {
  id: number;
  name: string;
  hijri: string | null;
  gregorian: string | null;
  goal: string | null;
  programs: string[];
}

export interface ZadRegister {
  id: string;
  name: string;
  fields: string[];
  source: string | null;
  types: string[];
}

export interface ZadPyramidTier {
  tier_order: number;
  tier_id: string;
  name: string;
  description: string;
}

export async function fetchZadResources(): Promise<ZadResource[]> {
  const { data, error } = await supabase.from('zad_resources').select('*').order('category').order('title');
  if (error) throw new Error('فشل تحميل الموارد');
  return (data || []) as ZadResource[];
}

export async function fetchZadIndicators(): Promise<ZadIndicator[]> {
  const { data, error } = await supabase.from('zad_indicators').select('*').order('code');
  if (error) throw new Error('فشل تحميل المؤشرات');
  return (data || []) as ZadIndicator[];
}

export async function fetchZadPrograms(): Promise<ZadProgram[]> {
  const { data, error } = await supabase.from('zad_programs').select('*').order('name');
  if (error) throw new Error('فشل تحميل البرامج');
  return (data || []) as ZadProgram[];
}

export async function fetchZadProgramIndicators(): Promise<{ program_id: string; indicator_code: string }[]> {
  const { data, error } = await supabase.from('zad_program_indicator').select('program_id, indicator_code');
  if (error) throw new Error('فشل تحميل مصفوفة الربط');
  return (data || []) as { program_id: string; indicator_code: string }[];
}

export async function fetchZadOccasions(): Promise<ZadOccasion[]> {
  const { data, error } = await supabase.from('zad_occasions').select('*').order('id');
  if (error) throw new Error('فشل تحميل المناسبات');
  return (data || []) as ZadOccasion[];
}

export async function fetchZadRegisters(): Promise<ZadRegister[]> {
  const { data, error } = await supabase.from('zad_registers').select('*').order('name');
  if (error) throw new Error('فشل تحميل السجلات');
  return (data || []) as ZadRegister[];
}

export async function fetchZadPyramid(): Promise<ZadPyramidTier[]> {
  const { data, error } = await supabase.from('zad_pyramid').select('*').order('tier_order');
  if (error) throw new Error('فشل تحميل هرم التميز');
  return (data || []) as ZadPyramidTier[];
}

// ============ Survey Engine ============

export interface SurveySectionItem {
  text: string;
  reverse?: boolean;
}
export interface SurveySection {
  id: string;
  name: string;
  swot_axis?: string;
  items: SurveySectionItem[];
  if_low?: string[];
}
export interface SurveyExtra {
  id: string;
  text: string;
  type: string;
  options?: string[];
  dims?: string[];
}
export interface SurveyDemographic {
  id: string;
  text: string;
  type: string;
  options?: string[];
}
export interface SurveySettings {
  anonymous?: boolean;
  one_response_per_device?: boolean;
  open_date?: string;
  close_date?: string;
}
export interface SurveyDefinition {
  id: string;
  slug: string | null;
  title: string;
  audience: string;
  status: string;
  scale: { type: string; labels: string[] };
  intro: string;
  demographics: SurveyDemographic[];
  sections: SurveySection[];
  extra: SurveyExtra[];
  settings: SurveySettings;
  indicators: string[];
  programs: string[];
  resources: string[];
  publish_gate: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponseInput {
  survey_id: string;
  demographics: Record<string, string>;
  answers: Record<string, number>;
  text_answers: Record<string, string>;
  response_fingerprint?: string;
}

export async function fetchSurveys(): Promise<SurveyDefinition[]> {
  const { data, error } = await supabase.from('guidance_surveys').select('*').order('updated_at', { ascending: false });
  if (error) throw new Error('فشل تحميل الاستبيانات');
  return (data || []) as SurveyDefinition[];
}

export async function fetchSurveyBySlug(slug: string): Promise<SurveyDefinition | null> {
  const { data, error } = await supabase.from('guidance_surveys').select('*').eq('slug', slug).maybeSingle();
  if (error) throw new Error('فشل تحميل الاستبيان');
  return data as SurveyDefinition | null;
}

function generateSlug(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `survey-${Date.now()}`;
}

export async function createSurvey(input: Partial<SurveyDefinition>): Promise<SurveyDefinition> {
  const slug = input.slug || generateSlug(input.title || 'استبيان');
  const { data, error } = await supabase.from('guidance_surveys').insert({
    slug,
    title: input.title || 'استبيان جديد',
    audience: input.audience || 'student',
    status: input.status || 'draft',
    scale: input.scale || { type: 'likert5', labels: ['لا أوافق بشدة', 'لا أوافق', 'محايد', 'أوافق', 'أوافق بشدة'] },
    intro: input.intro || '',
    demographics: input.demographics || [],
    sections: input.sections || [],
    extra: input.extra || [],
    settings: input.settings || { anonymous: true, one_response_per_device: true },
    indicators: input.programs?.length ? indicatorsForPrograms(input.programs) : (input.indicators || []),
    programs: input.programs || [],
    resources: input.resources || [],
    publish_gate: input.publish_gate || null,
  }).select().single();
  if (error) throw new Error('فشل إنشاء الاستبيان');
  return data as SurveyDefinition;
}

export async function updateSurvey(id: string, input: Partial<SurveyDefinition>): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) update.title = input.title;
  if (input.audience !== undefined) update.audience = input.audience;
  if (input.status !== undefined) update.status = input.status;
  if (input.slug !== undefined) update.slug = input.slug;
  if (input.scale !== undefined) update.scale = input.scale;
  if (input.intro !== undefined) update.intro = input.intro;
  if (input.demographics !== undefined) update.demographics = input.demographics;
  if (input.sections !== undefined) update.sections = input.sections;
  if (input.extra !== undefined) update.extra = input.extra;
  if (input.settings !== undefined) update.settings = input.settings;
  if (input.indicators !== undefined) update.indicators = input.indicators;
  if (input.programs !== undefined) {
    update.programs = input.programs;
    // مؤشرات الاعتماد تُحدد تلقائيًا من البرامج المرتبطة
    if (input.programs.length) update.indicators = indicatorsForPrograms(input.programs);
  }
  if (input.resources !== undefined) update.resources = input.resources;
  if (input.publish_gate !== undefined) update.publish_gate = input.publish_gate;
  const { error } = await supabase.from('guidance_surveys').update(update).eq('id', id);
  if (error) throw new Error('فشل تحديث الاستبيان');
}

export async function deleteSurveyResponses(surveyId: string): Promise<void> {
  const { error } = await supabase.from('guidance_survey_public_responses').delete().eq('survey_id', surveyId);
  if (error) throw new Error('تعذر حذف الإجابات');
}

export async function deleteSurvey(id: string): Promise<void> {
  const { error } = await supabase.from('guidance_surveys').delete().eq('id', id);
  if (error) throw new Error('فشل حذف الاستبيان');
}

export async function duplicateSurvey(id: string): Promise<SurveyDefinition> {
  const { data, error } = await supabase.from('guidance_surveys').select('*').eq('id', id).single();
  if (error) throw new Error('فشل جلب الاستبيان');
  const original = data as SurveyDefinition;
  // عنوان النسخة: «العنوان (نسخة 2)» بدل تكرار كلمة (نسخة) في كل مرة
  const base = original.title.replace(/(\s*\(نسخة(\s*\d+)?\))+\s*$/, '').trim();
  const { data: siblings } = await supabase.from('guidance_surveys').select('title').like('title', `${base}%`);
  let n = 2;
  const taken = new Set(((siblings || []) as { title: string }[]).map(r => r.title));
  while (taken.has(`${base} (نسخة ${n})`)) n++;
  return createSurvey({
    ...original,
    title: `${base} (نسخة ${n})`,
    slug: generateSlug(`${base}-${n}`),
    status: 'draft',
  });
}

export async function submitSurveyResponse(input: SurveyResponseInput): Promise<void> {
  const { error } = await supabase.from('guidance_survey_public_responses').insert({
    survey_id: input.survey_id,
    demographics: input.demographics,
    answers: input.answers,
    text_answers: input.text_answers,
    response_fingerprint: input.response_fingerprint || null,
  });
  if (error) {
    if (error.code === '23505') throw new Error('تم تسجيل إجابتك لهذا الاستبيان من هذا المتصفح مسبقًا');
    throw new Error('تعذر حفظ الإجابة');
  }
}

export interface SurveyResponseRecord {
  id: string;
  survey_id: string;
  demographics: Record<string, string>;
  answers: Record<string, number>;
  text_answers: Record<string, string>;
  submitted_at: string;
}

export async function fetchSurveyResponses(surveyId: string): Promise<SurveyResponseRecord[]> {
  const { data, error } = await supabase.from('guidance_survey_public_responses').select('*').eq('survey_id', surveyId).order('submitted_at', { ascending: false });
  if (error) throw new Error('فشل تحميل الاستجابات');
  return (data || []) as SurveyResponseRecord[];
}
