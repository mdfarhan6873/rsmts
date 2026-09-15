import { Controller, Post, Body, Res, Req, Get, Inject } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './decorators/public.decorator.js';
import type { Response, Request } from 'express';
import { CurrentUser } from './decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Body('refreshToken') bodyToken: string, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refreshToken || bodyToken;
    const result = await this.authService.refreshTokens(token);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('logout')
  async logout(@Req() req: Request, @Body('refreshToken') bodyToken: string, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refreshToken || bodyToken;
    await this.authService.logout(token);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { success: true };
  }

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return user;
  }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none' as const,
    };
    
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 }); // 1 hour
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
  }
}
