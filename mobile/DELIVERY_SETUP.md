# Downloads, daily updates, and push delivery

All changes are on `feature/mobile-download-push-updates`. `main` and production services have not been changed by this feature. Merge through a pull request to publish the website button. Future commits must use feature branches (see AGENTS.md).

## Downloads and updates

`download.html` resolves the latest signed `Footy.apk` GitHub release. Before a signed release exists, it links to the latest successful, unexpired main-branch Android artifact and explains GitHub sign-in and preview installation.

Android WorkManager schedules a unique network-connected check every 24 hours, including after restarts. Android can delay work for battery/network constraints, and a force-stopped app must be reopened. The worker reads only the repository's latest `footy-release.json`, validates the package, version code, repository URL and SHA-256 format, and notifies once per newer version. It never silently downloads or installs packages. Users can also queue a check from Settings. If notification permission is denied, the check still runs and its status is available in Settings.

The protected signed-release workflow generates `footy-release.json`, APK and AAB, then publishes them as a GitHub release. It requires the existing stable production signing secrets in the `android-release` environment and a strictly increasing version code. Debug artifacts are not announced as signed app updates. Never replace a production signing key between releases.

## Push activation checklist — connection still required

1. Connect Firebase, select/create the intended project, and register Android package `me.mohamedlaaribi.footy`. No Firebase project or credentials have been invented or created by this branch.
2. Review and apply `supabase/push-notifications.sql` against the existing Footy project after its security-hardening migration. It keeps device tokens private and owner/MFA protected, ties registrations to active sessions, and isolates service-only sender state. This SQL has NOT been applied to production.
3. Deploy `supabase/functions/football-push` with `verify_jwt=false` because the scheduler uses a separate bearer secret. The function rejects requests unless `FOOTY_PUSH_CRON_SECRET` is at least 32 characters and matches the Authorization header. Set `FCM_SERVICE_ACCOUNT` and `FOOTY_PUSH_CRON_SECRET` as server-side Supabase secrets. The Supabase service key stays in the server environment; never bundle it in the app or put it in source.
4. Configure Supabase Cron (or a trusted scheduler) to POST once per minute to `/functions/v1/football-push`, with the cron secret read from Vault. Do not put secrets in cron SQL committed to Git. The function uses a lease to avoid concurrent runs, baselines existing scores without flooding devices, queues idempotent messages, retries provider failures, respects current follows/preferences before sending, and deletes invalid device registrations. Delivery is at-least-once: a provider timeout after acceptance can cause a retry; Android tags coalesce the same update.
5. Add `FOOTY_GOOGLE_SERVICES_JSON` to the protected `android-release` environment, and set environment variable `FOOTY_PUSH_BACKEND_READY=true` only after sender/schema/scheduler and a real device have been verified. The build validates the Android package in the Firebase configuration. Preview/PR builds do not receive these secrets and clearly report pending push setup.
6. Build a signed release, install it, sign in, enable notifications, follow a club/league, background the app and verify a test match update. Test opt-outs, token refresh, sign-out/session revocation, denied permission, and an offline device before enabling broad distribution.

Foreground alerts continue to work while push setup is pending. Push requires sign-in; guest follows are local and are not uploaded to a public unauthenticated enrollment endpoint. Tokens are removed on sign-out/disable and registrations are tied to their account/session. The sender currently covers the same ten competitions as the match-centre feeds; calendars can have broader provider coverage. Firebase Cloud Messaging credentials, live device delivery and release signing are not verified until those services are connected and tested.
