# Footy accounts

Supabase project: `dwvuqfeymgnxmrcdmxaw` (Paris).

The browser uses the public project URL and publishable key in `config.js`. Database row-level security restricts profile reads and writes to the authenticated user. Never add a secret or service-role key to frontend files.

## Features

Email/password sign-up, verification resend, sign-in, password recovery, private profile editing, unique username, six avatar choices, five avatar colors, bio and region, team/competition favorites, account-based club and league follows, timezone/clock and alert preferences, email/password changes, session sign-out controls, JSON data export, personalization reset, and permanent account deletion after a recent password login.

## Auth configuration

The HTTPS Site URL, 12-character minimum password length, and callback allowlist are configured. Email confirmation and secure email change remain enabled. Production SMTP was explicitly deferred. After connecting it, set emailDeliveryReady to true in config.js.

The configured callback URLs are:

- `https://mohamedlaaribi.me/Footy/auth.html`
- `https://mohamedlaaribi.me/Footy/auth.html?flow=recovery`
- `https://mo7kun.github.io/Footy/auth.html`
- `https://mo7kun.github.io/Footy/auth.html?flow=recovery`
- `https://footy-matchday-mo7kun.merryscout131.chatgpt.site/auth.html`
- `https://footy-matchday-mo7kun.merryscout131.chatgpt.site/auth.html?flow=recovery`

For local testing only, add `http://127.0.0.1:4173/auth.html` and the same URL with `?flow=recovery`.

Keep email confirmation and secure email change enabled. Configure production SMTP for public signups: Supabase's default email service can restrict recipients to members of the project organization and has low send limits. Never disable confirmation to work around email delivery limits. The configured password minimum is 12 characters.

The app uses PKCE, so confirmation/recovery links should open in the same browser that requested them. Each hosting origin has its own session; the same account data syncs after sign-in at either origin.

## Schema

Apply `supabase/migrations/20261026_profiles.sql` to provision the private profile table and self-deletion function. The delete function intentionally uses SECURITY DEFINER because ordinary users cannot delete from `auth.users`; it accepts no user ID, takes the caller ID from the authenticated JWT, and checks a recent password authentication before deleting the caller. A security advisor warning about authenticated execution of this function is expected and must be reviewed in that context.

## Data handling

No user passwords are stored in application profile tables or frontend application storage. The Supabase SDK manages session tokens. Profile exports exclude session tokens and passwords. Follows made as a guest remain local until explicitly imported. Signing out restores guest follows rather than exposing another account's follows.

Club and league follows reuse private favorite_teams and favorite_leagues fields. Apply supabase/club-league-follows.sql for authenticated atomic follow changes. Existing favorites remain followed. Individual match follows are no longer used; historical match data is retained until personalization reset or account deletion.
