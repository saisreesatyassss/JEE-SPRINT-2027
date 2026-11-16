import { count, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      if (existing[0].email !== email) {
        const updated = await db
          .update(users)
          .set({ email })
          .where(eq(users.uid, uid))
          .returning();
        return updated[0];
      }
      return existing[0];
    }

    const adminEmailsRaw = process.env.ADMIN_EMAILS ?? '';
    const adminEmails = adminEmailsRaw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    let assignedRole = 'viewer';
    if (adminEmails.includes(email.toLowerCase())) {
      assignedRole = 'admin';
    } else {
      const [{ value: adminCount }] = await db
        .select({ value: count() })
        .from(users)
        .where(eq(users.role, 'admin'));
      if (Number(adminCount) === 0) {
        assignedRole = 'admin';
      }
    }

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        role: assignedRole,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function listReviewerUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database query failed in listReviewerUsers:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function updateUserRole(userId: number, role: 'admin' | 'reviewer' | 'viewer') {
  try {
    const updated = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('Database query failed in updateUserRole:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
