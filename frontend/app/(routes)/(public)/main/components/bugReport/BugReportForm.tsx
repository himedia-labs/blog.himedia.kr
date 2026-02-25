'use client';

import styles from './BugReportForm.module.css';

import type { KeyboardEvent, RefObject } from 'react';

type NoticeAttachment = {
  name: string;
  url: string;
};

type BugReportFormProps = {
  noticeTitle: string;
  noticeContent: string;
  noticeAttachments: NoticeAttachment[];
  isNoticeImageUploading: boolean;
  noticeTitleMaxLength: number;
  noticeContentMaxLength: number;
  noticeImageInputRef: RefObject<HTMLInputElement | null>;
  onTitleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onTitleChange: (value: string) => void;
  onContentKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onContentChange: (value: string) => void;
  onClickImageUpload: () => void;
  onSelectImageFiles: (files: FileList | null) => void;
  onRemoveAllAttachments: () => void;
  onRemoveAttachment: (targetUrl: string) => void;
};

/**
 * 버그 제보 폼
 * @description 모달 내부 입력/첨부 UI를 렌더링
 */
export default function BugReportForm(props: BugReportFormProps) {
  const {
    noticeTitle,
    noticeContent,
    noticeAttachments,
    isNoticeImageUploading,
    noticeTitleMaxLength,
    noticeContentMaxLength,
    noticeImageInputRef,
    onTitleKeyDown,
    onTitleChange,
    onContentKeyDown,
    onContentChange,
    onClickImageUpload,
    onSelectImageFiles,
    onRemoveAllAttachments,
    onRemoveAttachment,
  } = props;

  return (
    <div className={styles.noticeModalBody}>
      <div className={styles.noticeFormStack}>
        <label className={styles.noticeField}>
          <span className={styles.noticeLabel}>제목</span>
          <input
            type="text"
            value={noticeTitle}
            className={styles.noticeInput}
            placeholder="제목을 입력하세요"
            maxLength={noticeTitleMaxLength}
            onKeyDown={onTitleKeyDown}
            onChange={event => onTitleChange(event.target.value)}
          />
          <span className={styles.noticeCount}>
            {noticeTitle.length}/{noticeTitleMaxLength}
          </span>
        </label>
        <label className={styles.noticeField}>
          <span className={styles.noticeLabel}>내용</span>
          <textarea
            value={noticeContent}
            className={styles.noticeTextarea}
            placeholder="내용을 입력하세요"
            maxLength={noticeContentMaxLength}
            onKeyDown={onContentKeyDown}
            onChange={event => onContentChange(event.target.value)}
          />
          <div className={styles.noticeMetaRow}>
            <div className={styles.noticeImageRow}>
              <button
                type="button"
                className={styles.noticeImageButton}
                onClick={onClickImageUpload}
                disabled={isNoticeImageUploading || noticeAttachments.length >= 3}
              >
                {isNoticeImageUploading ? '업로드 중...' : '이미지 첨부'}
              </button>
              {noticeAttachments.length ? (
                <button type="button" className={styles.noticeImageResetButton} onClick={onRemoveAllAttachments}>
                  전체 제거
                </button>
              ) : null}
              <input
                ref={noticeImageInputRef}
                type="file"
                accept="image/*"
                multiple
                className={styles.noticeImageInput}
                onChange={event => onSelectImageFiles(event.target.files)}
              />
            </div>
            <span className={styles.noticeCount}>
              {noticeContent.length}/{noticeContentMaxLength}
            </span>
          </div>
        </label>
      </div>
      {noticeAttachments.length ? (
        <ul className={styles.noticeFileList} aria-label="첨부 파일 목록">
          {noticeAttachments.map(item => (
            <li key={item.url} className={styles.noticeFileItem}>
              <span className={styles.noticeFileName}>{item.name}</span>
              <button
                type="button"
                className={styles.noticeFileRemoveButton}
                onClick={() => onRemoveAttachment(item.url)}
                aria-label={`${item.name} 첨부 제거`}
              >
                X
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
