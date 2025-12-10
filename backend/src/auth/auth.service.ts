import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService, OAuthProfile } from '../user/user.service';
import { User } from '@prisma/client';

export interface TokenPayload {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthResult {
  user: User;
  token: TokenPayload;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  async validateOAuthLogin(profile: OAuthProfile): Promise<AuthResult> {
    const user = await this.userService.findOrCreateByOAuth(profile);
    const token = this.generateToken(user);
    return { user, token };
  }

  async linkOAuthAccount(
    userId: string,
    profile: OAuthProfile,
  ): Promise<AuthResult> {
    await this.userService.linkAccount(userId, profile);
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const token = this.generateToken(user);
    return { user, token };
  }

  generateToken(user: User): TokenPayload {
    const payload = { sub: user.id };
    const expiresIn = this.getExpiresInSeconds();

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn,
    };
  }

  async refreshToken(userId: string): Promise<TokenPayload> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.generateToken(user);
  }

  private getExpiresInSeconds(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 604800; // default 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 604800;
    }
  }
}
