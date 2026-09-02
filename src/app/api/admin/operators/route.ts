import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

/**
 * Creates a real operator login (Firebase Auth user + users/{uid}
 * Firestore doc with role: 'operator'). Same reasoning as
 * /api/admin/drivers — this must run server-side with the Admin SDK, or
 * the client SDK would sign the admin's own browser in as the new
 * operator and kick them out of their admin session.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!idToken) {
    return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 });
  }

  let callerUid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired session. Please sign in again.' }, { status: 401 });
  }

  const adminDb = getAdminDb();

  try {
    const callerSnap = await adminDb.collection('users').doc(callerUid).get();
    const callerRole = callerSnap.exists ? callerSnap.data()?.role : null;
    if (callerRole !== 'admin' && callerRole !== 'super_admin') {
      return NextResponse.json({ error: 'You do not have admin access.' }, { status: 403 });
    }
  } catch (err) {
    console.error('POST /api/admin/operators: failed to verify caller role —', err);
    return NextResponse.json({ error: 'Could not verify admin access.' }, { status: 500 });
  }

  let body: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    companyName?: string;
    description?: string;
    commissionPercent?: number;
    commissionFlatFee?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password || '';
  const firstName = body.firstName?.trim() || 'Operator';
  const lastName = body.lastName?.trim() || '';
  const phone = body.phone?.trim() || '';
  const companyName = body.companyName?.trim() || '';
  const description = body.description?.trim() || '';
  const commissionPercent = Number.isFinite(body.commissionPercent) ? Number(body.commissionPercent) : 15;
  const commissionFlatFee = Number.isFinite(body.commissionFlatFee) ? Number(body.commissionFlatFee) : 0;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  if (!companyName) {
    return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });
  }

  const adminAuth = getAdminAuth();

  let newUid: string;
  try {
    const created = await adminAuth.createUser({
      email,
      password,
      displayName: companyName,
      emailVerified: true,
    });
    newUid = created.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }
    if (code === 'auth/invalid-password') {
      return NextResponse.json({ error: 'Password must be at least 6 characters and not too weak.' }, { status: 400 });
    }
    console.error('POST /api/admin/operators: createUser failed —', err);
    return NextResponse.json({ error: 'Could not create the operator account.' }, { status: 500 });
  }

  try {
    await adminDb.collection('users').doc(newUid).set(
      {
        uid: newUid,
        email,
        firstName,
        lastName,
        phone,
        role: 'operator',
        status: 'active',
        photoURL: '',
        companyName,
        description,
        rating: 0,
        totalReviews: 0,
        fleetSize: 0,
        isVerified: false,
        commission: { percent: commissionPercent, flatFee: commissionFlatFee },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('POST /api/admin/operators: Firestore profile write failed, rolling back —', err);
    await adminAuth.deleteUser(newUid).catch(() => {});
    return NextResponse.json({ error: 'Could not save the operator profile. Nothing was created.' }, { status: 500 });
  }

  return NextResponse.json({ uid: newUid, email }, { status: 201 });
}
