'use client';

import { useCallback, useMemo } from 'react';

import { useRouter } from 'next/navigation';
import { CiImport } from 'react-icons/ci';
import { FiSend } from 'react-icons/fi';
import { RxWidth } from 'react-icons/rx';

import { useCategoriesQuery } from '@/app/api/categories/categories.queries';
import {
  DEFAULT_AUTHOR_NAME,
  DEFAULT_CATEGORY_LABEL,
  DEFAULT_PREVIEW_STATS,
} from '@/app/shared/constants/config/post.config';
import markdownEditorStyles from '@/app/shared/styles/markdownEditor.module.css';

import { EditorToolbar, PostPreview, PostDetailsForm } from './components';
import { formatDateLabel, renderMarkdownPreview } from '@/app/(routes)/(private)/posts/new/utils';
import { usePostForm, useTagInput, useThumbnailUpload, useDraftManager, useMarkdownEditor } from './hooks';

import styles from './PostCreate.module.css';
import type { DraftData } from '@/app/shared/types/post';

/**
 * 게시물 작성 페이지
 * @description 작성 폼과 미리보기를 제공
 */
export default function PostCreatePage() {
  // 라우트 훅
  const router = useRouter();

  // 기본 폼 상태
  const { state: formState, setters: formSetters, handlers: formHandlers } = usePostForm();
  const { title, categoryId, thumbnailUrl, content, titleLengthError } = formState;
  const { setContent, setThumbnailUrl } = formSetters;
  const { applyPartial, handleTitleChange, handleCategoryChange, handleThumbnailChange, handleContentChange } =
    formHandlers;

  // 태그 입력
  const { state: tagState, data: tagData, setters: tagSetters, handlers: tagHandlers } = useTagInput();
  const { tagInput, tags, tagLengthError, hasTagSuggestions } = tagState;
  const { tagSuggestions } = tagData;
  const { setTags } = tagSetters;
  const {
    handleTagKeyDown,
    handleTagChange,
    handleTagBlur,
    handleTagCompositionStart,
    handleTagCompositionEnd,
    handleTagSuggestionMouseDown,
    handleRemoveTag,
  } = tagHandlers;

  // 썸네일 업로드
  const {
    refs: { thumbnailInputRef },
    state: { isThumbnailUploading },
    handlers: { handleThumbnailFileClick, handleThumbnailFileSelect },
  } = useThumbnailUpload(setThumbnailUrl);

  const applyDraftData = useCallback(
    (data: Partial<DraftData>) => {
      applyPartial(data);
      if (data.tags !== undefined) setTags(data.tags);
    },
    [applyPartial, setTags],
  );

  // Draft 관리
  const {
    data: { draftList },
    handlers: { saveDraft, publishPost, openDraftList },
  } = useDraftManager({ title, categoryId, thumbnailUrl, content, tags }, applyDraftData);

  // 마크다운 에디터
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
      handleImagePaste,
      handleImageSelect,
    },
  } = useMarkdownEditor({ content, setContentValue: setContent });

  // 카테고리 목록
  const { data: categories, isLoading } = useCategoriesQuery();

  // 미리보기 데이터
  const categoryName = categories?.find(category => String(category.id) === categoryId)?.name ?? DEFAULT_CATEGORY_LABEL;
  const dateLabel = formatDateLabel(new Date());
  const previewStats = DEFAULT_PREVIEW_STATS;
  const authorName = DEFAULT_AUTHOR_NAME;
  const draftCount = draftList?.items?.length ?? 0;
  const previewContent = useMemo(() => renderMarkdownPreview(content), [content]);

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
            className={`${styles.headerAction} ${styles.headerActionText}`}
            aria-label="게시하기"
            title="게시하기"
            onClick={publishPost}
          >
            <span>게시하기</span>
            <FiSend aria-hidden />
          </button>
        </div>
      </header>
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

          <PostDetailsForm
            category={{
              categoryId,
              categories,
              isLoading,
              onCategoryChange: handleCategoryChange,
            }}
            thumbnail={{
              thumbnailUrl,
              thumbnailInputRef,
              isThumbnailUploading,
              onThumbnailChange: handleThumbnailChange,
              onThumbnailFileClick: handleThumbnailFileClick,
              onThumbnailFileSelect: handleThumbnailFileSelect,
            }}
            tag={{
              tagInput,
              tags,
              tagLengthError,
              hasTagSuggestions,
              tagSuggestions,
              onTagChange: handleTagChange,
              onTagKeyDown: handleTagKeyDown,
              onTagBlur: handleTagBlur,
              onTagCompositionStart: handleTagCompositionStart,
              onTagCompositionEnd: handleTagCompositionEnd,
              onRemoveTag: handleRemoveTag,
              onTagSuggestionMouseDown: handleTagSuggestionMouseDown,
            }}
          />

          <div className={markdownEditorStyles.editorBox}>
            <EditorToolbar
              onHeading={handleHeadingClick}
              onBold={() => applyInlineWrap('**')}
              onItalic={() => applyInlineWrap('_')}
              onUnderline={() => applyInlineWrap('<u>', '</u>')}
              onStrike={() => applyInlineWrap('~~')}
              onQuote={handleQuoteClick}
              onCode={applyCode}
              onLink={applyLink}
              onImage={handleImageClick}
              onBullet={handleBulletClick}
              onNumbered={handleNumberedClick}
            />
            <input
              ref={imageInputRef}
              className={markdownEditorStyles.srOnly}
              type="file"
              accept="image/*"
              aria-label="이미지 파일 선택"
              onChange={handleImageSelect}
            />
            <label className={markdownEditorStyles.srOnly} htmlFor="post-content">
              본문
            </label>
            <textarea
              id="post-content"
              className={markdownEditorStyles.editor}
              placeholder="본문 내용을 입력하세요"
              value={content}
              ref={contentRef}
              onPaste={handleImagePaste}
              onChange={handleContentChange}
            />
          </div>
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
          <PostPreview
            title={title}
            categoryName={categoryName}
            authorName={authorName}
            dateLabel={dateLabel}
            previewStats={previewStats}
            thumbnailUrl={thumbnailUrl}
            content={
              content ? (
                previewContent
              ) : (
                <p className={styles.previewSummary}>본문을 입력하면 요약이 여기에 표시됩니다.</p>
              )
            }
            tags={tags}
          />
        </aside>
      </div>
      <footer className={styles.actionFooter}>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.actionButtonExit}`}
          onClick={() => router.push('/')}
        >
          <span>나가기</span>
        </button>
        <button
          type="button"
          className={styles.actionButton}
          aria-label={`임시저장 ${draftCount}개`}
          title="임시저장"
          onClick={() => saveDraft()}
        >
          <span>저장하기</span>
          <span className={styles.footerDivider} aria-hidden="true">
            |
          </span>
          <span className={styles.footerCount}>{draftCount}</span>
        </button>
        <button type="button" className={styles.actionButton} onClick={openDraftList}>
          <span>불러오기</span>
          <CiImport aria-hidden="true" />
        </button>
      </footer>
    </section>
  );
}
