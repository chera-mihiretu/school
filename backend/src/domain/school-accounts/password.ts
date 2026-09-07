export const SCHOOL_PASSWORD_MIN_LENGTH = 12;

export function validateNewSchoolPassword(input: {
  currentPassword: string;
  newPassword: string;
}): string | undefined {
  if (input.newPassword.length < SCHOOL_PASSWORD_MIN_LENGTH) {
    return "Password must be at least 12 characters";
  }
  if (input.newPassword === input.currentPassword) {
    return "New password must be different from the current password";
  }
  return undefined;
}
