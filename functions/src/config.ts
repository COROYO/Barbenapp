import { setGlobalOptions } from 'firebase-functions/v2'

// Gen-2 region; must match client getFunctions() in src/lib/firebase.ts.
// Note: org policies that block allUsers on Cloud Run break callable IAM — use a region/project where deploy can set invokers.
setGlobalOptions({ region: 'us-central1' })
