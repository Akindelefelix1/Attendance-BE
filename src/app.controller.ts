import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Service welcome endpoint' })
  @ApiOkResponse({ description: 'Service is reachable' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiOkResponse({
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        timestamp: { type: 'string', example: '2026-03-26T10:00:00.000Z' }
      }
    }
  })
  getHealth() {
    return {
      ok: true,
      timestamp: new Date().toISOString()
    };
  }
}
