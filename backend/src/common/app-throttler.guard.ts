import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { timingSafeEqual } from 'crypto';
import { votanteDe } from '../modules/directivos/voto-reglas';

/* El ThrottlerGuard de siempre, con dos excepciones:

   · EL FRONTEND NO SE LIMITA. Todo lo que el servidor de Next pide —renders,
     revalidaciones, las herramientas del chat— sale de UNA IP, y con 120/min
     por IP compartía el cupo con todos los visitantes a la vez: después de un
     deploy o con varios chats abiertos devolvía 429. Se identifica con
     INTERNAL_API_KEY en `x-internal-key`; sin la variable no se salta nada.

   · EN /directivos EL CUPO ES POR NAVEGADOR. En un evento cientos de personas
     votan desde el mismo wifi, o sea desde la misma IP: por IP, el cupo se lo
     comía el primero. Ahí la clave es IP + `x-votante`. Fuera de /directivos el
     header no cuenta, para que rotarlo no saltee el límite del resto de la API.
     ponytail: rotar el id sí multiplica el cupo en /directivos; lo que frena
     el volumen ahí es el techo semanal por IP del voto (VOTE_IP_WEEKLY_CAP). */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(ctx: ExecutionContext): Promise<boolean> {
    const clave = process.env.INTERNAL_API_KEY;
    if (!clave) return false;
    const dada = ctx.switchToHttp().getRequest<{ headers: Record<string, unknown> }>().headers['x-internal-key'];
    if (typeof dada !== 'string' || dada.length !== clave.length) return false;
    return timingSafeEqual(Buffer.from(dada), Buffer.from(clave));
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip: string = req.ip || 'unknown';
    const votante = String(req.path ?? req.url ?? '').includes('/directivos')
      ? votanteDe(req.headers?.['x-votante'])
      : null;
    return votante ? `${ip}:${votante}` : ip;
  }
}
