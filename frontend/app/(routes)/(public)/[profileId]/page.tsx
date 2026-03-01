'use client';

import { useMemo, useState } from 'react';

import Image from 'next/image';
import { useParams } from 'next/navigation';

import { FaUser } from 'react-icons/fa';
import { FaFacebookF, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import { FiChevronDown, FiClock, FiGithub, FiGlobe, FiMail, FiTrendingUp } from 'react-icons/fi';

import { usePostsQuery } from '@/app/api/posts/posts.queries';
import { useProfileByHandleQuery } from '@/app/api/auth/auth.queries';
import PostSummaryList from '@/app/shared/components/post/PostSummaryList';
import { renderMarkdownPreview } from '@/app/shared/utils/markdown';
import { sortPostsByKey } from '@/app/(routes)/(private)/mypage/utils';
import { ProfilePageSkeleton, ProfilePostListSkeleton } from '@/app/(routes)/(public)/[profileId]/ProfilePage.skeleton';

import markdownStyles from '@/app/shared/components/markdown-editor/markdown.module.css';
import myPageStyles from '@/app/(routes)/(private)/mypage/MyPage.module.css';
import styles from '@/app/(routes)/(public)/[profileId]/ProfilePage.module.css';

/**
 * 프로필 페이지
 * @description 사용자 공개 프로필과 게시글 목록을 표시
 */
export default function ProfilePage() {
  // 필터 상태
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'latest' | 'popular'>('latest');

  // 라우트 파라미터
  const params = useParams();
  const profileId = Array.isArray(params?.profileId) ? params.profileId[0] : (params?.profileId ?? '');
  const decodedProfileId = decodeURIComponent(profileId);
  const hasAtPrefix = decodedProfileId.startsWith('@');
  const normalizedProfileId = decodedProfileId.replace(/^@/, '');

  // 조회 데이터
  const { data: profile, isLoading: isProfileLoading } = useProfileByHandleQuery(normalizedProfileId);
  const { data: postsData, isLoading: isPostsLoading } = usePostsQuery(
    {
      authorId: profile?.id,
      status: 'PUBLISHED',
      sort: 'publishedAt',
      order: 'DESC',
      limit: 30,
    },
    { enabled: Boolean(profile?.id) },
  );

  // 파생 데이터
  const posts = postsData?.items ?? [];
  const author = posts[0]?.author;
  const postCount = posts.length;
  const followerCount = author?.followerCount ?? 0;
  const followingCount = author?.followingCount ?? 0;
  const handleText = profile?.profileHandle ? `@${profile.profileHandle}` : `@${normalizedProfileId}`;
  const bioPreview = useMemo(() => renderMarkdownPreview(profile?.profileBio ?? ''), [profile?.profileBio]);
  const profileSocialLinks = [
    { href: profile?.profileContactEmail ? `mailto:${profile.profileContactEmail}` : '', label: '이메일', icon: FiMail },
    { href: profile?.profileGithubUrl, label: '깃허브', icon: FiGithub, external: true },
    { href: profile?.profileLinkedinUrl, label: '링크드인', icon: FaLinkedinIn, external: true },
    { href: profile?.profileTwitterUrl, label: 'X', icon: FaXTwitter, external: true },
    { href: profile?.profileFacebookUrl, label: '페이스북', icon: FaFacebookF, external: true },
    { href: profile?.profileWebsiteUrl, label: '홈페이지', icon: FiGlobe, external: true },
  ].filter(item => Boolean(item.href));
  const postCategories = useMemo(() => {
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
    return Array.from(counter.values()).sort((a, b) => b.count - a.count);
  }, [posts]);
  const postTags = useMemo(() => {
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
    return Array.from(counter.values()).sort((a, b) => b.count - a.count);
  }, [posts]);
  const sortedPosts = useMemo(() => sortPostsByKey(posts, sortKey), [posts, sortKey]);
  const filteredPosts = useMemo(() => {
    if (!selectedCategoryId && !selectedTagId) return sortedPosts;
    return sortedPosts.filter(post => {
      const matchesCategory = selectedCategoryId ? post.category?.id === selectedCategoryId : true;
      const matchesTag = selectedTagId ? post.tags?.some(tag => tag.id === selectedTagId) : true;
      return matchesCategory && matchesTag;
    });
  }, [selectedCategoryId, selectedTagId, sortedPosts]);
  const selectedCategoryLabel = postCategories.find(category => category.id === selectedCategoryId)?.name;
  const selectedTagLabel = postTags.find(tag => tag.id === selectedTagId)?.name;
  const toggleCategory = () => {
    setIsTagOpen(false);
    setIsCategoryOpen(prev => !prev);
  };
  const toggleTag = () => {
    setIsCategoryOpen(false);
    setIsTagOpen(prev => !prev);
  };
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(prev => (prev === categoryId ? null : categoryId));
    setIsCategoryOpen(false);
  };
  const handleTagSelect = (tagId: string) => {
    setSelectedTagId(prev => (prev === tagId ? null : tagId));
    setIsTagOpen(false);
  };
  const handleSortToggle = () => setSortKey(prev => (prev === 'latest' ? 'popular' : 'latest'));
  const emptyText = selectedCategoryId || selectedTagId ? '조건에 맞는 게시물이 없습니다.' : '아직 작성한 게시물이 없습니다.';

  // 프로필 : 파라미터 대기
  if (!decodedProfileId) {
    return <ProfilePageSkeleton />;
  }

  // 프로필 : @ 없는 요청 차단
  if (!hasAtPrefix) {
    return (
      <section className={styles.container} aria-label="프로필">
        <div className={styles.empty}>프로필을 찾을 수 없습니다.</div>
      </section>
    );
  }

  if (isProfileLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!profile) {
    return (
      <section className={styles.container} aria-label="프로필">
        <div className={styles.empty}>프로필을 찾을 수 없습니다.</div>
      </section>
    );
  }

  return (
    <section className={styles.container} aria-label="프로필">
      <div className={styles.headerBlock}>
        <header className={myPageStyles.header}>
          <div className={myPageStyles.profileCard}>
            <div className={myPageStyles.profileMain}>
              <div className={myPageStyles.avatar} aria-hidden="true">
                {profile.profileImageUrl ? (
                  <Image
                    className={myPageStyles.avatarImage}
                    src={profile.profileImageUrl}
                    alt=""
                    width={62}
                    height={62}
                    sizes="62px"
                    unoptimized
                  />
                ) : (
                  <FaUser className={myPageStyles.avatarIcon} />
                )}
              </div>
              <div className={myPageStyles.profileInfo}>
                <div className={myPageStyles.profileNameRow}>
                  <span className={myPageStyles.profileName}>{profile.name}</span>
                  <span className={myPageStyles.profileHandle}>{handleText}</span>
                </div>
                <div className={myPageStyles.profileStatsRow}>
                  <div className={myPageStyles.profileStats}>
                    <span className={myPageStyles.profileStat}>
                      글 <strong>{postCount}</strong>
                    </span>
                    <span className={myPageStyles.profileDivider}>·</span>
                    <span className={myPageStyles.profileStat}>
                      팔로워 <strong>{followerCount}</strong>
                    </span>
                    <span className={myPageStyles.profileDivider}>·</span>
                    <span className={myPageStyles.profileStat}>
                      팔로잉 <strong>{followingCount}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.profileSide}>
                {profileSocialLinks.length ? (
                  <div className={myPageStyles.profileSocialRow} aria-label="소셜 링크">
                    {profileSocialLinks.map(({ href, label, icon: Icon, external }) => (
                      <a
                        key={label}
                        className={myPageStyles.profileSocialLink}
                        href={href}
                        aria-label={label}
                        target={external ? '_blank' : undefined}
                        rel={external ? 'noreferrer' : undefined}
                      >
                        <Icon aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>
        <div className={myPageStyles.headerDivider} aria-hidden="true" />
      </div>
      <section className={myPageStyles.settingsSection} aria-label="소개">
        <div className={myPageStyles.settingsRow}>
          <span className={myPageStyles.settingsLabel}>소개</span>
        </div>
        <div className={myPageStyles.settingsBody}>
          {profile.profileBio ? (
            <div className={markdownStyles.markdown}>{bioPreview}</div>
          ) : (
            <div className={myPageStyles.settingsEmpty}>
              <p className={myPageStyles.settingsText}>아직 작성한 소개가 없습니다.</p>
            </div>
          )}
        </div>
      </section>
      <div className={myPageStyles.headerDivider} aria-hidden="true" />

      {isPostsLoading ? (
        <ProfilePostListSkeleton />
      ) : (
        <section className={myPageStyles.settingsSection} aria-label="게시글 목록">
          <div className={myPageStyles.settingsRow}>
            <span className={myPageStyles.settingsLabel}>게시글</span>
            <div className={myPageStyles.settingsControlGroup}>
              <div className={myPageStyles.filterDropdown}>
                <button
                  type="button"
                  className={myPageStyles.filterButton}
                  onClick={toggleCategory}
                  disabled={!postCategories.length}
                >
                  {selectedCategoryLabel ?? '카테고리'}
                  <FiChevronDown className={myPageStyles.filterChevron} aria-hidden="true" />
                </button>
                {isCategoryOpen ? (
                  <div className={myPageStyles.filterMenu}>
                    {postCategories.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        className={`${myPageStyles.filterItem} ${
                          selectedCategoryId === category.id ? myPageStyles.filterItemActive : ''
                        }`}
                        onClick={() => handleCategorySelect(category.id)}
                      >
                        <span>{category.name}</span>
                        <span className={myPageStyles.filterCount}>{category.count}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className={myPageStyles.filterDropdown}>
                <button type="button" className={myPageStyles.filterButton} onClick={toggleTag} disabled={!postTags.length}>
                  <span className={myPageStyles.tagFilterLabel}>{selectedTagLabel ? `#${selectedTagLabel}` : '#태그'}</span>
                  <FiChevronDown className={myPageStyles.filterChevron} aria-hidden="true" />
                </button>
                {isTagOpen ? (
                  <div className={`${myPageStyles.filterMenu} ${myPageStyles.tagFilterMenu}`}>
                    {postTags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        className={`${myPageStyles.filterItem} ${
                          selectedTagId === tag.id
                            ? `${myPageStyles.filterItemActive} ${myPageStyles.tagFilterItemActive}`
                            : ''
                        }`}
                        onClick={() => handleTagSelect(tag.id)}
                      >
                        <span className={myPageStyles.tagFilterName}>#{tag.name}</span>
                        <span className={myPageStyles.filterCount}>{tag.count}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className={myPageStyles.settingsDivider} aria-hidden="true" />
              <div className={myPageStyles.settingsSortGroup}>
                <button
                  type="button"
                  className={`${myPageStyles.settingsSortButton} ${myPageStyles.settingsSortButtonActive}`}
                  onClick={handleSortToggle}
                >
                  {sortKey === 'popular' ? (
                    <>
                      <FiTrendingUp className={myPageStyles.settingsSortIcon} aria-hidden="true" />
                      인기순
                    </>
                  ) : (
                    <>
                      <FiClock className={myPageStyles.settingsSortIcon} aria-hidden="true" />
                      최신순
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <PostSummaryList posts={filteredPosts} emptyText={emptyText} emptyClassName={styles.empty} />
        </section>
      )}
    </section>
  );
}
