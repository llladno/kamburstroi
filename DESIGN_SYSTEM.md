# DESIGN SYSTEM — Premium Renovation / Interior Finishing

> Design system extracted from the provided reference landing-page screenshot and adapted for a premium interior finishing / renovation company.
>
> **Core rule:** preserve the reference visual language. Change the content, imagery, and service-specific information — not the visual DNA.

---

## 0. Design North Star

### Visual direction

**Premium minimalism + architectural editorial + soft UI + subtle glass.**

The interface should feel:

- premium
- calm
- precise
- spacious
- architectural
- residential
- modern
- trustworthy
- understated

It should **not** feel like a generic construction website.

### One-line visual brief

> A high-end architectural website with large rounded surfaces, asymmetrical composition, restrained typography, immersive photography, soft off-white UI, pill controls, subtle blur, and almost invisible shadows.

---

# 1. Design Principles

## 1.1 Photography is the visual hero

Use large, realistic, high-quality interior and architecture photography as the dominant visual element.

Prefer:

- completed interiors
- premium apartments
- modern private houses
- natural materials
- wood / stone / plaster / glass
- daylight
- architectural compositions
- realistic lived-in spaces

Avoid:

- obvious stock-photo poses
- workers looking at camera
- low-resolution images
- excessive staging
- illustrations as the primary visual
- overly saturated HDR imagery

---

## 1.2 White space is structural

Do not fill empty areas simply because there is space.

Whitespace is part of the design.

Primary content should breathe around it.

---

## 1.3 Rounded geometry everywhere

The visual language is based on large rounded surfaces.

Use:

- 38–40px radius for major panels
- 20px radius for cards
- pill shapes for controls
- circular photo badges

Avoid sharp corners unless the content absolutely requires them.

---

## 1.4 Shadows should almost disappear

The reference relies on surfaces, contrast, and photography rather than strong elevation.

Use extremely soft shadows only.

Avoid:

```css
box-shadow: 0 15px 50px rgba(0, 0, 0, 0.18);
```

Prefer:

```css
box-shadow: 0 8px 25px rgba(20, 25, 30, 0.025);
```

---

## 1.5 Glass is a detail, not the style

Use glassmorphism only on floating controls and selected cards.

Do not make the whole website transparent or blurred.

Correct:

```css
background: rgba(255, 255, 255, 0.75);
backdrop-filter: blur(12px);
```

Incorrect:

```css
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(40px);
```

---

# 2. Color System

The palette is deliberately monochrome and warm-neutral.

## 2.1 Base colors

| Token | HEX | Usage |
|---|---|---|
| `--color-bg` | `#FFFFFF` | Page background |
| `--color-surface` | `#F3F4F5` | Main hero / large surfaces |
| `--color-card` | `#FAFAFB` | Cards |
| `--color-text` | `#17191B` | Main headings / primary text |
| `--color-text-secondary` | `#45494D` | Paragraphs / secondary content |
| `--color-text-muted` | `#92969A` | Metadata / navigation / supporting text |
| `--color-primary` | `#222528` | CTA / dark controls |
| `--color-primary-text` | `#FFFFFF` | Text on dark controls |

## 2.2 Borders

```css
--color-border: rgba(0, 0, 0, 0.04);
--color-border-light: rgba(255, 255, 255, 0.60);
```

Borders should be subtle enough to be perceived only when needed.

## 2.3 Glass surface

```css
--color-glass: rgba(255, 255, 255, 0.75);
```

## 2.4 No accent explosion

Do not introduce:

- construction orange
- bright green
- bright red
- electric blue
- neon gradients

A restrained monochrome palette is one of the main characteristics of the reference.

---

# 3. Typography

## 3.1 Font

Primary:

```text
Manrope
```

Acceptable fallback order:

```text
Manrope, Onest, Inter, system-ui, sans-serif
```

Use one family throughout the product whenever possible.

---

## 3.2 Font weights

Preferred weights:

```text
400 — regular
500 — medium / main headings
600 — strong emphasis
```

Avoid 700–900 for normal interface content.

The main hero heading should feel elegant and controlled, not heavy.

