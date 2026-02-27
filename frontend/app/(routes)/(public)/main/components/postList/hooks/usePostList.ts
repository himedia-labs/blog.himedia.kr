import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useAuthStore } from '@/app/shared/store/authStore';
import { useCategoriesQuery } from '@/app/api/categories/categories.queries';
import { useInfinitePostsQuery, usePostsQuery } from '@/app/api/posts/posts.queries';
import { toViewPost } from '@/app/(routes)/(public)/main/components/postList/utils/toViewPost';

import type { SortFilter, TopPost, ViewMode } from '@/app/shared/types/post';

const ALL_CATEGORY = 'ALL';
const EXTRA_CATEGORY_NAMES = ['Q&A', '채용'] as const;

/**
 * 메인 포스트 목록 훅
 * @description 메인 포스트 목록의 상태와 데이터를 제공
 */
export const usePostList = () => {
  // 인증 상태
  const { accessToken } = useAuthStore();

  // 라우팅 상태
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 뷰/정렬/카테고리 상태
  const viewMode: ViewMode = searchParams.get('view') === 'card' ? 'card' : 'list';
  const sortParam = searchParams.get('sort');
  const sortFilter: SortFilter = sortParam === 'top' || sortParam === 'following' ? sortParam : 'latest';
  const selectedCategory = searchParams.get('category') || ALL_CATEGORY;
  const categoryOrder = searchParams.get('order') === 'popular' ? 'popular' : 'latest';

  // 피드는 로그인 필요 - 비로그인 시 최신으로 리다이렉트
  useEffect(() => {
    if (sortFilter === 'following' && !accessToken) {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      nextSearchParams.delete('sort');
      const nextQueryString = nextSearchParams.toString();
      const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
      router.replace(nextUrl);
    }
  }, [sortFilter, accessToken, router, pathname, searchParams]);

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
    // 정렬 필터 선택 시 카테고리 리셋
    nextSearchParams.delete('category');
    nextSearchParams.delete('order');
    const nextQueryString = nextSearchParams.toString();
    const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
    router.replace(nextUrl);
  };

  // 카테고리 변경
  const setSelectedCategory = (nextCategory: string) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (nextCategory === ALL_CATEGORY) {
      nextSearchParams.delete('category');
      nextSearchParams.delete('order');
    } else {
      nextSearchParams.set('category', nextCategory);
      // 카테고리 선택 시 정렬 필터 리셋
      nextSearchParams.delete('sort');
    }
    const nextQueryString = nextSearchParams.toString();
    const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
    router.replace(nextUrl);
  };

  // 카테고리 정렬 변경
  const setCategoryOrder = (order: 'latest' | 'popular') => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (order === 'latest') {
      nextSearchParams.delete('order');
    } else {
      nextSearchParams.set('order', order);
    }
    const nextQueryString = nextSearchParams.toString();
    const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
    router.replace(nextUrl);
  };

  // 데이터 조회
  const { data: categories, isLoading: isCategoriesLoading } = useCategoriesQuery();
  const selectedCategoryId = categories?.find(category => category.name === selectedCategory)?.id;

  // 정렬 기준 결정 (카테고리 선택 시 categoryOrder 우선)
  const sortBy =
    selectedCategory !== ALL_CATEGORY && categoryOrder === 'popular'
      ? 'likeCount'
      : sortFilter === 'top'
        ? 'likeCount'
        : 'publishedAt';

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfinitePostsQuery({
    status: 'PUBLISHED',
    categoryId: selectedCategory === ALL_CATEGORY ? undefined : selectedCategoryId,
    feed: sortFilter === 'following' && accessToken ? 'following' : undefined,
    sort: sortBy,
    order: 'DESC',
    limit: 10,
  });
  const { data: topPostsData, isLoading: isTopPostsLoading } = usePostsQuery({
    status: 'PUBLISHED',
    sort: 'likeCount',
    order: 'DESC',
    limit: 5,
  });
  const dynamicCategoryNames = (categories ?? []).map(category => category.name);
  const categoryNames = [ALL_CATEGORY, ...new Set([...dynamicCategoryNames, ...EXTRA_CATEGORY_NAMES])];
  const posts = (data?.pages ?? []).flatMap(page => page.items).map(item => toViewPost(item));
  const filteredPosts =
    selectedCategory === ALL_CATEGORY ? posts : posts.filter(post => post.category === selectedCategory);
  const topPosts: TopPost[] = (topPostsData?.items ?? []).map(post => ({ id: post.id, title: post.title }));

  // 빈 상태 체크
  const isFollowingEmpty = sortFilter === 'following' && !isLoading && filteredPosts.length === 0;
  const isCategoryEmpty = selectedCategory !== ALL_CATEGORY && !isLoading && filteredPosts.length === 0;

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
    categoryOrder,
    setCategoryOrder,
    categoryNames,
    filteredPosts,
    topPosts,
    isLoading,
    isCategoriesLoading,
    isTopPostsLoading,
    isFollowingEmpty,
    isCategoryEmpty,
  };
};
