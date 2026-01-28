'use client';

import { Fragment, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { CiCalendar } from 'react-icons/ci';
import { FaUser, FaUserEdit } from 'react-icons/fa';
import {
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiMoreHorizontal,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';

import commentStyles from '@/app/(routes)/(public)/posts/[postId]/PostDetail.module.css';
import { splitCommentMentions } from '@/app/(routes)/(public)/posts/[postId]/postDetail.utils';
import EditorToolbar from '@/app/shared/components/markdown-editor/EditorToolbar';
import markdownStyles from '@/app/shared/styles/markdown.module.css';
import markdownEditorStyles from '@/app/shared/styles/markdownEditor.module.css';
import { stopMenuPropagation } from './mypage.handlers';
import {
  useBioEditor,
  useCommentEditor,
  useMyPageData,
  useMyPageTab,
  usePostSidebarData,
  usePostMenu,
  useActivitySort,
  useProfileEditor,
  useProfileImageEditor,
} from './mypage.hooks';
import { formatDateLabel, formatDateTimeLabel, formatSummary, sortPostsByKey } from './mypage.utils';
import styles from './MyPage.module.css';

export default function MyPage() {
  // 탭 상태
  const activeTab = useMyPageTab('settings');

  // 데이터 상태
  const {
    accessToken,
    displayName,
    followerCount,
    followingCount,
    likedPosts,
    myComments,
    myPosts,
    userEmail,
    userPhone,
    profileHandle,
    profileImageUrl,
    userBio,
  } = useMyPageData();

  // 활동 정렬
  const { sortKey, sortedPosts, sortedComments, handleSortChange } = useActivitySort(myPosts, myComments);
  const handleSortToggle = () => handleSortChange(sortKey === 'latest' ? 'popular' : 'latest');
  const { categories: postCategories, tags: postTags } = usePostSidebarData(myPosts);
  const sortedLikedPosts = useMemo(() => sortPostsByKey(likedPosts, sortKey), [likedPosts, sortKey]);

  // 프로필 편집
  const {
    isProfileEditing,
    profileHandle: editingHandle,
    handlers: { handleProfileEditToggle, handleProfileHandleChange, handleProfileCancel },
  } = useProfileEditor(displayName, profileHandle);

  // 프로필 이미지
  const {
    profileImageUrl: profileAvatarUrl,
    refs: { avatarInputRef },
    handlers: { handleAvatarClick, handleAvatarChange },
  } = useProfileImageEditor(profileImageUrl, isProfileEditing);

  // 게시글 메뉴
  const { isPostDeleting, openPostMenuId, handlePostDelete, handlePostEdit, handlePostMenuToggle } = usePostMenu();

  // 댓글 편집
  const {
    editingCommentId,
    editingContent,
    hasEditingLengthError,
    isDeleting,
    isUpdating,
    openCommentMenuId,
    handleCommentMenuToggle,
    handleDeleteComment,
    handleEditCancel,
    handleEditChange,
    handleEditStart,
    handleEditSubmit,
  } = useCommentEditor();

  // 자기소개 편집
  const {
    bioPreview,
    profileBio,
    showBioEditor,
    isBioUpdating,
    refs: { bioEditorRef, bioImageInputRef },
    handlers: { handleBioChange, handleBioSave, handleBioToggle, handleBioImageClick, handleBioImageSelect },
    toolbar: { applyBullet, applyCode, applyHeading, applyInlineWrap, applyLink, applyNumbered, applyQuote },
  } = useBioEditor(userBio);

  // 필터 상태
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const toggleCategory = () => setIsCategoryOpen(prev => !prev);
  const toggleTag = () => setIsTagOpen(prev => !prev);
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(prev => (prev === categoryId ? null : categoryId));
    setIsCategoryOpen(false);
  };
  const handleTagSelect = (tagId: string) => {
    setSelectedTagId(prev => (prev === tagId ? null : tagId));
    setIsTagOpen(false);
  };
  const selectedCategoryLabel = postCategories.find(category => category.id === selectedCategoryId)?.name;
  const selectedTagLabel = postTags.find(tag => tag.id === selectedTagId)?.name;

  const filteredPosts = useMemo(() => {
    if (!selectedCategoryId && !selectedTagId) return sortedPosts;
    return sortedPosts.filter(post => {
      const matchesCategory = selectedCategoryId ? post.category?.id === selectedCategoryId : true;
      const matchesTag = selectedTagId ? post.tags?.some(tag => tag.id === selectedTagId) : true;
      return matchesCategory && matchesTag;
    });
  }, [selectedCategoryId, selectedTagId, sortedPosts]);

  if (!accessToken) {
    return (
      <section className={styles.container} aria-label="마이페이지">
        <div className={styles.empty}>
          <p>로그인 후 이용해주세요.</p>
          <Link href="/login" className={styles.primaryLink}>
            로그인하기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.container} aria-label="마이페이지">
      <div className={styles.layout}>
        <aside className={styles.leftPanel}>
          <nav className={styles.list} aria-label="마이페이지 메뉴">
            <div className={styles.listSection}>
              <Link
                className={activeTab === 'settings' ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink}
                href="/mypage"
              >
                내 정보
              </Link>
              <div className={styles.listDividerLine} aria-hidden="true" />
              <span className={styles.listGroupTitle}>활동</span>
              <Link
                className={activeTab === 'posts' ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink}
                href="/mypage?tab=posts"
              >
                내 블로그
              </Link>
              <Link
                className={activeTab === 'comments' ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink}
                href="/mypage?tab=comments"
              >
                남긴 댓글
              </Link>
              <Link
                className={activeTab === 'likes' ? `${styles.listLink} ${styles.listLinkActive}` : styles.listLink}
                href="/mypage?tab=likes"
              >
                좋아한 포스트
              </Link>
              <div className={styles.listDividerLine} aria-hidden="true" />
              <Link className={styles.listLink} href="/mypage?tab=account">
                계정 설정
              </Link>
            </div>
          </nav>
        </aside>
        <div className={styles.main}>
          <header className={styles.header}>
            <div className={styles.profileCard}>
              <div className={styles.profileMain}>
                <button
                  type="button"
                  className={styles.avatarButton}
                  aria-label="프로필 이미지 업로드"
                  onClick={handleAvatarClick}
                >
                  <div className={styles.avatar} aria-hidden="true">
                    {profileAvatarUrl ? (
                      <Image
                        className={styles.avatarImage}
                        src={profileAvatarUrl}
                        alt=""
                        width={62}
                        height={62}
                        sizes="62px"
                        unoptimized
                      />
                    ) : isProfileEditing ? (
                      <FaUserEdit className={`${styles.avatarIcon} ${styles.avatarIconEdit}`} />
                    ) : (
                      <FaUser className={styles.avatarIcon} />
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    className={styles.avatarInput}
                    type="file"
                    accept="image/*"
                    disabled={!isProfileEditing}
                    onChange={handleAvatarChange}
                  />
                </button>
                <div className={styles.profileInfo}>
                  {isProfileEditing ? (
                    <div className={styles.profileNameRow}>
                      <span className={styles.profileName}>{displayName}</span>
                      <span className={styles.profileHandleInputGroup}>
                        <span className={styles.profileHandlePrefix}>@</span>
                        <input
                          className={styles.profileHandleInput}
                          value={editingHandle}
                          onChange={handleProfileHandleChange}
                          placeholder="아이디"
                        />
                      </span>
                    </div>
                  ) : (
                    <div className={styles.profileNameRow}>
                      <span className={styles.profileName}>{displayName}</span>
                      <span className={styles.profileHandle}>@{profileHandle}</span>
                    </div>
                  )}
                  <div className={styles.profileStats}>
                    <span className={styles.profileStat}>
                      글 <strong>{myPosts.length}</strong>
                    </span>
                    <span className={styles.profileDivider}>·</span>
                    <span className={styles.profileStat}>
                      팔로워 <strong>{followerCount}</strong>
                    </span>
                    <span className={styles.profileDivider}>·</span>
                    <span className={styles.profileStat}>
                      팔로잉 <strong>{followingCount}</strong>
                    </span>
                  </div>
                </div>
                <div className={styles.profileActions}>
                  {isProfileEditing ? (
                    <button type="button" className={styles.profileCancelButton} onClick={handleProfileCancel}>
                      취소
                    </button>
                  ) : null}
                  <button type="button" className={styles.profileEditButton} onClick={handleProfileEditToggle}>
                    {isProfileEditing ? '저장' : '프로필 수정'}
                  </button>
                </div>
              </div>
            </div>
          </header>
          <div className={styles.headerDivider} aria-hidden="true" />

          <div className={styles.content}>
            {activeTab === 'settings' ? (
              <div className={styles.settingsSection}>
                <div className={styles.settingsRow}>
                  <span className={styles.settingsLabel}>소개</span>
                  {!showBioEditor ? (
                    <button type="button" className={styles.settingsButton} onClick={handleBioToggle}>
                      {userBio ? '수정하기' : '작성하기'}
                    </button>
                  ) : null}
                </div>
                {showBioEditor ? (
                  <div className={styles.settingsBody}>
                    <div className={`${markdownEditorStyles.editorBox} ${styles.settingsEditorBox}`}>
                      <EditorToolbar
                        onHeading={applyHeading}
                        onBold={() => applyInlineWrap('**')}
                        onItalic={() => applyInlineWrap('_')}
                        onUnderline={() => applyInlineWrap('<u>', '</u>')}
                        onStrike={() => applyInlineWrap('~~')}
                        onQuote={applyQuote}
                        onCode={applyCode}
                        onLink={applyLink}
                        onImage={handleBioImageClick}
                        onBullet={applyBullet}
                        onNumbered={applyNumbered}
                      />
                      <input
                        ref={bioImageInputRef}
                        className={markdownEditorStyles.srOnly}
                        type="file"
                        accept="image/*"
                        aria-label="자기소개 이미지 선택"
                        onChange={handleBioImageSelect}
                      />
                      <label className={markdownEditorStyles.srOnly} htmlFor="profile-bio">
                        자기소개
                      </label>
                      <textarea
                        ref={bioEditorRef}
                        id="profile-bio"
                        className={`${markdownEditorStyles.editor} ${styles.settingsEditor}`}
                        placeholder="자기소개를 입력하세요."
                        value={profileBio}
                        maxLength={500}
                        onChange={handleBioChange}
                        disabled={isBioUpdating}
                      />
                    </div>
                    <div className={styles.settingsActions}>
                      <button type="button" className={styles.settingsCancelButton} onClick={handleBioToggle}>
                        닫기
                      </button>
                      <button
                        type="button"
                        className={styles.settingsSaveButton}
                        onClick={handleBioSave}
                        disabled={isBioUpdating}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : profileBio ? (
                  <div className={markdownStyles.markdown}>{bioPreview}</div>
                ) : (
                  <div className={styles.settingsEmpty}>
                    <p className={styles.settingsText}>아직 작성된 소개가 없습니다.</p>
                    <span className={styles.settingsSubtext}>자기소개를 작성하면 내 블로그 상단에 노출됩니다.</span>
                  </div>
                )}
              </div>
            ) : activeTab === 'posts' ? (
              myPosts.length ? (
                <div className={styles.postsMain}>
                  <div className={styles.settingsRow}>
                    <span className={styles.settingsLabel}>내 블로그</span>
                    <div className={styles.settingsControlGroup}>
                      <div className={styles.filterDropdown}>
                        <button
                          type="button"
                          className={styles.filterButton}
                          onClick={toggleCategory}
                          disabled={!postCategories.length}
                        >
                          {selectedCategoryLabel ?? '카테고리'}
                          <FiChevronDown className={styles.filterChevron} aria-hidden="true" />
                        </button>
                        {isCategoryOpen ? (
                          <div className={styles.filterMenu}>
                            {postCategories.map(category => (
                              <button
                                key={category.id}
                                type="button"
                                className={`${styles.filterItem} ${
                                  selectedCategoryId === category.id ? styles.filterItemActive : ''
                                }`}
                                onClick={() => handleCategorySelect(category.id)}
                              >
                                <span>{category.name}</span>
                                <span className={styles.filterCount}>{category.count}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className={styles.filterDropdown}>
                        <button
                          type="button"
                          className={styles.filterButton}
                          onClick={toggleTag}
                          disabled={!postTags.length}
                        >
                          {selectedTagLabel ?? '태그'}
                          <FiChevronDown className={styles.filterChevron} aria-hidden="true" />
                        </button>
                        {isTagOpen ? (
                          <div className={styles.filterMenu}>
                            {postTags.map(tag => (
                              <button
                                key={tag.id}
                                type="button"
                                className={`${styles.filterItem} ${
                                  selectedTagId === tag.id ? styles.filterItemActive : ''
                                }`}
                                onClick={() => handleTagSelect(tag.id)}
                              >
                                <span>{tag.name}</span>
                                <span className={styles.filterCount}>{tag.count}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className={styles.settingsDivider} aria-hidden="true" />
                      <div className={styles.settingsSortGroup}>
                        <button
                          type="button"
                          className={`${styles.settingsSortButton} ${styles.settingsSortButtonActive}`}
                          onClick={handleSortToggle}
                        >
                          {sortKey === 'popular' ? (
                            <>
                              <FiTrendingUp className={styles.settingsSortIcon} aria-hidden="true" />
                              인기순
                            </>
                          ) : (
                            <>
                              <FiClock className={styles.settingsSortIcon} aria-hidden="true" />
                              최신순
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {filteredPosts.length ? (
                    <ul className={styles.listView}>
                      {filteredPosts.map((post, index) => (
                        <Fragment key={post.id}>
                          <li>
                            <Link className={styles.postLink} href={`/posts/${post.id}`}>
                              <article className={styles.listItem}>
                                <div className={styles.listBody}>
                                  <div className={styles.listHeaderRow}>
                                    <h3>{post.title || '제목 없음'}</h3>
                                    <div className={styles.listMenuWrapper}>
                                      <button
                                        type="button"
                                        className={styles.listMenuButton}
                                        aria-label="게시글 옵션"
                                        onClick={event => {
                                          stopMenuPropagation(event);
                                          handlePostMenuToggle(post.id);
                                        }}
                                      >
                                        <FiMoreHorizontal aria-hidden="true" />
                                      </button>
                                      {openPostMenuId === post.id ? (
                                        <div className={styles.listMenu} role="menu" onClick={stopMenuPropagation}>
                                          <button
                                            type="button"
                                            className={styles.listMenuItem}
                                            role="menuitem"
                                            onClick={event => {
                                              stopMenuPropagation(event);
                                              handlePostEdit(post.id);
                                            }}
                                          >
                                            <FiEdit2 aria-hidden="true" />
                                            수정
                                          </button>
                                          <button
                                            type="button"
                                            className={styles.listMenuItem}
                                            role="menuitem"
                                            disabled={isPostDeleting}
                                            onClick={event => {
                                              stopMenuPropagation(event);
                                              handlePostDelete(post.id);
                                            }}
                                          >
                                            <FiTrash2 aria-hidden="true" />
                                            삭제
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                  <p className={styles.summary}>{formatSummary(post.content)}</p>
                                  <div className={styles.meta}>
                                    <span className={styles.metaGroup}>
                                      <span className={styles.metaItem}>
                                        <CiCalendar aria-hidden="true" />{' '}
                                        {formatDateLabel(post.publishedAt ?? post.createdAt)}
                                      </span>
                                    </span>
                                    <span className={styles.metaGroup}>
                                      <span className={styles.metaItem}>
                                        <FiEye aria-hidden="true" /> {post.viewCount.toLocaleString()}
                                      </span>
                                      <span className={styles.separator} aria-hidden="true">
                                        |
                                      </span>
                                      <span className={styles.metaItem}>
                                        <FiHeart aria-hidden="true" /> {post.likeCount.toLocaleString()}
                                      </span>
                                      <span className={styles.separator} aria-hidden="true">
                                        |
                                      </span>
                                      <span className={styles.metaItem}>
                                        <FiMessageCircle aria-hidden="true" /> {post.commentCount.toLocaleString()}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                                {post.thumbnailUrl ? (
                                  <div
                                    className={styles.listThumb}
                                    style={{ backgroundImage: `url(${post.thumbnailUrl})` }}
                                    aria-hidden="true"
                                  />
                                ) : null}
                              </article>
                            </Link>
                          </li>
                          {index < filteredPosts.length - 1 ? (
                            <li className={styles.listDividerItem} aria-hidden="true">
                              <div className={styles.listDivider} />
                            </li>
                          ) : null}
                        </Fragment>
                      ))}
                    </ul>
                  ) : (
                    <div className={styles.empty}>조건에 맞는 게시물이 없습니다.</div>
                  )}
                </div>
              ) : (
                <div className={styles.postsMain}>
                  <div className={styles.settingsRow}>
                    <span className={styles.settingsLabel}>내 블로그</span>
                    <div className={styles.settingsControlGroup}>
                      <div className={styles.filterDropdown}>
                        <button
                          type="button"
                          className={styles.filterButton}
                          onClick={toggleCategory}
                          disabled={!postCategories.length}
                        >
                          {selectedCategoryLabel ?? '카테고리'}
                          <FiChevronDown className={styles.filterChevron} aria-hidden="true" />
                        </button>
                        {isCategoryOpen ? (
                          <div className={styles.filterMenu}>
                            {postCategories.map(category => (
                              <button
                                key={category.id}
                                type="button"
                                className={`${styles.filterItem} ${
                                  selectedCategoryId === category.id ? styles.filterItemActive : ''
                                }`}
                                onClick={() => handleCategorySelect(category.id)}
                              >
                                <span>{category.name}</span>
                                <span className={styles.filterCount}>{category.count}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className={styles.filterDropdown}>
                        <button
                          type="button"
                          className={styles.filterButton}
                          onClick={toggleTag}
                          disabled={!postTags.length}
                        >
                          {selectedTagLabel ?? '태그'}
                          <FiChevronDown className={styles.filterChevron} aria-hidden="true" />
                        </button>
                        {isTagOpen ? (
                          <div className={styles.filterMenu}>
                            {postTags.map(tag => (
                              <button
                                key={tag.id}
                                type="button"
                                className={`${styles.filterItem} ${
                                  selectedTagId === tag.id ? styles.filterItemActive : ''
                                }`}
                                onClick={() => handleTagSelect(tag.id)}
                              >
                                <span>{tag.name}</span>
                                <span className={styles.filterCount}>{tag.count}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className={styles.settingsDivider} aria-hidden="true" />
                      <div className={styles.settingsSortGroup}>
                        <button
                          type="button"
                          className={`${styles.settingsSortButton} ${styles.settingsSortButtonActive}`}
                          onClick={handleSortToggle}
                        >
                          {sortKey === 'popular' ? (
                            <>
                              <FiTrendingUp className={styles.settingsSortIcon} aria-hidden="true" />
                              인기순
                            </>
                          ) : (
                            <>
                              <FiClock className={styles.settingsSortIcon} aria-hidden="true" />
                              최신순
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.empty}>아직 작성한 게시물이 없습니다.</div>
                </div>
              )
            ) : activeTab === 'account' ? (
              <div className={styles.settingsSection}>
                <div className={styles.settingsRow}>
                  <span className={styles.settingsLabel}>계정 설정</span>
                </div>
                  <div className={styles.settingsBlock}>
                    <div className={styles.settingsBlockTitle}>기본 정보</div>
                    <div className={styles.settingsGroup}>
                      <div className={styles.settingsItem}>
                        <div className={styles.settingsItemLabel}>이름</div>
                        <div className={styles.settingsItemValue}>{displayName}</div>
                        <button type="button" className={styles.settingsButton} disabled>
                          변경 불가
                        </button>
                      </div>
                      <div className={styles.settingsItem}>
                        <div className={styles.settingsItemLabel}>이메일 주소</div>
                        <div className={styles.settingsItemValue}>{userEmail || '미등록'}</div>
                        <button type="button" className={styles.settingsButton}>
                          변경하기
                        </button>
                      </div>
                      <div className={styles.settingsItem}>
                        <div className={styles.settingsItemLabel}>비밀번호</div>
                        <div className={styles.settingsItemValue}>********</div>
                        <button type="button" className={styles.settingsButton}>
                          변경하기
                        </button>
                      </div>
                      <div className={styles.settingsItem}>
                        <div className={styles.settingsItemLabel}>전화번호</div>
                        <div className={styles.settingsItemValue}>{userPhone || '미등록'}</div>
                        <button type="button" className={styles.settingsButton}>
                          변경하기
                        </button>
                      </div>
                      <div className={styles.settingsItem}>
                        <div className={styles.settingsItemLabel}>생년월일</div>
                        <div className={styles.settingsItemValue}>미등록</div>
                        <button type="button" className={styles.settingsButton}>
                          변경하기
                        </button>
                      </div>
                    </div>
                  </div>
                <div className={styles.settingsFooter}>
                  <button type="button" className={styles.withdrawButton}>
                    회원탈퇴 <FiChevronRight aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : activeTab === 'comments' ? (
              myComments.length ? (
                <>
                  <div className={styles.settingsRow}>
                    <span className={styles.settingsLabel}>남긴 댓글</span>
                    <div className={styles.settingsSortGroup}>
                      <button
                        type="button"
                        className={`${styles.settingsSortButton} ${styles.settingsSortButtonActive}`}
                        onClick={handleSortToggle}
                      >
                        {sortKey === 'popular' ? (
                          <>
                            <FiTrendingUp className={styles.settingsSortIcon} aria-hidden="true" />
                            인기순
                          </>
                        ) : (
                          <>
                            <FiClock className={styles.settingsSortIcon} aria-hidden="true" />
                            최신순
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className={`${commentStyles.commentList} ${styles.commentListReset}`}>
                    {sortedComments.map(comment => {
                      const postId = comment.post?.id ?? '';
                      const postTitle = comment.post?.title ?? '게시글 없음';
                      const commentLabel = comment.parentId ? '남긴 대댓글' : '남긴 댓글';
                      const commentLink = postId ? `/posts/${postId}#comment-${comment.id}` : '';
                      const commentDate = formatDateTimeLabel(comment.createdAt);
                      const isEditing = editingCommentId === comment.id;
                      const isLinkEnabled = Boolean(commentLink) && !isEditing;

                      return (
                        <Fragment key={comment.id}>
                          {isLinkEnabled ? (
                            <Link className={styles.commentLink} href={commentLink}>
                              <div
                                className={`${commentStyles.commentItem} ${styles.commentBox}`}
                                id={`comment-${comment.id}`}
                              >
                                <div className={commentStyles.commentInner}>
                                  <div className={commentStyles.commentHeaderRow}>
                                    <div className={commentStyles.commentProfile}>
                                      <div className={commentStyles.commentAvatarGroup}>
                                        <span className={commentStyles.commentAvatar} aria-hidden="true">
                                          {profileAvatarUrl ? (
                                            <Image
                                              className={commentStyles.commentAvatarImage}
                                              src={profileAvatarUrl}
                                              alt=""
                                              width={30}
                                              height={30}
                                              sizes="30px"
                                              unoptimized
                                            />
                                          ) : (
                                            <FaUser />
                                          )}
                                        </span>
                                      </div>
                                      <div className={commentStyles.commentMeta}>
                                        <span className={commentStyles.commentAuthor}>
                                          ‘{postTitle}’에 {commentLabel}
                                        </span>
                                        <span className={commentStyles.commentDate}>{commentDate}</span>
                                      </div>
                                    </div>
                                    <div className={commentStyles.commentMoreWrapper}>
                                      <button
                                        type="button"
                                        className={commentStyles.commentMoreButton}
                                        aria-label="댓글 옵션"
                                        onClick={event => {
                                          stopMenuPropagation(event);
                                          handleCommentMenuToggle(comment.id);
                                        }}
                                      >
                                        <FiMoreHorizontal aria-hidden="true" />
                                      </button>
                                      {openCommentMenuId === comment.id ? (
                                        <div
                                          className={commentStyles.commentMoreMenu}
                                          role="menu"
                                          onClick={stopMenuPropagation}
                                        >
                                          <button
                                            type="button"
                                            className={commentStyles.commentMoreItem}
                                            role="menuitem"
                                            onClick={event => {
                                              stopMenuPropagation(event);
                                              handleEditStart(comment.id, comment.content);
                                            }}
                                          >
                                            <FiEdit2 aria-hidden="true" />
                                            수정
                                          </button>
                                          <button
                                            type="button"
                                            className={commentStyles.commentMoreItem}
                                            role="menuitem"
                                            disabled={isDeleting}
                                            onClick={event => {
                                              stopMenuPropagation(event);
                                              handleDeleteComment(postId, comment.id);
                                            }}
                                          >
                                            <FiTrash2 aria-hidden="true" />
                                            삭제
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className={commentStyles.commentContent}>
                                    {isEditing ? (
                                      <div className={commentStyles.commentEditForm} onClick={stopMenuPropagation}>
                                        <textarea
                                          className={`${commentStyles.commentTextarea} ${
                                            hasEditingLengthError ? commentStyles.commentTextareaError : ''
                                          }`}
                                          name="comment-edit"
                                          value={editingContent}
                                          onChange={handleEditChange}
                                        />
                                        <div className={commentStyles.commentEditActions}>
                                          {hasEditingLengthError ? (
                                            <span className={commentStyles.commentError}>
                                              1,000자까지 입력 가능해요.
                                            </span>
                                          ) : null}
                                          <button
                                            type="button"
                                            className={commentStyles.commentCancelButton}
                                            onClick={handleEditCancel}
                                            disabled={isUpdating}
                                          >
                                            취소
                                          </button>
                                          <button
                                            type="button"
                                            className={
                                              editingContent.trim()
                                                ? `${commentStyles.commentButton} ${commentStyles.commentButtonActive}`
                                                : commentStyles.commentButton
                                            }
                                            disabled={!editingContent.trim() || isUpdating || hasEditingLengthError}
                                            onClick={() => handleEditSubmit(postId, comment.id)}
                                          >
                                            수정 완료
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <p className={commentStyles.commentBody}>
                                          {splitCommentMentions(comment.content).map((part, partIndex) =>
                                            part.type === 'mention' ? (
                                              <span
                                                key={`${part.value}-${partIndex}`}
                                                className={commentStyles.commentMention}
                                              >
                                                {part.value}
                                              </span>
                                            ) : (
                                              <Fragment key={`${part.value}-${partIndex}`}>{part.value}</Fragment>
                                            ),
                                          )}
                                        </p>
                                        <div className={styles.commentMetaRow}>
                                          <span className={styles.commentMetaItem}>
                                            <FiHeart aria-hidden="true" />
                                            {comment.likeCount.toLocaleString()}
                                          </span>
                                          <span className={styles.commentMetaItem}>
                                            <FiMessageCircle aria-hidden="true" />
                                            {comment.replyCount.toLocaleString()}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div
                              className={`${commentStyles.commentItem} ${styles.commentBox}`}
                              id={`comment-${comment.id}`}
                            >
                              <div className={commentStyles.commentInner}>
                                <div className={commentStyles.commentHeaderRow}>
                                  <div className={commentStyles.commentProfile}>
                                    <div className={commentStyles.commentAvatarGroup}>
                                      <span className={commentStyles.commentAvatar} aria-hidden="true">
                                        {profileAvatarUrl ? (
                                          <Image
                                            className={commentStyles.commentAvatarImage}
                                            src={profileAvatarUrl}
                                            alt=""
                                            width={30}
                                            height={30}
                                            sizes="30px"
                                            unoptimized
                                          />
                                        ) : (
                                          <FaUser />
                                        )}
                                      </span>
                                    </div>
                                    <div className={commentStyles.commentMeta}>
                                      <span className={commentStyles.commentAuthor}>
                                        ‘{postTitle}’에 {commentLabel}
                                      </span>
                                      <span className={commentStyles.commentDate}>{commentDate}</span>
                                    </div>
                                  </div>
                                  <div className={commentStyles.commentMoreWrapper}>
                                    <button
                                      type="button"
                                      className={commentStyles.commentMoreButton}
                                      aria-label="댓글 옵션"
                                      onClick={event => {
                                        stopMenuPropagation(event);
                                        handleCommentMenuToggle(comment.id);
                                      }}
                                    >
                                      <FiMoreHorizontal aria-hidden="true" />
                                    </button>
                                    {openCommentMenuId === comment.id ? (
                                      <div
                                        className={commentStyles.commentMoreMenu}
                                        role="menu"
                                        onClick={stopMenuPropagation}
                                      >
                                        <button
                                          type="button"
                                          className={commentStyles.commentMoreItem}
                                          role="menuitem"
                                          onClick={event => {
                                            stopMenuPropagation(event);
                                            handleEditStart(comment.id, comment.content);
                                          }}
                                        >
                                          <FiEdit2 aria-hidden="true" />
                                          수정
                                        </button>
                                        <button
                                          type="button"
                                          className={commentStyles.commentMoreItem}
                                          role="menuitem"
                                          disabled={isDeleting}
                                          onClick={event => {
                                            stopMenuPropagation(event);
                                            handleDeleteComment(postId, comment.id);
                                          }}
                                        >
                                          <FiTrash2 aria-hidden="true" />
                                          삭제
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                                <div className={commentStyles.commentContent}>
                                  {isEditing ? (
                                    <div className={commentStyles.commentEditForm} onClick={stopMenuPropagation}>
                                      <textarea
                                        className={`${commentStyles.commentTextarea} ${
                                          hasEditingLengthError ? commentStyles.commentTextareaError : ''
                                        }`}
                                        name="comment-edit"
                                        value={editingContent}
                                        onChange={handleEditChange}
                                      />
                                      <div className={commentStyles.commentEditActions}>
                                        {hasEditingLengthError ? (
                                          <span className={commentStyles.commentError}>1,000자까지 입력 가능해요.</span>
                                        ) : null}
                                        <button
                                          type="button"
                                          className={commentStyles.commentCancelButton}
                                          onClick={handleEditCancel}
                                          disabled={isUpdating}
                                        >
                                          취소
                                        </button>
                                        <button
                                          type="button"
                                          className={
                                            editingContent.trim()
                                              ? `${commentStyles.commentButton} ${commentStyles.commentButtonActive}`
                                              : commentStyles.commentButton
                                          }
                                          disabled={!editingContent.trim() || isUpdating || hasEditingLengthError}
                                          onClick={() => handleEditSubmit(postId, comment.id)}
                                        >
                                          수정 완료
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className={commentStyles.commentBody}>
                                        {splitCommentMentions(comment.content).map((part, partIndex) =>
                                          part.type === 'mention' ? (
                                            <span
                                              key={`${part.value}-${partIndex}`}
                                              className={commentStyles.commentMention}
                                            >
                                              {part.value}
                                            </span>
                                          ) : (
                                            <Fragment key={`${part.value}-${partIndex}`}>{part.value}</Fragment>
                                          ),
                                        )}
                                      </p>
                                      <div className={styles.commentMetaRow}>
                                        <span className={styles.commentMetaItem}>
                                          <FiHeart aria-hidden="true" />
                                          {comment.likeCount.toLocaleString()}
                                        </span>
                                        <span className={styles.commentMetaItem}>
                                          <FiMessageCircle aria-hidden="true" />
                                          {comment.replyCount.toLocaleString()}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.settingsRow}>
                    <span className={styles.settingsLabel}>남긴 댓글</span>
                    <div className={styles.settingsSortGroup}>
                      <button
                        type="button"
                        className={`${styles.settingsSortButton} ${styles.settingsSortButtonActive}`}
                        onClick={handleSortToggle}
                      >
                        {sortKey === 'popular' ? (
                          <>
                            <FiTrendingUp className={styles.settingsSortIcon} aria-hidden="true" />
                            인기순
                          </>
                        ) : (
                          <>
                            <FiClock className={styles.settingsSortIcon} aria-hidden="true" />
                            최신순
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className={styles.empty}>아직 남긴 댓글이 없습니다.</div>
                </>
              )
            ) : activeTab === 'likes' ? (
              <>
                <div className={styles.settingsRow}>
                  <span className={styles.settingsLabel}>좋아한 포스트</span>
                  <div className={styles.settingsSortGroup}>
                    <button
                      type="button"
                      className={`${styles.settingsSortButton} ${styles.settingsSortButtonActive}`}
                      onClick={handleSortToggle}
                    >
                      {sortKey === 'popular' ? (
                        <>
                          <FiTrendingUp className={styles.settingsSortIcon} aria-hidden="true" />
                          인기순
                        </>
                      ) : (
                        <>
                          <FiClock className={styles.settingsSortIcon} aria-hidden="true" />
                          최신순
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {sortedLikedPosts.length ? (
                  <ul className={styles.listView}>
                    {sortedLikedPosts.map((post, index) => (
                      <Fragment key={post.id}>
                        <li>
                          <Link className={styles.postLink} href={`/posts/${post.id}`}>
                            <article className={styles.listItem}>
                              <div className={styles.listBody}>
                                <div className={styles.listHeaderRow}>
                                  <h3>{post.title || '제목 없음'}</h3>
                                </div>
                                <p className={styles.summary}>{formatSummary(post.content)}</p>
                                <div className={styles.meta}>
                                  <span className={styles.metaGroup}>
                                    <span className={styles.metaItem}>
                                      <CiCalendar aria-hidden="true" />{' '}
                                      {formatDateLabel(post.publishedAt ?? post.createdAt)}
                                    </span>
                                  </span>
                                  <span className={styles.metaGroup}>
                                    <span className={styles.metaItem}>
                                      <FiEye aria-hidden="true" /> {post.viewCount.toLocaleString()}
                                    </span>
                                    <span className={styles.separator} aria-hidden="true">
                                      |
                                    </span>
                                    <span className={styles.metaItem}>
                                      <FiHeart aria-hidden="true" /> {post.likeCount.toLocaleString()}
                                    </span>
                                    <span className={styles.separator} aria-hidden="true">
                                      |
                                    </span>
                                    <span className={styles.metaItem}>
                                      <FiMessageCircle aria-hidden="true" /> {post.commentCount.toLocaleString()}
                                    </span>
                                  </span>
                                </div>
                              </div>
                              {post.thumbnailUrl ? (
                                <div
                                  className={styles.listThumb}
                                  style={{ backgroundImage: `url(${post.thumbnailUrl})` }}
                                  aria-hidden="true"
                                />
                              ) : null}
                            </article>
                          </Link>
                        </li>
                        {index < sortedLikedPosts.length - 1 ? (
                          <li className={styles.listDividerItem} aria-hidden="true">
                            <div className={styles.listDivider} />
                          </li>
                        ) : null}
                      </Fragment>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.empty}>아직 좋아요한 게시물이 없습니다.</div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
