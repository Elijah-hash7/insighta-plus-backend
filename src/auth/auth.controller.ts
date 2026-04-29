import { Controller, Post, Get, Body, UseGuards, Req, Res, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response, Request } from 'express';

@Controller({ version: '1', path: 'auth' })
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('github')
  @HttpCode(200)
  async githubLogin(
    @Body('code') code: string,
    @Body('code_verifier') codeVerifier: string,
    @Body('is_cli') isCli: boolean,
    @Res({ passthrough: true }) res: Response
  ) {
    const data = await this.authService.githubLogin(code, codeVerifier, isCli);

    
    this.setCookies(res, data.access_token, data.refresh_token);

    return data;
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body('user_id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refresh_token || req.body.refresh_token;
    const data = await this.authService.refreshTokens(userId, refreshToken);

    this.setCookies(res, data.access_token, data.refresh_token);
    return data;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    return this.authService.getMe(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.userId);
    // Clear cookies on logout
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { status: 'success', message: 'Logged out' };
  }

  
  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
