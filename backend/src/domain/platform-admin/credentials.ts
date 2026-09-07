const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^[A-Za-z0-9]+$/;
export const MIN_ADMIN_PASSWORD_LENGTH = 10;

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateBootstrapAdmin(
  email: string,
  password: string,
): string | undefined {
  const normalized = normalizeAdminEmail(email);
  if (!EMAIL_PATTERN.test(normalized)) {
    return "PLATFORM_ADMIN_EMAIL must be a valid email address";
  }

  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return `PLATFORM_ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`;
  }

  if (!PASSWORD_PATTERN.test(password)) {
    return "PLATFORM_ADMIN_PASSWORD must contain only letters and numbers";
  }

  return undefined;
}
