# FTI Event!t — Design System Specification

<!-- impeccable:design-schema 1 -->

## Design Foundations

### Visual Identity & Voice
- **Archetype**: Precision Campus Utility & Engineering Culture.
- **Voice**: Direct, reliable, tactile, and fast.
- **Tone**: High-contrast, serious yet vibrant academia — zero corporate buzzwords, zero generic marketing fluff.
- **Floor Anti-Patterns (BANNED)**:
  - ❌ Text Gradients (`bg-clip-text text-transparent`)
  - ❌ Fuzzy floating glow blobs & decorative backdrop-blur halos
  - ❌ Eyebrow badges with sparkles/stars (`✨ Featured Event`)
  - ❌ Cookie-cutter 3-card marketing grids
  - ❌ Desktop-first stretched layouts with giant empty whitespace

### Color Tokens (WCAG AA Compliant)
- **Base Background**: `#090D16` (Deep Space Slate) — deep contrast, saves battery on OLED mobile displays.
- **Surface Elevation 1**: `#0F172A` (Slate 900) — cards, top app bar, bottom navigation.
- **Surface Elevation 2**: `#1E293B` (Slate 800) — input fields, interactive borders, pill containers.
- **Primary / Brand**: `#1D4ED8` (Trisakti Royal Blue) — primary buttons, active tabs, primary badges.
- **Primary Hover/Active**: `#2563EB` (Blue 600) / Active Scale `scale-[0.98]`.
- **Accent SKPI / Points**: `#D97706` (Campus Academic Amber) — SKPI points, warning states.
- **Success / Attendance**: `#059669` (Emerald 600) — QR validation confirmed, checked-in status.
- **Foreground Primary**: `#F8FAFC` (Slate 50) — headers, prominent titles.
- **Foreground Secondary**: `#94A3B8` (Slate 400) — metadata, venue, timestamps.

### Typography
- **Primary Font**: `Inter`, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif.
- **Code / Monospace**: `JetBrains Mono`, `ui-monospace`, monospace (ticket codes, NIM, license IDs).
- **Scale**:
  - Display / Hero Title: `text-xl` to `text-2xl` (font-extrabold, tracking-tight)
  - Section Heading: `text-sm` (font-bold, tracking-wide, uppercase)
  - Card Title: `text-sm` to `text-base` (font-bold, leading-snug)
  - Body / Subtext: `text-xs` (font-normal or font-medium, leading-relaxed)
  - Metadata / Micro: `text-[10px]` to `text-[11px]` (font-bold or font-semibold, tracking-wider)

### Mobile-First Layout & Touch Ergonomics
- **Shell Dimensions**: `w-full max-w-md md:max-w-lg min-h-screen` centered in viewport with clean borderlines (`border-x border-slate-800/80`).
- **Touch Target Size**: Minimum 44px × 44px for every clickable element (thumb-friendly reach).
- **Bottom Navigation**: Fixed bar, `z-50`, persistent across student workflow (`Beranda`, `Event`, `Tiket`, `Sertifikat`, `Scanner`).
- **Form Inputs**: Sized at `text-base` (16px) font-size on mobile to prevent iOS Safari auto-zoom, padded at `py-3 px-4`.
- **Passbook Ticket**: Physical perforations with semi-circle punch-outs, crisp black-on-white high-density QR code, live pulsing presence indicator.
