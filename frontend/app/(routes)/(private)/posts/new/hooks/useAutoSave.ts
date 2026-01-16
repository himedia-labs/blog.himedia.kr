import { useEffect, useRef } from 'react';

import { AUTO_SAVE_DELAY_MS } from '@/app/shared/constants/limits/postCreate.limit';

import type { DraftData } from '@/app/shared/types/post';

interface UseAutoSaveParams {
  formData: DraftData;
  isAuthenticated: boolean;
  saveDraft: (options?: { silent?: boolean }) => Promise<void>;
}

export const useAutoSave = ({ formData, isAuthenticated, saveDraft }: UseAutoSaveParams) => {
  const saveDraftRef = useRef(saveDraft);

  useEffect(() => {
    saveDraftRef.current = saveDraft;
  }, [saveDraft]);

  useEffect(() => {
    const hasDraft =
      formData.title.trim() ||
      formData.content.trim() ||
      formData.categoryId ||
      formData.thumbnailUrl ||
      formData.tags.length > 0;
    if (!hasDraft) return;
    if (!isAuthenticated) return;

    const timer = window.setTimeout(() => {
      saveDraftRef.current({ silent: true });
    }, AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [formData.title, formData.categoryId, formData.thumbnailUrl, formData.content, formData.tags, isAuthenticated]);
};
