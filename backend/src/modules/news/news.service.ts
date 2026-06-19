import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NewsDocumentInput } from './news.dto';

const REQUIRED = [
  'doc_id', 'source_name', 'source_family', 'source_type',
  'source_url', 'retrieved_at', 'title', 'legal_mode',
];

export interface IngestResult {
  upserted: number;
  skipped: number;
  errors: { doc_id?: unknown; error: string }[];
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  async list(params: { take?: number; family?: string }) {
    const take = Math.min(params.take ?? 50, 200);
    return this.prisma.newsDocument.findMany({
      where: params.family ? { sourceFamily: params.family } : undefined,
      orderBy: { publishedAt: { sort: 'desc', nulls: 'last' } },
      take,
    });
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
