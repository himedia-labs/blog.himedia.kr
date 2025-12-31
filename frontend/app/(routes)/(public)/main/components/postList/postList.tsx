'use client';

import { useState } from 'react';
import { CiCalendar, CiGrid41 } from 'react-icons/ci';
import { FiEye } from 'react-icons/fi';
import { PiList } from 'react-icons/pi';

import { usePostsQuery } from '@/app/api/posts/posts.queries';
import { useCategoriesQuery } from '@/app/api/categories/categories.queries';

import styles from './postList.module.css';
import type { Post, PostListItem, TopPost, ViewMode } from '@/app/shared/types/post';

// 날짜 문자열을 화면 포맷으로 변환
const formatDate = (value?: string | null) => {
  if (!value) return '--';
  // 날짜 문자열을 Date로 변환
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  // 출력에 사용할 연도
  const year = date.getFullYear();
  // 출력에 사용할 월(2자리)
  const month = String(date.getMonth() + 1).padStart(2, '0');
  // 출력에 사용할 일(2자리)
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

// 본문에서 첫 이미지 링크 추출
const extractImageUrl = (content?: string) => {
  if (!content) return undefined;
  // HTML img 태그에서 추출한 결과
  const htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlMatch?.[1]) return htmlMatch[1];
  // Markdown 이미지 링크에서 추출한 결과
  const markdownMatch = content.match(/!\[[^\]]*]\(([^)]+)\)/);
  if (markdownMatch?.[1]) return markdownMatch[1];
  return undefined;
};

// 본문에서 요약 문구 생성
const buildSummary = (content?: string) => {
  if (!content) return '';
  // 앞뒤 공백 제거된 본문
  const trimmed = content.trim();
  if (!trimmed) return '';
  return trimmed.length > 140 ? `${trimmed.slice(0, 140)}...` : trimmed;
};

// 본문 길이로 예상 읽기 시간 계산
const buildReadTime = (content?: string) => {
  if (!content) return '--';
  // 글자 수 기준 예상 분
  const minutes = Math.max(1, Math.ceil(content.length / 450));
  return `${minutes} min`;
};

// API 응답을 화면용 Post로 변환
const toViewPost = (item: PostListItem): Post => {
  // 본문에서 추출한 썸네일 URL
  const imageUrl = item.thumbnailUrl ?? extractImageUrl(item.content);
  return {
    id: item.id,
    title: item.title,
    summary: buildSummary(item.content),
    imageUrl,
    category: item.category?.name ?? 'ALL',
    date: formatDate(item.publishedAt ?? item.createdAt),
    readTime: buildReadTime(item.content),
    views: item.viewCount,
  };
};

// 사이드바 상위 인기글(임시)
const TOP_POSTS: TopPost[] = [
  { id: 'backend-dream', title: '[무물보] 응답하라, 백엔드 개발자를 꿈꾸는 이유' },
  { id: 'fe-ground', title: "[FE Ground] 'AI x Front-End: 코딩 보조에서 동료로'" },
  { id: 'maft', title: 'AI로 E2E 테스트를 찍어내다: MAFT' },
  { id: 'student-backend', title: '백엔드를 꿈꾸는 학생개발자에게 해주고 싶은 말' },
  { id: 'copilot', title: '나만의 Visual Studio Code Copilot 세팅 가이드' },
];

export default function PostListSection() {
  // 현재 보기 모드 상태
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  // 선택된 카테고리 상태
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  // 카테고리 목록 API 응답
  const { data: categories } = useCategoriesQuery();
  // 선택된 카테고리의 ID
  const selectedCategoryId = categories?.find(category => category.name === selectedCategory)?.id;
  // 게시글 목록 API 응답
  const { data } = usePostsQuery({
    status: 'PUBLISHED',
    categoryId: selectedCategory === 'ALL' ? undefined : selectedCategoryId,
  });
  // 화면에 노출할 카테고리 이름 목록
  const categoryNames = ['ALL', ...(categories ?? []).map(category => category.name)];
  // 화면 렌더링용 게시글 목록
  const posts = (data?.items ?? []).map(item => toViewPost(item));
  // 선택 카테고리로 필터된 목록
  const filteredPosts = selectedCategory === 'ALL' ? posts : posts.filter(post => post.category === selectedCategory);

  return (
    <section className={styles.container} aria-label="포스트 하이라이트">
      <div className={styles.main}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setViewMode(viewMode === 'list' ? 'card' : 'list')}
            aria-label={viewMode === 'list' ? '카드 보기' : '리스트 보기'}
          >
            {viewMode === 'list' ? <CiGrid41 /> : <PiList />}
          </button>
        </div>

        {viewMode === 'list' ? (
          <ul className={styles.listView}>
            {filteredPosts.map(post => (
              <li key={post.id}>
                <article className={styles.listItem}>
                  <div className={styles.listBody}>
                    <h3>{post.title}</h3>
                    <p className={styles.summary}>{post.summary}</p>
                    <div className={styles.meta}>
                      <span className={styles.metaItem}>
                        <CiCalendar aria-hidden="true" /> {post.date}
                      </span>
                      <span className={styles.separator} aria-hidden="true">
                        |
                      </span>
                      <span className={styles.metaItem}>
                        <FiEye aria-hidden="true" /> {post.views.toLocaleString()}
                      </span>
                      <span className={styles.separator} aria-hidden="true">
                        |
                      </span>
                      <span className={styles.metaItem}>{post.readTime}</span>
                    </div>
                  </div>
                  {post.imageUrl ? (
                    <div
                      className={styles.listThumb}
                      style={{
                        backgroundImage: `url(${post.imageUrl})`,
                      }}
                      aria-hidden="true"
                    />
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <ul className={styles.cardGrid}>
            {filteredPosts.map(post => (
              <li key={post.id}>
                <article className={styles.cardItem}>
                  {post.imageUrl ? (
                    <div
                      className={styles.cardThumb}
                      style={{
                        backgroundImage: `url(${post.imageUrl})`,
                      }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className={styles.cardBody}>
                    <h3>{post.title}</h3>
                    <p className={styles.summary}>{post.summary}</p>
                  </div>
                  <div className={styles.cardFooter}>
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className={styles.sidebar} aria-label="TOP 5 인기글">
        <div className={styles.sidebarHeader}>
          <p className={styles.sidebarLabel}>
            TOP 5 <span className={styles.sidebarSubLabel}>(인기있는 글)</span>
          </p>
        </div>
        <ol className={styles.topList}>
          {TOP_POSTS.map((item, index) => (
            <li key={item.id}>
              <span className={styles.rank}>{index + 1}</span>
              <span className={styles.topTitle}>{item.title}</span>
            </li>
          ))}
        </ol>

        <div className={styles.categorySection}>
          <div className={styles.sidebarHeader}>
            <p className={styles.sidebarLabel}>
              CATEGORY <span className={styles.sidebarSubLabel}>(카테고리)</span>
            </p>
          </div>
          <div className={styles.categoryList}>
            {categoryNames.map(category => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category ? `${styles.categoryButton} ${styles.active}` : styles.categoryButton
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}
