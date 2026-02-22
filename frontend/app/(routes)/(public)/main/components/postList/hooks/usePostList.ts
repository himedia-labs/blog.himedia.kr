import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useCategoriesQuery } from '@/app/api/categories/categories.queries';
import { useInfinitePostsQuery, usePostsQuery } from '@/app/api/posts/posts.queries';
import { toViewPost } from '@/app/(routes)/(public)/main/components/postList/utils/toViewPost';

import type { SortFilter, TopPost, ViewMode } from '@/app/shared/types/post';

/**
 * 메인 포스트 목록 훅
 * @description 메인 포스트 목록의 상태와 데이터를 제공
 */
export const usePostList = () => {
  // 라우팅 상태
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 뷰/정렬 상태
  const viewMode: ViewMode = searchParams.get('view') === 'card' ? 'card' : 'list';
  const sortParam = searchParams.get('sort');
  const sortFilter: SortFilter = sortParam === 'top' || sortParam === 'following' ? sortParam : 'latest';

  // 카테고리 상태
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 뷰 모드 변경
  const setViewMode = (nextViewMode: ViewMode) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (nextViewMode === 'list') {
      nextSearchParams.delete('view');
    } else {
      nextSearchParams.set('view', nextViewMode);
    }
    const nextQueryString = nextSearchParams.toString();
    const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
    router.replace(nextUrl);
  };

  // 정렬 필터 변경
  const setSortFilter = (nextSortFilter: SortFilter) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (nextSortFilter === 'latest') {
      nextSearchParams.delete('sort');
    } else {
      nextSearchParams.set('sort', nextSortFilter);
    }
    const nextQueryString = nextSearchParams.toString();
    const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
    router.replace(nextUrl);
  };

  // 데이터 조회
  const { data: categories, isLoading: isCategoriesLoading } = useCategoriesQuery();
  const selectedCategoryId = categories?.find(category => category.name === selectedCategory)?.id;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfinitePostsQuery({
    status: 'PUBLISHED',
    categoryId: selectedCategory === 'ALL' ? undefined : selectedCategoryId,
    feed: sortFilter === 'following' ? 'following' : undefined,
    sort: sortFilter === 'top' ? 'likeCount' : 'publishedAt',
    order: 'DESC',
    limit: 10,
  });
  const { data: topPostsData, isLoading: isTopPostsLoading } = usePostsQuery({
    status: 'PUBLISHED',
    sort: 'likeCount',
    order: 'DESC',
    limit: 5,
  });
  const categoryNames = ['ALL', ...(categories ?? []).map(category => category.name)];
  const posts = (data?.pages ?? []).flatMap(page => page.items).map(item => toViewPost(item));
  const filteredPosts = selectedCategory === 'ALL' ? posts : posts.filter(post => post.category === selectedCategory);
  const topPosts: TopPost[] = (topPostsData?.items ?? []).map(post => ({ id: post.id, title: post.title }));

  return {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    viewMode,
    setViewMode,
    sortFilter,
    setSortFilter,
    selectedCategory,
    setSelectedCategory,
    categoryNames,
    filteredPosts,
    topPosts,
    isLoading,
    isCategoriesLoading,
    isTopPostsLoading,
  };
};
