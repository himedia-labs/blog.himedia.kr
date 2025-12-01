'use client';

import { useState } from 'react';
import { CiCalendar, CiGrid41 } from 'react-icons/ci';
import { FiEye } from 'react-icons/fi';
import { PiList } from 'react-icons/pi';

import styles from './blogList.module.css';
import { BlogPost, TopPost, ViewMode } from './blogList.types';

const BLOG_POSTS: BlogPost[] = [
  {
    id: 'ai-lab',
    title: 'AI 기반 실시간 번역 시스템 개발하면서 마주한 7가지 기술적 도전과 해결 과정',
    summary:
      'GPT-4와 Whisper API를 활용한 실시간 음성 번역 파이프라인 구축기. WebSocket 통신 최적화부터 레이턴시 개선, 다국어 처리 로직까지 상세한 구현 과정과 성능 튜닝 노하우를 공유합니다.',
    category: 'INSIGHT',
    date: '2024.10.12',
    readTime: '12 min',
    views: 1847,
    accent: '#ff6b2c',
    accentLight: '#ffe4d3',
  },
  {
    id: 'infra',
    title: 'Kubernetes 클러스터 비용 50% 절감',
    summary: '오토스케일링 정책 개선과 스팟 인스턴스 활용으로 월 클라우드 비용을 대폭 줄인 사례.',
    category: 'TECH',
    date: '2024.09.28',
    readTime: '5 min',
    views: 923,
    accent: '#0066ff',
    accentLight: '#d6e7ff',
  },
  {
    id: 'studio-story',
    title: '디자인 시스템 2.0: 컴포넌트 라이브러리를 처음부터 다시 만든 이유와 과정',
    summary:
      '레거시 디자인 시스템의 한계를 극복하고 Figma Variables, Tailwind CSS, Storybook을 결합한 새로운 시스템 구축 여정. 토큰 설계부터 자동화 워크플로우까지 모든 것을 공개합니다.',
    category: 'STORY',
    date: '2024.09.08',
    readTime: '15 min',
    views: 2156,
    accent: '#7045ff',
    accentLight: '#e3d9ff',
  },
  {
    id: 'case-study',
    title: '모노레포 전환 회고',
    summary: 'Turborepo 도입 과정과 팀 생산성 향상 효과.',
    category: 'CASE',
    date: '2024.08.20',
    readTime: '3 min',
    views: 567,
    accent: '#00ad7c',
    accentLight: '#d6f5ea',
  },
  {
    id: 'performance',
    title: 'Next.js 14 App Router 마이그레이션: 번들 사이즈 40% 감소와 LCP 개선 전략',
    summary:
      'Pages Router에서 App Router로 점진적 마이그레이션하며 겪은 시행착오. 서버 컴포넌트 최적화, 동적 import 전략, 이미지 최적화까지 실무에 바로 적용 가능한 팁들을 정리했습니다.',
    category: 'TECH',
    date: '2024.07.15',
    readTime: '10 min',
    views: 1392,
    accent: '#ff6b2c',
    accentLight: '#ffe4d3',
  },
  {
    id: 'database',
    title: 'PostgreSQL 쿼리 최적화',
    summary: '인덱스 설계와 실행 계획 분석으로 응답 속도 10배 개선.',
    category: 'TECH',
    date: '2024.06.30',
    readTime: '7 min',
    views: 734,
    accent: '#0066ff',
    accentLight: '#d6e7ff',
  },
];

const TOP_POSTS: TopPost[] = [
  { id: 'backend-dream', title: '[무물보] 응답하라, 백엔드 개발자를 꿈꾸는 이유' },
  { id: 'fe-ground', title: "[FE Ground] 'AI x Front-End: 코딩 보조에서 동료로'" },
  { id: 'maft', title: 'AI로 E2E 테스트를 찍어내다: MAFT' },
  { id: 'student-backend', title: '백엔드를 꿈꾸는 학생개발자에게 해주고 싶은 말' },
  { id: 'copilot', title: '나만의 Visual Studio Code Copilot 세팅 가이드' },
];

const CATEGORIES = [
  'ALL',
  'Frontend',
  'Backend',
  'Full Stack',
  'DevOps',
  'AI Engineer',
  'Data Engineer',
  'Android',
  'iOS',
  'QA',
  'Product Manager (PM)',
  'UI/UX Designer',
];

export default function BlogListSection() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  return (
    <section className={styles.container} aria-label="블로그 하이라이트">
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
            {BLOG_POSTS.map(post => (
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
                  <div
                    className={styles.listThumb}
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${post.accent} 0%, ${post.accentLight} 100%)`,
                    }}
                    aria-hidden="true"
                  />
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <ul className={styles.cardGrid}>
            {BLOG_POSTS.map(post => (
              <li key={post.id}>
                <article className={styles.cardItem}>
                  <div
                    className={styles.cardThumb}
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${post.accent} 0%, ${post.accentLight} 100%)`,
                    }}
                    aria-hidden="true"
                  />
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
            {CATEGORIES.map(category => (
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
