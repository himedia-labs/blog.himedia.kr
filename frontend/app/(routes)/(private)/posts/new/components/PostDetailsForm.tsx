import { IoIosArrowDown, IoMdCheckmark } from 'react-icons/io';

import styles from '../PostCreate.module.css';

import type { PostDetailsFormProps } from '@/app/shared/types/post';

/**
 * 게시물 상세 폼
 * @description 카테고리, 태그 입력 영역을 렌더링
 */
export default function PostDetailsForm({ category, tag }: PostDetailsFormProps) {
  // 카테고리
  const { categoryId, categories, isLoading, onCategoryChange } = category;

  // 태그
  const {
    tagInput,
    tags,
    tagLengthError,
    hasTagSuggestions,
    tagSuggestions,
    onTagChange,
    onTagKeyDown,
    onTagBlur,
    onTagCompositionStart,
    onTagCompositionEnd,
    onRemoveTag,
    onTagSuggestionMouseDown,
  } = tag;

  return (
    <>
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
              onChange={onCategoryChange}
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
          <label className={styles.metaLabel} htmlFor="post-tags">
            태그
          </label>
          <div className={`${styles.metaControl} ${styles.tagInput} ${tagLengthError ? styles.tagInputError : ''}`}>
            {tags.map(tag => (
              <button
                key={tag}
                type="button"
                className={styles.tagChip}
                onClick={() => onRemoveTag(tag)}
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
              onChange={onTagChange}
              onKeyDown={onTagKeyDown}
              onBlur={onTagBlur}
              onCompositionStart={onTagCompositionStart}
              onCompositionEnd={onTagCompositionEnd}
            />
          </div>
          {hasTagSuggestions ? (
            <div className={styles.tagSuggestions} role="listbox" aria-label="태그 추천">
              {tagSuggestions.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  className={styles.tagSuggestionItem}
                  onMouseDown={onTagSuggestionMouseDown(tag.name)}
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
      </div>
    </>
  );
}
