import Skeleton from 'react-loading-skeleton';

import { MyPageIntroSkeleton, MyPagePostListSkeleton } from '@/app/(routes)/(private)/mypage/MyPage.skeleton';

import myPageStyles from '@/app/(routes)/(private)/mypage/MyPage.module.css';
import styles from '@/app/(routes)/(public)/[profileId]/ProfilePage.module.css';

/**
 * 공개 프로필 전체 스켈레톤
 * @description 헤더/소개/게시글 영역 로딩 UI를 렌더링합니다.
 */
export function ProfilePageSkeleton() {
  return (
    <section className={styles.container} aria-label="프로필">
      <div className={styles.headerBlock} aria-hidden="true">
        <header className={myPageStyles.header}>
          <div className={myPageStyles.profileCard}>
            <div className={myPageStyles.profileMain}>
              <span className={myPageStyles.avatar}>
                <Skeleton circle width={62} height={62} />
              </span>
              <div className={myPageStyles.profileInfo}>
                <div className={myPageStyles.profileNameRow}>
                  <Skeleton width={130} height={32} />
                  <Skeleton width={84} height={18} />
                </div>
                <div className={myPageStyles.profileStatsRow}>
                  <Skeleton width={220} height={18} />
                </div>
              </div>
              <div className={styles.profileSide}>
                <div className={myPageStyles.profileSocialRow}>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <span key={`profile-social-skeleton-${index}`} className={myPageStyles.profileSocialLink}>
                      <Skeleton width={16} height={16} />
                    </span>
                  ))}
                </div>
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
        <MyPageIntroSkeleton />
      </section>
      <div className={myPageStyles.headerDivider} aria-hidden="true" />
      <MyPagePostListSkeleton label="게시글" />
    </section>
  );
}

/**
 * 공개 프로필 게시글 스켈레톤
 * @description 게시글 목록 영역 로딩 UI를 렌더링합니다.
 */
export function ProfilePostListSkeleton() {
  return <MyPagePostListSkeleton label="게시글" />;
}
