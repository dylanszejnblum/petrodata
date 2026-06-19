import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MetaService } from './meta.service';
import { RESPONSE_META_KEY } from './response-meta.decorator';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface RawResult<T = unknown> {
  data: T;
  pagination?: Pagination;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly meta: MetaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const override = this.reflector.getAllAndOverride<Record<string, unknown>>(
      RESPONSE_META_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    return next.handle().pipe(
      switchMap((value) =>
        from(
          (async () => {
            const meta = override ?? (await this.meta.buildMeta());
            // Pass-through for already-shaped payloads (e.g. GeoJSON)
            if (value && typeof value === 'object' && (value as any).__raw === true) {
              const { __raw, ...rest } = value as any;
              return rest;
            }
            if (
              value &&
              typeof value === 'object' &&
              'data' in value &&
              !Array.isArray(value)
            ) {
              const r = value as RawResult;
              return { data: r.data, meta, ...(r.pagination ? { pagination: r.pagination } : {}) };
            }
            return { data: value, meta };
          })(),
        ),
      ),
    );
  }
}
