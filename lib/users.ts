import { sql } from './db';
import { randomUUID } from 'crypto';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const rows = await sql`
    SELECT id, email, name, password FROM users
    WHERE email = ${email.toLowerCase()} LIMIT 1
  `;
  return (rows[0] as StoredUser) ?? null;
}

export async function addUser(
  email: string,
  name: string,
  hashedPassword: string
): Promise<StoredUser | null> {
  const existing = await getUserByEmail(email);
  if (existing) return null;

  const id = randomUUID();
  await sql`
    INSERT INTO users (id, email, name, password)
    VALUES (${id}, ${email.toLowerCase()}, ${name}, ${hashedPassword})
  `;
  return { id, email: email.toLowerCase(), name, password: hashedPassword };
}
