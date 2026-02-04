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
    const epoch = 1704067200000n;
    this.snowflake = new Snowflake(epoch);
  }

  /**
   * Snowflake ID 생성
   * @description 고유 ID를 문자열로 반환
   */
  generate(): string {
    return this.snowflake.generate().toString();
  }
}
