# HealthStock — Homepage Typography, Colors, Theme & Animations Details (`Landing.jsx`)

This document provides a comprehensive element-by-element breakdown of every heading, sub-heading, paragraph, kicker, button, badge, text element, color palette token, font family stack, glassmorphism specification, and Framer Motion animation system on the HealthStock Homepage (`Landing.jsx`).

---

## 1. Global Font Stack & Design Theme Rules

- **Primary Font Family**: `'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Font Weights Used**:
  - `400` (Regular) — Body text
  - `500` (Medium) — Paragraph copy & descriptions
  - `600` (SemiBold) — Footer copyright & sub-metadata
  - `700` (Bold) — Navigation items, action buttons, kicker tags
  - `800` (ExtraBold) — Feature card titles, CTA headlines
  - `900` (Black) — Main Hero H1 (`Never Miss a Dose Again`) and Bento section titles (`Empowering Better Health Outcomes`)
- **Corner Radius**: `2rem` (`32px`) rounded card containers, `8px` rounded buttons.
- **Card Border**: `1px solid rgba(226, 232, 240, 0.8)` (`border-slate-100/80`).
- **Shadow System**: Subtle ambient drop shadow `shadow-[0_12px_40px_rgba(15,47,87,0.02)]` expanding to `shadow-[0_20px_40px_rgba(15,47,87,0.08)]` on hover.
- **Frosted Glass Surface**: `backdrop-blur-xl` on navbar with `bg-white/90`.

---

## 2. Color Palette & Token System

| Color Token Name | Hex Code / Value | Primary Role & Usage |
| :--- | :--- | :--- |
| **Primary Brand Navy** | `#0F2F57` | Main headlines, primary text, brand logo, dark structural titles |
| **Brand Electric Blue** | `#0B53FA` | Primary action buttons, scroll progress bar, active navbar indicator line, icon highlights |
| **Brand Emerald Green** | `#10B981` | Accent brand mark (`stock`), status badges (`100% On Track`), decorative underline accents |
| **Brand Muted Blue** | `#4B6B8B` | Body paragraphs, inactive navigation links, descriptive sub-labels |
| **Page Background** | `#FAFCFD` | Ultra-clean, subtle ice-white background with a cool blue undertone |
| **Navbar Glass Surface** | `rgba(255, 255, 255, 0.90)` | Translucent white backdrop with `backdrop-blur-xl` blur filter |
| **Card Backgrounds** | `#FFFFFF` & `#F8FAFC` | Pure white card containers with subtle borders (`#F1F5F9` / `#E2E8F0`) |
| **Benefits Banner Gradient** | `linear-gradient(to right, #E5ECF6, #EBF0F9, #F1F3FB)` | Multi-stop gradient for section divider background |
| **CTA Banner Surface** | `#0B53FA` | Deep electric blue background with concentric white border rings (`border-white/10`) |

---

## 3. Navbar Header Section (`Navbar`)

| Element | Target Text | Font Size (Mobile) | Font Size (Desktop) | Font Weight | Color Token | Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Brand Logo Primary** | `Health` | `17px` (`text-[17px]`) | `17px` (`text-[17px]`) | `800` (ExtraBold) | `#0F2F57` (Deep Blue) | Brand Name Part 1 |
| **Brand Logo Accent** | `stock` | `17px` (`text-[17px]`) | `17px` (`text-[17px]`) | `800` (ExtraBold) | `#10B981` (Emerald Green) | Brand Name Part 2 |
| **Brand Sub-Tagline** | `TRACK • MANAGE • LIVE WELL` | `8px` (`text-[8px]`) | `8px` (`text-[8px]`) | `700` (Bold) | `#95A6B7` (Muted Blue) | Brand Kicker (Uppercase) |
| **Desktop Nav Link** | `Home` | `14px` (`text-[14px]`) | `14px` (`text-[14px]`) | `700` (Bold) | `#0B53FA` (Active Blue) | Active Navigation Tab |
| **Desktop Nav Link** | `Features` | `14px` (`text-[14px]`) | `14px` (`text-[14px]`) | `700` (Bold) | `#4B6B8B` (Inactive Slate) | Inactive Navigation Link |
| **Desktop Nav Link** | `Benefits` | `14px` (`text-[14px]`) | `14px` (`text-[14px]`) | `700` (Bold) | `#4B6B8B` (Inactive Slate) | Inactive Navigation Link |
| **Secondary Button** | `Log in` | `13px` (`text-[13px]`) | `13px` (`text-[13px]`) | `700` (Bold) | `#0F2F57` | Outline Action Trigger |
| **Primary Button** | `Get Started` | `13px` (`text-[13px]`) | `13px` (`text-[13px]`) | `700` (Bold) | `#FFFFFF` (White) | Primary Action Button |

