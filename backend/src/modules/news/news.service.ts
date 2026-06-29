import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListNewsQueryDto, NewsDocumentInput } from './news.dto';

const REQUIRED = [
  'doc_id', 'source_name', 'source_family', 'source_type',
  'source_url', 'retrieved_at', 'title', 'legal_mode',
];

/** Card-level projection — never ships `bodyText` in list responses (legal gating
 *  is enforced at the doc level; the feed only needs metadata). */
const LIST_SELECT = {
  docId: true,
  sourceName: true,
  sourceFamily: true,
  sourceType: true,
  sourceUrl: true,
  publishedAt: true,
  eventDate: true,
  title: true,
  deck: true,
  region: true,
  entities: true,
  topics: true,
  clusterId: true,
  importanceScore: true,
  legalMode: true,
} satisfies Prisma.NewsDocumentSelect;

/** Adds the fields needed to derive card extras (reading time, thumbnail). These
 *  are consumed server-side in `toCard` and stripped before the response — the
 *  feed still never ships raw `bodyText`. */
const LIST_SELECT_CARD = {
  ...LIST_SELECT,
  bodyText: true,
  attachments: true,
} satisfies Prisma.NewsDocumentSelect;

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i;

/** Estimated reading time in whole minutes (>= 1) at ~200 wpm; null when no body. */
function readingMinutes(text: string | null): number | null {
  if (!text) return null;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words ? Math.max(1, Math.round(words / 200)) : null;
}

/** First image URL among attachments, if any. */
function firstImageUrl(attachments: unknown): string | null {
  if (!Array.isArray(attachments)) return null;
  for (const a of attachments) {
    const url = a && typeof a === 'object' ? (a as { url?: unknown }).url : null;
    if (typeof url !== 'string' || !url) continue;
    const type = (a as { type?: unknown }).type;
    const isImage =
      (typeof type === 'string' && type.toLowerCase().startsWith('image')) || IMAGE_EXT.test(url);
    if (isImage) return url;
  }
  return null;
}

export interface IngestResult {
  upserted: number;
  skipped: number;
  errors: { doc_id?: unknown; error: string }[];
}

export interface Facet {
  value: string;
  count: number;
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Project a `LIST_SELECT_CARD` row to the card shape: derive `readingMinutes`
   *  and `image`, then drop the raw `bodyText`/`attachments` so they never ship.
   *  The thumbnail is gated to docs we're licensed to reproduce. */
  private toCard(row: Prisma.NewsDocumentGetPayload<{ select: typeof LIST_SELECT_CARD }>) {
    const { bodyText, attachments, ...card } = row;
    return {
      ...card,
      readingMinutes: readingMinutes(bodyText),
      image: card.legalMode === 'fulltext_internal' ? firstImageUrl(attachments) : null,
    };
  }

  /** Idempotent upsert by doc_id. Re-ingesting an existing doc updates it but
   *  never clobbers `editorNotes` (human-in-the-loop) or `createdAt`. */
  async ingest(documents: NewsDocumentInput[]): Promise<IngestResult> {
    let upserted = 0;
    const errors: IngestResult['errors'] = [];

    for (const d of documents) {
      const missing = REQUIRED.filter((k) => !d[k]);
      if (missing.length) {
        errors.push({ doc_id: d['doc_id'], error: `missing: ${missing.join(', ')}` });
        continue;
      }
      try {
        const row = this.toRow(d);
        await this.prisma.newsDocument.upsert({
          where: { docId: row.docId },
          create: { ...row, editorNotes: (d['editor_notes'] as string) ?? '' },
          update: row, // editorNotes/createdAt absent here → preserved
        });
        upserted++;
      } catch (e) {
        errors.push({ doc_id: d['doc_id'], error: (e as Error).message });
      }
    }

    if (errors.length) {
      this.logger.warn(`ingest: ${upserted} upserted, ${errors.length} skipped`);
    }
    return { upserted, skipped: errors.length, errors };
  }

