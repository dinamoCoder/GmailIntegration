// src/auth/interfaces/user.interface.ts
export interface User {
    googleId: string;
    email: string;
    accessToken: string;
    refreshToken?: string;  // Optional, only if you want to store the refresh token
  }
  