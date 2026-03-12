import { Injectable } from '@nestjs/common';

@Injectable()
export class ServiceApiService {
  getHealthStatus(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
