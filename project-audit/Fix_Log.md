# HealthStock Frontend Engineering Fix Log

This log tracks every production-level UI, UX, styling, accessibility, and architectural fix completed across the HealthStock codebase.

---

## Completed Fix Log

- [x] **Navbar Active Link Animation**: Replaced hardcoded active indicator in `Landing.jsx` with dynamic state (`activeSection`) and smooth scroll intersection detection.
- [x] **Card Hover Detached Overlay**: Removed inner detached `motion.div` overlay elements across all cards in `Landing.jsx`; unified `whileHover` spring transformations directly on outer card elements.
- [x] **Form Input Border Aesthetics**: Replaced harsh black borders (`border-2 border-black`) across `Login.jsx`, `Signup.jsx`, `ResetPassword.jsx`, and `SymptomTracker.jsx` with modern sleek borders (`border border-slate-200 hover:border-slate-300 focus-within:ring-4 focus-within:ring-brand-primary/10`).
- [x] **Medication Calendar Scheduled Count**: Corrected scheduled intake slot count calculation in `MedicationCalendar.jsx` to accurately aggregate multi-dose time slots (Morning, Afternoon, Night).
- [x] **Past Date Compliance Tagging**: Standardized past date rendering in `MedicationCalendar.jsx` so unlogged historical doses clearly display the red `MISSED` status badge (`XCircle Missed`).
- [x] **Unified History & Calendar Workspace**: Combined Calendar and History into a single unified workspace in `ActivityLog.jsx` with sub-tabs (`Calendar View`, `Log Table`, `Export Reports`).
- [x] **Navigation Alignment**: Simplified `Sidebar.jsx` and `MobileNav.jsx` to present a single clean `History & Calendar` navigation route.
- [x] **Design System & Typography Hierarchy**: Enforced unified scale (`H1`–`H6`, `Body`, `Small`, `Caption`) in `index.css` and verified 8px mathematical spacing system.
- [x] **Viewport & Horizontal Scroll Protection**: Enforced `overflow-x: clip` on `html, body` and wrapped tables in `overflow-x-auto` responsive containers across all viewports (320px–1920px+).
