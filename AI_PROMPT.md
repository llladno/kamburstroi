# AI PROMPT — Build the Website in the Reference Design Language

You are a senior product designer and frontend engineer.

Your task is to design and implement a **premium interior finishing / renovation company website** using the provided reference screenshot as the **primary visual source of truth**.

The website must preserve the reference's visual language extremely closely. Adapt the **content and photography** to renovation / finishing services, but do not replace the design concept with another style.

---

# 1. PRIMARY INSTRUCTION

**Reproduce the reference design language, not a generic interpretation of it.**

The result should immediately feel like the same design family as the reference screenshot.

Preserve:

- asymmetrical hero composition
- 55/45 visual balance
- large rounded panels
- off-white left surface
- full-bleed architectural photography on the right
- restrained typography
- dark pill CTA
- floating white controls over the image
- three statistic cards with overlapping circular images
- very soft shadows
- subtle glass / blur only on floating controls
- generous whitespace
- monochrome neutral palette

Do not redesign these fundamentals.

---

# 2. BUSINESS CONTEXT

The company provides premium interior finishing and renovation services.

Services may include:

- apartment renovation
- house finishing
- turnkey renovation
- rough finishing
- decorative finishing
- painting
- plastering
- flooring
- wall finishing
- lighting installation
- final installation
- project supervision

The company should feel established, precise, premium and trustworthy.

Do not use clichéd construction branding.

---

# 3. HERO — HIGHEST PRIORITY

Build the hero first and match the reference composition before creating the rest of the page.

Desktop reference canvas:

```text
1280 × 720
```

Outer page padding:

```text
8–12px
```

Hero:

```text
Left panel  ≈ 55%
Right panel ≈ 45%
Gap         ≈ 13px
Radius      ≈ 38–40px
```

Use:

```css
grid-template-columns: 1.30fr 1fr;
gap: 13px;
```

The layout must feel visually asymmetric.

Do not use a 50/50 split.

---

# 4. LEFT HERO PANEL

Use an off-white surface:

```text
#F3F4F5
```

with very subtle ambient radial light.

Example:

```css
background:
  radial-gradient(
    circle at 70% 20%,
    rgba(255,255,255,.90),
    transparent 42%
  ),
  radial-gradient(
    circle at 20% 70%,
    rgba(255,255,255,.45),
    transparent 40%
  ),
  #F3F4F5;
```

The gradients must be subtle. They should support the surface, not look decorative.

Hero panel:

```css
border-radius: 38px;
overflow: hidden;
position: relative;
```

---

# 5. HEADER

Place a compact header inside the left hero panel.

Structure:

```text
LOGO     Наши работы     Услуги     Процесс     Контакты
```

The navigation is intentionally understated.

Typography:

```text
12–13px
400 weight
#92969A
```

Spacing between nav items:

```text
42–48px
```

Header should never overpower the hero heading.

---

# 6. HERO COPY

Position the main content around the same visual area as the reference.

Approximate desktop relationship:

```text
top: 132–138px
left: 119–120px
max-width: 450–500px
```

Do not obsess over exact hardcoded coordinates on every screen size; reproduce the visual rhythm and relationships.

Recommended heading:

```text
Отделка квартиры
под ключ за 45 дней
```

Alternative:

```text
Отделочные работы
под ключ для квартир и домов
```

Description:

```text
Выполним весь комплекс работ — от черновой подготовки
до финального монтажа, с контролем качества на каждом этапе.
```

Copy must be concise.

Avoid exaggerated marketing claims.

---

# 7. TYPOGRAPHY

Use:

```text
Manrope
```

Fallback:

```text
Onest, Inter, system-ui, sans-serif
```

### Hero heading

```text
34–36px
500 weight
1.15–1.22 line-height
-0.025em tracking
#17191B
```

The heading must NOT look bold or aggressive.

### Body

```text
15–16px
400 weight
~1.4 line-height
#45494D
```

### Navigation

```text
12–13px
400
#92969A
```

---

# 8. CTA

Create one dominant dark CTA.

Text:

```text
Рассчитать стоимость ↘
```

Approximate size:

```text
244 × 58px
```

Style:

```css
background: #222528;
color: #FFFFFF;
border-radius: 999px;
font-size: 13px;
font-weight: 500;
```

No gradient.

No bright accent color.

No giant icon.

Use a tiny elegant arrow on the right.

---

# 9. STATISTICS

At the bottom of the left hero panel, create exactly three stat cards.

Suggested content:

```text
7+           лет опыта
180+         объектов завершили
12 мес.      гарантии
```

Target card dimensions:

```text
~162 × 173px
```

Radius:

```text
20px
```

Background:

```text
rgba(255,255,255,.75)
```

Shadow:

```text
0 8px 25px rgba(20,25,30,.025)
```

Each card gets a small circular project-photo badge overlapping the top edge.

