import Skeleton from 'react-loading-skeleton';

import 'react-loading-skeleton/dist/skeleton.css';
import styles from '@/app/(routes)/(private)/mypage/MyPage.module.css';
import commentStyles from '@/app/(routes)/(public)/posts/[postId]/PostDetail.module.css';
import postListStyles from '@/app/(routes)/(public)/main/components/postList/postList.module.css';

type MyPageValueSkeletonProps = {
  width: number;
  height: number;
};

/**
 * 마이페이지 값 스켈레톤
 * @description 텍스트 자리 스켈레톤을 렌더링
 */
export function MyPageValueSkeleton({ width, height }: MyPageValueSkeletonProps) {
  return <Skeleton width={width} height={height} />;
}

/**
 * 마이페이지 게시글 스켈레톤
 * @description 내 블로그/좋아요 탭의 리스트 로딩 UI를 렌더링
 */
export function MyPagePostListSkeleton({ label, showFilters = true }: { label: string; showFilters?: boolean }) {
  return (
    <div className={styles.postsMain} aria-hidden="true">
      <div className={styles.settingsRow}>
        <span className={styles.settingsLabel}>{label}</span>
        {showFilters ? (
          <div className={styles.settingsControlGroup}>
            <span className={styles.filterButton}>
              <Skeleton width={62} height={14} />
            </span>
            <span className={styles.filterButton}>
              <Skeleton width={52} height={14} />
            </span>
            <div className={styles.settingsDivider} />
            <span className={styles.settingsSortButton}>
              <Skeleton width={58} height={14} />
            </span>
          </div>
        ) : (
          <div className={styles.settingsSortGroup}>
            <span className={styles.settingsSortButton}>
              <Skeleton width={58} height={14} />
            </span>
          </div>
        )}
      </div>
      <ul className={postListStyles.listView}>
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={`mypage-post-list-skeleton-${index}`}>
            <article className={postListStyles.listItem}>
              <div className={postListStyles.listBody}>
                <Skeleton width="72%" height={28} />
                <Skeleton count={2} height={15} />
                <div className={postListStyles.listTagList}>
                  <Skeleton width={52} height={24} borderRadius={4} />
                  <Skeleton width={68} height={24} borderRadius={4} />
                  <Skeleton width={56} height={24} borderRadius={4} />
                </div>
                <div className={postListStyles.meta}>
                  <Skeleton width={220} height={12} />
                  <Skeleton width={170} height={12} />
                </div>
              </div>
              <div className={postListStyles.listThumb}>
                <Skeleton width="100%" height="100%" />
              </div>
            </article>
            {index < 2 ? <div className={postListStyles.listDivider} /> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 마이페이지 댓글 스켈레톤
 * @description 남긴 댓글 탭의 리스트 로딩 UI를 렌더링
 */
export function MyPageCommentsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={styles.settingsRow}>
        <span className={styles.settingsLabel}>남긴 댓글</span>
        <div className={styles.settingsSortGroup}>
          <span className={styles.settingsSortButton}>
            <Skeleton width={58} height={14} />
          </span>
        </div>
      </div>
      <div className={commentStyles.commentList}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`mypage-comment-skeleton-${index}`}>
            <div className={commentStyles.commentItem}>
              <div className={commentStyles.commentInner}>
                <div className={commentStyles.commentHeaderRow}>
                  <div className={commentStyles.commentProfile}>
                    <div className={commentStyles.commentAvatarGroup}>
                      <span className={commentStyles.commentAvatar}>
                        <Skeleton circle width={30} height={30} />
                      </span>
                    </div>
                    <div className={commentStyles.commentMeta}>
                      <Skeleton width={220} height={14} />
                      <Skeleton width={110} height={12} />
                    </div>
                  </div>
                </div>
                <div className={commentStyles.commentContent}>
                  <Skeleton count={2} height={14} />
                  <div className={commentStyles.commentFooter}>
                    <Skeleton width={88} height={12} />
                  </div>
                </div>
              </div>
            </div>
            {index < 2 ? <div className={commentStyles.commentDividerLine} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 마이페이지 계정설정 스켈레톤
 * @description 계정 설정 탭의 블록 로딩 UI를 렌더링
 */
export function MyPageAccountSkeleton() {
  return (
    <div className={styles.settingsSection} aria-hidden="true">
      <div className={styles.settingsRow}>
        <span className={styles.settingsLabel}>계정 설정</span>
      </div>
      <div className={styles.settingsBlock}>
        <div className={styles.settingsBlockTitle}>기본 정보</div>
        <div className={styles.settingsGroup}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`mypage-account-skeleton-${index}`} className={styles.settingsItem}>
              <div className={styles.settingsItemLabel}>
                <Skeleton width={84} height={14} />
              </div>
              <div className={styles.settingsItemValue}>
                <Skeleton width={220} height={18} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 마이페이지 소개 스켈레톤
 * @description 내 정보 탭 소개 영역 로딩 UI를 렌더링
 */
export function MyPageIntroSkeleton() {
  return (
    <div className={styles.settingsBody} aria-hidden="true">
      <Skeleton width="100%" height={18} />
      <Skeleton width="92%" height={18} />
      <Skeleton width="78%" height={18} />
    </div>
  );
}
