import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthDto } from './modules/data-status/data-status.response';

@ApiTags('system')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Liveness check', description: 'Always returns 200 if the process is up. Use as a load-balancer health probe.' })
  @ApiOkResponse({ type: HealthDto })
  health() {
    return { status: 'ok', service: 'petroldata-api' };
  }
}
