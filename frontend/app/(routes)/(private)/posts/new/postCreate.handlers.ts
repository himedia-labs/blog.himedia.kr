import type { Dispatch, SetStateAction } from 'react';

import { extractTags } from './postCreate.utils';

import type { TagCommit } from '@/app/shared/types/post';
import type { ToastOptions } from '@/app/shared/types/toast';

/**
 * 태그 추가 헬퍼 생성
 * @description 입력값에서 태그를 추출해 목록에 추가합니다.
 */
export const createAddTagsFromInput = (params: {
  tags: string[];
  setTags: Dispatch<SetStateAction<string[]>>;
  showToast: (options: ToastOptions) => void;
  maxCount: number;
  maxLength: number;
}) => {
  return (value: string) => {
    const candidates = extractTags(value);
    if (!candidates.length) return false;

    const existingTags = new Set(params.tags);
    const newTags: string[] = [];
    let hasDuplicate = false;
    let limitReached = false;

    candidates.forEach(tag => {
      if (tag.length > params.maxLength) {
        return;
      }
      if (existingTags.has(tag)) {
        hasDuplicate = true;
        return;
      }
      if (existingTags.size >= params.maxCount) {
        limitReached = true;
        return;
      }
      existingTags.add(tag);
      newTags.push(tag);
    });

    if (hasDuplicate) {
      params.showToast({ message: '이미 추가된 태그입니다.', type: 'warning' });
    }

    if (limitReached) {
      params.showToast({ message: `태그는 최대 ${params.maxCount}개까지 추가할 수 있어요.`, type: 'warning' });
    }

    if (newTags.length) {
      params.setTags(prev => {
        const next = [...prev];
        newTags.forEach(tag => {
          if (!next.includes(tag)) next.push(tag);
        });
        return next;
      });
    }

    return true;
  };
};

/**
 * 태그 입력 확정 헬퍼 생성
 * @description 입력값을 태그로 확정하고 입력창을 비웁니다.
 */
export const createCommitTagInput = (params: { addTagsFromInput: TagCommit; setTagInput: (value: string) => void }) => {
  return (value: string) => {
    if (!params.addTagsFromInput(value)) return false;
    params.setTagInput('');
    return true;
  };
};