  /** Filterable, paginated feed. Returns a `{ data, pagination }` envelope so the
   *  response interceptor attaches `pagination` alongside `meta`. */
  async list(q: ListNewsQueryDto) {
    const limit = Math.min(q.pageSize ?? q.take ?? 24, 200);
    const page = Math.max(q.page ?? 1, 1);
    const skip = (page - 1) * limit;

    const where = this.buildWhere(q);
    const orderBy: Prisma.NewsDocumentOrderByWithRelationInput[] =
      q.sort === 'recent'
        ? [{ publishedAt: { sort: 'desc', nulls: 'last' } }]
        : [
            { importanceScore: { sort: 'desc', nulls: 'last' } },
            { publishedAt: { sort: 'desc', nulls: 'last' } },
          ];

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.newsDocument.findMany({
        where,
        orderBy,
        select: LIST_SELECT_CARD,
        skip,
        take: limit,
      }),
      this.prisma.newsDocument.count({ where }),
    ]);

    return { data: rows.map((r) => this.toCard(r)), pagination: { page, limit, total } };
  }

  /** Single document + its cluster siblings (other docs sharing `clusterId`). */
  async getOne(docId: string) {
    const document = await this.prisma.newsDocument.findUnique({ where: { docId } });
    if (!document) throw new NotFoundException(`news document not found: ${docId}`);

    const cluster = document.clusterId
      ? await this.prisma.newsDocument.findMany({
          where: { clusterId: document.clusterId, docId: { not: docId } },
          orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
          select: LIST_SELECT_CARD,
          take: 20,
        })
      : [];

    return { document, cluster: cluster.map((r) => this.toCard(r)) };
  }

  /** Distinct topics / source families / regions / top entities with counts, for filter UI. */
  async getFacets() {
    const [topics, families, regions, entities] = await Promise.all([
      this.prisma.$queryRaw<Facet[]>`
        SELECT t AS value, COUNT(*)::int AS count
        FROM news_document, unnest(topics) AS t
        WHERE t <> ''
        GROUP BY t
        ORDER BY count DESC, t ASC
        LIMIT 60`,
      this.prisma.$queryRaw<Facet[]>`
        SELECT source_family AS value, COUNT(*)::int AS count
        FROM news_document
        GROUP BY source_family
        ORDER BY count DESC, source_family ASC`,
      this.prisma.$queryRaw<Facet[]>`
        SELECT r AS value, COUNT(*)::int AS count
        FROM news_document, unnest(region) AS r
        WHERE r <> ''
        GROUP BY r
        ORDER BY count DESC, r ASC
        LIMIT 40`,
      this.prisma.$queryRaw<Facet[]>`
        SELECT value, COUNT(*)::int AS count FROM (
          SELECT jsonb_array_elements_text(COALESCE(entities->'companies', '[]'::jsonb)) AS value FROM news_document
          UNION ALL
          SELECT jsonb_array_elements_text(COALESCE(entities->'regulators', '[]'::jsonb)) AS value FROM news_document
        ) s
        WHERE value <> ''
        GROUP BY value
        ORDER BY count DESC, value ASC
        LIMIT 40`,
    ]);

    return { topics, families, regions, entities };
  }

  private buildWhere(q: ListNewsQueryDto): Prisma.NewsDocumentWhereInput {
    const and: Prisma.NewsDocumentWhereInput[] = [];

    if (q.family) and.push({ sourceFamily: q.family });
    if (q.topic) and.push({ topics: { has: q.topic } });
    if (q.region) and.push({ region: { has: q.region } });

    if (q.entity) {
      and.push({
        OR: [
          { entities: { path: ['companies'], array_contains: q.entity } },
          { entities: { path: ['regulators'], array_contains: q.entity } },
        ],
      });
    }

    if (q.q) {
      and.push({
        OR: [
          { title: { contains: q.q, mode: 'insensitive' } },
          { deck: { contains: q.q, mode: 'insensitive' } },
        ],
      });
    }

    if (q.from || q.to) {
      and.push({
        publishedAt: {
          ...(q.from ? { gte: new Date(q.from) } : {}),
          ...(q.to ? { lte: new Date(q.to) } : {}),
        },
      });
    }

    return and.length ? { AND: and } : {};
  }

  private toRow(d: NewsDocumentInput) {
    const str = (k: string) => (d[k] == null ? null : String(d[k]));
    const date = (k: string) => (d[k] ? new Date(String(d[k])) : null);
    const num = (k: string) => (d[k] == null ? null : Number(d[k]));
    const json = (k: string, fallback: Prisma.InputJsonValue) =>
      (d[k] ?? fallback) as Prisma.InputJsonValue;

    return {
      docId: String(d['doc_id']),
      sourceName: String(d['source_name']),
      sourceFamily: String(d['source_family']),
      sourceType: String(d['source_type']),
      sourceUrl: String(d['source_url']),
      discoveredVia: str('discovered_via'),
      retrievedAt: new Date(String(d['retrieved_at'])),
      publishedAt: date('published_at'),
      eventDate: date('event_date'),
      title: String(d['title']),
      deck: str('deck'),
      bodyText: str('body_text'),
      language: (d['language'] as string) ?? 'es',
      region: (d['region'] as string[]) ?? [],
      geo: json('geo', {}),
      entities: json('entities', {}),
      topics: (d['topics'] as string[]) ?? [],
      signals: json('signals', {}),
      numbers: json('numbers', {}),
      attachments: json('attachments', []),
      clusterId: str('cluster_id'),
      noveltyScore: num('novelty_score'),
      importanceScore: num('importance_score'),
      legalMode: String(d['legal_mode']),
    };
  }
}
