# FTI Event!t — Design System Specification

<!-- impeccable:design-schema 1 -->

## Design Foundations

### Visual Identity & Voice
- **Theme**: Clean Academic Light Mode (Official University Campus Utility).
- **Voice**: Authentic, professional, trustworthy, and fast.
- **Tone**: Clean campus administration & engineering excellence — pure white backgrounds, crisp slate typography, and Trisakti royal blue accents. Zero dark mode gamer/neon tropes, zero generic marketing fluff.
- **Floor Anti-Patterns (BANNED)**:
  - ❌ Dark mode neon glowing borders
  - ❌ Text Gradients (`bg-clip-text text-transparent`)
  - ❌ Fuzzy floating glow blobs & decorative backdrop-blur halos
  - ❌ Eyebrow badges with sparkles/stars (`✨ Featured Event`)
  - ❌ Premature SKPI point speculation (removed until official curriculum rules are finalized)

### Color Tokens (Light Mode — WCAG AAA / AA Compliant)
- **Base Background**: `#F1F5F9` (Slate 100) — outer viewport container on desktop.
- **App Shell Surface**: `#FFFFFF` (Pure White) — primary app content background.
- **Card / Surface Elevation**: `#FFFFFF` with `#E2E8F0` border and subtle shadow.
- **Sub-surface Elevation**: `#F8FAFC` (Slate 50) — headers, input fields, attendee info boxes.
- **Primary / Brand**: `#1D4ED8` (Trisakti Royal Blue) — primary buttons, active icons, tags.
- **Primary Hover/Active**: `#1E40AF` (Blue 800) / Active Scale `scale-[0.98]`.
- **Success / Attendance**: `#059669` (Emerald 600) — QR validation confirmed, checked-in status.
- **Pending / Action**: `#D97706` (Amber 600) — waiting for door check-in scan.
- **Foreground Primary**: `#0F172A` (Slate 900) — headings, titles, active labels.
- **Foreground Secondary**: `#475569` (Slate 600) / `#64748B` (Slate 500) — metadata, venue, timestamps.
- **Border**: `#E2E8F0` (Slate 200) / `#CBD5E1` (Slate 300) — crisp partition lines.

### Typography
- **Primary Font**: `Inter`, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif.
- **Code / Monospace**: `JetBrains Mono`, `ui-monospace`, monospace (ticket codes, NIM, license IDs).
- **Scale**:
  - Display / Hero Title: `text-xl` to `text-2xl` (font-extrabold, tracking-tight)
  - Section Heading: `text-xs` to `text-sm` (font-bold, tracking-wide, uppercase)
  - Card Title: `text-sm` to `text-base` (font-bold, leading-snug)
  - Body / Subtext: `text-xs` (font-normal or font-medium, leading-relaxed)
  - Metadata / Micro: `text-[10px]` to `text-[11px]` (font-bold or font-semibold, tracking-wider)

### Mobile-First Layout & Touch Ergonomics
- **Shell Dimensions**: `w-full max-w-md md:max-w-lg min-h-screen` centered in viewport with clean borderlines (`sm:border-x sm:border-slate-200`).
- **Touch Target Size**: Minimum 44px × 44px for every clickable element (thumb-friendly reach).
- **Bottom Navigation**: Pinned white bar, `z-50`, persistent across student workflow (`Beranda`, `Event`, `Tiket`, `Sertifikat`, `Scanner`).
- **Form Inputs**: Sized at `text-base` (16px) font-size on mobile to prevent iOS Safari auto-zoom, padded at `py-2.5 px-3.5`.
- **Passbook Ticket**: Physical perforations with semi-circle punch-outs, crisp black-on-white high-density QR code, live pulsing presence indicator.
- **Official PDF Certificate**: Clean academic white certificate with royal blue border, gold seal lines, and faculty signatures.
