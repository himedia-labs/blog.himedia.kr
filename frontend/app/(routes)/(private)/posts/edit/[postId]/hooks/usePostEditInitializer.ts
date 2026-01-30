import { useEffect } from 'react';

import { mapDraftToForm } from '@/app/(routes)/(private)/posts/new/postCreate.utils';

import type { PostEditInitializerParams } from '@/app/shared/types/postEdit';

// 게시물 수정 : 초기화 훅
export const usePostEditInitializer = ({ postDetail, applyPartial, setTags }: PostEditInitializerParams) => {
  // 데이터 반영
  useEffect(() => {
    if (!postDetail) return;
    const formData = mapDraftToForm(postDetail);
    applyPartial(formData);
    setTags(formData.tags);
  }, [applyPartial, postDetail, setTags]);
};
