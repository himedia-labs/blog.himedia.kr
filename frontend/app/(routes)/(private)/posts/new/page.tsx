'use client';

import { useState } from 'react';
import Link from 'next/link';

import { RiTwitterXFill } from 'react-icons/ri';
import { RxWidth } from 'react-icons/rx';
import { IoIosArrowDown, IoMdCheckmark } from 'react-icons/io';
import { FaFacebookSquare, FaGithub, FaLinkedin } from 'react-icons/fa';
import {
  FiCheck,
  FiEye,
  FiHeart,
  FiMail,
  FiMenu,
  FiMessageCircle,
  FiSave,
  FiTag,
  FiX,
} from 'react-icons/fi';
import {
  HiOutlineBold,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCodeBracket,
  HiOutlineH1,
  HiOutlineH2,
  HiOutlineH3,
  HiOutlineItalic,
  HiOutlineLink,
  HiOutlineListBullet,
  HiOutlineNumberedList,
  HiOutlinePhoto,
  HiOutlineStrikethrough,
  HiOutlineUnderline,
} from 'react-icons/hi2';

import { formatDateLabel, renderMarkdownPreview } from './postCreate.utils';
import usePostCreateForm, { usePostCreatePage } from './postCreate.hooks';

import styles from './PostCreate.module.css';

