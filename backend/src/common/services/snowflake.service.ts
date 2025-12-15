import { Injectable } from '@nestjs/common';

/**
 * Snowflake ID 서비스
 * @description Twitter Snowflake 알고리즘 기반 고유 ID 생성
 *
 * 구조 (64bit):
 * [41bit 타임스탬프][10bit 워커ID][13bit 시퀀스]
 */
@Injectable()
export class SnowflakeService {
  private readonly epoch = 1704067200000n;
  private readonly workerIdBits = 10n;
  private readonly sequenceBits = 13n;
  private readonly maxWorkerId = (1n << this.workerIdBits) - 1n; // 1023
  private readonly maxSequence = (1n << this.sequenceBits) - 1n; // 8191

  private readonly workerId: bigint;
  private sequence = 0n;
  private lastTimestamp = -1n;

  constructor() {
    // 워커 ID 설정 (환경변수 또는 기본값)
    const nodeId = BigInt(process.env.NODE_ID || '0');
    if (nodeId < 0n || nodeId > this.maxWorkerId) {
      throw new Error(`Worker ID must be between 0 and ${this.maxWorkerId}`);
    }
    this.workerId = nodeId;
  }

  /**
   * Snowflake ID 생성
   * @returns Bigint 형식의 ID
   */
  generate(): string {
    let timestamp = BigInt(Date.now());

    // 시간이 역행한 경우
    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards. Refusing to generate id');
    }

    // 같은 밀리초 내 생성
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & this.maxSequence;

      // 시퀀스 초과 시 다음 밀리초 대기
      if (this.sequence === 0n) {
        timestamp = this.waitNextMillis(timestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    // ID 조합: [타임스탬프 41bit][워커ID 10bit][시퀀스 13bit]
    const id =
      ((timestamp - this.epoch) << (this.workerIdBits + this.sequenceBits)) |
      (this.workerId << this.sequenceBits) |
      this.sequence;

    return id.toString();
  }

  /**
   * 다음 밀리초까지 대기
   */
  private waitNextMillis(currentTimestamp: bigint): bigint {
    let timestamp = BigInt(Date.now());
    while (timestamp <= currentTimestamp) {
      timestamp = BigInt(Date.now());
    }
    return timestamp;
  }

  /**
   * Snowflake ID에서 타임스탬프 추출
   * @param id Bigint 문자열
   * @returns Date 객체
   */
  extractTimestamp(id: string): Date {
    const snowflakeId = BigInt(id);
    const timestamp = (snowflakeId >> (this.workerIdBits + this.sequenceBits)) + this.epoch;
    return new Date(Number(timestamp));
  }

  /**
   * Snowflake ID에서 워커 ID 추출
   * @param id Bigint 문자열
   * @returns 워커 ID
   */
  extractWorkerId(id: string): number {
    const snowflakeId = BigInt(id);
    const workerId = (snowflakeId >> this.sequenceBits) & this.maxWorkerId;
    return Number(workerId);
  }

  /**
   * Snowflake ID에서 시퀀스 추출
   * @param id Bigint 문자열
   * @returns 시퀀스 번호
   */
  extractSequence(id: string): number {
    const snowflakeId = BigInt(id);
    const sequence = snowflakeId & this.maxSequence;
    return Number(sequence);
  }
}