Badge:

```text
38–40px diameter
3px light border
~18px upward overlap
```

The badge should look embedded into the card composition.

---

# 10. RIGHT HERO IMAGE

Use a premium architectural / interior photograph.

The right panel must be almost entirely image.

```css
width: 100%;
height: 100%;
object-fit: cover;
object-position: 55% center;
```

Visual characteristics:

```text
premium residential interior
architectural photography
natural daylight
realistic materials
wood / stone / plaster / glass
large windows
modern apartment or house
cinematic but realistic
high-end editorial photography
```

The image should feel like a finished project, not a stock construction photo.

---

# 11. FLOATING IMAGE CONTROLS

Near the top-left of the image, place two small white pill controls.

Example:

```text
[ ↘  Оставить заявку ] [ ☎  +7 (999) 989-88-89 ]
```

Height:

```text
39–42px
```

Radius:

```text
999px
```

Background:

```text
rgba(255,255,255,.95)
```

Blur:

```css
backdrop-filter: blur(12px);
```

Shadow:

```text
0 5px 20px rgba(20,25,30,.07)
```

Icons:

```text
12–14px
1.5–1.8px stroke
#6B7075
```

They should float above the image without becoming visually heavy.

---

# 12. COLOR PALETTE

Use ONLY this core palette unless there is a very specific accessibility reason to add another neutral.

```text
#FFFFFF  page background
#F3F4F5  hero surface
#FAFAFB  cards
#17191B  primary text
#45494D  secondary text
#92969A  muted text
#222528  dark CTA
#FFFFFF  text on dark CTA
```

Do not introduce:

- orange
- bright green
- red
- neon blue
- purple gradients
- colorful construction accents

The monochrome palette is intentional.

---

# 13. RADIUS

Use:

```text
Hero:     38–40px
Panels:   28–32px
Cards:    20px
Controls: 999px
Circles:  50%
```

All major components should share the same rounded language.

---

# 14. SHADOWS

Shadows should be almost invisible.

Card:

```css
box-shadow: 0 8px 25px rgba(20, 25, 30, 0.025);
```

Floating controls:

```css
box-shadow: 0 5px 20px rgba(20, 25, 30, 0.07);
```

Do NOT use strong shadows.

---

# 15. GLASS EFFECT

Use subtle glass only where useful.

Correct:

```css
background: rgba(255,255,255,.75);
backdrop-filter: blur(12px);
```

Incorrect:

```css
background: rgba(255,255,255,.15);
backdrop-filter: blur(40px);
```

The site is **not** a glassmorphism showcase.

---

# 16. ICON STYLE

Use thin, geometric utility icons.

Prefer Lucide-style icons.

```text
stroke: 1.5–1.8px
size: 12–14px
color: #6B7075
```

Avoid decorative icon sets.

---

# 17. COMPONENTS FOR THE REST OF THE SITE

After the hero matches the reference, extend the same design language to the rest of the website.

Recommended structure:

```text
Header
Hero
Services
Projects
Process
Advantages
Reviews
FAQ
CTA
Footer
```

Use large rounded surfaces and generous whitespace throughout.

---

## Services

Use elegant project-like cards.

Each service card may contain:

```text
large image
service name
short description
small arrow
```

Avoid dense grids.

---

## Projects

Use large photography-first project cards.

Metadata should be minimal:

```text
Квартира · 94 м²
Отделка под ключ
```

---

## Process

Use a simple numbered sequence.

Example:

```text
01  Замер
02  Смета
03  Подготовка
04  Работы
05  Сдача
```

Keep the treatment minimal.

---

## Reviews

Large rounded quote cards.

Use small metadata and generous line-height.

---

## FAQ

Minimal accordion with large click areas and no heavy borders.

---

# 18. SPACING

Use a spacious rhythm.

Suggested scale:

```text
8
12
16
20
24
32
40
48
56
64
80
96
120
```

Do not compress sections merely to fit more information on screen.

---

# 19. MOTION

Use subtle motion only.

Duration:

```text
180–280ms
```

Easing:

```text
cubic-bezier(0.22, 1, 0.36, 1)
```

Good:

- button moves up 1px on hover
- arrow shifts 2–4px
- image scales 1.01–1.02
- cards gently transition

Avoid:

- bouncing
- dramatic parallax
- huge scaling
- flashy page transitions

---

# 20. RESPONSIVE BEHAVIOR

## Desktop ≥ 1100px

Maintain:

```text
55 / 45 split
```

## Tablet 768–1099px

Keep the asymmetry but reduce padding.

Approximate:

```text
52 / 48
```

## Mobile < 768px

Stack the composition.

Order:

```text
Header
Hero copy
CTA
Image
Statistics
```

Use:

```text
22–24px horizontal padding
28–32px major radii
30–34px heading
15px body
```

Do not simply scale down the desktop design.

---

