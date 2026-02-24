/**
 * 감사 로그 액션 라벨
 * @description 감사 로그 action 코드를 한글 라벨로 변환
 */
export const formatAuditActionLabel = (action: string) => {
  if (action === 'USER_APPROVED') return '회원 승인 처리';
  if (action === 'USER_ROLE_UPDATED') return '회원 역할 변경';
  if (action === 'REPORT_STATUS_UPDATED') return '신고 상태 변경';
  return action;
};

/**
 * 감사 로그 대상 라벨
 * @description 감사 로그 target 정보를 한글 설명으로 변환
 */
export const formatAuditTargetLabel = (
  targetType: string,
  targetId: string,
  targetName?: string | null,
  targetEmail?: string | null,
) => {
  if (targetType === 'user') {
    if (targetName && targetEmail) return `${targetName} (${targetId})`;
    if (targetName) return `${targetName} (${targetId})`;
    return `회원 (${targetId})`;
  }
  if (targetType === 'admin_report') return `신고 ID: ${targetId}`;
  if (targetType === 'admin_page') return '관리자 페이지';
  return `${targetType} / ${targetId}`;
};

/**
 * 감사 로그 결과 라벨
 * @description payload의 result/reasonCode 값을 사용자 표시용 텍스트로 변환
 */
export const formatAuditResultLabel = (payload: Record<string, unknown> | null) => {
  const result = payload?.result;
  const reasonCode = payload?.reasonCode;
  if (result === 'SUCCESS') return '성공';
  if (result === 'FAILURE' && typeof reasonCode === 'string') return `실패 (${reasonCode})`;
  if (result === 'FAILURE') return '실패';
  return '보류';
};

/**
 * 감사 로그 결과 톤
 * @description payload 결과값을 배지 색상 톤으로 변환
 */
export const getAuditResultTone = (payload: Record<string, unknown> | null) => {
  const result = payload?.result;
  if (result === 'SUCCESS') return 'success';
  if (result === 'FAILURE') return 'error';
  return 'warning';
};

/**
 * 감사 로그 변경 전 라벨
 * @description payload의 before 스냅샷을 사용자 표시용 문자열로 변환
 */
export const formatAuditBeforeLabel = (payload: Record<string, unknown> | null) => {
  const beforeSnapshot = readSnapshot(payload, 'before');
  if (beforeSnapshot) return formatSnapshot(beforeSnapshot);
  return formatLegacyBeforeSnapshot(payload);
};

/**
 * 감사 로그 변경 후 라벨
 * @description payload의 after 스냅샷을 사용자 표시용 문자열로 변환
 */
export const formatAuditAfterLabel = (payload: Record<string, unknown> | null) => {
  const afterSnapshot = readSnapshot(payload, 'after');
  if (afterSnapshot) return formatSnapshot(afterSnapshot);
  return formatLegacyAfterSnapshot(payload);
};

/**
 * 스냅샷 읽기
 * @description payload에서 before/after 객체를 안전하게 추출
 */
const readSnapshot = (payload: Record<string, unknown> | null, key: string) => {
  if (!payload) return null;
  const value = payload[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

/**
 * 스냅샷 문자열 변환
 * @description 객체 스냅샷을 사용자 친화적인 key/value 문자열로 변환
 */
const formatSnapshot = (snapshot: Record<string, unknown> | null) => {
  if (!snapshot) return '없음';
  const entries = Object.entries(snapshot);
  if (!entries.length) return '없음';
  return entries
    .map(([key, value]) => {
      const label = formatSnapshotKey(key);
      const formattedValue = formatSnapshotValue(key, value);
      if (!label) return formattedValue;
      return `${label}: ${formattedValue}`;
    })
    .join(', ');
};

/**
 * 스냅샷 키 라벨
 * @description 스냅샷 key를 한글 라벨로 변환
 */
const formatSnapshotKey = (key: string) => {
  if (key === 'approved') return '';
  if (key === 'role') return '';
  if (key === 'status') return '상태';
  if (key === 'handledAt') return '처리시각';
  return key;
};

/**
 * 스냅샷 값 라벨
 * @description 스냅샷 value를 key별 사용자 표시 텍스트로 변환
 */
const formatSnapshotValue = (key: string, value: unknown) => {
  if (key === 'approved' && typeof value === 'boolean') return value ? '승인' : '미승인';
  if (key === 'role' && typeof value === 'string') return formatUserRoleLabel(value);
  if (key === 'status' && typeof value === 'string') return formatReportStatusLabel(value);
  if (value === null) return '없음';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};

/**
 * 신고 상태 라벨
 * @description 신고 상태 코드를 한글 라벨로 변환
 */
const formatReportStatusLabel = (status: string) => {
  if (status === 'OPEN') return '대기';
  if (status === 'IN_PROGRESS') return '진행중';
  if (status === 'RESOLVED') return '해결';
  if (status === 'REJECTED') return '반려';
  return status;
};

/**
 * 회원 역할 라벨
 * @description 회원 역할 코드를 한글 라벨로 변환
 */
const formatUserRoleLabel = (role: string) => {
  if (role === 'TRAINEE') return '훈련생';
  if (role === 'GRADUATE') return '수료생';
  if (role === 'MENTOR') return '멘토';
  if (role === 'INSTRUCTOR') return '강사';
  if (role === 'ADMIN') return '관리자';
  return role;
};

/**
 * 레거시 변경 전 스냅샷
 * @description before 필드가 없는 구형 payload를 변경 전 문자열로 변환
 */
const formatLegacyBeforeSnapshot = (payload: Record<string, unknown> | null) => {
  if (!payload) return '없음';
  if (typeof payload.approved === 'boolean') return '미승인';
  if (typeof payload.status === 'string') return '상태: 없음, 처리시각: 없음';
  return '없음';
};

/**
 * 레거시 변경 후 스냅샷
 * @description after 필드가 없는 구형 payload를 변경 후 문자열로 변환
 */
const formatLegacyAfterSnapshot = (payload: Record<string, unknown> | null) => {
  if (!payload) return '없음';
  if (typeof payload.approved === 'boolean') return payload.approved ? '승인' : '미승인';
  if (typeof payload.status === 'string') {
    const handledAt = typeof payload.handledAt === 'string' && payload.handledAt ? payload.handledAt : '없음';
    return `상태: ${formatReportStatusLabel(payload.status)}, 처리시각: ${handledAt}`;
  }
  return '없음';
};
