import type { PrismaService } from '../prisma/prisma.service';
import { cached, TTL } from './cache';

/**
 * Operators keep filing a month for weeks after it closes, so the newest month
 * on file is usually partial: in Oct 2026, September showed 4,102 producing VM
 * wells against August's 5,337 and read as a fake 20% production drop.
 *
 * Rule (same as /inversiones' referenceMonth): walking back from the newest
 * month, a month with < 90% of the previous month's producing wells is still
 * being reported. Returns the newest month that passes, or the oldest of the
 * window if none do.
 */
export function pickCompleteMonth(rows: { month: Date; wells: number }[]): Date | null {
  // rows newest first
  if (!rows.length) return null;
  let i = 0;
  while (i + 1 < rows.length && rows[i].wells < 0.9 * rows[i + 1].wells) i++;
  return rows[i].month;
}

/** Newest fully reported production month (cached; data refreshes monthly). */
export function latestCompleteMonth(prisma: PrismaService): Promise<Date | null> {
  return cached('production:latest-complete-month', TTL.LONG, async () => {
    const rows = await prisma.$queryRaw<{ month: Date; wells: number }[]>`
      SELECT date_month AS month, COUNT(*) FILTER (WHERE boe > 0)::int AS wells
      FROM fact_production_monthly
      WHERE date_month >= (SELECT MAX(date_month) FROM fact_production_monthly) - INTERVAL '3 months'
      GROUP BY date_month
      ORDER BY date_month DESC`;
    return pickCompleteMonth(rows);
  });
}

/** `preliminary` flag for a series point: true when the month is past the complete one. */
export const isPreliminary = (month: Date | string, complete: Date | null): boolean =>
  complete != null && new Date(month).getTime() > complete.getTime();
