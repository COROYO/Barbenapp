# Baby Tracker

Mobile-first PWA zum gemeinsamen Tracken von Fütterung (Pre/Milch/Kombi/Pumpen) und Schlaf.
Vite + React + TypeScript + Firebase (Firestore, Auth, FCM, Functions, Hosting).

## Lokales Setup

```bash
npm install
cp .env.example .env.local
# Werte aus Firebase-Console eintragen
npm run dev
```

## Firebase initialisieren

1. [Firebase Console](https://console.firebase.google.com/) → neues Projekt anlegen.
2. Web-App hinzufügen, Config in `.env.local` kopieren und `.firebaserc` mit der Project-ID anpassen.
3. **Authentication** → **Sign-in method** → "E-Mail-Link (passwordless sign-in)" aktivieren. Eure Domain unter "Authorized domains" hinzufügen.
4. **Firestore Database** anlegen (Produktionsmodus, Location `eur3` oder `europe-west3`).
5. **Cloud Messaging** aktivieren; unter "Web Push certificates" VAPID-Key generieren → `VITE_FIREBASE_VAPID_KEY`.
6. **Blaze-Plan** aktivieren (Pay-as-you-go) – für Cloud Functions notwendig. Budget-Alarm bei 1 $/Monat setzen. Für diese App praktisch 0 € Kosten.

### Rules & Indizes deployen

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore
```

### Cloud Functions (Reminder-Pushes)

```bash
cd functions && npm install && npm run build && cd ..
firebase deploy --only functions
```

Die scheduled Function `remindersScheduled` läuft alle 15 Minuten und verschickt Push-Notifications an alle Mitglieder eines Babys, wenn länger als `reminderAfterHours` keine Fütterung protokolliert wurde.

## Produktion deployen

```bash
npm run build
firebase deploy --only hosting
```

Für alle Dienste zusammen:

```bash
firebase deploy
```

## Auf Handy installieren

- **iOS Safari**: Teilen → "Zum Home-Bildschirm". Danach App-Icon tippen → läuft im Vollbild.
- **Android Chrome**: Menü → "App installieren".

Push-Notifications funktionieren erst nach Install und ausdrücklicher Freigabe unter `Einstellungen → Erinnerungen → Aktivieren`. iOS unterstützt Web-Push nur auf installierten PWAs ab iOS 16.4.

## Daten-Modell

```
babies/{babyId}
  name, memberIds[], inviteCode, currentSleepId, reminderAfterHours, …
users/{uid}
  fcmTokens[]
babies/{babyId}/feedings/{feedingId}
  occurredAt, type ('pre'|'milk'|'combo'|'pump'), amountPreMl, amountMilkMl, note, …
babies/{babyId}/sleepSessions/{sleepId}
  startedAt, endedAt, note, …
invites/{code}
  babyId
```

Security Rules: Nur Mitglieder des Babys lesen/schreiben. Invite-Flow: Empfänger fügt sich per `arrayUnion` dem Baby hinzu.

## Stack

- Vite + React 18 + TypeScript, React Router 6
- Tailwind + shadcn/ui (Dark Mode default)
- Firestore mit Offline-Persistence (optimistic writes, multi-tab)
- `onSnapshot`-Listener für Realtime-Sync
- vite-plugin-pwa (injectManifest) – gemeinsamer Service Worker mit Workbox-Precache und Firebase-Messaging-Background-Handler
- Firebase Cloud Functions (Node 20, TypeScript) mit scheduled Trigger für Reminder-Pushes
- Recharts für Tagesstatistik

## Nützliche Scripts

```bash
npm run dev           # Dev-Server
npm run build         # Build + SW + Manifest
node scripts/generate-icons.mjs  # PNG-Icons aus favicon.svg neu erzeugen
```
