import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMeta } from '../../common/response-meta.decorator';
import { Premium } from '../../common/premium.decorator';
import { IngestNewsBodyDto, ListNewsQueryDto, NewsDigestQueryDto } from './news.dto';
import { NewsIngestGuard } from './news-ingest.guard';
import { NewsService } from './news.service';

@ApiTags('news')
@ResponseMeta({
  source: 'Editorial, regulatory & corporate sources',
  dataset: 'Vaca Muerta oil & gas news & disclosures',
  license: 'Metadata + snippets; full-text rights remain with each publisher',
  note: 'Each document carries its own source_url, source_family and legal_mode',
})
@Controller({ path: 'news', version: '1' })
export class NewsController {
  constructor(private readonly service: NewsService) {}

  @Post('ingest')
  @UseGuards(NewsIngestGuard)
  @ApiSecurity('news-ingest-token')
  @ApiOperation({
    summary: 'Ingest news documents (internal, token-guarded)',
    description:
      'The data pipeline POSTs batches here. Upserts by doc_id; never overwrites editor notes. Body: { documents: Document[] }.',
  })
  ingest(@Body() body: IngestNewsBodyDto) {
    return this.service.ingest(body.documents);
  }

  @Get()
  @ApiOperation({
    summary: 'List news documents',
    description:
      'Paginated, filterable feed. Sort by importance (default) or recency. ' +
      'Filter by source_family, topic, entity (company/regulator), region, ' +
      'free-text q (title/deck) and a publishedAt from/to window. ' +
      'Returns a card-level projection (no body_text).',
  })
  list(@Query() q: ListNewsQueryDto) {
    return this.service.list(q);
  }

  @Get('facets')
  @ApiOperation({
    summary: 'News filter facets',
    description: 'Distinct topics, source families and top entities with counts, for filter UIs.',
  })
  facets() {
    return this.service.getFacets();
  }

  // Declared before :docId so "digest" isn't read as a document id.
  @Get('digest')
  @Premium()
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'News digest for the content agent (API key)',
    description:
      'Top stories in a publishedAt window (default: last 24 h), one per cluster, ranked by ' +
      'importance. Full documents — body_text, numbers, signals, entities — plus `sources`: every ' +
      'outlet in the cluster, for on-screen citations. Filter by topic / entity.',
  })
  digest(@Query() q: NewsDigestQueryDto, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'private, max-age=60'); // behind a key: no shared caches
    return this.service.digest(q);
  }

  @Get(':docId')
  @ApiOperation({
    summary: 'Single news document + cluster',
    description: 'Returns the document and its cluster siblings (other docs sharing cluster_id).',
  })
  @ApiParam({ name: 'docId', description: 'Document id (sha1 of canonical source_url)' })
  getOne(@Param('docId') docId: string) {
    return this.service.getOne(docId);
  }
}
