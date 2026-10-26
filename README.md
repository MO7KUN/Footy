# Footy

A responsive football match centre with real scores and fixtures from ESPN's public football feed. No fabricated or simulated fixtures are used.

## Features

- Ten competitions, date navigation, team search and live/finished/upcoming filters.
- Shareable hash routes for each match, compatible with GitHub Pages.
- Score, key events, full commentary, venue and officials, starting lineups and substitutes, statistics, tournament tables with both teams highlighted, match reports and team-related articles when the provider supplies them.
- Followed matches persist on the device. Optional browser notifications for score and status changes while the site remains open.
- Football companion for loaded scores, match summaries and common rules. A secure generative AI endpoint can be connected in Settings; no API keys are accepted by or embedded in the static frontend.

## Hosting

The Sites checkout serves `dist/`. On GitHub, these static files are placed at the repository root so GitHub Pages can publish `main` / `(root)` without a build. All assets use relative paths, including under `/Footy/`.

Serve the static directory with any static HTTP server. Open `index.html` over HTTP(S), rather than a `file:` URL.

## AI connection

The AI endpoint must accept HTTPS `POST` JSON `{ "message": "...", "context": {...} }` and return `{ "answer": "..." }`. Configure the endpoint in Settings for the current device or set the public endpoint URL in `config.js` for all visitors. The server must handle CORS for the Footy origin, authenticate or rate-limit requests, bound request/output sizes, and keep provider credentials in server secrets. A URL being saved does not verify the endpoint is reachable. Until an AI service is connected, the UI explicitly identifies its built-in companion as non-generative.

## Coverage and limitations

ESPN's public endpoints are not a contracted commercial feed and may change, throttle or omit coverage. Requests refresh every 30 seconds while the page is visible; provider latency still applies. Missing data and feed errors are shown explicitly. Match statistics and lineups are not guaranteed for every competition. Tables reflect the provider's latest published standings, not a locally calculated live table. Article headlines link to the original publisher rather than reproducing full articles. Team logos remain the property of their respective owners.

Notifications require browser support and permission. The site polls while open; it does not provide background push after the tab closes. Follows and preferences are local to the browser and are not synced across devices.

## Privacy

The frontend stores follows, alert preference and AI endpoint URL in browser local storage. It requests match data and logos from ESPN and fonts from Google Fonts. Chat questions and visible match context are sent only to the AI endpoint explicitly configured for the site. Never put API keys, bearer tokens or other secrets in the endpoint URL, `config.js`, or this public repository.
