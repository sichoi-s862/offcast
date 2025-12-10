import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

function createOAuthGuard(strategyName: string) {
  @Injectable()
  class OAuthGuard extends AuthGuard(strategyName) {
    constructor(public configService: ConfigService) {
      super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();

      // 사용자가 OAuth 동의를 거부한 경우
      if (request.query.error) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const errorMessage = request.query.error_description || request.query.error || 'access_denied';
        response.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`);
        return false;
      }

      try {
        return (await super.canActivate(context)) as boolean;
      } catch (err) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const errorMessage = err?.message || 'Authentication failed';
        response.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`);
        return false;
      }
    }
  }
  return OAuthGuard;
}

@Injectable()
export class YouTubeOAuthGuard extends createOAuthGuard('youtube') {}

@Injectable()
export class TikTokOAuthGuard extends createOAuthGuard('tiktok') {}

@Injectable()
export class SoopOAuthGuard extends createOAuthGuard('soop') {}

@Injectable()
export class InstagramOAuthGuard extends createOAuthGuard('instagram') {}

@Injectable()
export class ChzzkOAuthGuard extends createOAuthGuard('chzzk') {}
