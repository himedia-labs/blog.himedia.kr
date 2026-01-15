import { type ChangeEvent, useCallback, useRef, useState } from 'react';

import { useToast } from '@/app/shared/components/toast/toast';

import { TITLE_MAX_LENGTH } from '../postCreate.constants';

import type { DraftData } from '@/app/shared/types/post';

// 기본 폼 상태 관리 hook
export const usePostForm = () => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [content, setContent] = useState('');
  const [titleLengthError, setTitleLengthError] = useState(false);
  const titleLimitNotifiedRef = useRef(false);

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      if (value.length > TITLE_MAX_LENGTH) {
        if (!titleLimitNotifiedRef.current) {
          showToast({
            message: `제목은 ${TITLE_MAX_LENGTH}자 이하로 입력해주세요.`,
            type: 'warning',
          });
          titleLimitNotifiedRef.current = true;
        }
        setTitleLengthError(true);
        setTitle(value.slice(0, TITLE_MAX_LENGTH));
        return;
      }

      titleLimitNotifiedRef.current = false;
      setTitleLengthError(false);
      setTitle(value);
    },
    [showToast],
  );

  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(event.target.value);
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setThumbnailUrl(event.target.value);
  };

  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  const applyPartial = useCallback(
    (data: Partial<DraftData>) => {
      if (data.title !== undefined) setTitle(data.title);
      if (data.categoryId !== undefined) setCategoryId(data.categoryId);
      if (data.thumbnailUrl !== undefined) setThumbnailUrl(data.thumbnailUrl);
      if (data.content !== undefined) setContent(data.content);
    },
    [setTitle, setCategoryId, setThumbnailUrl, setContent],
  );

  return {
    state: {
      title,
      categoryId,
      thumbnailUrl,
      content,
      titleLengthError,
    },
    setters: {
      setTitle,
      setCategoryId,
      setThumbnailUrl,
      setContent,
    },
    handlers: {
      handleTitleChange,
      handleCategoryChange,
      handleThumbnailChange,
      handleContentChange,
      applyPartial,
    },
  };
};
