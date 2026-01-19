import { useCallback, useEffect, useRef, useState } from 'react';

import { useToast } from '@/app/shared/components/toast/toast';
import { useTagSuggestionsQuery } from '@/app/api/tags/tags.queries';
import { TAG_MAX_COUNT, TAG_MAX_LENGTH } from '@/app/shared/constants/limits/postCreate.limit';

import { getTagQueryFromInput } from '../postCreate.utils';
import { createAddTagsFromInput, createCommitTagInput } from '../postCreate.handlers';

import type { ChangeEvent, CompositionEvent, FocusEvent, KeyboardEvent, MouseEvent } from 'react';

// 태그 커밋 트리거 키
const COMMIT_KEYS = ['Enter', ' ', ','];

/**
 * 태그 입력 훅
 * @description 태그 입력과 추천, 조합 처리를 관리
 */
export const useTagInput = () => {
  const { showToast } = useToast();
  const [tagQuery, setTagQuery] = useState('');
  const [tagInput, setTagInput] = useState('');
  const isComposingRef = useRef(false);
  const [tags, setTags] = useState<string[]>([]);
  const pendingBlurCommitRef = useRef(false);
  const tagLimitNotifiedRef = useRef(false);
  const [tagLengthError, setTagLengthError] = useState(false);
  const shouldCommitAfterComposition = useRef(false);

  const { data: tagSuggestions = [] } = useTagSuggestionsQuery(tagQuery);
  const hasTagSuggestions = tagQuery.length > 0 && tagSuggestions.length > 0;

  const addTagsFromInput = createAddTagsFromInput({
    tags,
    setTags,
    showToast,
    maxCount: TAG_MAX_COUNT,
    maxLength: TAG_MAX_LENGTH,
  });
  const commitTagInput = createCommitTagInput({ addTagsFromInput, setTagInput });

  const handleTagKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if ('isComposing' in event.nativeEvent && event.nativeEvent.isComposing) {
        if (COMMIT_KEYS.includes(event.key)) {
          shouldCommitAfterComposition.current = true;
        }
        return;
      }

      if (COMMIT_KEYS.includes(event.key)) {
        event.preventDefault();
        commitTagInput(tagInput);
        return;
      }

      if (event.key === 'Backspace' && tagInput.trim() === '' && tags.length > 0) {
        setTags(prev => prev.slice(0, -1));
      }
    },
    [commitTagInput, setTags, tagInput, tags],
  );

  const handleTagChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      const isComposing = 'isComposing' in event.nativeEvent && event.nativeEvent.isComposing;

      let didClamp = false;
      const clamped = value
        .split(/([,\s]+)/)
        .map(part => {
          if (!part || /[,\s]+/.test(part)) return part;
          if (part.length <= TAG_MAX_LENGTH) return part;
          didClamp = true;
          return part.slice(0, TAG_MAX_LENGTH);
        })
        .join('');

      if (didClamp) {
        event.currentTarget.value = clamped;
      }

      if (didClamp && !tagLimitNotifiedRef.current) {
        showToast({ message: `태그는 ${TAG_MAX_LENGTH}자 이하로 입력해주세요.`, type: 'warning' });
        tagLimitNotifiedRef.current = true;
      }

      if (!didClamp) {
        tagLimitNotifiedRef.current = false;
      }

      setTagLengthError(didClamp);

      if (!isComposing && /[,\s]$/.test(clamped)) {
        if (commitTagInput(clamped)) return;
      }

      setTagInput(clamped);
    },
    [commitTagInput, showToast],
  );

  const handleTagBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (isComposingRef.current) {
        pendingBlurCommitRef.current = true;
        shouldCommitAfterComposition.current = false;
        const value = event.currentTarget.value;

        window.setTimeout(() => {
          if (!pendingBlurCommitRef.current) return;
          pendingBlurCommitRef.current = false;
          commitTagInput(value);
        }, 0);
        return;
      }

      commitTagInput(event.currentTarget.value);
    },
    [commitTagInput],
  );

  const handleTagCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleTagCompositionEnd = useCallback(
    (event: CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;

      if (pendingBlurCommitRef.current) {
        pendingBlurCommitRef.current = false;
        shouldCommitAfterComposition.current = false;
        commitTagInput(event.currentTarget.value);
        return;
      }

      if (!shouldCommitAfterComposition.current) return;
      shouldCommitAfterComposition.current = false;
      commitTagInput(event.currentTarget.value);
    },
    [commitTagInput],
  );

  const handleTagSuggestionMouseDown = (tagName: string) => {
    return (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      commitTagInput(tagName);
    };
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(item => item !== tag));
  };

  useEffect(() => {
    setTagQuery(getTagQueryFromInput(tagInput));
  }, [tagInput]);

  useEffect(() => {
    if (!tagInput) {
      setTagLengthError(false);
    }
  }, [tagInput]);

  return {
    state: {
      tagInput,
      tags,
      tagLengthError,
      hasTagSuggestions,
    },
    data: {
      tagSuggestions,
    },
    setters: {
      setTags,
    },
    handlers: {
      handleTagKeyDown,
      handleTagChange,
      handleTagBlur,
      handleTagCompositionStart,
      handleTagCompositionEnd,
      handleTagSuggestionMouseDown,
      handleRemoveTag,
    },
  };
};
