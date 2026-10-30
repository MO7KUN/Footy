# Footy for Android

An Android app built with Capacitor, bundling the existing Footy football interface with mobile navigation, Android back handling, external links in a browser, offline status and native foreground match notifications. The app uses the **same Supabase project, accounts, private profiles, club/league follows and preferences as the website**. No duplicate database or privileged key is created.

## Install a preview

Open the repository's **Actions → Android preview APK** successful run and download **Footy-Android-preview** under Artifacts. Extract the ZIP and install `app-debug.apk` on an Android 7+ device. Android asks you to allow installation from your chosen file manager. This preview is debug-signed, not a Play Store release. Updates from separately generated debug signing keys may require uninstalling the older preview; synced account data stays in Supabase, but guest follows on the phone are removed on uninstall.

## Local development

Use Node 22+, Java 21 and the Android SDK required by Capacitor 8. Run from `mobile/`:

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run android:init
npm run android:open
```

The generated Android project is in `mobile/android/`. Android Studio can run it on a device or emulator. `npm run android:sync` refreshes bundled website assets after changes. The build supports both the Sites `dist/` layout and the flattened GitHub Pages layout. Package versions and the lockfile are pinned. Generated assets and Android build output are ignored.

## Accounts and data

Sign in using the same email and password as the website. The existing row-level security restricts profiles and follow changes to their owner. Only the public configuration in `config.js` is bundled. Session tokens are encrypted with AES-GCM using a non-exportable Android Keystore key. Authentication does not fall back to plaintext storage if the keystore fails. Android cloud backup and device-transfer extraction are disabled. Upgrading clears old WebView authentication entries, so existing app users must sign in again. The app does not share login sessions with an external browser.

Account creation, email verification, password recovery and changing email open the website so the existing browser email-confirmation flow retains its session verifier. Return to the app and sign in afterwards. Public account emails remain restricted until the email service is configured, as on the website. Profile export opens the Android share sheet, so choose its recipient carefully.

Notifications reflect changes polled while the app is active. They are **not background push notifications**; a server/Firebase integration is needed for alerts while the app is closed. AI uses the same configured service (currently the built-in companion until a secure AI endpoint is connected). Scores, fixtures, articles, logos and account sync need an internet connection.

## Release and testing

CI produces an installable APK, but physical-device/emulator testing is still required: sign in, follow/unfollow on web and phone then reopen the other app, edit a profile, inspect domestic/European fixture links, test back navigation, deny/allow notification permission, go offline and sign out. The Android signed release workflow builds a non-debuggable signed APK and AAB from main. Configure an android-release GitHub environment with FOOTY_KEYSTORE_BASE64, FOOTY_KEYSTORE_PASSWORD, FOOTY_KEY_ALIAS and FOOTY_KEY_PASSWORD secrets using your stable private production signing key. Dispatch the workflow with an increasing version_code and version_name. Signing fails closed when a setting is absent; debug keys are never substituted. Play Console setup and store privacy/data-safety declarations remain required for store distribution. Do not commit signing keys, passwords or service-role keys.
