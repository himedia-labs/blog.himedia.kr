import type {
  ChangeEvent,
  CompositionEvent,
  Dispatch,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  SetStateAction,
} from 'react';

import { extractTags } from './postCreate.utils';

import type { ToastOptions } from '@/app/shared/types/toast';
import type { MutableRef, TagCommit } from '@/app/shared/types/post';

// 제목 입력 핸들러 생성
export const createHandleTitleChange = (params: {
  setTitle: (value: string) => void;
  maxLength: number;
  showToast: (options: ToastOptions) => void;
  limitNotifiedRef: MutableRef<boolean>;
  setTitleLengthError: (value: boolean) => void;
}) => {
  return (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value.length > params.maxLength) {
      if (!params.limitNotifiedRef.current) {
        params.showToast({
          message: `제목은 ${params.maxLength}자 이하로 입력해주세요.`,
          type: 'warning',
        });
        params.limitNotifiedRef.current = true;
      }
      params.setTitleLengthError(true);
      params.setTitle(value.slice(0, params.maxLength));
      return;
    }

    params.limitNotifiedRef.current = false;
    params.setTitleLengthError(false);
    params.setTitle(value);
  };
};

// 카테고리 선택 핸들러 생성
export const createHandleCategoryChange = (params: { setCategoryId: (value: string) => void }) => {
  return (event: ChangeEvent<HTMLSelectElement>) => {
    params.setCategoryId(event.target.value);
  };
};

// 썸네일 입력 핸들러 생성
export const createHandleThumbnailChange = (params: { setThumbnailUrl: (value: string) => void }) => {
  return (event: ChangeEvent<HTMLInputElement>) => {
    params.setThumbnailUrl(event.target.value);
  };
};

// 본문 입력 핸들러 생성
export const createHandleContentChange = (params: { setContent: (value: string) => void }) => {
  return (event: ChangeEvent<HTMLTextAreaElement>) => {
    params.setContent(event.target.value);
  };
};

// 태그 추가 헬퍼 생성
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

// 태그 입력 확정 헬퍼 생성
export const createCommitTagInput = (params: { addTagsFromInput: TagCommit; setTagInput: (value: string) => void }) => {
  return (value: string) => {
    if (!params.addTagsFromInput(value)) return false;
    params.setTagInput('');
    return true;
  };
};

// 태그 키다운 핸들러 생성
export const createHandleTagKeyDown = (params: {
  tagInput: string;
  tags: string[];
  setTags: Dispatch<SetStateAction<string[]>>;
  commitTagInput: TagCommit;
  shouldCommitAfterComposition: MutableRef<boolean>;
}) => {
  return (event: KeyboardEvent<HTMLInputElement>) => {
    if ('isComposing' in event.nativeEvent && event.nativeEvent.isComposing) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === ',') {
        params.shouldCommitAfterComposition.current = true;
      }
      return;
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === ',') {
      event.preventDefault();
      params.commitTagInput(params.tagInput);
      return;
    }

    if (event.key === 'Backspace' && params.tagInput.trim() === '' && params.tags.length > 0) {
      params.setTags(prev => prev.slice(0, -1));
    }
  };
};

// 태그 입력 변경 핸들러 생성
export const createHandleTagChange = (params: {
  commitTagInput: TagCommit;
  setTagInput: (value: string) => void;
  showToast: (options: ToastOptions) => void;
  maxLength: number;
  limitNotifiedRef: MutableRef<boolean>;
  setTagLengthError: (value: boolean) => void;
}) => {
  return (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const isComposing = 'isComposing' in event.nativeEvent && event.nativeEvent.isComposing;

    const clampTagInput = (input: string) => {
      let didClamp = false;
      const clamped = input
        .split(/([,\s]+)/)
        .map(part => {
          if (!part || /[,\s]+/.test(part)) return part;
          if (part.length <= params.maxLength) return part;
          didClamp = true;
          return part.slice(0, params.maxLength);
        })
        .join('');
      return { clamped, didClamp };
    };

    const { clamped, didClamp } = clampTagInput(value);

    if (didClamp) {
      event.currentTarget.value = clamped;
    }

    if (didClamp && !params.limitNotifiedRef.current) {
      params.showToast({ message: `태그는 ${params.maxLength}자 이하로 입력해주세요.`, type: 'warning' });
      params.limitNotifiedRef.current = true;
    }

    if (!didClamp) {
      params.limitNotifiedRef.current = false;
    }

    params.setTagLengthError(didClamp);

    if (!isComposing && /[,\s]$/.test(clamped)) {
      if (params.commitTagInput(clamped)) return;
    }

    params.setTagInput(clamped);
  };
};

// 태그 blur 확정 핸들러 생성
export const createHandleTagBlur = (params: {
  commitTagInput: TagCommit;
  isComposingRef: MutableRef<boolean>;
  pendingBlurCommitRef: MutableRef<boolean>;
  shouldCommitAfterComposition: MutableRef<boolean>;
}) => {
  return (event: FocusEvent<HTMLInputElement>) => {
    if (params.isComposingRef.current) {
      params.pendingBlurCommitRef.current = true;
      params.shouldCommitAfterComposition.current = false;
      const value = event.currentTarget.value;

      window.setTimeout(() => {
        if (!params.pendingBlurCommitRef.current) return;
        params.pendingBlurCommitRef.current = false;
        params.commitTagInput(value);
      }, 0);
      return;
    }

    params.commitTagInput(event.currentTarget.value);
  };
};

// 태그 조합 시작 핸들러 생성
export const createHandleTagCompositionStart = (params: { isComposingRef: MutableRef<boolean> }) => {
  return () => {
    params.isComposingRef.current = true;
  };
};

// 태그 조합 종료 핸들러 생성
export const createHandleTagCompositionEnd = (params: {
  commitTagInput: TagCommit;
  shouldCommitAfterComposition: MutableRef<boolean>;
  isComposingRef: MutableRef<boolean>;
  pendingBlurCommitRef: MutableRef<boolean>;
}) => {
  return (event: CompositionEvent<HTMLInputElement>) => {
    params.isComposingRef.current = false;

    if (params.pendingBlurCommitRef.current) {
      params.pendingBlurCommitRef.current = false;
      params.shouldCommitAfterComposition.current = false;
      params.commitTagInput(event.currentTarget.value);
      return;
    }

    if (!params.shouldCommitAfterComposition.current) return;
    params.shouldCommitAfterComposition.current = false;
    params.commitTagInput(event.currentTarget.value);
  };
};

// 태그 추천 선택 핸들러 생성
export const createHandleTagSuggestionMouseDown = (params: { commitTagInput: TagCommit }) => {
  return (tagName: string) => {
    return (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      params.commitTagInput(tagName);
    };
  };
};

// 태그 칩 삭제 핸들러 생성
export const createHandleRemoveTag = (params: { setTags: Dispatch<SetStateAction<string[]>> }) => {
  return (tag: string) => {
    params.setTags(prev => prev.filter(item => item !== tag));
  };
};
