// Public-facing student types — never expose pinHash or failedPinAttempts
export interface StudentProfile {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  hubId: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentInput {
  studentId: string;
  firstName: string;
  lastName: string;
  pin: string;
}

export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
}

export interface BatchCreateStudentInput {
  students: CreateStudentInput[];
}

export interface BatchCreateResult {
  created: StudentProfile[];
  failed: Array<{ studentId: string; reason: string }>;
}

export interface ResetPinInput {
  newPin: string;
}
