import { useCallback, useRef, useState } from 'react';

import { useToast } from '@/app/shared/components/toast/toast';
import { TITLE_MAX_LENGTH } from '@/app/shared/constants/config/post.config';

import type { ChangeEvent } from 'react';
import type { DraftData } from '@/app/shared/types/post';

/**
 * 게시물 폼 훅
 * @description 제목/카테고리/본문 상태를 관리
 */
export const usePostForm = () => {
  // 공통 훅
  const { showToast } = useToast();

  // 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // 에러 상태
  const [titleLengthError, setTitleLengthError] = useState(false);

  // 제한 상태
  const titleLimitNotifiedRef = useRef(false);

  // 입력 핸들러
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

  // 셀렉트 핸들러
  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(event.target.value);
  };

  // 본문 핸들러
  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  // 폼 갱신
  const applyPartial = useCallback((data: Partial<DraftData>) => {
    if (data.title !== undefined) setTitle(data.title);
    if (data.categoryId !== undefined) setCategoryId(data.categoryId);
    if (data.content !== undefined) setContent(data.content);
  }, []);

  return {
    state: {
      title,
      categoryId,
      content,
      titleLengthError,
    },
    setters: {
      setTitle,
      setCategoryId,
      setContent,
    },
    handlers: {
      handleTitleChange,
      handleCategoryChange,
      handleContentChange,
      applyPartial,
    },
  };
};
