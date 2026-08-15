// src/modules/identity/api/dtos.ts

export interface LoginRequestDto {
  email: string;
  passwordHash: string; // Should be plain text from API, hashed in App layer
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
}
