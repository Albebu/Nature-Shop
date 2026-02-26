export type UserType = 'CUSTOMER' | 'EMPLOYEE';

export interface TokenPayload {
  id: string;
  userType: UserType;
  tenantId: string | null | undefined;
}
