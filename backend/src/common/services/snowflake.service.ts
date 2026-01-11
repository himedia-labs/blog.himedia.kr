import { Injectable } from '@nestjs/common';
import { Snowflake } from '@sapphire/snowflake';

/**
 * Snowflake ID 서비스
 * @description 분산 환경에서 고유 ID 생성 (@sapphire/snowflake 패키지 사용)
 */
@Injectable()
export class SnowflakeService {
  private readonly snowflake: Snowflake;

  constructor() {
    // Epoch: 2024-01-01 00:00:00 UTC (1704067200000ms)
    const epoch = 1704067200000n;
    this.snowflake = new Snowflake(epoch);
  }

  /**
   * Snowflake ID 생성
   */
  generate(): string {
    return this.snowflake.generate().toString();
  }
}
