import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { postsKeys } from '@/app/api/posts/posts.keys';
import { useLikePostMutation, useSharePostMutation, useViewPostMutation } from '@/app/api/posts/posts.mutations';
import { useToast } from '@/app/shared/components/toast/toast';
import { LOGIN_MESSAGES } from '@/app/shared/constants/messages/auth.message';
import { POST_DETAIL_MESSAGES } from '@/app/shared/constants/messages/post.message';
import { VIEW_DELAY_MS } from '@/app/shared/constants/config/post.config';
import { useAuthStore } from '@/app/shared/store/authStore';
import { extractMarkdownHeadings, renderMarkdownPreview } from '@/app/shared/utils/markdownPreview';

import { copyToClipboard } from './postDetail.utils';

import type { PostDetailActionsParams, PostDetailRefreshParams, PostDetailResponse, PostTocItem } from '@/app/shared/types/post';

/**
 * 게시물 상세 액션 훅
 * @description 공유/조회수 처리와 미리보기 컨텐츠를 관리
 */
export const usePostDetailActions = ({ data, postId }: PostDetailActionsParams) => {
  // 공통 훅
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const accessToken = useAuthStore(state => state.accessToken);

  // 뮤테이션 훅
  const { mutateAsync: likePost } = useLikePostMutation();
  const { mutateAsync: viewPost } = useViewPostMutation();
  const { mutateAsync: sharePost } = useSharePostMutation();

  // 타이머 ref
  const viewTimerRef = useRef<number | null>(null);
  const viewedPostIdRef = useRef<string | null>(null);

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

  // 공유 처리
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

  // 프리뷰 계산
  const previewContent = useMemo(() => renderMarkdownPreview(data?.content ?? ''), [data?.content]);
  const tocItems = useMemo<PostTocItem[]>(() => extractMarkdownHeadings(data?.content ?? ''), [data?.content]);

  // 좋아요 처리
  const handleLikeClick = useCallback(async () => {
    if (!postId) return;
    if (!accessToken) {
      showToast({ message: LOGIN_MESSAGES.requireAuth, type: 'warning' });
      return;
    }

    try {
      const response = await likePost(postId);
      updateDetailCache({ likeCount: response.likeCount, liked: response.liked });
    } catch {
      showToast({ message: POST_DETAIL_MESSAGES.LIKE_COUNT_FAILURE, type: 'warning' });
    }
  }, [accessToken, likePost, postId, showToast, updateDetailCache]);

  return { handleShareCopy, handleLikeClick, previewContent, tocItems };
};

/**
 * 게시물 상세 리프레시 훅
 * @description 토큰 변경 시 상세/댓글 데이터를 갱신
 */
export const usePostDetailRefresh = ({
  accessToken,
  isInitialized,
  refetchComments,
  refetchPost,
}: PostDetailRefreshParams) => {
  // 토큰 리프레시
  useEffect(() => {
    if (!isInitialized || !accessToken) return;
    refetchPost().catch(() => null);
    refetchComments().catch(() => null);
  }, [accessToken, isInitialized, refetchComments, refetchPost]);
};
