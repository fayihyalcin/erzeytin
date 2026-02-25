import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'zeytin-admin-api',
      timestamp: new Date().toISOString(),
    };
  }
}