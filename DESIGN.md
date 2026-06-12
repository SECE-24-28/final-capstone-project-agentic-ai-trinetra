# Design

## Overview
Trinetra uses a restrained security-operations console style: near-black architecture, olive command accents from the project seed, bright semantic status colors, compact data panels, and clear form controls. The UI should feel technical and reliable, not theatrical.

## Color
Use OKLCH tokens. Strategy: restrained product UI with accent usage under 10%.

```css
--bg: oklch(0.080 0.000 0);
--surface: oklch(0.130 0.010 110);
--surface-2: oklch(0.180 0.012 110);
--ink: oklch(0.950 0.004 110);
--muted: oklch(0.710 0.018 110);
--primary: oklch(0.650 0.100 110);
--primary-strong: oklch(0.540 0.120 112);
--accent: oklch(0.680 0.145 28);
--danger: oklch(0.620 0.190 25);
--warning: oklch(0.760 0.150 82);
--success: oklch(0.690 0.145 150);
--info: oklch(0.720 0.105 220);
--border: oklch(0.270 0.016 110);
```

## Typography
Use Geist Sans for all interface text and Geist Mono for identifiers, endpoint names, counters, timestamps, and payload snippets. Product headings are fixed-size and compact, not fluid hero type.

## Components
Primary surfaces are app shell regions, panels, tables, tabs, segmented controls, status pills, field groups, and toast notifications. Cards are only used for repeated data panels and stay at 8px radius.

## Layout
Desktop uses a left navigation rail and a dense main dashboard. Mobile collapses into a stacked command surface with all actions available without horizontal scrolling.

## Motion
Motion is limited to state feedback: toast entry, loading pulse, hover/focus transitions. All movement must respect `prefers-reduced-motion`.
