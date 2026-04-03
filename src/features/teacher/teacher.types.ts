export interface TeacherProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  school: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
