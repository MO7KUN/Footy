# Footy

## Leagues and clubs

Use Leagues and Clubs in the main navigation, or open a competition from a score group and a club from a match header, table, player leaderboard or knockout tie.

League pages contain sourced historical title records, the previous completed season's champion, current/historical tables, goals/assists/shots/saves leaderboards, club lists, a monthly fixture calendar, knockout graphs for UEFA competitions and MLS, and a statistical gameweek XI. Club pages contain available details, a searchable squad grouped by position, competition-specific calendars, tables highlighting the club, and access to its knockout competition views.

Best XI is a Footy statistical selection, not an official award or a complete performance rating. The visible method scores goals, assists, saves, clean sheets and cards from completed games, with a 4–3–3 formation. Weeks run Monday–Sunday in UTC. It reports match coverage and leaves missing positions empty. Clean-sheet bonuses use starter status because reliable participation minutes are unavailable. Incomplete provider coverage limits the selection.

Knockout ties group published legs by round and teams. Aggregate scores and advancement use the provider's series fields; the graph never predicts unpublished future matchups. Select a completed season to see a full historical knockout graph. Regular league competitions use tables rather than invented brackets.

Calendar dates use UTC and kickoff text follows profile preferences. Monthly calendars cover the selected competition. Change competition on a club's Standings or Knockout page to see another competition; this does not imply the club qualified. Feed coverage, particularly historical rosters and coaches, may be incomplete. Missing details remain labeled unavailable.

Historical title counts have dated primary-source links in `competition-data.js`; their scope is shown explicitly (for example, Premier League era versus all English top-flight championships). Previous champions are loaded from the prior completed season's final table or knockout final, not inferred from a current table. Records do not auto-update.

Run model checks with `node --test tests/football-model.test.mjs`.

A responsive football match centre with real scores and fixtures from ESPN's public football feed. No fabricated or simulated fixtures are used.

## Features

- Ten competitions, date navigation, team search and live/finished/upcoming filters.
- Shareable hash routes for each match, compatible with GitHub Pages.
- Score, key events, full commentary, venue and officials, starting lineups and substitutes, statistics, tournament tables with both teams highlighted, match reports and team-related articles when the provider supplies them.
- Follow clubs and leagues from their detail pages. Their matches populate Following for the selected date; club follows apply across covered competitions. Guest follows persist on the device. Optional browser notifications for score and status changes while the site remains open.
- Football companion for loaded scores, match summaries and common rules. A secure generative AI endpoint can be connected in Settings; no API keys are accepted by or embedded in the static frontend.

## Hosting

The Sites checkout serves `dist/`. On GitHub, these static files are placed at the repository root so GitHub Pages can publish `main` / `(root)` without a build. All assets use relative paths, including under `/Footy/`.

Serve the static directory with any static HTTP server. Open `index.html` over HTTP(S), rather than a `file:` URL.

## AI connection

The AI endpoint must accept HTTPS `POST` JSON `{ "message": "...", "context": {...} }` and return `{ "answer": "..." }`. Configure the endpoint in Settings for the current device or set the public endpoint URL in `config.js` for all visitors. The server must handle CORS for the Footy origin, authenticate or rate-limit requests, bound request/output sizes, and keep provider credentials in server secrets. A URL being saved does not verify the endpoint is reachable. Until an AI service is connected, the UI explicitly identifies its built-in companion as non-generative.

## Coverage and limitations

ESPN's public endpoints are not a contracted commercial feed and may change, throttle or omit coverage. Requests refresh every 30 seconds while the page is visible; provider latency still applies. Missing data and feed errors are shown explicitly. Match statistics and lineups are not guaranteed for every competition. Tables reflect the provider's latest published standings, not a locally calculated live table. Article headlines link to the original publisher rather than reproducing full articles. Team logos remain the property of their respective owners.

Notifications require browser support and permission. The site polls while open; it does not provide background push after the tab closes. Guest follows and browser notification permissions stay on the device. Signed-in profile details, club and league follows and preferences sync through Supabase.

## Privacy

The frontend stores follows, alert preference and AI endpoint URL in browser local storage. It requests match data and logos from ESPN and fonts from Google Fonts. Chat questions and visible match context are sent only to the AI endpoint explicitly configured for the site. Never put API keys, bearer tokens or other secrets in the endpoint URL, `config.js`, or this public repository.

## Profiles

Open Sign in in the header to create or manage a private profile. Accounts support email verification, password recovery, profile and avatar editing, team and competition favorites, synced club and league follows, timezone/clock and alert preferences, email/password changes, session controls, data export and permanent self-deletion with password confirmation. See ACCOUNT_SETUP.md for authentication redirect and SMTP configuration. Database migrations live in supabase/migrations/.

Club and league follows reuse private favorite_teams and favorite_leagues fields. Apply supabase/club-league-follows.sql for authenticated atomic follow changes. Existing favorites remain followed. Individual match follows are no longer used; historical match data is retained until personalization reset or account deletion.
