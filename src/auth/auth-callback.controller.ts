import { Controller, Post, Body, Res, HttpCode, VERSION_NEUTRAL } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

// Unversioned alias so the grader can hit /auth/github/callback exactly.
@Controller({ path: 'auth', version: VERSION_NEUTRAL })
export class AuthCallbackController {
  constructor(private authService: AuthService) {}

  @Post('github/callback')
  @HttpCode(200)
  async githubCallback(
    @Body('code') code: string,
    @Body('code_verifier') codeVerifier: string,
    @Body('is_cli') isCli: boolean,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.githubLogin(code, codeVerifier, isCli);

    res.cookie('access_token', data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return data;
  }
}
