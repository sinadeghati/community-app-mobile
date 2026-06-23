/**
 * In-memory only — holds credentials between register and email verification.
 * Cleared after verify, cancel, or app restart.
 */
type PendingRegistration = {
  username: string;
  email: string;
  password: string;
};

let pending: PendingRegistration | null = null;

export const setPendingRegistration = (data: PendingRegistration) => {
  pending = {
    username: data.username.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
  };
};

export const getPendingRegistration = (): PendingRegistration | null => pending;

export const clearPendingRegistration = () => {
  pending = null;
};
