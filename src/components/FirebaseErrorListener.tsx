'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // In a real app, you might use a toast library or a global error state
      // For this dev environment, we throw it to make it visible in the Next.js overlay
      // NOTE: This will cause a flash of the error boundary in dev mode.
      console.error(
        'A Firestore permission error was caught by the global listener:',
        error.toString()
      );
      throw error;
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything
}