---

## 4. Main Hero Section (`#home`)

| Element | Target Text | Font Size (Mobile) | Font Size (Desktop) | Font Weight | Color Token | Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Category Kicker** | `INTELLIGENT HEALTH TRACKING` | `10px` (`text-[10px]`) | `11px` (`text-[11px]`) | `800` (ExtraBold) | `#0B53FA` | Hero Badge Tag (Uppercase) |
| **Main Headline (H1)** | `Never Miss a Dose Again` | `36px` (`text-4xl`) - `48px` | `60px` (`text-6xl`) - `76px` | `900` (Black) | `#0F2F57` | Page Primary H1 Headline |
| **Body Paragraph** | `Your intelligent medication adherence and refill...` | `12px` (`text-xs`) | `16px` (`text-base`) | `500` (Medium) | `#4B6B8B` (80% opacity) | Introductory Lead Text |
| **CTA Button 1** | `Start Tracking Free` | `12px` (`text-xs`) | `14px` (`text-sm`) | `700` (Bold) | `#FFFFFF` | Primary Conversion Button |
| **CTA Button 2** | `Login to Dashboard` | `12px` (`text-xs`) | `14px` (`text-sm`) | `700` (Bold) | `#0F2F57` | Secondary Navigation Button |
| **Badge 1 Kicker** | `ADHERENCE` | `8px` (`text-[8px]`) | `9px` (`text-[9px]`) | `700` (Bold) | `#94A3B8` | Floating Card Category Tag |
| **Badge 1 Title** | `100% On Track` | `12px` (`text-xs`) | `12px` (`text-xs`) | `900` (Black) | `#0F2F57` | Floating Card Metric |
| **Badge 2 Kicker** | `NEXT DOSE` | `8px` (`text-[8px]`) | `9px` (`text-[9px]`) | `700` (Bold) | `#94A3B8` | Floating Card Category Tag |
| **Badge 2 Title** | `5:00 AM Left` | `12px` (`text-xs`) | `12px` (`text-xs`) | `900` (Black) | `#0F2F57` | Floating Card Metric |

---

## 5. Features Section (`#features`)

| Element | Target Text | Font Size (Mobile) | Font Size (Desktop) | Font Weight | Color Token | Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Card 1 Title (H3)** | `Smart Scheduling` | `18px` (`text-lg`) | `20px` (`text-xl`) | `800` (ExtraBold) | `#0F2F57` | Feature Card 1 Heading |
| **Card 1 Desc** | `Visual daily timelines and customized multi-dose...` | `12px` (`text-xs`) | `14px` (`text-sm`) | `500` (Medium) | `#4B6B8B` (80% opacity) | Feature Card 1 Description |
| **Card 2 Title (H3)** | `Inventory Tracking` | `18px` (`text-lg`) | `20px` (`text-xl`) | `800` (ExtraBold) | `#0F2F57` | Feature Card 2 Heading |
| **Card 2 Desc** | `Automatic countdowns, critical stock alerts...` | `12px` (`text-xs`) | `14px` (`text-sm`) | `500` (Medium) | `#4B6B8B` (80% opacity) | Feature Card 2 Description |
| **Card 3 Title (H3)** | `Health Analytics` | `18px` (`text-lg`) | `20px` (`text-xl`) | `800` (ExtraBold) | `#0F2F57` | Feature Card 3 Heading |
| **Card 3 Desc** | `Create health analytics expanded in extents...` | `12px` (`text-xs`) | `14px` (`text-sm`) | `500` (Medium) | `#4B6B8B` (80% opacity) | Feature Card 3 Description |

---

## 6. Benefits Section (`#benefits`)

