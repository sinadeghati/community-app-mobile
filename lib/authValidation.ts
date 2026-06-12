export type PasswordChecks = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

export const evaluatePasswordStrength = (password: string) => {
  const checks: PasswordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strengthCount = Object.values(checks).filter(Boolean).length;
  const strengthLabel =
    strengthCount <= 1 ? "Weak" : strengthCount <= 3 ? "Good" : "Strong";

  return {
    checks,
    strengthCount,
    strengthLabel,
    isStrongEnough: Object.values(checks).every(Boolean),
  };
};

export const passwordsMatch = (password: string, confirmPassword: string) =>
  password.length > 0 && password === confirmPassword;

export const isValidEmail = (email: string) => {
  const trimmed = email.trim();
  return trimmed.includes("@") && trimmed.includes(".");
};
