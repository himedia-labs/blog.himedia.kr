import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { postsKeys } from '@/app/api/posts/posts.keys';
import { useSharePostMutation, useViewPostMutation } from '@/app/api/posts/posts.mutations';
import { useToast } from '@/app/shared/components/toast/toast';
import { POST_DETAIL_MESSAGES } from '@/app/shared/constants/messages/postDetail.message';
import { VIEW_DELAY_MS } from '@/app/shared/constants/limits/postDetail.limit';
import { renderMarkdownPreview } from '@/app/shared/utils/markdownPreview';

import { copyToClipboard } from './postDetail.utils';

import type { PostDetailActionsParams, PostDetailResponse } from '@/app/shared/types/post';

/**
 * 게시물 상세 액션 훅
 * @description 공유/조회수 처리와 미리보기 컨텐츠를 관리
 */
export const usePostDetailActions = ({ data, postId }: PostDetailActionsParams) => {
  // 공통 훅
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const viewTimerRef = useRef<number | null>(null);
  const viewedPostIdRef = useRef<string | null>(null);
  const { mutateAsync: viewPost } = useViewPostMutation();
  const { mutateAsync: sharePost } = useSharePostMutation();

  // 캐시 갱신
  const updateDetailCache = useCallback(
    (changes: Partial<PostDetailResponse>) => {
      queryClient.setQueryData<PostDetailResponse | undefined>(postsKeys.detail(postId), previous => {
        if (!previous) return previous;
        return { ...previous, ...changes };
      });
    },
    [postId, queryClient],
  );

  // 공유 핸들러
  const handleShareCopy = useCallback(async () => {
    if (!postId) return;
    const link = window.location.href;

    try {
      await copyToClipboard(link);
      showToast({ message: POST_DETAIL_MESSAGES.SHARE_COPY_SUCCESS, type: 'success' });
    } catch {
      showToast({ message: POST_DETAIL_MESSAGES.SHARE_COPY_FAILURE, type: 'error' });
      return;
    }

    try {
      const response = await sharePost(postId);
      updateDetailCache({ shareCount: response.shareCount });
    } catch {
      showToast({ message: POST_DETAIL_MESSAGES.SHARE_COUNT_FAILURE, type: 'warning' });
    }
  }, [postId, sharePost, showToast, updateDetailCache]);

  // 조회수 트래킹
  useEffect(() => {
    if (!postId || !data) return;
    if (viewedPostIdRef.current === postId) return;

    if (viewTimerRef.current) {
      window.clearTimeout(viewTimerRef.current);
    }

    viewTimerRef.current = window.setTimeout(() => {
      if (viewedPostIdRef.current === postId) return;
      viewedPostIdRef.current = postId;

      viewPost(postId)
        .then(response => {
          updateDetailCache({ viewCount: response.viewCount });
        })
        .catch(() => null);
    }, VIEW_DELAY_MS);

    return () => {
      if (viewTimerRef.current) {
        window.clearTimeout(viewTimerRef.current);
      }
    };
  }, [data, postId, updateDetailCache, viewPost]);

  // 프리뷰 컨텐츠
  const previewContent = useMemo(() => renderMarkdownPreview(data?.content ?? ''), [data?.content]);

  return { handleShareCopy, previewContent };
};
