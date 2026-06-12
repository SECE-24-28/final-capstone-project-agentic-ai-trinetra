# Product

## Register

product

## Users
Trinetra is used by evaluators, security operators, and technical stakeholders reviewing an MVP surveillance backend. They need to see whether the implemented services are reachable, authenticated workflows work, cameras can be managed, detections become events, and live notifications can surface operational activity.

## Product Purpose
The product demonstrates the backend capabilities of the Trinetra AI surveillance system through a functional operator dashboard. Success means the frontend clearly maps to the FastAPI backend: auth, health, system status, analytics, cameras, alerts/events, users, and WebSocket notifications are visible and testable from one interface.

## Brand Personality
Technical, security-heavy, and command-oriented. The interface should feel like a credible operations console for surveillance infrastructure rather than a marketing site or playful prototype.

## Anti-references
Avoid marketing landing pages, oversized hero sections, decorative AI-dashboard tropes, vague security theater, glassy sci-fi panels, and visuals that imply functionality not implemented in the backend.

## Design Principles
- Map the backend honestly: every major backend capability should have a visible frontend affordance or status.
- Prioritize operator clarity: service health, auth state, cameras, alerts, and live notifications must be easy to scan.
- Preserve MVP demo usefulness: failures, missing auth, empty data, and offline backend states should explain what happened and how to proceed.
- Use restraint for trust: dense, technical UI beats decorative polish for this product.
- Keep notification feedback immediate: presence or detection activity should surface as a clear popup without requiring a complex alert workflow.

## Accessibility & Inclusion
Use WCAG AA as the baseline, with high-contrast text, keyboard-accessible controls, visible focus states, readable status labels beyond color alone, and reduced-motion accommodations.
