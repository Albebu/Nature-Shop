export type UserType = 'CUSTOMER' | 'EMPLOYEE';

export interface TokenPayload {
  userId: string;
  userType: UserType;
  tenantId: string | null | undefined;
}
