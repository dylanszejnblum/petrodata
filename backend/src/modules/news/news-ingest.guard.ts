import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Bearer-token guard for the internal ingest endpoint. The data pipeline holds
 * the token; the backend is the only writer to the DB. Fails closed: if
 * NEWS_INGEST_TOKEN is unset, ingest is disabled.
 */
@Injectable()
export class NewsIngestGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.NEWS_INGEST_TOKEN;
    if (!expected) {
      throw new UnauthorizedException('news ingest disabled: NEWS_INGEST_TOKEN not set');
    }
    const req = context.switchToHttp().getRequest<Request>();
    const auth = (req.headers['authorization'] as string) ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (token !== expected) {
      throw new UnauthorizedException('invalid ingest token');
    }
    return true;
  }
}
