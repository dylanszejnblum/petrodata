import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, MaxLength } from 'class-validator';

export const NEWSLETTER_SOURCES = ['newsletter-modal', 'footer', 'landing-page'] as const;
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

export class SubscribeNewsletterDto {
  @ApiProperty({
    example: 'you@example.com',
    description: 'Subscriber email. Normalised (trimmed + lowercased) before storage.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'A valid email is required.' })
  @MaxLength(254) // RFC 5321 maximum address length
  email: string;

  @ApiPropertyOptional({
    enum: NEWSLETTER_SOURCES,
    description: 'Where the signup originated.',
  })
  @IsOptional()
  @IsIn(NEWSLETTER_SOURCES)
  source?: NewsletterSource;
}

export class SubscribeResponseDto {
  @ApiProperty({
    example: 'subscribed',
    description: 'Always "subscribed" — the response never reveals whether the email already existed.',
  })
  status: string;
}
