import { useEffect, useRef } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useAuthStore } from '@/app/shared/store/authStore';
import { useDraftDetailQuery, useDraftsQuery } from '@/app/api/posts/posts.queries';

import { useAutoSave } from './useAutoSave';
import { useDraftNotice } from './useDraftNotice';
import { useDraftSaver } from './useDraftSaver';
import { mapDraftToForm } from '../postCreate.utils';

import type { DraftData } from '@/app/shared/types/post';

/**
 * 임시저장 관리
 * @description 임시저장 불러오기, 저장, 발행, 자동저장을 통합 관리
 */
export const useDraftManager = (formData: DraftData, setFormData: (data: Partial<DraftData>) => void) => {
  // 라우터 및 유틸리티
  const router = useRouter();
  const { accessToken } = useAuthStore();

  // URL 파라미터
  const searchParams = useSearchParams();
  const searchDraftId = searchParams.get('draftId');

  // State
  const prevSearchDraftIdRef = useRef<string>(searchDraftId);

  // Queries
  const isAuthenticated = !!accessToken;
  const { data: draftList } = useDraftsQuery({ limit: 20 }, { enabled: isAuthenticated });

  // 파생 상태
  const draftId = searchDraftId;
  const { data: draftDetail } = useDraftDetailQuery(draftId ?? undefined, { enabled: isAuthenticated });
  const hasDrafts = (draftList?.items?.length ?? 0) > 0;
  const lastSavedAt = draftDetail?.updatedAt;

  // draft 불러오기
  useEffect(() => {
    if (!draftDetail) return;
    setFormData(mapDraftToForm(draftDetail));
  }, [draftDetail, setFormData]);

  // draftId 변경 시 폼 초기화
  useEffect(() => {
    if (prevSearchDraftIdRef.current === searchDraftId) return;
    prevSearchDraftIdRef.current = searchDraftId;

    if (!searchDraftId) {
      setFormData({
        title: '',
        categoryId: '',
        thumbnailUrl: '',
        content: '',
        tags: [],
      });
    }
  }, [searchDraftId, setFormData]);

  // draft 알림 표시
  useDraftNotice({ draftId, hasDrafts });

  // 임시저장
  const { saveDraft, publishPost } = useDraftSaver({ formData, draftId, isAuthenticated });

  // 임시저장 목록 열기
  const openDraftList = () => {
    router.push('/posts/drafts');
  };

  // 자동저장
  useAutoSave({ formData, isAuthenticated, saveDraft });

  return {
    state: {
      lastSavedAt,
    },
    data: {
      draftList,
    },
    handlers: {
      saveDraft,
      publishPost,
      openDraftList,
    },
  };
};
