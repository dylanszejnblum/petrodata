import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMeta } from '../../common/response-meta.decorator';
import { ApiOkEnvelope } from '../../common/swagger';
import { SubscribeNewsletterDto, SubscribeResponseDto } from './newsletter.dto';
import { NewsletterService } from './newsletter.service';

@ApiTags('newsletter')
@ResponseMeta({
  source: 'Petrodata',
  dataset: 'Newsletter subscriptions',
  note: 'Write-only public endpoint; responses never reveal subscription status.',
})
@Controller({ path: 'newsletter', version: '1' })
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Subscribe an email to the newsletter',
    description:
      'Idempotent. Always returns 200 with the same body whether the email is new or already subscribed, so it cannot be used to probe who is on the list. The email is normalised (trim + lowercase) and deduped on a unique column.',
  })
  @ApiOkEnvelope(SubscribeResponseDto)
  async subscribe(
    @Body() dto: SubscribeNewsletterDto,
    @Req() req: Request,
  ): Promise<SubscribeResponseDto> {
    // req.ip, not the left-most X-Forwarded-For: with `trust proxy 1` Express
    // resolves the hop Traefik appended. The left-most value is client-supplied,
    // so reading it let anyone reset this rate limit by sending a new header.
    const ip = req.ip || 'unknown';
    await this.service.subscribe(dto.email, dto.source ?? 'newsletter-modal', ip);
    return { status: 'subscribed' };
  }
}
