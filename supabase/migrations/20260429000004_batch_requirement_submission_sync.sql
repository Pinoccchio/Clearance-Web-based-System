-- =============================================================================
-- Migration: Batch sync requirement submissions for student submit flows
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_requirement_submissions_batch(
  p_clearance_item_id uuid,
  p_student_id uuid,
  p_updates jsonb
)
RETURNS SETOF public.requirement_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id uuid;
  v_owner_id uuid;
  v_source_type text;
  v_source_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_student_id THEN
    RAISE EXCEPTION 'You are not allowed to update these requirement submissions.'
      USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_updates) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Updates payload must be a JSON array.'
      USING ERRCODE = '22023';
  END IF;

  SELECT ci.request_id, cr.student_id, ci.source_type, ci.source_id
  INTO v_request_id, v_owner_id, v_source_type, v_source_id
  FROM clearance_items ci
  JOIN clearance_requests cr ON cr.id = ci.request_id
  WHERE ci.id = p_clearance_item_id;

  IF v_request_id IS NULL OR v_owner_id IS DISTINCT FROM p_student_id THEN
    RAISE EXCEPTION 'You are not allowed to update these requirement submissions.'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    WITH updates AS (
      SELECT DISTINCT requirement_id, acknowledged
      FROM jsonb_to_recordset(p_updates) AS x(requirement_id uuid, acknowledged boolean)
    )
    SELECT 1
    FROM updates u
    LEFT JOIN requirements r
      ON r.id = u.requirement_id
     AND r.source_type = v_source_type
     AND r.source_id = v_source_id
     AND r.requires_upload = false
     AND r.is_attendance = false
    WHERE u.requirement_id IS NULL
       OR u.acknowledged IS NULL
       OR r.id IS NULL
  ) THEN
    RAISE EXCEPTION 'One or more requirement updates are invalid for this clearance item.'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH updates AS (
    SELECT DISTINCT requirement_id, acknowledged
    FROM jsonb_to_recordset(p_updates) AS x(requirement_id uuid, acknowledged boolean)
  ),
  upserted AS (
    INSERT INTO requirement_submissions (
      clearance_item_id,
      requirement_id,
      student_id,
      file_urls,
      status,
      submitted_at
    )
    SELECT
      p_clearance_item_id,
      u.requirement_id,
      p_student_id,
      '{}'::text[],
      CASE WHEN u.acknowledged THEN 'submitted' ELSE 'pending' END,
      CASE WHEN u.acknowledged THEN now() ELSE NULL END
    FROM updates u
    ON CONFLICT (clearance_item_id, requirement_id) DO UPDATE
    SET student_id = EXCLUDED.student_id,
        status = EXCLUDED.status,
        submitted_at = CASE
          WHEN EXCLUDED.status = 'submitted'
            THEN COALESCE(requirement_submissions.submitted_at, EXCLUDED.submitted_at)
          ELSE NULL
        END
    RETURNING requirement_submissions.*
  )
  SELECT *
  FROM upserted;
END;
$function$;

CREATE INDEX IF NOT EXISTS idx_requirements_source_published
  ON public.requirements (source_type, source_id, is_published);

CREATE INDEX IF NOT EXISTS idx_req_submissions_item_requirement_status
  ON public.requirement_submissions (clearance_item_id, requirement_id, status);
