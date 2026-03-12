import { Controller, Get } from '@nestjs/common';

@Controller()
export class ServiceApiController {
  @Get()
  getInfo() {
    return {
      name: 'Medical Learning Portal API',
      version: '1.0.0',
      status: 'ok',
    };
  }
}