---

## 3.3 Type scale

### Hero heading

```text
34–36px
500 weight
1.15–1.22 line height
-0.025em letter spacing
```

### Section heading

```text
30–38px
500 weight
1.15–1.2 line height
```

### Large display number

```text
40–43px
400–500 weight
1.0 line height
```

### Body

```text
15–16px
400 weight
1.4 line height
```

### Navigation

```text
12–13px
400 weight
```

### Caption / metadata

```text
12–13px
400 weight
1.35–1.45 line height
```

---

# 4. Radius System

```css
--radius-hero: 38px;
--radius-panel: 32px;
--radius-card: 20px;
--radius-control: 999px;
--radius-circle: 50%;
```

### Usage

| Element | Radius |
|---|---:|
| Hero panel | `38–40px` |
| Large content section | `28–32px` |
| Card | `20px` |
| Button | `999px` |
| Floating control | `999px` |
| Avatar / image badge | `50%` |

---

# 5. Shadow System

## Card

```css
--shadow-card: 0 8px 25px rgba(20, 25, 30, 0.025);
```

## Floating controls

```css
--shadow-floating: 0 5px 20px rgba(20, 25, 30, 0.07);
```

## Main surfaces

Usually no visible shadow.

### Rule

> When you think the shadow is obvious, make it weaker.

---

# 6. Layout System

## 6.1 Desktop base

Reference composition:

```text
1280 × 720
```

Outer page padding:

```text
8–12px
```

Main hero gap:

```text
12–14px
```

Hero height:

```text
~688px in the reference composition
```

---

## 6.2 Hero split

Use an asymmetric layout.

```css
.hero {
  display: grid;
  grid-template-columns: 1.30fr 1fr;
  gap: 13px;
}
```

Equivalent target ratio:

```text
Left : Right ≈ 55 : 45
```

Do not use a 50/50 split unless a responsive breakpoint requires it.

---

# 7. Hero Panel

## Left panel

```css
background: #F3F4F5;
border-radius: 38px;
position: relative;
overflow: hidden;
```

Add very subtle ambient light using low-opacity radial gradients.

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

The gradient must remain nearly invisible.

---

## Right panel

```css
border-radius: 38px;
overflow: hidden;
position: relative;
```

Image:

```css
width: 100%;
height: 100%;
object-fit: cover;
object-position: 55–60% center;
```

---

# 8. Header

Header should be understated.

Structure:

```text
LOGO     Navigation item     Navigation item     Navigation item
```

Typical spacing:

```text
left padding: ~108–112px
upper padding: ~55–60px
gap between nav items: 42–48px
```

Navigation color:

```css
#92969A
```

Navigation size:

```text
12–13px
```

Do not make the header visually dominant.

---

# 9. Hero Content

Recommended width:

```text
450–500px
```

Approximate position in the reference:

```text
top: 132–138px
left: 119–120px
```

This is not a universal hardcoded coordinate. Preserve the **visual relationship** instead:

- header above
- heading below with generous whitespace
- description close to heading
- CTA below description
- statistics anchored toward the bottom

---

# 10. CTA Buttons

## Primary CTA

Target size:

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

Arrow:

```text
12–13px
```

Place the arrow on the far right inside the button.

### Button spacing

Typical vertical rhythm:

```text
Hero heading
↓ 12–16px
Description
↓ 48–56px
CTA
```

---

# 11. Floating Image Controls

Place them near the top-left of the hero image.

Typical positioning:

```text
top: 47–50px
left: 52px
```

Group:

```text
display: flex
gap: 10–12px
```

Control height:

```text
39–42px
```

Background:

```css
rgba(255, 255, 255, .95)
```

Radius:

```text
999px
```

Blur:

```css
backdrop-filter: blur(12px);
```

Shadow:

```css
0 5px 20px rgba(20,25,30,.07)
```

---

# 12. Statistics Cards

Exactly three cards in the reference pattern.

Target dimensions:

```text
~162 × 173px
```

Gap:

```text
~14px
```

Card:

```css
background: rgba(255,255,255,.75);
border-radius: 20px;
box-shadow: var(--shadow-card);
```

