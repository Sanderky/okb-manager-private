import { mockDb } from '@/shared/api/mock/mockDb';
import type { AuthSessionMock, AuthUserMock } from '@/shared/api/mock/types';
import { delay } from '@/shared/lib/delay';

export const login = async (email: string, password: string) => {
  await delay(600);

  const user = mockDb.auth.registeredUsers.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error('Nieprawidłowe dane logowania (Invalid login credentials)');
  }

  const authUser: AuthUserMock = {
    id: user.id,
    email: user.email,
    user_metadata: { ...user.user_metadata },
  };

  const session: AuthSessionMock = {
    access_token: `mock-jwt-token-${crypto.randomUUID()}`,
    // access_token: `mock-jwt-token-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    user: authUser,
  };

  mockDb.auth.currentSession = session;

  window.dispatchEvent(
    new CustomEvent('mock-auth-change', { detail: { event: 'SIGNED_IN' } })
  );

  return { user: authUser, session };
};

export const logout = async () => {
  await delay();
  mockDb.auth.currentSession = null;

  window.dispatchEvent(
    new CustomEvent('mock-auth-change', { detail: { event: 'SIGNED_OUT' } })
  );
};

export const onAuthStateChange = (
  callback: (event: string, session: any) => void
) => {
  const handleMockAuthChange = async (e: Event) => {
    const customEvent = (e as CustomEvent).detail?.event || 'SIGNED_IN';
    const session = await getSession();
    callback(customEvent, session);
  };

  window.addEventListener('mock-auth-change', handleMockAuthChange);
  return () =>
    window.removeEventListener('mock-auth-change', handleMockAuthChange);
};

export const resetPassword = async (email: string) => {
  await delay();
  const user = mockDb.auth.registeredUsers.find((u) => u.email === email);
  if (!user) {
    return;
  }
  console.log(`[Mock] Link do resetu hasła "wysłany" na: ${email}`);
};

export const getSession = async () => {
  await delay(200);
  return mockDb.auth.currentSession;
};

export const updatePassword = async (password: string) => {
  await delay();
  const session = mockDb.auth.currentSession;
  if (!session) throw new Error('Brak aktywnej sesji (Auth session missing)');

  const userIndex = mockDb.auth.registeredUsers.findIndex(
    (u) => u.id === session.user.id
  );
  if (userIndex !== -1) {
    mockDb.auth.registeredUsers[userIndex].password = password;
  }

  return { user: session.user };
};

export const updateDisplayName = async (displayName: string) => {
  await delay();
  const session = mockDb.auth.currentSession;
  if (!session) throw new Error('Brak aktywnej sesji (Auth session missing)');

  const userIndex = mockDb.auth.registeredUsers.findIndex(
    (u) => u.id === session.user.id
  );
  if (userIndex !== -1) {
    mockDb.auth.registeredUsers[userIndex].user_metadata.display_name =
      displayName;
  }

  session.user.user_metadata.display_name = displayName;

  return { user: session.user };
};

export const updateEmail = async (email: string) => {
  await delay();
  const session = mockDb.auth.currentSession;
  if (!session) throw new Error('Brak aktywnej sesji (Auth session missing)');

  const isTaken = mockDb.auth.registeredUsers.some(
    (u) => u.email === email && u.id !== session.user.id
  );
  if (isTaken) {
    throw new Error('Ten adres e-mail jest już zajęty.');
  }

  const userIndex = mockDb.auth.registeredUsers.findIndex(
    (u) => u.id === session.user.id
  );
  if (userIndex !== -1) {
    mockDb.auth.registeredUsers[userIndex].email = email;
  }

  session.user.email = email;

  return { user: session.user };
};
