export const STAFF_EMAIL_UNAVAILABLE = "This email cannot be used.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type StaffSex = "male" | "female";

export type StaffAdminView = {
  id: string;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  displayName: string;
  sex: StaffSex;
  phone: string;
  email: string;
  employeeId: string | null;
  mustChangePassword: boolean;
  lastMailAt: string | null;
  lastMailOk: boolean | null;
  lastMailError: string | null;
  signedInAt: string | null;
  createdAt: string;
};

export type StaffCredentials = {
  email: string;
  password: string;
  loginUrl: string;
  schoolId: string | null;
};

export type CreatedStaffResult = {
  staff: StaffAdminView;
  credentials: StaffCredentials;
  emailSent: boolean;
  emailError?: string;
};

export type CreateStaffInput = {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: StaffSex;
  phone: string;
  email: string;
};

export function parseStaffSex(value: unknown): StaffSex | undefined {
  if (value === "male" || value === "female") {
    return value;
  }
  return undefined;
}

export function staffSexLabel(sex: StaffSex): string {
  switch (sex) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    default: {
      const _never: never = sex;
      return _never;
    }
  }
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  return value;
}

function readNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return value;
}

export function parseStaffAdminView(
  value: unknown,
): StaffAdminView | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const id = readString(record, "id");
  const givenName = readString(record, "givenName");
  const fatherName = readString(record, "fatherName");
  const grandfatherName = readString(record, "grandfatherName");
  const displayName = readString(record, "displayName");
  const sex = parseStaffSex(record.sex);
  const phone = readString(record, "phone");
  const email = readString(record, "email");
  const createdAt = readString(record, "createdAt") ?? readString(record, "created");
  if (
    id === undefined ||
    givenName === undefined ||
    fatherName === undefined ||
    grandfatherName === undefined ||
    displayName === undefined ||
    sex === undefined ||
    phone === undefined ||
    email === undefined ||
    createdAt === undefined
  ) {
    return undefined;
  }

  return {
    id,
    givenName,
    fatherName,
    grandfatherName,
    displayName,
    sex,
    phone,
    email,
    employeeId: readNullableString(record, "employeeId"),
    mustChangePassword: record.mustChangePassword === true,
    lastMailAt: typeof record.lastMailAt === "string" ? record.lastMailAt : null,
    lastMailOk: typeof record.lastMailOk === "boolean" ? record.lastMailOk : null,
    lastMailError:
      typeof record.lastMailError === "string" ? record.lastMailError : null,
    signedInAt: typeof record.signedInAt === "string" ? record.signedInAt : null,
    createdAt,
  };
}

export function parseStaffCredentials(
  value: unknown,
): StaffCredentials | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.email !== "string" ||
    typeof record.password !== "string" ||
    typeof record.loginUrl !== "string"
  ) {
    return undefined;
  }

  return {
    email: record.email,
    password: record.password,
    loginUrl: record.loginUrl,
    schoolId:
      typeof record.schoolId === "string" && record.schoolId.length > 0
        ? record.schoolId
        : null,
  };
}

export function parseCreatedStaffResult(
  value: unknown,
): CreatedStaffResult | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const staff = parseStaffAdminView(record.staff);
  const credentials = parseStaffCredentials(record.credentials);
  if (staff === undefined || credentials === undefined) {
    return undefined;
  }
  if (typeof record.emailSent !== "boolean") {
    return undefined;
  }

  return {
    staff,
    credentials,
    emailSent: record.emailSent,
    ...(typeof record.emailError === "string"
      ? { emailError: record.emailError }
      : {}),
  };
}

export function parseStaffAdminList(value: unknown): StaffAdminView[] {
  if (value === null || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.staff)) {
    return [];
  }

  return record.staff.flatMap((item) => {
    const member = parseStaffAdminView(item);
    return member === undefined ? [] : [member];
  });
}

export function normalizeEthiopianMobile(input: string): string | undefined {
  const digits = input.replace(/\D/g, "");
  if (/^0[97]\d{8}$/.test(digits)) {
    return `+251${digits.slice(1)}`;
  }
  if (/^251[97]\d{8}$/.test(digits)) {
    return `+${digits}`;
  }
  if (/^[97]\d{8}$/.test(digits)) {
    return `+251${digits}`;
  }
  return undefined;
}

export function validateStaffEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return "Email is required.";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "A valid email is required.";
  }
  return undefined;
}

export function validateStaffName(
  value: string,
  label: string,
): string | undefined {
  if (value.trim().length === 0) {
    return `${label} is required.`;
  }
  return undefined;
}

export function validateStaffDraft(input: {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: StaffSex | "";
  phone: string;
  email: string;
}): string | undefined {
  const given = validateStaffName(input.givenName, "Given name");
  if (given !== undefined) {
    return given;
  }
  const father = validateStaffName(input.fatherName, "Father’s name");
  if (father !== undefined) {
    return father;
  }
  const grandfather = validateStaffName(
    input.grandfatherName,
    "Grandfather’s name",
  );
  if (grandfather !== undefined) {
    return grandfather;
  }
  if (input.sex === "") {
    return "Sex is required.";
  }
  const sex = parseStaffSex(input.sex);
  if (sex === undefined) {
    return "Sex is required.";
  }
  if (normalizeEthiopianMobile(input.phone) === undefined) {
    return "Enter an Ethiopian mobile number starting with 09 or 07.";
  }
  return validateStaffEmail(input.email);
}

export function toCreateStaffInput(input: {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: StaffSex;
  phone: string;
  email: string;
}): CreateStaffInput | { error: string } {
  const invalid = validateStaffDraft(input);
  if (invalid !== undefined) {
    return { error: invalid };
  }

  const phone = normalizeEthiopianMobile(input.phone);
  if (phone === undefined) {
    return { error: "Enter an Ethiopian mobile number starting with 09 or 07." };
  }

  return {
    givenName: input.givenName.trim(),
    fatherName: input.fatherName.trim(),
    grandfatherName: input.grandfatherName.trim(),
    sex: input.sex,
    phone,
    email: input.email.trim().toLowerCase(),
  };
}

export function canResendStaffCredentials(
  staff: Pick<StaffAdminView, "mustChangePassword">,
): boolean {
  return staff.mustChangePassword;
}

export function staffMailStatusCopy(
  staff: Pick<
    StaffAdminView,
    "signedInAt" | "lastMailOk" | "lastMailError"
  >,
): string {
  if (staff.signedInAt !== null) {
    return "Staff signed in";
  }
  if (staff.lastMailOk === true) {
    return "SMTP accepted — not proof of inbox";
  }
  if (staff.lastMailOk === false) {
    const error = staff.lastMailError;
    return error !== null && error.length > 0
      ? `Send failed: ${error}`
      : "Send failed";
  }
  return "Not sent";
}