Place cards in a horizontal group near the bottom of the left panel.

---

## 12.1 Image badge

Each statistic card gets a circular photo badge overlapping its top edge.

Target diameter:

```text
38–40px
```

Position:

```text
top: -18px
left: ~34px
```

Border:

```text
3px solid #F3F4F5
```

Use a real project image crop where possible.

---

## 12.2 Statistic value

```text
40–43px
400–500 weight
#17191B
```

Examples:

```text
7+
180+
45
```

Secondary symbols such as `+` or `~` may use muted gray.

---

## 12.3 Statistic label

```text
12–13px
400 weight
17px line height
#70757A / #92969A
```

Keep labels short.

Good:

```text
лет опыта
объектов завершили
месяцев гарантии
```

Bad:

```text
Мы уже более семи лет выполняем строительные работы...
```

---

# 13. Iconography

Use thin interface icons.

Recommended:

```text
Lucide Icons
```

Stroke:

```text
1.5–1.8px
```

Typical size:

```text
12–14px
```

Color:

```text
#6B7075
```

Avoid large decorative iconography.

---

# 14. Photography Rules

## Interior photography prompt characteristics

```text
premium residential interior
architectural photography
natural daylight
soft shadows
realistic materials
high-end renovation
warm natural wood
stone
microcement
large windows
clean composition
cinematic but realistic
editorial architectural photography
```

### Image treatment

Avoid excessive overlays.

Do not darken every photo dramatically.

The image should look premium because of the photography itself, not because of filters.

---

# 15. Motion

Animation should be subtle.

Recommended duration:

```text
180–280ms
```

Recommended easing:

```text
cubic-bezier(0.22, 1, 0.36, 1)
```

Good animations:

- slight button lift
- small arrow translation
- image scale 1.01–1.02 on hover
- card transition
- subtle opacity reveal

Avoid:

- aggressive parallax
- bouncing cards
- large scale animations
- flashy entrance animations

---

# 16. Interaction States

## Primary button hover

```css
transform: translateY(-1px);
```

Optional subtle shadow:

```css
box-shadow: 0 8px 24px rgba(20,25,30,.10);
```

## Image hover

```css
transform: scale(1.015);
```

The interaction must remain calm.

---

# 17. Responsive Rules

## Desktop ≥ 1100px

Keep asymmetric split hero.

```text
~55% / ~45%
```

## Tablet 768–1099px

Keep split composition but reduce internal padding.

Recommended:

```text
52% / 48%
```

## Mobile < 768px

Switch to vertical flow:

```text
Header
↓
Hero text
↓
CTA
↓
Image
↓
Stats
```

Do not simply shrink the desktop layout.

### Mobile principles

- 22–24px page padding
- 28–32px panel radius
- heading ~30–34px
- body ~15px
- CTA full width where useful
- floating image controls can wrap
- statistics become a 1×3 or 3×1 stack depending on content density

---

# 18. Component Architecture

Recommended component system:

```text
Page
├── Header
├── Hero
│   ├── HeroContent
│   │   ├── Eyebrow (optional)
│   │   ├── HeroHeading
│   │   ├── HeroDescription
│   │   └── PrimaryButton
│   ├── HeroStats
│   │   └── StatCard × 3
│   └── HeroImage
│       └── FloatingActionGroup
├── Services
├── Projects
├── Process
├── Reviews
├── FAQ
└── Footer
```

All sections must visually inherit the hero's language.

---

# 19. Section Continuity

Do not create unrelated visual styles for every section.

All sections should reuse:

- same typography
- same radii
- same neutral palette
- same restrained shadows
- same pill controls
- same photography quality
- same spacing philosophy

Recommended section patterns:

### Services
Large rounded cards with service title + short description + project image.

### Projects
Large image-led cards with minimal metadata.

### Process
Simple horizontal / vertical timeline with rounded surfaces.

### Reviews
Large quote cards, restrained typography.

### FAQ
Minimal accordion with generous spacing.

---

# 20. Content Rules for Renovation Company

Use concrete, outcome-focused wording.

Prefer:

