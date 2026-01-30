import { useRef } from 'react';

import { useSplitView } from '@/app/(routes)/(private)/posts/new/hooks/useSplitView';
import { useMarkdownImageUpload } from '@/app/(routes)/(private)/posts/new/hooks/useMarkdownImageUpload';

import type { MarkdownEditorParams } from '@/app/shared/types/post';

/**
 * 마크다운 에디터 훅
 * @description 마크다운 문법/이미지/분할 뷰 동작을 통합 제공
 */
export const useMarkdownEditor = (params: MarkdownEditorParams) => {
  const { content, setContentValue } = params;
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    refs: { splitRef },
    split: splitState,
  } = useSplitView();

  // 본문과 커서 위치를 함께 갱신
  const setContentAndSelection = (nextValue: string, selectionStart: number, selectionEnd = selectionStart) => {
    setContentValue(nextValue);
    window.requestAnimationFrame(() => {
      const textarea = contentRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  // 인라인 마크다운 감싸기 적용
  const applyInlineWrap = (before: string, after = before) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = content.slice(start, end);
    const nextValue = content.slice(0, start) + before + selected + after + content.slice(end);
    const nextStart = start + before.length;
    const nextEnd = selected ? nextStart + selected.length : nextStart;
    setContentAndSelection(nextValue, nextStart, nextEnd);
  };

  // 라인 단위 프리픽스 적용
  const applyLinePrefix = (prefix: string, options?: { numbered?: boolean }) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const lineStart = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const lineEndIndex = content.indexOf('\n', end);
    const blockEnd = lineEndIndex === -1 ? content.length : lineEndIndex;
    const block = content.slice(lineStart, blockEnd);
    const lines = block.split('\n');
    const prefixes = lines.map((_, index) => (options?.numbered ? `${index + 1}. ` : prefix));
    const nextBlock = lines.map((line, index) => `${prefixes[index]}${line}`).join('\n');
    const nextValue = content.slice(0, lineStart) + nextBlock + content.slice(blockEnd);
    const prefixLengths = prefixes.map(item => item.length);
    const getLineIndex = (pos: number) => content.slice(lineStart, pos).split('\n').length - 1;
    const sumPrefixLength = (lineIndex: number) =>
      prefixLengths.slice(0, lineIndex + 1).reduce((sum, length) => sum + length, 0);
    const nextStart = start >= lineStart && start <= blockEnd ? start + sumPrefixLength(getLineIndex(start)) : start;
    const nextEnd = end >= lineStart && end <= blockEnd ? end + sumPrefixLength(getLineIndex(end)) : end;
    setContentAndSelection(nextValue, nextStart, nextEnd);
  };

  // 코드 인라인/블록 적용
  const applyCode = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = content.slice(start, end);

    if (selected.includes('\n')) {
      const before = '```\n';
      const after = '\n```';
      const nextValue = content.slice(0, start) + before + selected + after + content.slice(end);
      const nextStart = start + before.length;
      const nextEnd = nextStart + selected.length;
      setContentAndSelection(nextValue, nextStart, nextEnd);
      return;
    }

    applyInlineWrap('`');
  };

  // 링크 마크다운 적용
  const applyLink = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = content.slice(start, end);

    if (selected) {
      const prefix = '[';
      const suffix = ']()';
      const nextValue = content.slice(0, start) + prefix + selected + suffix + content.slice(end);
      const cursor = start + prefix.length + selected.length + suffix.length - 1;
      setContentAndSelection(nextValue, cursor, cursor);
      return;
    }

    const snippet = '[텍스트](링크)';
    const nextValue = content.slice(0, start) + snippet + content.slice(end);
    const textStart = start + 1;
    const textEnd = textStart + '텍스트'.length;
    setContentAndSelection(nextValue, textStart, textEnd);
  };

  const {
    refs: { imageInputRef },
    handlers: { handleImageClick, handleImagePaste, handleImageSelect },
  } = useMarkdownImageUpload({ content, contentRef, setContentValue, setContentAndSelection });

  // 제목 마크다운 적용
  const handleHeadingClick = (level: 1 | 2 | 3) => applyLinePrefix(`${'#'.repeat(level)} `);
  // 인용 마크다운 적용
  const handleQuoteClick = () => applyLinePrefix('> ');
  // 불릿 리스트 마크다운 적용
  const handleBulletClick = () => applyLinePrefix('- ');
  // 번호 리스트 마크다운 적용
  const handleNumberedClick = () => applyLinePrefix('', { numbered: true });

  // 본문 서식 핸들러 묶음
  const editorHandlers = {
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
  };

  return {
    refs: {
      splitRef,
      contentRef,
      imageInputRef,
    },
    split: {
      value: splitState.value,
      min: splitState.min,
      max: splitState.max,
      handlers: splitState.handlers,
    },
    editor: editorHandlers,
  };
};
