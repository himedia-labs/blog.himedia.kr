'use client';

import { useMemo } from 'react';

import { FiSend } from 'react-icons/fi';
import { RxWidth } from 'react-icons/rx';
import { useParams, useRouter } from 'next/navigation';

import { usePostDetailQuery } from '@/app/api/posts/posts.queries';
import { useCategoriesQuery } from '@/app/api/categories/categories.queries';
import { createEditPreview } from '@/app/(routes)/(private)/posts/edit/[postId]/utils';
import { createExitHandler } from '@/app/(routes)/(private)/posts/edit/[postId]/handlers';
import { EditorToolbar, PostPreview, PostDetailsForm } from '@/app/(routes)/(private)/posts/new/components';
import { usePostEditInitializer, usePostEditSaver } from '@/app/(routes)/(private)/posts/edit/[postId]/hooks';
import { useMarkdownEditor, usePostForm, useTagInput } from '@/app/(routes)/(private)/posts/new/hooks';

import styles from '@/app/(routes)/(private)/posts/new/PostCreate.module.css';
import markdownEditorStyles from '@/app/shared/components/markdown-editor/markdownEditor.module.css';

/**
 * 게시물 수정 페이지
 * @description 기존 게시물을 불러와 수정 화면을 제공
 */
export default function PostEditPage() {
  // 라우트 훅
  const router = useRouter();
  const params = useParams<{ postId: string }>();
  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId;

  // 상세 조회
  const { data: postDetail, isLoading } = usePostDetailQuery(postId, { enabled: Boolean(postId) });

  // 기본 폼
  const { state: formState, setters: formSetters, handlers: formHandlers } = usePostForm();
  const { title, categoryId, content, titleLengthError } = formState;
  const { setContent } = formSetters;
  const { applyPartial, handleTitleChange, handleCategoryChange, handleContentChange } = formHandlers;

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

  // 저장 처리
  const { handlePostUpdate } = usePostEditSaver({
    postId,
    formData: { title, categoryId, content, tags },
  });

  // 데이터 적용
  usePostEditInitializer({ postDetail, applyPartial, setTags });

  // 카테고리 목록
  const { data: categories, isLoading: isCategoryLoading } = useCategoriesQuery();

  // 미리보기 데이터
  const { authorName, categoryName, dateLabel, previewStats, previewContent } = useMemo(
    () =>
      createEditPreview({
        categories,
        categoryId,
        content,
      }),
    [categories, categoryId, content],
  );
  const authorStats = {
    postCount: postDetail?.author?.postCount ?? 0,
    followerCount: postDetail?.author?.followerCount ?? 0,
    followingCount: postDetail?.author?.followingCount ?? 0,
  };

  if (!postDetail && !isLoading) {
    return (
      <section className={styles.container} aria-label="게시물 수정">
        <p className={styles.previewSummary}>게시글을 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className={styles.container} aria-label="게시물 수정">
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.headerTitle}>게시물 수정</h1>
          <p className={styles.headerDescription}>내용을 수정하고 저장하세요.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.headerAction} ${styles.headerActionText}`}
            aria-label="수정하기"
            title="수정하기"
            onClick={handlePostUpdate}
          >
            <span>수정하기</span>
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
              isLoading: isCategoryLoading,
              onCategoryChange: handleCategoryChange,
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
            authorStats={authorStats}
            previewStats={previewStats}
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
          onClick={createExitHandler(router, postId)}
        >
          <span>나가기</span>
        </button>
        <button type="button" className={styles.actionButton} onClick={handlePostUpdate}>
          <span>저장하기</span>
        </button>
      </footer>
    </section>
  );
}
