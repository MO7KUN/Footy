# Downloads, daily updates, and push delivery

All changes use `feature/mobile-download-push-updates` and PR #2. Main and the published website remain unchanged until integration. The shared Supabase push service is now deployed.

## Downloads and updates

The website download page resolves the latest signed GitHub release, or explains how to download an Android preview artifact before a signed release exists. Android WorkManager checks for updates every 24 hours when network and battery conditions allow, including after restarts. Users can also check from Settings. Updates require user installation; they are never installed silently.

Signed distribution still requires the existing stable signing credentials in the protected `android-release` environment and an increasing version code. Do not replace a production signing key. The signed-release workflow remains limited to main after PR integration.

## Firebase and push status

Firebase project `footy-mo7kun-push` is created, with Android package `me.mohamedlaaribi.footy` registered. `firebase-android.json` contains public Android client configuration only. Build scripts reject service-account keys and unexpected project/package configuration. `FOOTY_GOOGLE_SERVICES_JSON` can override client configuration; `FOOTY_PUSH_BACKEND_READY=false` disables registration.

The private sender identity has the Firebase Cloud Messaging API Admin role. Its private key and the scheduler bearer secret are stored in Footy's encrypted Supabase Vault, with the user's explicit approval. Neither secret is in GitHub or Android assets. A service-only RPC validates the scheduler credential before returning the provider credential to the Edge Function. Anonymous and signed-in clients cannot execute that RPC.

`push-notifications.sql` and `push-scheduler.sql` have been applied to the existing shared Supabase project. Device registrations are private, owner/MFA protected, and tied to active sessions. Sender snapshots, queue, and lease are service-only. `football-push` is deployed; Cron invokes it once per minute. An unauthorized request returned 401, an authorized run returned 200, and a scheduled run returned 200. The sender baselines scores, respects current follows/preferences, retries failed sends, and removes invalid tokens.

## Device verification still required

Build/install the new Android preview, sign in, follow a club or league, and enable notifications. Verify delivery with the app backgrounded, permission denial, preference opt-outs, token refresh, account sign-out, and offline recovery before broad distribution. No real-device delivery has been claimed. The sender covers the same ten competitions as the match centre. Guests retain local foreground alerts; background push requires sign-in.

Private local provisioning files are outside the source checkout in `.footy-tools`. Do not copy them into source or build artifacts.
