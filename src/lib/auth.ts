import 'server-only';

import { cookies, headers } from 'next/headers';

export type UserRole = 'viewer' | 'analyst' | 'admin';

export type AuthContext = {
  userId: string;
  role: UserRole;
  ip: string;
};

function normalizeRole(role: string | undefined): UserRole {
  if (role === 'admin' || role === 'analyst' || role === 'viewer') {
    return role;
  }
  return 'viewer';
}

export async function getAuthContext(): Promise<AuthContext> {
  const headerStore = await headers();
  const cookieStore = await cookies();

  const userIdFromHeader = headerStore.get('x-user-id') ?? undefined;
  const roleFromHeader = headerStore.get('x-user-role') ?? undefined;
  const ipHeader = headerStore.get('x-forwarded-for');

  const userIdFromCookie = cookieStore.get('earth_insights_user_id')?.value;
  const roleFromCookie = cookieStore.get('earth_insights_user_role')?.value;

  const userId = userIdFromHeader || userIdFromCookie || 'anonymous';
  const role = normalizeRole(roleFromHeader || roleFromCookie);
  const ip = (ipHeader || '0.0.0.0').split(',')[0]?.trim() || '0.0.0.0';

  const authRequired = process.env.AUTH_REQUIRED === 'true';
  if (authRequired && userId === 'anonymous') {
    throw new Error('Unauthorized: missing authenticated user context.');
  }

  return { userId, role, ip };
}

export function requireRole(context: AuthContext, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(context.role)) {
    throw new Error(`Forbidden: role '${context.role}' is not allowed for this action.`);
  }
}
