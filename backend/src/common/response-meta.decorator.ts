import { SetMetadata } from '@nestjs/common';

export const RESPONSE_META_KEY = 'response_meta_override';

/**
 * Override the default (production-data) response `meta` for a controller or
 * handler. The ResponseInterceptor uses this verbatim instead of
 * MetaService.buildMeta(). Use on endpoints that don't serve production data
 * (e.g. news) so they don't misattribute themselves.
 */
export const ResponseMeta = (meta: Record<string, unknown>) =>
  SetMetadata(RESPONSE_META_KEY, meta);
