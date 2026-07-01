import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { PREMIUM_KEY } from './premium.decorator';

/**
 * Gates @Premium() routes behind a valid API key. Unmarked routes are public and
 * pass straight through. The key arrives as `x-api-key: <key>` (or
 * `Authorization: Bearer <key>`); we hash it and match the stored SHA-256 — the
 * plaintext is never in the DB. On success the key is attached to the request
 * (`req.apiKey`) for later usage metering.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const premium = this.reflector.getAllAndOverride<boolean>(PREMIUM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!premium) return true; // public route

    const req = context.switchToHttp().getRequest<Request>();
    const header = (req.headers['x-api-key'] as string) ?? '';
    const auth = (req.headers['authorization'] as string) ?? '';
    const provided = header || (auth.startsWith('Bearer ') ? auth.slice(7).trim() : '');
    if (!provided) {
      throw new UnauthorizedException('API key required: send it as the x-api-key header');
    }

    const keyHash = createHash('sha256').update(provided).digest('hex');
    const key = await this.prisma.apiKey.findUnique({ where: { keyHash } });
    if (!key || !key.active) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    (req as Request & { apiKey?: { id: number; label: string } }).apiKey = { id: key.id, label: key.label };
    return true;
  }
}