export default function PostCreatePage() {
  const { state, derived, data, handlers } = usePostCreateForm();
  const { title, categoryId, thumbnailUrl, content, tagInput, tags, tagLengthError, titleLengthError } = state;
  const { categoryName, dateLabel, previewStats, authorName, draftButtonTitle, hasTagSuggestions } = derived;
  const { categories, isLoading, tagSuggestions, draftList } = data;
  const {
    handleTitleChange,
    handleCategoryChange,
    handleThumbnailChange,
    handleContentChange,
    setContentValue,
    handleRemoveTag,
    handleTagKeyDown,
    handleTagChange,
    handleTagBlur,
    handleTagCompositionStart,
    handleTagCompositionEnd,
    handleTagSuggestionMouseDown,
    saveDraft,
    handleSave,
  } = handlers;
  const {
    refs: { splitRef, contentRef, imageInputRef },
    split: { value: splitLeft, min: splitMin, max: splitMax, handlers: splitHandlers },
    editor: {
      applyInlineWrap,
      applyCode,
      applyLink,
      handleHeadingClick,
      handleQuoteClick,
      handleBulletClick,
      handleNumberedClick,
      handleImageClick,
      handleImageSelect,
    },
  } = usePostCreatePage({ content, setContentValue });
  const [isDraftSidebarOpen, setIsDraftSidebarOpen] = useState(false);
  const draftItems = draftList?.items ?? [];
  const handleOpenDrafts = () => setIsDraftSidebarOpen(true);
  const handleCloseDrafts = () => setIsDraftSidebarOpen(false);

  return (
    <section className={styles.container} aria-label="게시물 작성">
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.headerTitle}>새 게시물 작성</h1>
          <p className={styles.headerDescription}>카테고리와 태그를 설정하고 내용을 작성하세요.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.headerAction}
            aria-label="임시저장 목록 열기"
            title="임시저장 목록"
            onClick={handleOpenDrafts}
          >
            <FiMenu aria-hidden />
          </button>
        </div>
      </header>
      <div
        className={styles.draftSidebarBackdrop}
        data-open={isDraftSidebarOpen ? 'true' : 'false'}
        onClick={handleCloseDrafts}
        aria-hidden="true"
      />
      <aside
        className={styles.draftSidebar}
        data-open={isDraftSidebarOpen ? 'true' : 'false'}
        aria-label="임시저장 목록"
        aria-hidden={isDraftSidebarOpen ? 'false' : 'true'}
      >
        <div className={styles.draftSidebarHeader}>
          <h2 className={styles.draftSidebarTitle}>임시저장 목록</h2>
          <button
            type="button"
            className={styles.draftSidebarClose}
            aria-label="임시저장 목록 닫기"
            onClick={handleCloseDrafts}
          >
            <FiX aria-hidden />
          </button>
        </div>
        <div className={styles.draftSidebarList}>
          {draftItems.length > 0 ? (
            draftItems.map(draft => (
              <Link
                key={draft.id}
                href={`/posts/new?draftId=${draft.id}`}
                className={styles.draftSidebarItem}
                onClick={handleCloseDrafts}
              >
                <span className={styles.draftSidebarItemTitle}>{draft.title?.trim() || '제목 없음'}</span>
                <span className={styles.draftSidebarItemMeta}>
                  <span>{draft.category?.name ?? '미지정'}</span>
                  <span>•</span>
                  <span>{formatDateLabel(new Date(draft.createdAt))}</span>
                </span>
              </Link>
            ))
          ) : (
            <p className={styles.draftSidebarEmpty}>임시저장된 게시물이 없습니다.</p>
          )}
        </div>
      </aside>
      <div className={styles.split} ref={splitRef}>
        <form className={styles.form}>
          <label className={styles.srOnly} htmlFor="post-title">
            제목
          </label>
          <input
            id="post-title"
            className={`${styles.titleInput} ${titleLengthError ? styles.titleInputError : ''}`}
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={handleTitleChange}
          />

          <div className={styles.metaRow}>
            <div className={styles.metaField}>
              <label className={styles.metaLabel} htmlFor="post-category">
                카테고리
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="post-category"
                  className={styles.metaControl}
                  value={categoryId}
                  onChange={handleCategoryChange}
                  disabled={isLoading}
                >
                  <option value="">카테고리를 선택하세요</option>
                  {(categories ?? []).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <IoIosArrowDown className={styles.selectIcon} aria-hidden />
              </div>
            </div>

            <div className={styles.metaField}>
              <label className={styles.metaLabel} htmlFor="post-thumbnail">
                썸네일 URL
              </label>
              <input
                id="post-thumbnail"
                className={styles.metaControl}
                type="url"
                placeholder="https://"
                value={thumbnailUrl}
                onChange={handleThumbnailChange}
              />
            </div>
          </div>

          <div className={styles.metaField}>
            <label className={styles.metaLabel} htmlFor="post-tags">
              태그
            </label>
            <div className={`${styles.metaControl} ${styles.tagInput} ${tagLengthError ? styles.tagInputError : ''}`}>
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={styles.tagChip}
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`태그 삭제: ${tag}`}
                >
                  #{tag}
                </button>
              ))}
              <input
                id="post-tags"
                className={styles.tagInputField}
                type="text"
                placeholder="태그 입력 후 스페이스/엔터"
                value={tagInput}
                onChange={handleTagChange}
                onKeyDown={handleTagKeyDown}
                onBlur={handleTagBlur}
                onCompositionStart={handleTagCompositionStart}
                onCompositionEnd={handleTagCompositionEnd}
              />
            </div>
            {hasTagSuggestions ? (
              <div className={styles.tagSuggestions} role="listbox" aria-label="태그 추천">
                {tagSuggestions.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    className={styles.tagSuggestionItem}
                    onMouseDown={handleTagSuggestionMouseDown(tag.name)}
                  >
                    <span className={styles.tagSuggestionName}>#{tag.name}</span>
                    <span className={styles.tagSuggestionCount}>게시물 {tag.postCount.toLocaleString()}개</span>
                    <span className={styles.tagSuggestionIcon} aria-hidden="true">
                      <IoMdCheckmark />
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.headingToolbar} role="group" aria-label="서식 도구">
            <button
              type="button"
              className={styles.headingButton}
              aria-label="제목 1"
              title="제목 1"
              onClick={handleHeadingClick(1)}
            >
              <HiOutlineH1 aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.headingButton}
              aria-label="제목 2"
              title="제목 2"
              onClick={handleHeadingClick(2)}
            >
              <HiOutlineH2 aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.headingButton}
              aria-label="제목 3"
              title="제목 3"
              onClick={handleHeadingClick(3)}
            >
              <HiOutlineH3 aria-hidden="true" />
            </button>
            <span className={styles.headingSeparator} aria-hidden="true">
              |
            </span>
            <button
              type="button"
              className={styles.headingButton}
              aria-label="굵게"
              title="굵게"
              onClick={() => applyInlineWrap('**')}
            >
              <HiOutlineBold aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.headingButton}
              aria-label="기울임"
              title="기울임"
              onClick={() => applyInlineWrap('_')}
            >
              <HiOutlineItalic aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.headingButton}
              aria-label="밑줄"
              title="밑줄"
              onClick={() => applyInlineWrap('<u>', '</u>')}
            >
              <HiOutlineUnderline aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.headingButton}
              aria-label="취소선"
              title="취소선"
              onClick={() => applyInlineWrap('~~')}
            >
              <HiOutlineStrikethrough aria-hidden="true" />
            </button>
            <span className={styles.headingSeparator} aria-hidden="true">
              |
            </span>
            <button
              type="button"
              className={styles.headingButton}
              aria-label="인용"
              title="인용"
              onClick={handleQuoteClick}
            >
              <HiOutlineChatBubbleLeftRight aria-hidden="true" />
            </button>
            <button type="button" className={styles.headingButton} aria-label="코드" title="코드" onClick={applyCode}>
              <HiOutlineCodeBracket aria-hidden="true" />
            </button>
            <span className={styles.headingSeparator} aria-hidden="true">
              |
            </span>
            <button type="button" className={styles.headingButton} aria-label="링크" title="링크" onClick={applyLink}>
              <HiOutlineLink aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.headingButton}
              aria-label="이미지"
              title="이미지"
              onClick={handleImageClick}
            >
              <HiOutlinePhoto aria-hidden="true" />
            </button>
            <span className={styles.headingSeparator} aria-hidden="true">
              |
            </span>
            <button
              type="button"
              className={styles.headingButton}
              aria-label="불릿 리스트"
              title="불릿 리스트"
              onClick={handleBulletClick}
            >
              <HiOutlineListBullet aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.headingButton}
              aria-label="번호 리스트"
              title="번호 리스트"
              onClick={handleNumberedClick}
            >
              <HiOutlineNumberedList aria-hidden="true" />
            </button>
          </div>
          <input
            ref={imageInputRef}
            className={styles.srOnly}
            type="file"
            accept="image/*"
            aria-label="이미지 파일 선택"
            onChange={handleImageSelect}
          />
          <div className={styles.contentHeader} aria-hidden="true" />

          <label className={styles.srOnly} htmlFor="post-content">
            본문
          </label>
          <textarea
            id="post-content"
            className={styles.editor}
            placeholder="본문 내용을 입력하세요"
            value={content}
            ref={contentRef}
            onChange={handleContentChange}
          />
        </form>

        <div
          className={styles.splitHandle}
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={splitMin}
          aria-valuemax={splitMax}
          aria-valuenow={Math.round(splitLeft)}
          onPointerDown={splitHandlers.handlePointerDown}
          onPointerMove={splitHandlers.handlePointerMove}
          onPointerUp={splitHandlers.handlePointerUp}
          onPointerCancel={splitHandlers.handlePointerUp}
        >
          <span className={styles.splitHandleIcon} aria-hidden="true">
            <RxWidth />
          </span>
        </div>

        <aside className={styles.preview} aria-label="게시물 미리보기">
          <article className={styles.previewCard}>
            <div className={styles.previewHeadingBlock}>
              <div className={styles.previewTitleRow}>
                <h2 className={styles.previewTitle}>
                  {title || '제목이 여기에 표시됩니다'}
                  {categoryName ? <span className={styles.previewCategoryInline}>({categoryName})</span> : null}
                </h2>
              </div>
              <div className={styles.previewMeta}>
                <span className={styles.previewMetaGroup}>
                  <span className={styles.previewMetaItem}>{authorName}</span>
                  <span className={styles.previewMetaSeparator} aria-hidden="true">
                    |
                  </span>
                  <span className={styles.previewMetaItem}>{dateLabel}</span>
                </span>
                <span className={styles.previewMetaGroup}>
                  <span className={styles.previewMetaItem}>
                    <FiEye aria-hidden="true" /> {previewStats.views.toLocaleString()}
                  </span>
                  <span className={styles.previewMetaSeparator} aria-hidden="true">
                    |
                  </span>
                  <span className={styles.previewMetaItem}>
                    <FiHeart aria-hidden="true" /> {previewStats.likeCount.toLocaleString()}
                  </span>
                  <span className={styles.previewMetaSeparator} aria-hidden="true">
                    |
                  </span>
                  <span className={styles.previewMetaItem}>
                    <FiMessageCircle aria-hidden="true" /> {previewStats.commentCount.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
            <div className={styles.previewDivider} aria-hidden="true" />
            <div
              className={styles.previewThumb}
              style={thumbnailUrl ? { backgroundImage: `url(${thumbnailUrl})` } : undefined}
              data-empty={!thumbnailUrl}
            >
              {!thumbnailUrl && '썸네일 미리보기'}
            </div>
            <div className={styles.previewContent}>
              {content ? (
                renderMarkdownPreview(content)
              ) : (
                <p className={styles.previewSummary}>본문을 입력하면 요약이 여기에 표시됩니다.</p>
              )}
            </div>
            {tags.length > 0 ? (
              <div className={styles.previewTags}>
                <span className={styles.previewTagIcon} aria-hidden="true">
                  <FiTag />
                </span>
                {tags.map(tag => (
                  <span key={tag} className={styles.previewTag}>
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div className={styles.previewActionsRow}>
              <span className={styles.previewMetaActions}>
                <span className={styles.previewMetaAction} role="img" aria-label="이메일">
                  <FiMail aria-hidden="true" />
                </span>
                <span className={styles.previewMetaAction} role="img" aria-label="깃허브">
                  <FaGithub aria-hidden="true" />
                </span>
                <span className={styles.previewMetaAction} role="img" aria-label="트위터">
                  <RiTwitterXFill aria-hidden="true" />
                </span>
                <span className={styles.previewMetaAction} role="img" aria-label="페이스북">
                  <FaFacebookSquare aria-hidden="true" />
                </span>
                <span className={styles.previewMetaAction} role="img" aria-label="링크드인">
                  <FaLinkedin aria-hidden="true" />
                </span>
              </span>
            </div>
          </article>
        </aside>
      </div>
      <footer className={styles.actionFooter} aria-label="작성 actions">
        <button type="button" className={styles.actionButton} onClick={saveDraft}>
          임시저장
        </button>
        <button type="button" className={styles.actionButton} onClick={handleSave}>
          저장
        </button>
      </footer>
    </section>
  );
}
