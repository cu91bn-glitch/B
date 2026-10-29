-- Revert: allow SELECT on survey responses for the counselor tool (no-auth app)
-- The app is a single-school counselor tool with no login.
-- Demographics contain only grade level (no names/PII).
-- Rate limiting is enforced via the unique fingerprint constraint.
DROP POLICY IF EXISTS "survey_responses_select_public" ON guidance_survey_public_responses;
CREATE POLICY "survey_responses_select_public"
  ON guidance_survey_public_responses FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "survey_responses_select_anonymous" ON guidance_survey_responses;
CREATE POLICY "survey_responses_select_anonymous"
  ON guidance_survey_responses FOR SELECT
  TO anon, authenticated
  USING (true);