```text
Отделка под ключ
Смета до начала работ
Фиксируем этапы и сроки
Контроль качества
Авторский надзор
Гарантия на работы
```

Avoid:

```text
Мы молодая динамично развивающаяся компания...
Огромный опыт и индивидуальный подход...
Лучшие специалисты на рынке...
Низкие цены!!!
```

The copy should feel precise and confident rather than loud.

---

# 21. Hero Content Template

Recommended structure:

```text
[small eyebrow, optional]

Главный результат
+ конкретное преимущество

Короткое объяснение процесса / ценности.

[Primary CTA]

[3 key metrics]
```

Example:

```text
Отделка квартиры
под ключ за 45 дней

Выполним весь комплекс работ — от черновой
подготовки до финального монтажа.

[Рассчитать стоимость ↘]

7+           180+          12 мес.
лет опыта    объектов       гарантии
```

---

# 22. CSS Variables — Ready to Use

```css
:root {
  /* Colors */
  --color-bg: #ffffff;
  --color-surface: #f3f4f5;
  --color-card: #fafafb;
  --color-text: #17191b;
  --color-text-secondary: #45494d;
  --color-text-muted: #92969a;
  --color-primary: #222528;
  --color-primary-text: #ffffff;
  --color-border: rgba(0, 0, 0, 0.04);
  --color-border-light: rgba(255, 255, 255, 0.60);
  --color-glass: rgba(255, 255, 255, 0.75);

  /* Radius */
  --radius-hero: 38px;
  --radius-panel: 32px;
  --radius-card: 20px;
  --radius-control: 999px;

  /* Shadows */
  --shadow-card: 0 8px 25px rgba(20, 25, 30, 0.025);
  --shadow-floating: 0 5px 20px rgba(20, 25, 30, 0.07);

  /* Typography */
  --font-family: "Manrope", "Onest", "Inter", system-ui, sans-serif;

  /* Layout */
  --hero-gap: 13px;
  --page-padding: 10px;

  /* Motion */
  --duration-fast: 180ms;
  --duration-normal: 240ms;
  --ease-premium: cubic-bezier(0.22, 1, 0.36, 1);
}
```

---

# 23. Non-Negotiable Visual Constraints

These constraints should survive all design iterations:

1. **Asymmetric 55/45 hero split.**
2. **Large 38–40px rounded hero panels.**
3. **Off-white left surface + immersive right photography.**
4. **Manrope-style modern grotesk.**
5. **Medium-weight, not bold, hero heading.**
6. **Dark pill CTA.**
7. **Three overlapping statistic cards.**
8. **Floating white pills on the photo.**
9. **Very soft shadows.**
10. **Monochrome neutral palette.**
11. **Subtle glass only where appropriate.**
12. **Large whitespace and restrained content density.**

---

# 24. Anti-Patterns

The generated page is off-brand when it resembles:

- a generic construction template
- a real-estate marketplace
- a loud home-improvement landing page
- a Bootstrap corporate website
- an e-commerce interface
- a dark cyberpunk / neon UI
- a heavily glassmorphic dashboard
- a template with every section using a different card style

---

# 25. Design Validation Checklist

Before considering the page complete, verify:

- [ ] Hero composition is asymmetric.
- [ ] Main image is visually dominant.
- [ ] Left panel feels light and airy.
- [ ] Heading is medium-weight, not heavy.
- [ ] CTA is a dark pill.
- [ ] Three stat cards are visually integrated into the hero.
- [ ] Photo badges overlap the stat cards.
- [ ] Floating controls sit over the image.
- [ ] Radius values are consistent.
- [ ] Shadows are barely visible.
- [ ] Colors remain neutral.
- [ ] No unnecessary accents were introduced.
- [ ] No section feels visually unrelated to the hero.
- [ ] Mobile redesign preserves the same visual language.

---

# 26. Final Art Direction Statement

> Build a premium renovation website that feels like an architectural studio rather than a conventional construction company. The interface should use large rounded surfaces, asymmetric composition, minimal typography, soft neutral backgrounds, immersive photography, subtle floating controls, and extremely restrained depth. Every element should feel intentional, calm, and expensive.
