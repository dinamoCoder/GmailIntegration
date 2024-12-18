import { Controller, Get, Req, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { User } from './user.interface';

@Controller('auth')
export class AuthController {
  
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;  // Cast req.user to the User type
    console.log(req.user);
    console.log('User:', user); // Log user object to inspect its structure
  
    if (!user) {
      return res.redirect('http://localhost:3000/login?error=Unauthorized');
    }
  
    // Check if user object has the expected properties
    const { accessToken, email } = user;
  
    if (!accessToken || !email) {
      return res.redirect('http://localhost:3000/login?error=MissingData');
    }
  
    const frontendUrl = `http://localhost:3000/emails?token=${accessToken}&email=${email}`;
    return res.redirect(frontendUrl);
  }
  
}
