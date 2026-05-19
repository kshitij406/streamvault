import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

const USERS_FILE = path.join(process.cwd(), 'data/users.json');

export async function getUsers(): Promise<StoredUser[]> {
  if (process.env.USERS_DATA) {
    try {
      return JSON.parse(process.env.USERS_DATA);
    } catch {
      return [];
    }
  }
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function addUser(
  email: string,
  name: string,
  hashedPassword: string
): Promise<StoredUser | null> {
  const users = await getUsers();

  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return null;
  }

  const newUser: StoredUser = {
    id: randomUUID(),
    email,
    name,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  } catch {
    // Vercel production: filesystem is read-only.
    // User should set USERS_DATA env var or commit data/users.json.
  }

  return newUser;
}