# 21. MOBILE HERO

On mobile, preserve the same DNA:

- off-white surface
- rounded corners
- large photography
- dark pill CTA
- restrained typography
- generous whitespace

Floating image controls may wrap into two rows when necessary.

Stats may become vertical cards or a compact grid depending on available width.

---

# 22. ACCESSIBILITY

Keep the visual style premium without sacrificing usability.

Requirements:

- semantic HTML
- visible keyboard focus
- sufficient contrast
- alt text for meaningful images
- buttons must be buttons
- navigation must be real links
- mobile hit areas at least ~44px high

Do not solve accessibility by introducing bright colors everywhere. Adjust contrast primarily through neutral values.

---

# 23. FRONTEND IMPLEMENTATION RULES

When implementing:

- use clean reusable components
- centralize design tokens
- avoid one-off styles when a shared token is appropriate
- preserve consistent spacing
- avoid magic numbers unless they directly reproduce the reference composition
- keep responsive behavior intentional
- use CSS variables for colors, radii, shadows and motion

Recommended root variables:

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f3f4f5;
  --color-card: #fafafb;
  --color-text: #17191b;
  --color-text-secondary: #45494d;
  --color-text-muted: #92969a;
  --color-primary: #222528;
  --color-primary-text: #ffffff;
  --color-border: rgba(0, 0, 0, 0.04);
  --color-glass: rgba(255, 255, 255, 0.75);

  --radius-hero: 38px;
  --radius-card: 20px;
  --radius-control: 999px;

  --shadow-card: 0 8px 25px rgba(20, 25, 30, 0.025);
  --shadow-floating: 0 5px 20px rgba(20, 25, 30, 0.07);

  --font-family: "Manrope", "Onest", "Inter", system-ui, sans-serif;

  --ease-premium: cubic-bezier(0.22, 1, 0.36, 1);
}
```

---

# 24. VERY IMPORTANT — WHAT NOT TO DO

Do not generate:

```text
❌ generic construction website
❌ loud orange construction branding
❌ green construction branding
❌ dark corporate blocks everywhere
❌ 50/50 hero split
❌ sharp rectangular cards
❌ giant 64–80px bold headlines
❌ heavy 700–900 typography
❌ strong drop shadows
❌ excessive glassmorphism
❌ colorful gradients
❌ huge icons
❌ stock worker photography
❌ overloaded navigation
❌ dense dashboards
❌ every section with a different visual style
```

---

# 25. VISUAL QA LOOP

After the first implementation, inspect the result as a designer, not only as an engineer.

Ask:

1. Does the hero immediately resemble the reference composition?
2. Is the left/right balance still around 55/45?
3. Are the hero panels large enough and rounded enough?
4. Is the typography elegant rather than bold?
5. Is the photo the dominant visual?
6. Are the stat cards integrated into the hero rather than looking like a dashboard?
7. Are the shadows almost invisible?
8. Are the floating controls light and pill-shaped?
9. Is the palette truly neutral?
10. Does the page feel expensive without looking flashy?

If any answer is no, adjust the composition before adding more visual elements.

---

# 26. MASTER ART-DIRECTION PROMPT

Use this paragraph as the condensed visual instruction when another AI tool needs a shorter prompt:

> Create a premium minimalist website for an interior finishing and renovation company, closely matching the provided reference screenshot. Preserve the reference's asymmetric 55/45 hero layout, two large rounded panels, off-white left surface, immersive full-bleed architectural photograph on the right, Manrope-style modern grotesk typography, medium-weight 34–36px hero heading, dark charcoal pill CTA, three rounded statistic cards with overlapping circular project-photo badges, and two small white pill controls floating over the hero image. Use a restrained monochrome palette (#FFFFFF, #F3F4F5, #FAFAFB, #17191B, #45494D, #92969A, #222528), extremely soft shadows, generous whitespace, subtle blur only on floating controls, and premium architectural photography. The result should feel calm, expensive, precise, modern and editorial — like an architectural studio — not like a generic construction template. Do not introduce bright colors, orange/green construction branding, heavy shadows, huge bold typography, strong glassmorphism, gradients, or excessive icons. Adapt only the content and photography to renovation / finishing services while preserving the original visual DNA.

---

# 27. FINAL SUCCESS CRITERIA

The implementation is successful when:

- the first screen has nearly the same visual rhythm as the reference
- the asymmetric hero composition is immediately recognizable
- the image-to-content ratio feels the same
- the rounded geometry is consistent
- typography remains quiet and elegant
- the CTA is a dark pill
- the stats feel like part of the hero architecture
- floating controls feel lightweight
- the whole website shares one coherent design language
- renovation content feels natural inside the visual system

**Priority order:**

```text
1. Composition
2. Image quality
3. Spacing
4. Typography
5. Radius
6. Color
7. Micro-interactions
```

Never sacrifice the composition to add more content.
