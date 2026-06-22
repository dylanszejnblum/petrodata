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
    // Read the client IP from the proxy header (not a request-body/param), so it
    // stays out of the OpenAPI contract. Used only for in-memory rate limiting.
    const xff = (req.headers['x-forwarded-for'] as string) ?? '';
    const ip = xff.split(',')[0]?.trim() || req.ip || 'unknown';
    await this.service.subscribe(dto.email, dto.source ?? 'newsletter-modal', ip);
    return { status: 'subscribed' };
  }
}
