import {
  type ChangeEvent,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { AxiosError } from 'axios';

import { useCategoriesQuery } from '@/app/api/categories/categories.queries';
import { useTagSuggestionsQuery } from '@/app/api/tags/tags.queries';
import { useToast } from '@/app/shared/components/toast/toast';
import { useCreatePostMutation, useUpdatePostMutation } from '@/app/api/posts/posts.mutations';
import { useUploadImageMutation, useUploadThumbnailMutation } from '@/app/api/uploads/uploads.mutations';
import { useDraftDetailQuery, useDraftsQuery } from '@/app/api/posts/posts.queries';
import type { ApiErrorResponse } from '@/app/shared/types/error';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { postsKeys } from '@/app/api/posts/posts.keys';
import { useAuthStore } from '@/app/shared/store/authStore';

import {
  createAddTagsFromInput,
  createCommitTagInput,
  createHandleCategoryChange,
  createHandleContentChange,
  createHandleRemoveTag,
  createHandleTagBlur,
  createHandleTagChange,
  createHandleTagCompositionEnd,
  createHandleTagCompositionStart,
  createHandleTagKeyDown,
  createHandleTagSuggestionMouseDown,
  createHandleThumbnailChange,
  createHandleTitleChange,
} from './postCreate.handlers';
import {
  AUTO_SAVE_DELAY_MS,
  DEFAULT_SPLIT_LEFT,
  DRAFT_TOAST_DURATION_MS,
  SPLIT_MAX,
  SPLIT_MIN,
  TAG_MAX_COUNT,
  TAG_MAX_LENGTH,
  THUMBNAIL_MAX_SIZE,
  TITLE_MAX_LENGTH,
} from './postCreate.constants';
import { formatDateLabel, getTagQueryFromInput } from './postCreate.utils';

const DEFAULT_CATEGORY_LABEL = '카테고리';
const DEFAULT_AUTHOR_NAME = '홍길동';
const DEFAULT_PREVIEW_STATS = {
  views: 128,
  likeCount: 12,
  commentCount: 3,
};
const PREVIEW_TIME_FORMAT_LOCALE = 'ko-KR';
const PREVIEW_TIME_FORMAT_OPTIONS = { hour: '2-digit', minute: '2-digit' } as const;
const DRAFT_BUTTON_LABEL = '임시저장';
const DRAFT_BUTTON_LABEL_PREFIX = '임시저장됨';
const TOAST_DRAFT_SAVED_MESSAGE = '임시저장 완료';
const TOAST_TITLE_REQUIRED_MESSAGE = '제목을 입력해주세요.';
const TOAST_CATEGORY_REQUIRED_MESSAGE = '카테고리를 선택해주세요.';
const TOAST_CONTENT_REQUIRED_MESSAGE = '본문을 입력해주세요.';
const TOAST_SAVE_SUCCESS_MESSAGE = '게시물이 저장되었습니다.';
const TOAST_SAVE_FAILURE_MESSAGE = '게시물 저장에 실패했습니다.';
const TOAST_THUMBNAIL_UPLOAD_SUCCESS_MESSAGE = '썸네일 업로드 완료';
const TOAST_THUMBNAIL_UPLOAD_FAILURE_MESSAGE = '썸네일 업로드에 실패했습니다.';
const TOAST_THUMBNAIL_UPLOAD_TYPE_MESSAGE = '이미지 파일만 업로드할 수 있습니다.';
const TOAST_THUMBNAIL_UPLOAD_SIZE_MESSAGE = '이미지는 10MB 이하로 업로드해주세요.';
const TOAST_IMAGE_UPLOAD_SUCCESS_MESSAGE = '이미지 업로드 완료';
const TOAST_IMAGE_UPLOAD_FAILURE_MESSAGE = '이미지 업로드에 실패했습니다.';
const TOAST_IMAGE_UPLOAD_TYPE_MESSAGE = '이미지 파일만 업로드할 수 있습니다.';
const TOAST_IMAGE_UPLOAD_SIZE_MESSAGE = '이미지는 10MB 이하로 업로드해주세요.';

// 게시물 작성 폼 상태/핸들러 제공
export const usePostCreateForm = () => {
  const { showToast } = useToast();
  const { accessToken } = useAuthStore();
  const { data: categories, isLoading } = useCategoriesQuery();
  const router = useRouter();
  const queryClient = useQueryClient();
  const createPostMutation = useCreatePostMutation();
  const updatePostMutation = useUpdatePostMutation();
  const uploadThumbnailMutation = useUploadThumbnailMutation();
  const searchParams = useSearchParams();
  const searchDraftId = searchParams.get('draftId');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagLengthError, setTagLengthError] = useState(false);
  const [titleLengthError, setTitleLengthError] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(searchDraftId);
  const shouldCommitAfterComposition = useRef(false);
  const isComposingRef = useRef(false);
  const pendingBlurCommitRef = useRef(false);
  const titleLimitNotifiedRef = useRef(false);
  const tagLimitNotifiedRef = useRef(false);
  const draftNoticeShownRef = useRef(false);
  const previousDraftIdRef = useRef<string | null>(searchDraftId);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const categoryName = categories?.find(category => String(category.id) === categoryId)?.name ?? DEFAULT_CATEGORY_LABEL;
  const dateLabel = formatDateLabel(new Date());
  const previewStats = DEFAULT_PREVIEW_STATS;
  // 미리보기 작성자 이름
  const authorName = DEFAULT_AUTHOR_NAME;
  const savedAtLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString(PREVIEW_TIME_FORMAT_LOCALE, PREVIEW_TIME_FORMAT_OPTIONS)
    : null;
  const draftButtonTitle = savedAtLabel ? `${DRAFT_BUTTON_LABEL_PREFIX} ${savedAtLabel}` : DRAFT_BUTTON_LABEL;
  const { data: tagSuggestions = [] } = useTagSuggestionsQuery(tagQuery);
  const hasTagSuggestions = tagQuery.length > 0 && tagSuggestions.length > 0;
  const isAuthenticated = !!accessToken;
  const { data: draftDetail } = useDraftDetailQuery(draftId ?? undefined, { enabled: isAuthenticated });
  const { data: draftList } = useDraftsQuery({ limit: 20 }, { enabled: isAuthenticated });
  const hasDrafts = (draftList?.items?.length ?? 0) > 0;
  const isThumbnailUploading = uploadThumbnailMutation.isPending;

  useEffect(() => {
    if (previousDraftIdRef.current === searchDraftId) return;
    const previousDraftId = previousDraftIdRef.current;
    previousDraftIdRef.current = searchDraftId;
    setDraftId(searchDraftId);

    if (!searchDraftId) {
      setTitle('');
      setCategoryId('');
      setThumbnailUrl('');
      setContent('');
      setTags([]);
      setTagInput('');
      setTagQuery('');
      setLastSavedAt(null);
      return;
    }

    if (previousDraftId) {
      setTitle('');
      setCategoryId('');
      setThumbnailUrl('');
      setContent('');
      setTags([]);
      setTagInput('');
      setTagQuery('');
      setLastSavedAt(null);
    }
  }, [searchDraftId]);

  useEffect(() => {
    if (draftNoticeShownRef.current) return;
    if (draftId) return;
    if (!hasDrafts) return;
    draftNoticeShownRef.current = true;
    showToast({ message: '임시저장된 게시물이 있습니다.', type: 'info' });
  }, [draftId, hasDrafts, showToast]);

  useEffect(() => {
    if (!draftDetail) return;
    setTitle(draftDetail.title ?? '');
    setCategoryId(draftDetail.category?.id ?? '');
    setThumbnailUrl(draftDetail.thumbnailUrl ?? '');
    setContent(draftDetail.content ?? '');
    setTags(draftDetail.tags?.map(tag => tag.name) ?? []);
    setLastSavedAt(draftDetail.updatedAt ?? null);
  }, [draftDetail]);

  const addTagsFromInput = createAddTagsFromInput({
    tags,
    setTags,
    showToast,
    maxCount: TAG_MAX_COUNT,
    maxLength: TAG_MAX_LENGTH,
  });
  const commitTagInput = createCommitTagInput({ addTagsFromInput, setTagInput });

  const handleTitleChange = createHandleTitleChange({
    setTitle,
    maxLength: TITLE_MAX_LENGTH,
    showToast,
    limitNotifiedRef: titleLimitNotifiedRef,
    setTitleLengthError,
  });
  const handleCategoryChange = createHandleCategoryChange({ setCategoryId });
  const handleThumbnailChange = createHandleThumbnailChange({ setThumbnailUrl });
  const handleContentChange = createHandleContentChange({ setContent });
  const setContentValue = setContent;
  const handleRemoveTag = createHandleRemoveTag({ setTags });
  const handleThumbnailFileClick = () => {
    if (!isAuthenticated) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }

    thumbnailInputRef.current?.click();
  };
  const handleThumbnailFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!isAuthenticated) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast({ message: TOAST_THUMBNAIL_UPLOAD_TYPE_MESSAGE, type: 'warning' });
      return;
    }

    if (file.size > THUMBNAIL_MAX_SIZE) {
      showToast({ message: TOAST_THUMBNAIL_UPLOAD_SIZE_MESSAGE, type: 'warning' });
      return;
    }

    if (uploadThumbnailMutation.isPending) return;

    try {
      const response = await uploadThumbnailMutation.mutateAsync(file);
      setThumbnailUrl(response.url);
      showToast({ message: TOAST_THUMBNAIL_UPLOAD_SUCCESS_MESSAGE, type: 'success' });
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message ?? TOAST_THUMBNAIL_UPLOAD_FAILURE_MESSAGE;
      showToast({ message, type: 'error' });
    }
  };
  const handleTagKeyDown = createHandleTagKeyDown({
    tagInput,
    tags,
    setTags,
    commitTagInput,
    shouldCommitAfterComposition,
  });
  const handleTagChange = createHandleTagChange({
    commitTagInput,
    setTagInput,
    showToast,
    maxLength: TAG_MAX_LENGTH,
    limitNotifiedRef: tagLimitNotifiedRef,
    setTagLengthError,
  });
  const handleTagBlur = createHandleTagBlur({
    commitTagInput,
    isComposingRef,
    pendingBlurCommitRef,
    shouldCommitAfterComposition,
  });
  const handleTagCompositionStart = createHandleTagCompositionStart({ isComposingRef });
  const handleTagCompositionEnd = createHandleTagCompositionEnd({
    commitTagInput,
    shouldCommitAfterComposition,
    isComposingRef,
    pendingBlurCommitRef,
  });
  const handleTagSuggestionMouseDown = createHandleTagSuggestionMouseDown({ commitTagInput });

  // 임시저장 처리
  const saveDraft = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedThumbnail = thumbnailUrl.trim();
    const normalizedCategoryId = categoryId || null;
    const hasDraftInput = Boolean(
      trimmedTitle || trimmedContent || normalizedCategoryId || trimmedThumbnail || tags.length > 0,
    );

    if (!hasDraftInput) {
      if (!silent) {
        showToast({ message: '입력한 내용이 없습니다.', type: 'warning' });
      }
      return;
    }

    if (!isAuthenticated) {
      if (!silent) {
        showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      }
      return;
    }

    if (createPostMutation.isPending || updatePostMutation.isPending) return;

    try {
      const payload = {
        title: trimmedTitle,
        content,
        categoryId: normalizedCategoryId,
        status: 'DRAFT' as const,
        thumbnailUrl: draftId ? trimmedThumbnail : trimmedThumbnail || undefined,
        tags,
      };

      let savedDraftId = draftId;
      if (draftId) {
        await updatePostMutation.mutateAsync({ id: draftId, ...payload });
      } else {
        const response = await createPostMutation.mutateAsync(payload);
        savedDraftId = response.id;
        setDraftId(response.id);
        router.replace(`/posts/new?draftId=${response.id}`);
      }

      setLastSavedAt(new Date().toISOString());
      queryClient.invalidateQueries({ queryKey: postsKeys.drafts(), exact: false });
      if (savedDraftId) {
        queryClient.invalidateQueries({ queryKey: postsKeys.draft(savedDraftId) });
      }
      showToast({ message: TOAST_DRAFT_SAVED_MESSAGE, type: 'success', duration: DRAFT_TOAST_DURATION_MS });
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message ?? TOAST_SAVE_FAILURE_MESSAGE;
      showToast({ message, type: 'error' });
    }
  };

  // 게시물 저장 처리
  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedThumbnail = thumbnailUrl.trim();

    if (!isAuthenticated) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }

    if (!trimmedTitle) {
      showToast({ message: TOAST_TITLE_REQUIRED_MESSAGE, type: 'warning' });
      return;
    }

    if (!categoryId) {
      showToast({ message: TOAST_CATEGORY_REQUIRED_MESSAGE, type: 'warning' });
      return;
    }

    if (!trimmedContent) {
      showToast({ message: TOAST_CONTENT_REQUIRED_MESSAGE, type: 'warning' });
      return;
    }

    if (createPostMutation.isPending || updatePostMutation.isPending) return;

    try {
      const payload = {
        title: trimmedTitle,
        content,
        categoryId,
        status: 'PUBLISHED' as const,
        thumbnailUrl: draftId ? trimmedThumbnail : trimmedThumbnail || undefined,
        tags,
      };

      if (draftId) {
        await updatePostMutation.mutateAsync({ id: draftId, ...payload });
      } else {
        await createPostMutation.mutateAsync(payload);
      }

      setLastSavedAt(null);
      showToast({ message: TOAST_SAVE_SUCCESS_MESSAGE, type: 'success' });
      router.replace('/');
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message ?? TOAST_SAVE_FAILURE_MESSAGE;
      showToast({ message, type: 'error' });
    }
  };

  useEffect(() => {
    setTagQuery(getTagQueryFromInput(tagInput));
  }, [tagInput]);

  useEffect(() => {
    if (!tagInput) {
      setTagLengthError(false);
    }
  }, [tagInput]);

  useEffect(() => {
    const hasDraft = title.trim() || content.trim() || categoryId || thumbnailUrl || tags.length > 0;
    if (!hasDraft) return;
    if (!isAuthenticated) return;

    const timer = window.setTimeout(() => {
      saveDraft({ silent: true });
    }, AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [title, categoryId, thumbnailUrl, content, tags, isAuthenticated]);

  return {
    state: {
      title,
      categoryId,
      thumbnailUrl,
      content,
      tagInput,
      tags,
      tagLengthError,
      titleLengthError,
    },
    refs: {
      thumbnailInputRef,
    },
    derived: {
      categoryName,
      dateLabel,
      previewStats,
      authorName,
      draftButtonTitle,
      hasTagSuggestions,
    },
    data: {
      categories,
      isLoading,
      tagSuggestions,
      draftList,
      isThumbnailUploading,
    },
    handlers: {
      handleTitleChange,
      handleCategoryChange,
      handleThumbnailChange,
      handleThumbnailFileClick,
      handleThumbnailFileSelect,
      handleContentChange,
      setContentValue,
      handleRemoveTag,
      handleTagKeyDown,
      handleTagChange,
      handleTagBlur,
      handleTagCompositionStart,
      handleTagCompositionEnd,
      handleTagSuggestionMouseDown,
      saveDraft,
      handleSave,
    },
  };
};

// 작성 페이지 UI 상태/핸들러 제공
export const usePostCreatePage = (params: { content: string; setContentValue: Dispatch<SetStateAction<string>> }) => {
  const { content, setContentValue } = params;
  const { showToast } = useToast();
  const { accessToken } = useAuthStore();
  const uploadImageMutation = useUploadImageMutation();
  const splitRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  const [splitLeft, setSplitLeft] = useState(DEFAULT_SPLIT_LEFT);

  // 분할 비율 CSS 변수 동기화
  useEffect(() => {
    const container = splitRef.current;
    if (!container) return;
    container.style.setProperty('--split-left', `${splitLeft}%`);
  }, [splitLeft]);

  // 분할 위치 업데이트
  const updateSplit = (clientX: number) => {
    const container = splitRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const nextValue = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, nextValue));
    container.style.setProperty('--split-left', `${clamped}%`);
    setSplitLeft(clamped);
  };

  // 분할 드래그 시작
  const handleSplitPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateSplit(event.clientX);
  };

  // 분할 드래그 이동
  const handleSplitPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    event.preventDefault();
    updateSplit(event.clientX);
  };

  // 분할 드래그 종료
  const handleSplitPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  // 분할 드래그 핸들러 묶음
  const splitHandlers = {
    handlePointerDown: handleSplitPointerDown,
    handlePointerMove: handleSplitPointerMove,
    handlePointerUp: handleSplitPointerUp,
  };

  // 커서 선택 범위 저장
  const captureSelection = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    selectionRef.current = {
      start: textarea.selectionStart ?? 0,
      end: textarea.selectionEnd ?? 0,
    };
  };

  // 커서 선택 범위 조회
  const getSelectionRange = () => {
    if (selectionRef.current) {
      const range = selectionRef.current;
      selectionRef.current = null;
      return range;
    }
    const textarea = contentRef.current;
    return {
      start: textarea?.selectionStart ?? 0,
      end: textarea?.selectionEnd ?? 0,
    };
  };

  // 본문과 커서 위치를 함께 갱신
  const setContentAndSelection = (nextValue: string, selectionStart: number, selectionEnd = selectionStart) => {
    setContentValue(nextValue);
    window.requestAnimationFrame(() => {
      const textarea = contentRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  // 인라인 마크다운 감싸기 적용
  const applyInlineWrap = (before: string, after = before) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = content.slice(start, end);
    const nextValue = content.slice(0, start) + before + selected + after + content.slice(end);
    const nextStart = start + before.length;
    const nextEnd = selected ? nextStart + selected.length : nextStart;
    setContentAndSelection(nextValue, nextStart, nextEnd);
  };

  // 라인 단위 프리픽스 적용
  const applyLinePrefix = (prefix: string, options?: { numbered?: boolean }) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const lineStart = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const lineEndIndex = content.indexOf('\n', end);
    const blockEnd = lineEndIndex === -1 ? content.length : lineEndIndex;
    const block = content.slice(lineStart, blockEnd);
    const lines = block.split('\n');
    const prefixes = lines.map((_, index) => (options?.numbered ? `${index + 1}. ` : prefix));
    const nextBlock = lines.map((line, index) => `${prefixes[index]}${line}`).join('\n');
    const nextValue = content.slice(0, lineStart) + nextBlock + content.slice(blockEnd);
    const prefixLengths = prefixes.map(item => item.length);
    const getLineIndex = (pos: number) => content.slice(lineStart, pos).split('\n').length - 1;
    const sumPrefixLength = (lineIndex: number) =>
      prefixLengths.slice(0, lineIndex + 1).reduce((sum, length) => sum + length, 0);
    const nextStart = start >= lineStart && start <= blockEnd ? start + sumPrefixLength(getLineIndex(start)) : start;
    const nextEnd = end >= lineStart && end <= blockEnd ? end + sumPrefixLength(getLineIndex(end)) : end;
    setContentAndSelection(nextValue, nextStart, nextEnd);
  };

  // 코드 인라인/블록 적용
  const applyCode = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = content.slice(start, end);

    if (selected.includes('\n')) {
      const before = '```\n';
      const after = '\n```';
      const nextValue = content.slice(0, start) + before + selected + after + content.slice(end);
      const nextStart = start + before.length;
      const nextEnd = nextStart + selected.length;
      setContentAndSelection(nextValue, nextStart, nextEnd);
      return;
    }

    applyInlineWrap('`');
  };

  // 링크 마크다운 적용
  const applyLink = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = content.slice(start, end);

    if (selected) {
      const prefix = '[';
      const suffix = ']()';
      const nextValue = content.slice(0, start) + prefix + selected + suffix + content.slice(end);
      const cursor = start + prefix.length + selected.length + suffix.length - 1;
      setContentAndSelection(nextValue, cursor, cursor);
      return;
    }

    const snippet = '[텍스트](링크)';
    const nextValue = content.slice(0, start) + snippet + content.slice(end);
    const textStart = start + 1;
    const textEnd = textStart + '텍스트'.length;
    setContentAndSelection(nextValue, textStart, textEnd);
  };

  // 이미지 선택 트리거
  const handleImageClick = () => {
    captureSelection();
    imageInputRef.current?.click();
  };

  // 이미지 선택 후 마크다운 삽입
  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!accessToken) {
      showToast({ message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast({ message: TOAST_IMAGE_UPLOAD_TYPE_MESSAGE, type: 'warning' });
      return;
    }

    if (file.size > THUMBNAIL_MAX_SIZE) {
      showToast({ message: TOAST_IMAGE_UPLOAD_SIZE_MESSAGE, type: 'warning' });
      return;
    }

    if (uploadImageMutation.isPending) return;

    const { start, end } = getSelectionRange();
    const selected = content.slice(start, end).trim();
    const fileLabel = file.name.replace(/\.[^/.]+$/, '');
    const altText = selected || fileLabel || '이미지';
    const placeholderId = `uploading:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const markdown = `![${altText}](${placeholderId})`;
    const nextValue = content.slice(0, start) + markdown + content.slice(end);
    const cursor = start + markdown.length;
    setContentAndSelection(nextValue, cursor, cursor);

    try {
      const response = await uploadImageMutation.mutateAsync(file);
      setContentValue(prev => prev.replace(placeholderId, response.url));
      showToast({ message: TOAST_IMAGE_UPLOAD_SUCCESS_MESSAGE, type: 'success' });
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message = axiosError.response?.data?.message ?? TOAST_IMAGE_UPLOAD_FAILURE_MESSAGE;
      setContentValue(prev => prev.replace(markdown, '').replace(placeholderId, ''));
      showToast({ message, type: 'error' });
    }
  };

  // 제목 마크다운 적용
  const handleHeadingClick = (level: 1 | 2 | 3) => () => applyLinePrefix(`${'#'.repeat(level)} `);
  // 인용 마크다운 적용
  const handleQuoteClick = () => applyLinePrefix('> ');
  // 불릿 리스트 마크다운 적용
  const handleBulletClick = () => applyLinePrefix('- ');
  // 번호 리스트 마크다운 적용
  const handleNumberedClick = () => applyLinePrefix('', { numbered: true });

  // 본문 서식 핸들러 묶음
  const editorHandlers = {
    applyInlineWrap,
    applyCode,
    applyLink,
    handleHeadingClick,
    handleQuoteClick,
    handleBulletClick,
    handleNumberedClick,
    handleImageClick,
    handleImageSelect,
  };

  return {
    refs: {
      splitRef,
      contentRef,
      imageInputRef,
    },
    split: {
      value: splitLeft,
      min: SPLIT_MIN,
      max: SPLIT_MAX,
      handlers: splitHandlers,
    },
    editor: editorHandlers,
  };
};

export default usePostCreateForm;
