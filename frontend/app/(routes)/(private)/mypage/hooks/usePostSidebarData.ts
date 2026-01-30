import { useMemo } from 'react';

import type { PostListItem } from '@/app/shared/types/post';

/**
 * 마이페이지 사이드바 훅
 * @description 내 블로그 카테고리/태그 목록을 구성
 */
export const usePostSidebarData = (posts: PostListItem[]) => {
  // 카테고리 목록
  const categories = useMemo(() => {
    const counter = new Map<string, { id: string; name: string; count: number }>();
    posts.forEach(post => {
      const category = post.category;
      if (!category) return;
      const existing = counter.get(category.id);
      if (existing) {
        existing.count += 1;
        return;
      }
      counter.set(category.id, { id: category.id, name: category.name, count: 1 });
    });
    return Array.from(counter.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [posts]);

  // 태그 목록
  const tags = useMemo(() => {
    const counter = new Map<string, { id: string; name: string; count: number }>();
    posts.forEach(post => {
      post.tags?.forEach(tag => {
        const existing = counter.get(tag.id);
        if (existing) {
          existing.count += 1;
          return;
        }
        counter.set(tag.id, { id: tag.id, name: tag.name, count: 1 });
      });
    });
    return Array.from(counter.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [posts]);

  return { categories, tags };
};
