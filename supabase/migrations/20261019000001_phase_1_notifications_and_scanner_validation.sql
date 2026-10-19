-- ============================================================
-- FTI Event!t - Phase 1 Migration: Notifications, Event Templates & Scanner Validation
-- ============================================================

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id BIGINT REFERENCES public.events(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(40) NOT NULL DEFAULT 'EVENT_BLAST', -- 'REMINDER_H1', 'EVENT_BLAST', 'CERTIFICATE_READY'
    is_read BOOLEAN NOT NULL DEFAULT false,
    link_url VARCHAR(255) DEFAULT '/tickets',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for high-performance unread counts and sorting
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON public.notifications(user_id, is_read, created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS: User can read their own notifications
CREATE POLICY "Users can read own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- RLS: User can update (e.g. mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS: Authenticated service / admins / panitia can insert notifications
CREATE POLICY "Staff and service can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 2. Add cert_template_url to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS cert_template_url TEXT;

-- 3. Update process_ticket_checkin RPC with optional event validation
CREATE OR REPLACE FUNCTION public.process_ticket_checkin(
    p_ticket_code UUID,
    p_event_id BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_scanner_id UUID := auth.uid();
    v_scanner_role user_role;
    v_ticket RECORD;
    v_student RECORD;
BEGIN
    -- Verify scanner has PANITIA or ADMIN role
    SELECT role INTO v_scanner_role FROM public.profiles WHERE id = v_scanner_id;
    IF v_scanner_role IS NULL OR v_scanner_role = 'MAHASISWA' THEN
        RETURN jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'message', 'Hanya panitia atau admin yang dapat melakukan scan.');
    END IF;

    -- Find ticket with lock
    SELECT t.id, t.is_checked_in, t.checked_in_at, t.event_id, t.user_id, e.title as event_title
    INTO v_ticket
    FROM public.tickets t
    JOIN public.events e ON e.id = t.event_id
    WHERE t.ticket_code = p_ticket_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Tiket tidak ditemukan / tidak valid.');
    END IF;

    -- Get student profile
    SELECT name, nim_nidn, prodi, angkatan INTO v_student FROM public.profiles WHERE id = v_ticket.user_id;

    -- Validate event match if panitia selected a specific event
    IF p_event_id IS NOT NULL AND v_ticket.event_id <> p_event_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'WRONG_EVENT',
            'message', 'Tiket ini untuk acara "' || v_ticket.event_title || '", bukan untuk acara yang sedang Anda scan!',
            'student', row_to_json(v_student),
            'ticket_event_id', v_ticket.event_id,
            'ticket_event_title', v_ticket.event_title
        );
    END IF;

    IF v_ticket.is_checked_in THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_CHECKED_IN',
            'message', 'Tiket sudah pernah di-scan sebelumnya!',
            'student', row_to_json(v_student),
            'checked_in_at', v_ticket.checked_in_at,
            'event_title', v_ticket.event_title
        );
    END IF;

    -- Update ticket status
    UPDATE public.tickets
    SET is_checked_in = true,
        checked_in_at = NOW(),
        status = 'ATTENDED'
    WHERE id = v_ticket.id;

    -- Log check-in
    INSERT INTO public.check_ins (ticket_id, scanned_by, timestamp)
    VALUES (v_ticket.id, v_scanner_id, NOW())
    ON CONFLICT (ticket_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'code', 'SUCCESS',
        'message', 'Check-in berhasil! Selamat datang.',
        'student', row_to_json(v_student),
        'event_title', v_ticket.event_title
    );
END;
$$;

-- 4. RPC for H-1 Event Reminders Dispatch
CREATE OR REPLACE FUNCTION public.dispatch_event_reminders(p_target_event_id BIGINT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_role user_role;
    v_event RECORD;
    v_ticket RECORD;
    v_count INT := 0;
BEGIN
    -- Verify caller is PANITIA or ADMIN
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
    IF v_caller_role IS NULL OR v_caller_role = 'MAHASISWA' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Wewenang tidak mencukupi untuk mengirim pengingat.');
    END IF;

    -- Loop over target events
    FOR v_event IN
        SELECT id, title, event_start_at, venue
        FROM public.events
        WHERE is_archived = false
          AND (
              (p_target_event_id IS NOT NULL AND id = p_target_event_id)
              OR (p_target_event_id IS NULL AND event_start_at BETWEEN NOW() AND NOW() + INTERVAL '36 hours')
          )
    LOOP
        FOR v_ticket IN
            SELECT DISTINCT user_id
            FROM public.tickets
            WHERE event_id = v_event.id
              AND status IN ('CONFIRMED', 'ATTENDED')
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM public.notifications
                WHERE user_id = v_ticket.user_id
                  AND event_id = v_event.id
                  AND type = 'REMINDER_H1'
                  AND created_at > NOW() - INTERVAL '12 hours'
            ) THEN
                INSERT INTO public.notifications (
                    user_id,
                    event_id,
                    title,
                    message,
                    type,
                    link_url
                ) VALUES (
                    v_ticket.user_id,
                    v_event.id,
                    'Pengingat Acara: ' || v_event.title,
                    'Acara ' || v_event.title || ' akan dimulai pada ' || TO_CHAR(v_event.event_start_at AT TIME ZONE 'Asia/Jakarta', 'DD Mon YYYY, HH24:MI WIB') || ' di ' || v_event.venue || '. Siapkan QR tiket Anda!',
                    'REMINDER_H1',
                    '/tickets'
                );
                v_count := v_count + 1;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Berhasil mengirim ' || v_count || ' notifikasi pengingat.',
        'notifications_sent', v_count
    );
END;
$$;

-- 5. RPC for Admin Blasting New Event
CREATE OR REPLACE FUNCTION public.broadcast_event_notification(p_event_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_role user_role;
    v_event RECORD;
    v_student RECORD;
    v_count INT := 0;
BEGIN
    -- Verify caller is ADMIN
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
    IF v_caller_role <> 'ADMIN' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Hanya administrator yang dapat melakukan blasting acara.');
    END IF;

    SELECT id, title, category, venue, quota INTO v_event
    FROM public.events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Acara tidak ditemukan.');
    END IF;

    -- Send notification to all students
    FOR v_student IN
        SELECT id FROM public.profiles WHERE role = 'MAHASISWA'
    LOOP
        INSERT INTO public.notifications (
            user_id,
            event_id,
            title,
            message,
            type,
            link_url
        ) VALUES (
            v_student.id,
            v_event.id,
            'Acara Baru: ' || v_event.title,
            'Acara baru ' || v_event.title || ' telah dibuka untuk mahasiswa FTI Trisakti. Kuota terbatas (' || v_event.quota || ' kursi), klaim tiket sekarang!',
            'EVENT_BLAST',
            '/events'
        );
        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Berhasil melakukan blasting ke ' || v_count || ' mahasiswa.',
        'recipient_count', v_count
    );
END;
$$;
