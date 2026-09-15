import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { UserDocument } from '../users/schemas/user.schema.js';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { RefreshSession, RefreshSessionDocument } from './schemas/refresh-session.schema.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private usersService: UsersService,
    @Inject(JwtService) private jwtService: JwtService,
    @InjectModel(RefreshSession.name) private refreshSessionModel: mongoose.Model<RefreshSessionDocument>
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (user && user.password) {
      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        const { password, ...result } = user.toObject();
        return result;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user._id, role: user.role, name: user.name };
    const accessToken = this.jwtService.sign(payload);

    // Generate Refresh Token: prefix with userId for fast DB lookup
    const rawToken = crypto.randomBytes(40).toString('hex');
    const refreshToken = `${user._id}.${rawToken}`;
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.refreshSessionModel.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const parts = refreshToken.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid refresh token format');
    }
    const [userId, rawToken] = parts;

    const sessions = await this.refreshSessionModel.find({
      userId,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() }
    });

    let validSession: RefreshSessionDocument | null = null;
    for (const session of sessions) {
      const isMatch = await bcrypt.compare(rawToken, session.tokenHash);
      if (isMatch) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findOne(userId) as UserDocument;
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    const payload = { email: user.email, sub: user._id, role: user.role, name: user.name };
    const newAccessToken = this.jwtService.sign(payload);

    const newRawToken = crypto.randomBytes(40).toString('hex');
    const newRefreshToken = `${user._id}.${newRawToken}`;
    const tokenHash = await bcrypt.hash(newRawToken, 10);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    validSession.revokedAt = new Date();
    await validSession.save();

    await this.refreshSessionModel.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const parts = refreshToken.split('.');
    if (parts.length !== 2) return;
    const [userId, rawToken] = parts;

    const sessions = await this.refreshSessionModel.find({
      userId,
      revokedAt: { $exists: false }
    });

    for (const session of sessions) {
      const isMatch = await bcrypt.compare(rawToken, session.tokenHash);
      if (isMatch) {
        session.revokedAt = new Date();
        await session.save();
        break;
      }
    }
  }
}
