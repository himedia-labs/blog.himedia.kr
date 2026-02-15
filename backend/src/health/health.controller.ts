import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service';

@Controller()
export class HealthController {
  /**
   * 헬스 컨트롤러
   * @description 상태 확인 요청을 처리
   */
  constructor(private readonly healthService: HealthService) {}

  /**
   * 루트 상태
   * @description 루트 경로에서 서버 상태를 반환
   */
  @Get()
  getRootHealth() {
    return this.healthService.getServerHealth();
  }

  /**
   * 서버 상태
   * @description 서버 상태 확인 결과를 반환
   */
  @Get('health')
  getServerHealth() {
    return this.healthService.getServerHealth();
  }

  /**
   * 데이터베이스 상태
   * @description 데이터베이스 연결 상태를 반환
   */
  @Get('health/db')
  getDatabaseHealth() {
    return this.healthService.getDatabaseHealth();
  }
}
