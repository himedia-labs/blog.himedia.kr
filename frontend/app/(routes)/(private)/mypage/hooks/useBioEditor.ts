import { useEffect, useMemo, useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { authKeys } from '@/app/api/auth/auth.keys';
import { useUpdateProfileBioMutation } from '@/app/api/auth/auth.mutations';
import { uploadsApi } from '@/app/api/uploads/uploads.api';
import { useToast } from '@/app/shared/components/toast/toast';
import { renderMarkdownPreview } from '@/app/shared/utils/markdownPreview';

import type { ChangeEvent } from 'react';

/**
 * 마이페이지 자기소개 훅
 * @description 자기소개 편집/미리보기/저장을 관리
 */
export const useBioEditor = (userBio: string) => {
  // ref 변수들
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { mutateAsync: updateMyBio, isPending: isBioUpdating } = useUpdateProfileBioMutation();
  const bioEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const bioImageInputRef = useRef<HTMLInputElement | null>(null);

  // 에디터 상태
  const [profileBio, setProfileBio] = useState('');
  const [showBioEditor, setShowBioEditor] = useState(false);

  // 미리보기 변환
  const bioPreview = useMemo(() => renderMarkdownPreview(profileBio), [profileBio]);

  // 기본값 반영
  useEffect(() => {
    setProfileBio(userBio);
  }, [userBio]);

  // 자기소개 입력
  const handleBioChange = (event: ChangeEvent<HTMLTextAreaElement>) => setProfileBio(event.target.value);

  // 편집 토글
  const handleBioToggle = () =>
    setShowBioEditor(prev => {
      if (prev) setProfileBio(userBio);
      return !prev;
    });

  // 편집기 값 갱신
  const setBioValue = (nextValue: string, selectionStart: number, selectionEnd = selectionStart) => {
    setProfileBio(nextValue);
    window.requestAnimationFrame(() => {
      if (!bioEditorRef.current) return;
      bioEditorRef.current.focus();
      bioEditorRef.current.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  // 인라인 서식 적용
  const applyInlineWrap = (prefix: string, suffix = prefix, fallback = '텍스트') => {
    if (!bioEditorRef.current) return;
    const { selectionStart, selectionEnd, value } = bioEditorRef.current;
    const selectedText = value.slice(selectionStart, selectionEnd) || fallback;
    const nextValue = `${value.slice(0, selectionStart)}${prefix}${selectedText}${suffix}${value.slice(selectionEnd)}`;
    const nextStart = selectionStart + prefix.length;
    const nextEnd = nextStart + selectedText.length;
    setBioValue(nextValue, nextStart, nextEnd);
  };

  // 라인 서식 적용
  const applyLinePrefix = (prefix: string) => {
    if (!bioEditorRef.current) return;
    const { selectionStart, selectionEnd, value } = bioEditorRef.current;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionEnd);
    const sliceEnd = lineEnd === -1 ? value.length : lineEnd;
    const selectedText = value.slice(lineStart, sliceEnd);
    const nextText = selectedText
      .split('\n')
      .map(line => `${prefix}${line}`)
      .join('\n');
    const nextValue = `${value.slice(0, lineStart)}${nextText}${value.slice(sliceEnd)}`;
    setBioValue(nextValue, lineStart, lineStart + nextText.length);
  };

  // 번호 리스트 적용
  const applyNumbered = () => {
    if (!bioEditorRef.current) return;
    const { selectionStart, selectionEnd, value } = bioEditorRef.current;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = value.indexOf('\n', selectionEnd);
    const sliceEnd = lineEnd === -1 ? value.length : lineEnd;
    const selectedText = value.slice(lineStart, sliceEnd);
    const nextText = selectedText
      .split('\n')
      .map((line, index) => `${index + 1}. ${line}`)
      .join('\n');
    const nextValue = `${value.slice(0, lineStart)}${nextText}${value.slice(sliceEnd)}`;
    setBioValue(nextValue, lineStart, lineStart + nextText.length);
  };

  // 제목 적용
  const applyHeading = (level: 1 | 2 | 3) => applyLinePrefix(`${'#'.repeat(level)} `);

  // 인용 적용
  const applyQuote = () => applyLinePrefix('> ');

  // 불릿 적용
  const applyBullet = () => applyLinePrefix('- ');

  // 코드 적용
  const applyCode = () => {
    if (!bioEditorRef.current) return;
    const { selectionStart, selectionEnd, value } = bioEditorRef.current;
    const selectedText = value.slice(selectionStart, selectionEnd);
    if (selectedText.includes('\n')) {
      const nextValue = `${value.slice(0, selectionStart)}\n\`\`\`\n${selectedText}\n\`\`\`\n${value.slice(selectionEnd)}`;
      const cursor = selectionStart + selectedText.length + 8;
      setBioValue(nextValue, cursor, cursor);
      return;
    }
    applyInlineWrap('`', '`', '코드');
  };

  // 링크 적용
  const applyLink = () => {
    if (!bioEditorRef.current) return;
    const { selectionStart, selectionEnd, value } = bioEditorRef.current;
    const selectedText = value.slice(selectionStart, selectionEnd) || '링크 텍스트';
    const nextValue = `${value.slice(0, selectionStart)}[${selectedText}](url)${value.slice(selectionEnd)}`;
    const nextStart = selectionStart + selectedText.length + 3;
    const nextEnd = nextStart + 3;
    setBioValue(nextValue, nextStart, nextEnd);
  };

  // 이미지 선택
  const handleBioImageClick = () => {
    bioImageInputRef.current?.click();
  };

  // 이미지 삽입
  const handleBioImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadsApi.uploadImage(file);
      if (!bioEditorRef.current) return;
      const { selectionStart, selectionEnd, value } = bioEditorRef.current;
      const nextValue = `${value.slice(0, selectionStart)}![이미지](${url})${value.slice(selectionEnd)}`;
      const cursor = selectionStart + url.length + 6;
      setBioValue(nextValue, cursor, cursor);
      showToast({ message: '이미지가 삽입되었습니다.', type: 'success' });
    } catch {
      showToast({ message: '이미지 업로드에 실패했습니다.', type: 'error' });
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  // 자기소개 저장
  const handleBioSave = async () => {
    if (isBioUpdating) return;
    if (profileBio === userBio) {
      showToast({ message: '변경된 내용이 없습니다.', type: 'info' });
      return;
    }
    try {
      await updateMyBio({ profileBio });
      await queryClient.invalidateQueries({ queryKey: authKeys.currentUser });
      showToast({ message: '자기소개가 저장되었습니다.', type: 'success' });
      setShowBioEditor(false);
    } catch {
      showToast({ message: '자기소개 저장에 실패했습니다.', type: 'error' });
    }
  };

  return {
    bioPreview,
    profileBio,
    showBioEditor,
    isBioUpdating,
    refs: {
      bioEditorRef,
      bioImageInputRef,
    },
    handlers: {
      handleBioChange,
      handleBioSave,
      handleBioToggle,
      handleBioImageClick,
      handleBioImageSelect,
    },
    toolbar: {
      applyBullet,
      applyCode,
      applyHeading,
      applyInlineWrap,
      applyLink,
      applyNumbered,
      applyQuote,
    },
  };
};
