import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { NewsIngestGuard } from './news-ingest.guard';

const ctx = (authorization?: string) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ headers: authorization ? { authorization } : {} }) }),
  }) as unknown as ExecutionContext;

describe('NewsIngestGuard', () => {
  const guard = new NewsIngestGuard();
  const previo = process.env.NEWS_INGEST_TOKEN;
  afterAll(() => {
    process.env.NEWS_INGEST_TOKEN = previo;
  });

  it('falla cerrado sin token configurado', () => {
    delete process.env.NEWS_INGEST_TOKEN;
    expect(() => guard.canActivate(ctx('Bearer cualquiera'))).toThrow(UnauthorizedException);
  });

  it('acepta el token exacto y rechaza el resto', () => {
    process.env.NEWS_INGEST_TOKEN = 'secreto-de-prueba';
    expect(guard.canActivate(ctx('Bearer secreto-de-prueba'))).toBe(true);
    expect(() => guard.canActivate(ctx('Bearer secreto-de-prueb'))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx('Bearer secreto-de-prueba-extra'))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx())).toThrow(UnauthorizedException);
  });
});