| Element | Target Text | Font Size (Mobile) | Font Size (Desktop) | Font Weight | Color Token | Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Section Banner Title (H2)** | `Empowering Better Health Outcomes` | `24px` (`text-2xl`) - `36px` | `48px` (`text-5xl`) | `900` (Black) | `#0F2F57` | Section H2 Headline |
| **Banner Sub-Card Text** | `Our platform goes beyond simple alarms...` | `12px` (`text-xs`) | `14px` (`text-sm`) | `500` (Medium) | `#4B6B8B` | Supporting Description |
| **Bento 1 Title (H3)** | `Pharmacy Dispatch Integration` | `18px` (`text-lg`) | `24px` (`text-2xl`) | `900` (Black) | `#0F2F57` | Bento Card 1 Heading |
| **Bento 1 Desc** | `Connect with your pharmacy and manage refill requests.` | `12px` (`text-xs`) | `14px` (`text-sm`) | `500` (Medium) | `#4B6B8B` (80% opacity) | Bento Card 1 Description |
| **Bento 4 Title (H3)** | `Family & Caregiver Support` | `18px` (`text-lg`) | `24px` (`text-2xl`) | `900` (Black) | `#0F2F57` | Bento Card 4 Heading |
| **Bento 4 Desc** | `Share adherence scores and intake logs with loved ones.` | `12px` (`text-xs`) | `14px` (`text-sm`) | `500` (Medium) | `#4B6B8B` (80% opacity) | Bento Card 4 Description |

---

## 7. Call-To-Action Banner (`CTA`)

| Element | Target Text | Font Size (Mobile) | Font Size (Desktop) | Font Weight | Color Token | Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CTA Title (H2)** | `Ready to Take Control?` | `24px` (`text-2xl`) | `36px` (`text-4xl`) | `800` (ExtraBold) | `#FFFFFF` (White) | CTA Banner H2 Headline |
| **CTA Sub-paragraph** | `Join thousands of users who have improved...` | `12px` (`text-xs`) | `14px` (`text-sm`) | `500` (Medium) | `#BACCDD` (Light Blue) | CTA Supporting Subtitle |
| **CTA Action Button** | `Create Your Free Account` | `12px` (`text-xs`) | `14px` (`text-sm`) | `800` (ExtraBold) | `#0B53FA` (Bright Blue) | Conversion Button Text |

---

## 8. Footer Section (`Footer`)

| Element | Target Text | Font Size (Mobile) | Font Size (Desktop) | Font Weight | Color Token | Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Footer Link 1** | `Privacy` | `12px` (`text-xs`) | `12px` (`text-xs`) | `700` (Bold) | `#94A3B8` (Slate-400) | Footer Legal Link |
| **Footer Link 2** | `Terms` | `12px` (`text-xs`) | `12px` (`text-xs`) | `700` (Bold) | `#94A3B8` (Slate-400) | Footer Legal Link |
| **Footer Copyright** | `© 2026 HealthStock. All rights reserved.` | `12px` (`text-xs`) | `12px` (`text-xs`) | `600` (SemiBold) | `#94A3B8` (Slate-400) | Legal Copyright Line |

---

## 9. Framer Motion Animation System Specs

### A. Scroll-Linked Progress & Hero Transforms
1. **Scroll Progress Bar**: `scaleX: scrollYProgress` mapped to fixed top progress line (`h-[3.5px] bg-[#0B53FA] origin-left z-[100]`).
2. **Hero Opacity & Scale Parallax**:
   - `heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])`
   - `heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])`
   - Hero section smoothly scales down to 95% and fades out as user scrolls down the first 20% of the page.

### B. Micro-Interactions & Hover Variants
1. **Button Scale Interaction**: `whileHover={{ scale: 1.03 }}` and `whileTap={{ scale: 0.97 }}` for tactile spring feedback.
2. **Card Lift Motion**: `whileHover={{ y: -6 }}` with `transition-all duration-300` smoothly lifts cards by 6px with an expanded shadow (`shadow-[0_20px_40px_rgba(15,47,87,0.08)]`).
3. **Arrow Motion**: `arrowMotion`: `rest: { x: 0 }`, `hover: { x: 5, transition: { type: "spring", stiffness: 400, damping: 10 } }` shifts arrow 5px to the right on hover.
4. **Active Navbar Underline**: Uses `motion.div layoutId="navbarActiveIndicator"` for smooth sliding underline transitions between `Home`, `Features`, and `Benefits`.

### C. Floating Hero Image Badges
1. **Adherence Floating Card**: `animate={{ y: [-6, 6, -6] }}` with `transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}`.
2. **Next Dose Floating Card**: `animate={{ y: [6, -6, 6] }}` with `transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}`.

### D. CTA Banner Ornament Animations
1. **Left Concentric Circles**: `animate={{ rotate: 360 }}` with `transition={{ repeat: Infinity, duration: 25, ease: "linear" }}`.
2. **Right Concentric Circles**: `animate={{ rotate: -360 }}` with `transition={{ repeat: Infinity, duration: 20, ease: "linear" }}`.
3. **Pulsing Core Dot**: `animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}` with `transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}`.
