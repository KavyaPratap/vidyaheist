import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

import { useCollection, useCollectionQuery } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser } from './auth/use-user';
import {
  FirebaseProvider,
  FirebaseClientProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from './provider';

// Prevent multiple instances of Firebase
function getFirebaseInstances() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);
    return { firebaseApp, firestore, auth };
  } else {
    const firebaseApp = getApps()[0];
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);
    return { firebaseApp, firestore, auth };
  }
}

// Main initialization function for server components or layout
export const initializeFirebase = (): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} => {
  return getFirebaseInstances();
};

// Barrel file for easy imports
export {
  FirebaseProvider,
  FirebaseClientProvider,
  useCollection,
  useCollectionQuery,
  useDoc,
  useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
};
