import { getAuditResultTone } from '@/app/(routes)/(private)/admin/utils/formatAuditLog.utils';

import type { AdminReportStatus } from '@/app/shared/types/admin';

type AdminStyleMap = Record<string, string>;

/**
 * 역할 배지 클래스 조회
 * @description 신청 역할별 스타일 클래스명을 반환
 */
export const getRoleBadgeClassName = (styles: AdminStyleMap, role: string | null | undefined) => {
  if (role === 'GRADUATE') return styles.roleBadgeGraduate;
  if (role === 'MENTOR') return styles.roleBadgeMentor;
  if (role === 'INSTRUCTOR') return styles.roleBadgeInstructor;
  return styles.roleBadgeTrainee;
};

/**
 * 감사 결과 배지 클래스 조회
 * @description 감사 로그 payload 결과값에 맞는 스타일 클래스명을 반환
 */
export const getAuditResultBadgeClassName = (styles: AdminStyleMap, payload: Record<string, unknown> | null) => {
  const tone = getAuditResultTone(payload);
  if (tone === 'success') return styles.auditResultSuccess;
  if (tone === 'error') return styles.auditResultError;
  return styles.auditResultWarning;
};

/**
 * 접속 상태 배지 클래스 조회
 * @description 접속일지 상태값에 맞는 스타일 클래스명을 반환
 */
export const getAccessStatusBadgeClassName = (styles: AdminStyleMap, status: string) => {
  if (status === '접속중') return styles.auditResultSuccess;
  if (status === '종료') return styles.auditResultError;
  if (status === '강제 만료') return styles.auditResultError;
  return styles.auditResultWarning;
};

/**
 * 신고 상태 라벨
 * @description 신고 상태 코드를 한글 라벨로 변환
 */
export const getReportStatusLabel = (status: AdminReportStatus) => {
  if (status === 'IN_PROGRESS') return '진행중';
  if (status === 'RESOLVED') return '해결';
  if (status === 'REJECTED') return '반려';
  return '접수';
};

/**
 * 신고 상태 배지 클래스 조회
 * @description 신고 상태 코드에 맞는 스타일 클래스명을 반환
 */
export const getReportStatusBadgeClassName = (styles: AdminStyleMap, status: AdminReportStatus) => {
  if (status === 'IN_PROGRESS') return styles.auditResultWarning;
  if (status === 'RESOLVED') return styles.auditResultSuccess;
  if (status === 'REJECTED') return styles.auditResultError;
  return styles.reportStatusOpen;
};

/**
 * 신고자 라벨
 * @description 신고자 정보를 이름(이메일 / 회원PK) 형식으로 변환
 */
export const formatReporterLabel = (
  reporterUserId: string | null,
  reporterName: string | null,
  reporterEmail: string | null,
) => {
  if (!reporterUserId) return '비회원/미기록';
  if (reporterName && reporterEmail) return `${reporterName} (${reporterEmail} / ${reporterUserId})`;
  if (reporterEmail) return `${reporterEmail} (${reporterUserId})`;
  if (reporterName) return `${reporterName} (${reporterUserId})`;
  return `회원 (${reporterUserId})`;
};

/**
 * 신고 본문 분리
 * @description 신고 본문에서 첨부 이미지 메타 블록을 제거한 텍스트를 반환
 */
export const getReportBodyText = (content: string) => {
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const attachmentBlockStartIndex = normalizedContent.indexOf('\n\n첨부 이미지:\n');
  if (attachmentBlockStartIndex < 0) return normalizedContent.trim();

  return normalizedContent.slice(0, attachmentBlockStartIndex).trim();
};

/**
 * 신고 첨부 이미지 URL 파싱
 * @description 신고 본문에 저장된 첨부 이미지 URL 목록을 추출
 */
export const getReportImageUrls = (content: string) => {
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const match = normalizedContent.match(/\n\n첨부 이미지:\n([\s\S]*)$/);
  if (!match?.[1]) return [] as string[];

  return match[1]
    .split('\n')
    .map(line => line.replace(/^- /, '').trim())
    .filter(line => line.startsWith('http://') || line.startsWith('https://'));
};
