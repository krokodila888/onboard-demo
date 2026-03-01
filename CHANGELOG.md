# Changelog

All notable changes to this project are documented here.

## [0.1.0] — 2026-03-01

### Added
- **AdvancedTractionCalculator** — multi-step traction calculator (Steps 1–3: locomotive params → traction characteristics → operating indicators) with progress bar, collapsible sections, inline SVG F(v) chart, and summary cards
- **О проекте page** — full research-context page with goal, features, library cards, criteria comparison table (7 rows × 4 libraries with star ratings), 7-step testing methodology, and 8 typical onboarding problem patterns
- **React Joyride** onboarding integration (7-step guided tour, state-driven via `useState`)
- **Shepherd.js** onboarding integration with Floating UI positioning
- **Intro.js** onboarding integration via data-attributes + JS API
- **Driver.js** onboarding integration with spotlight / overlay effect
- **ErrorBoundary** component — class-based error boundary with recovery UI (retry + reload)
- **Favicon** — custom SVG train icon on blue background (`/favicon.svg`)
- Keyboard shortcut **Ctrl+T** to start onboarding tour on active tab
- ESLint flat config (`eslint.config.js`) with `react`, `react-hooks`, `react-refresh`, and `prettier` rules
- Prettier config (`.prettierrc`) — semi-free, single quotes, 100-char print width
- npm scripts: `lint` and `format`
- Open Graph and meta description tags in `index.html`

### Changed
- `AboutPage` is now **lazy-loaded** via `React.lazy` + `Suspense` to reduce initial bundle
- `AdvancedTractionCalculator` wrapped with `React.memo` to prevent unnecessary re-renders
- `handleStartTour` converted to `useCallback` for stable reference
- Tab buttons include ARIA `aria-controls` / `id` attributes; `tablist` has `aria-label`
- Removed all `console.log` calls from onboarding integration hooks
- Favicon updated from default Vite logo to custom `/favicon.svg`
- Page title updated to include subtitle; meta description added

## [0.0.1] — initial

- Baseline React + Vite + Tailwind project scaffold
- Basic traction calculator prototype
- Tab-based UI with four onboarding library placeholders
