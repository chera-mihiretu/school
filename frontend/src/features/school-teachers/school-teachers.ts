export const TEACHER_EMAIL_UNAVAILABLE = "This email cannot be used.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type TeacherSex = "male" | "female";

export type TeacherAdminView = {
  id: string;
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  displayName: string;
  sex: TeacherSex;
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

export type TeacherCredentials = {
  email: string;
  password: string;
  loginUrl: string;
  schoolId: string | null;
};

export type CreatedTeacherResult = {
  teacher: TeacherAdminView;
  credentials: TeacherCredentials;
  emailSent: boolean;
  emailError?: string;
};

export type CreateTeacherInput = {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: TeacherSex;
  phone: string;
  email: string;
};

export function parseTeacherSex(value: unknown): TeacherSex | undefined {
  if (value === "male" || value === "female") {
    return value;
  }
  return undefined;
}

export function teacherSexLabel(sex: TeacherSex): string {
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

export function parseTeacherAdminView(
  value: unknown,
): TeacherAdminView | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const id = readString(record, "id");
  const givenName = readString(record, "givenName");
  const fatherName = readString(record, "fatherName");
  const grandfatherName = readString(record, "grandfatherName");
  const displayName = readString(record, "displayName");
  const sex = parseTeacherSex(record.sex);
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

export function parseTeacherCredentials(
  value: unknown,
): TeacherCredentials | undefined {
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

export function parseCreatedTeacherResult(
  value: unknown,
): CreatedTeacherResult | undefined {
  if (value === null || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const teacher = parseTeacherAdminView(record.teacher);
  const credentials = parseTeacherCredentials(record.credentials);
  if (teacher === undefined || credentials === undefined) {
    return undefined;
  }
  if (typeof record.emailSent !== "boolean") {
    return undefined;
  }

  return {
    teacher,
    credentials,
    emailSent: record.emailSent,
    ...(typeof record.emailError === "string"
      ? { emailError: record.emailError }
      : {}),
  };
}

export function parseTeacherAdminList(value: unknown): TeacherAdminView[] {
  if (value === null || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.teachers)) {
    return [];
  }

  return record.teachers.flatMap((item) => {
    const teacher = parseTeacherAdminView(item);
    return teacher === undefined ? [] : [teacher];
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

export function validateTeacherEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return "Email is required.";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "A valid email is required.";
  }
  return undefined;
}

export function validateTeacherName(
  value: string,
  label: string,
): string | undefined {
  if (value.trim().length === 0) {
    return `${label} is required.`;
  }
  return undefined;
}

export function validateTeacherDraft(input: {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: TeacherSex | "";
  phone: string;
  email: string;
}): string | undefined {
  const given = validateTeacherName(input.givenName, "Given name");
  if (given !== undefined) {
    return given;
  }
  const father = validateTeacherName(input.fatherName, "Father’s name");
  if (father !== undefined) {
    return father;
  }
  const grandfather = validateTeacherName(
    input.grandfatherName,
    "Grandfather’s name",
  );
  if (grandfather !== undefined) {
    return grandfather;
  }
  if (input.sex === "") {
    return "Sex is required.";
  }
  const sex = parseTeacherSex(input.sex);
  if (sex === undefined) {
    return "Sex is required.";
  }
  if (normalizeEthiopianMobile(input.phone) === undefined) {
    return "Enter an Ethiopian mobile number starting with 09 or 07.";
  }
  return validateTeacherEmail(input.email);
}

export function toCreateTeacherInput(input: {
  givenName: string;
  fatherName: string;
  grandfatherName: string;
  sex: TeacherSex;
  phone: string;
  email: string;
}): CreateTeacherInput | { error: string } {
  const invalid = validateTeacherDraft(input);
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

export function canResendTeacherCredentials(
  teacher: Pick<TeacherAdminView, "mustChangePassword">,
): boolean {
  return teacher.mustChangePassword;
}

export function teacherMailStatusCopy(
  teacher: Pick<
    TeacherAdminView,
    "signedInAt" | "lastMailOk" | "lastMailError"
  >,
): string {
  if (teacher.signedInAt !== null) {
    return "Teacher signed in";
  }
  if (teacher.lastMailOk === true) {
    return "SMTP accepted — not proof of inbox";
  }
  if (teacher.lastMailOk === false) {
    const error = teacher.lastMailError;
    return error !== null && error.length > 0
      ? `Send failed: ${error}`
      : "Send failed";
  }
  return "Not sent";
}
