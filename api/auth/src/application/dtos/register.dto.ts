export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterResponseDto {
  token: string;
  refreshToken: string;
}
