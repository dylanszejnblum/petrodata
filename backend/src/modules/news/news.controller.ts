import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IngestNewsBodyDto, ListNewsQueryDto } from './news.dto';
import { NewsIngestGuard } from './news-ingest.guard';
import { NewsService } from './news.service';

@ApiTags('news')
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
