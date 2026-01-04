import { useState } from 'react';

import { usePostsQuery } from '@/app/api/posts/posts.queries';
import { useCategoriesQuery } from '@/app/api/categories/categories.queries';

import { toViewPost } from './postList.handlers';

import type { TopPost, ViewMode } from '@/app/shared/types/post';

// 메인 포스트 목록 상태/데이터 제공 훅
export const usePostList = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const { data: categories } = useCategoriesQuery();
  const selectedCategoryId = categories?.find(category => category.name === selectedCategory)?.id;
  const { data } = usePostsQuery({
    status: 'PUBLISHED',
    categoryId: selectedCategory === 'ALL' ? undefined : selectedCategoryId,
  });
  const categoryNames = ['ALL', ...(categories ?? []).map(category => category.name)];
  const posts = (data?.items ?? []).map(item => toViewPost(item));
  const filteredPosts = selectedCategory === 'ALL' ? posts : posts.filter(post => post.category === selectedCategory);
  const topPosts: TopPost[] = [...filteredPosts]
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 5)
    .map(post => ({ id: post.id, title: post.title }));

  return {
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    categoryNames,
    filteredPosts,
    topPosts,
  };
};

export default usePostList;
