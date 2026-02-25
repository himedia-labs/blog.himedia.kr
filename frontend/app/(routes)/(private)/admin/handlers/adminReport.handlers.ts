import { handleAdminReportStatusChange } from '@/app/(routes)/(private)/admin/handlers/handleAdminReportStatusChange.handlers';

import type { QueryClient } from '@tanstack/react-query';
import type { AdminReportStatus } from '@/app/shared/types/admin';

/**
 * 신고 상태 변경 핸들러 생성
 * @description 신고 상태를 갱신하고 관련 캐시를 재검증한다
 */
export const createHandleStatusChange = (params: {
  queryClient: QueryClient;
  mutateAsync: (payload: { reportId: string; status: AdminReportStatus }) => Promise<unknown>;
  showToast: (options: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void;
}) => {
  return async (reportId: string, status: AdminReportStatus) => {
    try {
      await handleAdminReportStatusChange({
        queryClient: params.queryClient,
        mutateAsync: params.mutateAsync,
        reportId,
        status,
      });
      params.showToast({ message: `${formatReportStatusLabel(status)} 처리되었습니다.`, type: 'success' });
    } catch (error) {
      params.showToast({ message: extractErrorMessage(error, '신고 상태 변경에 실패했습니다.'), type: 'error' });
    }
  };
};

/**
 * 신고 상태 라벨
 * @description 신고 상태 코드를 토스트 문구용 라벨로 변환
 */
const formatReportStatusLabel = (status: AdminReportStatus) => {
  if (status === 'IN_PROGRESS') return '처리중으로';
  if (status === 'RESOLVED') return '해결로';
  if (status === 'REJECTED') return '반려로';
  return '처리';
};

/**
 * 에러 메시지 추출
 * @description axios 에러 응답 메시지를 안전하게 추출한다
 */
const extractErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || !error) return fallback;
  if (!('response' in error) || typeof error.response !== 'object' || !error.response) return fallback;
  if (!('data' in error.response) || typeof error.response.data !== 'object' || !error.response.data) return fallback;
  if (!('message' in error.response.data) || typeof error.response.data.message !== 'string') return fallback;
  return error.response.data.message;
};
