import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { postsApi } from '@/app/api/posts/posts.api';
import { postsKeys } from '@/app/api/posts/posts.keys';

/**
 * 마이페이지 게시글 메뉴 훅
 * @description 내 게시글 메뉴 토글/삭제 상태를 관리
 */
export const usePostMenu = () => {
  // 메뉴 상태
  const queryClient = useQueryClient();
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);

  // 삭제 뮤테이션
  const { mutateAsync: deleteMyPost, isPending: isPostDeleting } = useMutation({
    mutationFn: (postId: string) => postsApi.deletePost(postId),
  });

  // 게시글 메뉴 토글
  const handlePostMenuToggle = (postId: string) => setOpenPostMenuId(prev => (prev === postId ? null : postId));

  // 게시글 수정 이동
  const handlePostEdit = (postId: string) => {
    window.location.href = `/posts/edit/${postId}`;
  };

  // 게시글 삭제
  const handlePostDelete = async (postId: string) => {
    const confirmed = window.confirm('게시글을 삭제할까요?');
    if (!confirmed) return;
    await deleteMyPost(postId);
    setOpenPostMenuId(null);
    await queryClient.invalidateQueries({ queryKey: postsKeys.all });
  };

  return {
    isPostDeleting,
    openPostMenuId,
    handlePostDelete,
    handlePostEdit,
    handlePostMenuToggle,
  };
};
