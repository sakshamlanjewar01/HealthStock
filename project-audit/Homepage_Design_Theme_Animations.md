# HealthStock — Homepage Design Theme, Colors, Fonts & Animations Details

This document provides a complete technical extraction of the design theme system, color palette tokens, font stack, glassmorphism specs, and Framer Motion animation systems used on the HealthStock Homepage (`Landing.jsx`).

---

## 1. Typography & Font Family Stack

- **Primary Font Family**: `'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Font Weights Used**:
  - `400` (Regular) — Body text
  - `500` (Medium) — Paragraph copy & descriptions
  - `600` (SemiBold) — Footer copyright & sub-metadata
  - `700` (Bold) — Navigation items, action buttons, kicker tags
  - `800` (ExtraBold) — Feature card titles, CTA headlines
  - `900` (Black) — Main Hero H1 (`Never Miss a Dose Again`) and Bento section titles (`Empowering Better Health Outcomes`)

---

## 2. Palette & Color Token System

### A. Brand Colors
- **Primary Brand Navy (`#0F2F57`)**: Used for main headlines, primary text, brand logo, and dark structural text.
- **Brand Electric Blue (`#0B53FA`)**: Used for primary action buttons, scroll progress bar, active navbar indicator line, and icon highlights.
- **Brand Emerald Green (`#10B981`)**: Used for accent brand mark (`stock`), status badges (`100% On Track`), and decorative underline accents.
- **Brand Muted Blue (`#4B6B8B`)**: Used for body paragraphs, inactive navigation links, and descriptive sub-labels.

### B. Surface & Background Colors
- **Page Background (`#FAFCFD`)**: Ultra-clean, subtle ice-white background with a cool blue undertone.
- **Navbar Glass Surface (`rgba(255, 255, 255, 0.90)`)**: Translucent white backdrop with `backdrop-blur-xl` blur filter.
- **Card Backgrounds (`#FFFFFF` & `#F8FAFC`)**: Pure white card containers with subtle borders (`#F1F5F9` / `#E2E8F0`).
- **Benefits Banner Gradient (`linear-gradient(to right, #E5ECF6, #EBF0F9, #F1F3FB)`)**: Gentle multi-stop gradient for section divider background.
- **CTA Banner Surface (`#0B53FA`)**: Deep electric blue background with concentric white border rings (`border-white/10` and `border-white/5`).

### C. Category Accent Hues
- **Scheduling Blue Icon Container**: Background `#EAF2FC`, Icon `#0B53FA`.
- **Inventory Green Icon Container**: Background `#E6F4EA`, Icon `#137333`.
- **Analytics Purple Icon Container**: Background `#F2E6FF`, Icon `#7030A0`.
- **Next Dose Orange Badge Container**: Background `#FFF7ED`, Icon `#EA580C`.

---

## 3. Framer Motion Animation System

### A. Scroll-Linked Progress & Hero Transforms
1. **Scroll Progress Bar**:
   - `scaleX: scrollYProgress` mapped to fixed top progress line (`h-[3.5px] bg-[#0B53FA] origin-left z-[100]`).
2. **Hero Opacity & Scale Parallax**:
   - `heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])`
   - `heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])`
   - Hero section smoothly scales down to 95% and fades out as user scrolls down the first 20% of the page.

### B. Micro-Interactions & Hover Variants
1. **Button Scale Interaction**:
   - `whileHover={{ scale: 1.03 }}`
   - `whileTap={{ scale: 0.97 }}`
   - Provides physical spring feedback when hovering and clicking buttons.
2. **Card Lift Motion**:
   - `whileHover={{ y: -6 }}` with `transition-all duration-300`
   - Smoothly lifts feature and bento cards upwards by 6px with an expanded shadow on hover (`shadow-[0_20px_40px_rgba(15,47,87,0.08)]`).
3. **Arrow Motion**:
   - `arrowMotion`: `rest: { x: 0 }`, `hover: { x: 5, transition: { type: "spring", stiffness: 400, damping: 10 } }`
   - Arrow icon shifts 5px to the right on card hover.
4. **Active Navbar Underline (`navbarActiveIndicator`)**:
   - Uses `motion.div layoutId="navbarActiveIndicator"` for smooth sliding underline transitions between `Home`, `Features`, and `Benefits` navigation tabs.

### C. Floating Hero Image Badges
1. **Adherence Floating Card**:
   - `animate={{ y: [-6, 6, -6] }}` with `transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}`
   - Floating bobbing animation every 4 seconds.
2. **Next Dose Floating Card**:
   - `animate={{ y: [6, -6, 6] }}` with `transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}`
   - Counter-synchronous floating bobbing animation every 5 seconds.

### D. CTA Banner Ornament Animations
1. **Left Concentric Circles**:
   - `animate={{ rotate: 360 }}` with `transition={{ repeat: Infinity, duration: 25, ease: "linear" }}`
   - Infinite smooth 360-degree rotation.
2. **Right Concentric Circles**:
   - `animate={{ rotate: -360 }}` with `transition={{ repeat: Infinity, duration: 20, ease: "linear" }}`
   - Reverse infinite 360-degree rotation.
3. **Pulsing Core Dot**:
   - `animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}` with `transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}`
   - Continuous subtle heartbeat pulse.

---

## 4. Design Theme Summary

| Theme Property | Specification / Value |
| :--- | :--- |
| **Design Style** | Modern Healthcare Glassmorphism & SaaS Clean Aesthetic |
| **Corner Radius (Cards)** | `2rem` (`32px`) Rounded Borders |
| **Corner Radius (Buttons)** | `8px` (`rounded-[8px]`) |
| **Card Border** | `1px solid rgba(226, 232, 240, 0.8)` (`border-slate-100/80`) |
| **Shadow System** | Subtle ambient drop shadow `shadow-[0_12px_40px_rgba(15,47,87,0.02)]` extending to `shadow-[0_20px_40px_rgba(15,47,87,0.08)]` on hover. |
| **Backdrop Filter** | `backdrop-blur-xl` on navbar for frosted translucent glass effect. |
