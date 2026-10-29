-- Phase 8: Security, privacy, and performance fixes

-- 1. PRIVACY: Restrict SELECT on survey public responses
--    Previously USING (true) let anyone read all responses including demographics.
--    Now only allow SELECT via service_role (for counselor analysis).
--    The anon/authenticated roles can still INSERT (submit responses) but cannot read others' data.
DROP POLICY IF EXISTS "survey_responses_select_public" ON guidance_survey_public_responses;
CREATE POLICY "survey_responses_select_public"
  ON guidance_survey_public_responses FOR SELECT
  TO anon, authenticated
  USING (false);

-- 2. PRIVACY: Restrict SELECT on anonymous survey responses (guidance_survey_responses)
--    Same pattern: only service_role can read, anon/authenticated can only INSERT
DROP POLICY IF EXISTS "survey_responses_insert_anonymous" ON guidance_survey_responses;
CREATE POLICY "survey_responses_insert_anonymous"
  ON guidance_survey_responses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "survey_responses_select_anonymous"
  ON guidance_survey_responses FOR SELECT
  TO anon, authenticated
  USING (false);

-- 3. PERFORMANCE: Add missing indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_survey_public_responses_survey_id
  ON guidance_survey_public_responses (survey_id);

CREATE INDEX IF NOT EXISTS idx_zad_program_indicator_indicator_code
  ON zad_program_indicator (indicator_code);

CREATE INDEX IF NOT EXISTS idx_survey_public_responses_fingerprint
  ON guidance_survey_public_responses (response_fingerprint);

-- 4. PERFORMANCE: Add index on evidence created_at for coverage queries
CREATE INDEX IF NOT EXISTS idx_guidance_evidence_created_at
  ON guidance_evidence (created_at DESC);

-- 5. PRIVACY: Add rate limiting via unique constraint on (survey_id, response_fingerprint)
--    The unique constraint on guidance_survey_responses already exists for one_response_per_device.
--    For public responses, add a unique constraint to prevent duplicate submissions per fingerprint.
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_public_responses_unique_fingerprint
  ON guidance_survey_public_responses (survey_id, response_fingerprint)
  WHERE response_fingerprint IS NOT NULL;
