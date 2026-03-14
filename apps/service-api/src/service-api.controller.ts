import { Controller, Get } from '@nestjs/common';
import { ServiceApiService } from './service-api.service';

@Controller({ version: '1' })
export class ServiceApiController {
  constructor(private readonly serviceApiService: ServiceApiService) {}

  @Get()
  getInfo() {
    return {
      name: 'Medical Learning Portal API',
      version: '1.0.0',
      status: 'ok',
    };
  }

  @Get('health')
  getHealth() {
    return this.serviceApiService.getHealthStatus();
  }
}

