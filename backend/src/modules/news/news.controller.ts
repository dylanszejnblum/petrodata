import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseMeta } from '../../common/response-meta.decorator';
import { IngestNewsBodyDto, ListNewsQueryDto } from './news.dto';
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
    description: 'Most recent first. Filter by source_family.',
  })
  list(@Query() q: ListNewsQueryDto) {
    return this.service.list({ take: q.take, family: q.family });
  }
}
