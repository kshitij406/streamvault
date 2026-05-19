import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUsers, addUser } from '@/lib/users';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  const users = await getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await addUser(email.trim(), name.trim(), hashed);

  if (!user) {
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
