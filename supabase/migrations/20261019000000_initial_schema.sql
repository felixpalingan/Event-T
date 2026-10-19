-- ============================================================
-- FTI Event!t - Initial Database Schema Migration
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'PANITIA', 'MAHASISWA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'ATTENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nim_nidn VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    role user_role NOT NULL DEFAULT 'MAHASISWA',
    prodi VARCHAR(80) NOT NULL DEFAULT 'Teknik Informatika',
    angkatan INTEGER NOT NULL DEFAULT 2024,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        nim_nidn, 
        name, 
        email, 
        phone_number, 
        role, 
        prodi, 
        angkatan
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nim_nidn', 'NIM-' || SUBSTRING(NEW.id::TEXT, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'phone_number',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'MAHASISWA'),
        COALESCE(NEW.raw_user_meta_data->>'prodi', 'Teknik Informatika'),
        COALESCE((NEW.raw_user_meta_data->>'angkatan')::INTEGER, 2024)
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        nim_nidn = EXCLUDED.nim_nidn,
        prodi = EXCLUDED.prodi,
        angkatan = EXCLUDED.angkatan,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'SEMINAR', -- SEMINAR, WORKSHOP, KULIAH_TAMU, LOMBA, MAKRAB
    mode VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',     -- OFFLINE, ONLINE, HYBRID
    venue VARCHAR(150) NOT NULL DEFAULT 'Auditorium FTI',
    meeting_url VARCHAR(500),
    banner_image TEXT,
    quota INTEGER NOT NULL DEFAULT 100,
    price INTEGER NOT NULL DEFAULT 0,
    skpi_points INTEGER NOT NULL DEFAULT 10,
    has_certificate BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    is_post_test_open BOOLEAN NOT NULL DEFAULT false,
    reg_open_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reg_close_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    event_start_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '8 days'),
    event_end_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '8 days 3 hours'),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. EVENT QUESTIONS (Pre-Test & Post-Test)
CREATE TABLE IF NOT EXISTS public.event_questions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_event_question_number UNIQUE (event_id, question_number)
);

-- 6. TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.tickets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_code UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    status ticket_status NOT NULL DEFAULT 'CONFIRMED',
    is_checked_in BOOLEAN NOT NULL DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_event_ticket UNIQUE (user_id, event_id)
);

-- 7. CHECK-INS LOG TABLE
CREATE TABLE IF NOT EXISTS public.check_ins (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_ticket_checkin UNIQUE (ticket_id)
);

-- 8. USER TEST SCORES TABLE
CREATE TABLE IF NOT EXISTS public.user_test_scores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    pre_test_score INTEGER,
    post_test_score INTEGER,
    pre_test_submitted_at TIMESTAMPTZ,
    post_test_submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_event_score UNIQUE (user_id, event_id)
);

-- 9. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    certificate_no VARCHAR(60) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    pdf_url TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_event_certificate UNIQUE (user_id, event_id)
);

-- ============================================================
-- HIGH-PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_nim ON public.profiles(nim_nidn);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_archived, event_start_at ASC);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id, is_checked_in);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON public.tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_checkins_ticket_id ON public.check_ins(ticket_id);
CREATE INDEX IF NOT EXISTS idx_questions_event_id ON public.event_questions(event_id);
CREATE INDEX IF NOT EXISTS idx_testscores_event_id ON public.user_test_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_event ON public.certificates(user_id, event_id);

-- ============================================================
-- ATOMIC BUSINESS FUNCTIONS (PREVENT OVERBOOKING & FRAUD)
-- ============================================================

-- Function: 1-Click Atomic Ticket Claim
CREATE OR REPLACE FUNCTION public.claim_event_ticket(p_event_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_event RECORD;
    v_active_tickets INT;
    v_ticket RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Autentikasi diperlukan.');
    END IF;

    -- Lock the event row for atomic quota check
    SELECT id, quota, is_archived, reg_open_at, reg_close_at, title
    INTO v_event
    FROM public.events
    WHERE id = p_event_id
    FOR SHARE;

    IF NOT FOUND OR v_event.is_archived THEN
        RETURN jsonb_build_object('success', false, 'message', 'Event tidak ditemukan atau sudah diarsipkan.');
    END IF;

    IF NOW() < v_event.reg_open_at THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pendaftaran untuk event ini belum dibuka.');
    END IF;

    IF NOW() > v_event.reg_close_at THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pendaftaran untuk event ini telah ditutup.');
    END IF;

    -- Count active tickets atomically
    SELECT COUNT(*) INTO v_active_tickets
    FROM public.tickets
    WHERE event_id = p_event_id AND status IN ('CONFIRMED', 'ATTENDED');

    IF v_active_tickets >= v_event.quota THEN
        RETURN jsonb_build_object('success', false, 'message', 'Kuota pendaftaran event ini sudah penuh.');
    END IF;

    -- Insert ticket (protected against duplicates by unique constraint)
    BEGIN
        INSERT INTO public.tickets (user_id, event_id, status)
        VALUES (v_user_id, p_event_id, 'CONFIRMED')
        RETURNING id, ticket_code, status, is_checked_in, created_at INTO v_ticket;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Berhasil mendaftar ke acara ' || v_event.title || '!',
            'ticket', row_to_json(v_ticket)
        );
    EXCEPTION
        WHEN unique_violation THEN
            RETURN jsonb_build_object('success', false, 'message', 'Anda sudah terdaftar pada acara ini.');
    END;
END;
$$;

-- Function: Process QR Check-in Atomically
CREATE OR REPLACE FUNCTION public.process_ticket_checkin(p_ticket_code UUID)
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

    IF v_ticket.is_checked_in THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_CHECKED_IN',
            'message', 'Tiket sudah pernah di-scan sebelumnya!',
            'student', row_to_json(v_student),
            'checked_in_at', v_ticket.checked_in_at
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
    VALUES (v_ticket.id, v_scanner_id, NOW());

    RETURN jsonb_build_object(
        'success', true,
        'code', 'SUCCESS',
        'message', 'Check-in berhasil! Selamat datang.',
        'student', row_to_json(v_student),
        'event_title', v_ticket.event_title
    );
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- 2. Events Policies
CREATE POLICY "Active events are publicly readable"
    ON public.events FOR SELECT
    TO anon, authenticated
    USING (is_archived = false);

CREATE POLICY "Panitia and Admin can view all events including archived"
    ON public.events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('PANITIA', 'ADMIN')
        )
    );

CREATE POLICY "Only Admin can insert or update events"
    ON public.events FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role = 'ADMIN'
        )
    );

-- 3. Tickets Policies
CREATE POLICY "Users can view their own tickets"
    ON public.tickets FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('PANITIA', 'ADMIN')
        )
    );

-- 4. Check-Ins Policies
CREATE POLICY "Panitia and Admin can view check-ins"
    ON public.check_ins FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('PANITIA', 'ADMIN')
        )
    );

-- 5. User Test Scores Policies
CREATE POLICY "Users can view and submit their own test scores"
    ON public.user_test_scores FOR ALL
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('PANITIA', 'ADMIN')
        )
    );

-- 6. Certificates Policies
CREATE POLICY "Users can view their own certificates"
    ON public.certificates FOR SELECT
    TO authenticated
    USING (
        (SELECT auth.uid()) = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('PANITIA', 'ADMIN')
        )
    );
