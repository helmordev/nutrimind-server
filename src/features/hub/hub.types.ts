export interface Hub {
  id: string;
  name: string;
  teacherId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HubWithMemberCount extends Hub {
  memberCount: number;
}

export interface ServerCode {
  id: string;
  hubId: string;
  code: string;
  createdBy: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface HubMember {
  id: string;
  hubId: string;
  studentId: string;
  joinedAt: Date;
}

export interface CreateHubInput {
  name: string;
}

export interface UpdateHubInput {
  name?: string;
}

export interface JoinHubInput {
  code: string;
}

export interface GenerateCodeInput {
  ttlSeconds?: number;
}
