export interface AdminTeacherView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  school: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
