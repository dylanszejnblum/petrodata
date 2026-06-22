import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NewsletterSource } from './newsletter.dto';

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const PRUNE_THRESHOLD = 10_000;

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  private rateLimited(ip: string, now: number): boolean {
    // Opportunistically drop expired buckets so the map can't grow unbounded.
    if (this.hits.size > PRUNE_THRESHOLD) {
      for (const [k, v] of this.hits) if (now > v.resetAt) this.hits.delete(k);
    }
    const entry = this.hits.get(ip);
    if (!entry || now > entry.resetAt) {
      this.hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return false;
    }
    entry.count += 1;
    return entry.count > RATE_LIMIT_MAX;
  }

  /**
   * Idempotent subscribe. Always resolves successfully — whether the email is
   * new, already subscribed, rate-limited, or the write failed — so the caller's
   * response never reveals subscription status (no enumeration). Dedup is
   * enforced by the unique `email` column via an atomic upsert, so there is no
   * find-then-create race.
   */
  async subscribe(email: string, source: NewsletterSource, ip: string): Promise<void> {
    if (this.rateLimited(ip, Date.now())) return;
    try {
      await this.prisma.newsletterSubscriber.upsert({
        where: { email },
        create: { email, source },
        update: {}, // already subscribed → keep original source + timestamp
      });
    } catch (err) {
      // Swallow and log without the email (privacy): never surface the reason.
      this.logger.warn(`newsletter subscribe failed: ${(err as Error).message}`);
    }
  }
}
