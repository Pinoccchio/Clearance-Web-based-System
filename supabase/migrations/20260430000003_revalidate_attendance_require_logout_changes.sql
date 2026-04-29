-- Revalidate attendance-linked clearance items when an event's attendance rule changes.
-- If an event is edited from scan-in only to require scan-out, existing submitted items
-- that no longer qualify must be moved back to on_hold.

CREATE OR REPLACE FUNCTION public.sync_event_attendance_requirement_state(
  p_event_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_source_type text;
  v_source_id uuid;
  v_requirement_id uuid;
  v_require_logout boolean;
  v_default_reason text := 'An attendance rule was updated after your submission. Please review and re-submit.';
  v_history_reason text := COALESCE(
    p_reason,
    'Automatically reset: the event attendance rule changed.'
  );
  v_changed_count integer := 0;
  v_item RECORD;
  v_from_status text;
  v_qualifies boolean;
BEGIN
  SELECT source_type, source_id, requirement_id, require_logout
  INTO v_source_type, v_source_id, v_requirement_id, v_require_logout
  FROM events
  WHERE id = p_event_id;

  IF v_source_type IS NULL OR v_source_id IS NULL OR v_requirement_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR v_item IN
    SELECT DISTINCT ON (cr.student_id)
      ci.id AS clearance_item_id,
      ci.request_id,
      ci.status,
      cr.student_id
    FROM clearance_items ci
    JOIN clearance_requests cr ON cr.id = ci.request_id
    WHERE ci.source_type = v_source_type
      AND ci.source_id = v_source_id
      AND ci.status != 'approved'
      AND EXISTS (
        SELECT 1
        FROM attendance_records ar
        WHERE ar.event_id = p_event_id
          AND ar.student_id = cr.student_id
      )
    ORDER BY cr.student_id, cr.created_at DESC
  LOOP
    v_qualifies := EXISTS (
      SELECT 1
      FROM attendance_records ar
      WHERE ar.event_id = p_event_id
        AND ar.student_id = v_item.student_id
        AND ar.attendance_type = 'log_in'
    ) AND (
      NOT v_require_logout OR EXISTS (
        SELECT 1
        FROM attendance_records ar2
        WHERE ar2.event_id = p_event_id
          AND ar2.student_id = v_item.student_id
          AND ar2.attendance_type = 'log_out'
      )
    );

    IF v_qualifies THEN
      INSERT INTO requirement_submissions (
        clearance_item_id,
        requirement_id,
        student_id,
        status,
        submitted_at
      )
      VALUES (
        v_item.clearance_item_id,
        v_requirement_id,
        v_item.student_id,
        'submitted',
        NOW()
      )
      ON CONFLICT (clearance_item_id, requirement_id)
      DO UPDATE SET
        status = 'submitted',
        submitted_at = NOW();
    ELSE
      DELETE FROM requirement_submissions
      WHERE clearance_item_id = v_item.clearance_item_id
        AND requirement_id = v_requirement_id;

      IF v_item.status IN ('submitted', 'approved') THEN
        SELECT status INTO v_from_status
        FROM clearance_items
        WHERE id = v_item.clearance_item_id;

        UPDATE clearance_items
        SET status = 'on_hold',
            remarks = COALESCE(p_reason, v_default_reason),
            reviewed_by = NULL,
            reviewed_at = NULL
        WHERE id = v_item.clearance_item_id
          AND status IN ('submitted', 'approved');

        IF FOUND THEN
          INSERT INTO clearance_item_history (
            clearance_item_id,
            from_status,
            to_status,
            actor_id,
            actor_role,
            remarks
          )
          VALUES (
            v_item.clearance_item_id,
            v_from_status,
            'on_hold',
            NULL,
            'system',
            v_history_reason
          );

          PERFORM public.recompute_clearance_request_status(v_item.request_id);
          v_changed_count := v_changed_count + 1;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN v_changed_count;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_event_attendance_requirement_state ON public.events;

CREATE OR REPLACE FUNCTION public.handle_event_attendance_requirement_state_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
BEGIN
  PERFORM public.sync_event_attendance_requirement_state(
    NEW.id,
    'An event attendance rule was updated. Please review and re-submit.'
  );
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_sync_event_attendance_requirement_state
AFTER UPDATE OF requirement_id, require_logout ON public.events
FOR EACH ROW
WHEN (
  OLD.requirement_id IS DISTINCT FROM NEW.requirement_id
  OR OLD.require_logout IS DISTINCT FROM NEW.require_logout
)
EXECUTE FUNCTION public.handle_event_attendance_requirement_state_change();
