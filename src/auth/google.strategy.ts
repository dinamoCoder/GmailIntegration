import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { User } from './user.interface';  // Import the User interface

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
        clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
        clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
        callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
        access_type: 'offline', // Ensures refresh_token is issued
        prompt: 'consent',      // Forces user re-consent to get refresh_token
        scope: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/gmail.modify'
        ],
      });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {  // Returning `any` because we're using done(callback) for Passport

    // Check if profile contains the email and id
    if (!profile || !profile.emails || !profile.id) {
      return done(new Error('Google profile or email not found.'));
    }

    const user: User = {
      googleId: profile.id,         // Google ID from the profile
      email: profile.emails[0].value,  // Email from the profile
      accessToken,                  // Access token to be used for API requests
      refreshToken,                 // Optionally store the refresh token
    };

    // Return the user information to Passport
    done(null, user);  // Pass the user object to req.user
  }
}
