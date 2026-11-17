# LaunchTwin AI — High-Trust Landing Page (Part 1)

This directory contains the standalone, high-trust B2B SaaS landing page for LaunchTwin AI. It is built as an independent Vite + React + TypeScript + Tailwind CSS application with self-hosted typography and zero external runtime tracking.

## Technology Stack & Architectural Principles

- **Framework**: Vite 8 + React 19 + TypeScript 5.8
- **Styling**: Tailwind CSS v4 + Pure Vanilla CSS design tokens
- **Typography**: Self-hosted via `@fontsource/plus-jakarta-sans` (body) and `@fontsource/jetbrains-mono` (numbers/currencies)
- **Icons**: `lucide-react`
- **Math Library**: `decimal.js` (installed for exact financial math in Part 2)
- **Zero Hallucination / Ground Truth**: Every metric, threshold, and stage weight maps directly to verified backend Python code documented in [`landing/FACTS.md`](./FACTS.md).

## Local Development & Setup

### Prerequisites
- Node.js >= 18 (Tested on Node v24)
- npm >= 9

### Configuration
Copy `.env.example` to `.env` (or let defaults apply):
```bash
cp .env.example .env
```
Key variables:
- `VITE_APP_URL`: Base URL for the main application (default: `http://localhost:5173`). All CTAs dynamically link to this target (`/` and `/new-analysis`).

### Available Scripts

Run all commands inside the `landing/` directory:

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **dev** | `npm run dev` | Starts local dev server at `http://localhost:5174` |
| **build** | `npm run build` | Typechecks and compiles production bundle to `dist/` |
| **preview** | `npm run preview` | Previews production build locally on port 5174 |
| **typecheck** | `npm run typecheck` | Validates TypeScript types with `tsc --noEmit` |
| **lint** | `npm run lint` | Fast static analysis via `oxlint` |
| **test** | `npm run test` | Executes unit and navigation tests via `vitest` |

## Verified Content & Pipeline Architecture

The landing page implements the top half of the application (Part 1):
1. **Header & Sticky Navigation**: Responsive navbar with skip link, section anchors, and dynamic app CTA.
2. **Hero**: Headline, promise line (*"AI finds the evidence. Python rules decide the verdict."*), dual CTAs, and a static sample readiness card labelled **"Example"** displaying proved Vector A baseline unit economics.
3. **The Problem**: Concrete examination of the 3 root causes of D2C launch failure (Spreadsheet Guesswork, Hidden Cost Compounding, Inverted Marketing Economics).
4. **How It Works**: 3-step workflow from assumption inputs to safe web evidence collection to deterministic Python evaluation.
5. **The 6-Stage Pipeline**: Customer, Competitor, Product Packaging, Pricing, Financial, and Marketing stages with exact thresholds and critical stage veto logic.
6. **Architecture Comparison**: AI Investigator (safe extraction, SSRF defense, verbatim quotes, 80% confidence ceiling) vs Python Judge (pure domain rules, 50-digit `Decimal` precision, absolute veto authority).
