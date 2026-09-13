import { cert, getApps, initializeApp } from 'firebase-admin/app'
import serviceAccount from '../../firebase-service-account.json' with { type: 'json' }

const firebaseAdmin =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : getApps()[0]

export { firebaseAdmin }

