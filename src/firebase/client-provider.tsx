
'use client';

import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

export const FirebaseClientProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { firebaseApp, firestore, auth } = initializeFirebase();
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
};
