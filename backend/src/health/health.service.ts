import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  /**
   * 헬스 서비스
   * @description 서버와 데이터베이스 상태를 확인
   */
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * 서버 상태
   * @description 애플리케이션 상태를 반환
   */
  getServerHealth() {
    // 상태/응답
    return {
      status: 'ok',
      service: 'himedia-backend',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 데이터베이스 상태
   * @description 데이터베이스 연결 상태를 반환
   */
  async getDatabaseHealth() {
    // 연결/확인
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
      });
    }

    // 상태/응답
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
