export type ContactMessage = {
  id: string;
  schoolName: string;
  senderName: string;
  role: string | null;
  email: string;
  note: string;
  phone: string | null;
  createdAt: Date;
  actedAt: Date | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isContactMessageId(id: string): boolean {
  return UUID_PATTERN.test(id);
}
