import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/firebase/admin';
import { ADMIN_EMAIL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or malformed Authorization header' }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin SDK is not initialized' }, { status: 500 });
    }

    // Verify requesting admin ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const requesterEmail = decodedToken.email?.toLowerCase();

    // STRICT GUARD: Only the master sudo (vidyaheist@gmail.com) can manage roles & passwords
    if (requesterEmail !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden: Only the super admin (vidyaheist@gmail.com) can manage staff roles.' }, { status: 403 });
    }

    const body = await req.json();
    const { targetUid, action, role, password } = body;

    if (!targetUid) {
      return NextResponse.json({ error: 'Missing target user UID' }, { status: 400 });
    }

    // Fetch the target user details to protect the main super-user
    const targetUser = await adminAuth.getUser(targetUid);
    const targetEmail = targetUser.email?.toLowerCase();

    // STRICT GUARD: No one, not even other admins, can ever demote or edit vidyaheist@gmail.com
    if (targetEmail === ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden: The master super-user (vidyaheist@gmail.com) cannot be edited or demoted.' }, { status: 403 });
    }

    if (action === 'updateRole') {
      if (role !== 'admin' && role !== 'microadmin' && role !== 'student') {
        return NextResponse.json({ error: 'Invalid user role selected' }, { status: 400 });
      }

      // 1. Update Firestore user role
      await adminDb.collection('users').doc(targetUid).set({
        role: role === 'student' ? null : role,
        updatedAt: new Date()
      }, { merge: true });

      // 2. Set Custom User Claims on FirebaseAuth
      await adminAuth.setCustomUserClaims(targetUid, { role: role === 'student' ? null : role });

      return NextResponse.json({ success: true, message: `Successfully updated user role to ${role}` });

    } else if (action === 'updatePassword') {
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }

      // 1. Update user password in Auth
      await adminAuth.updateUser(targetUid, { password });

      return NextResponse.json({ success: true, message: 'Successfully updated user password' });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in Employee Management API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
