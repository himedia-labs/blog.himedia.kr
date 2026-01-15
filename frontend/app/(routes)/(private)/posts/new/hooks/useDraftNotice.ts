import { useEffect, useRef } from 'react';

import { FiCircle } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import { useRouter } from 'next/navigation';

import { useToast } from '@/app/shared/components/toast/toast';

import type { DraftNoticeParams } from '@/app/shared/types/post';

export const useDraftNotice = ({ draftId, hasDrafts }: DraftNoticeParams) => {
  const router = useRouter();
  const { showToast } = useToast();
  const draftNoticeShownRef = useRef(false);

  useEffect(() => {
    if (draftNoticeShownRef.current) return;
    if (draftId) return;
    if (!hasDrafts) return;
    draftNoticeShownRef.current = true;
    showToast({
      message: '이전에 저장된 초안이 있습니다.',
      type: 'info',
      duration: 4000,
      actions: [
        {
          id: 'draft-open',
          label: '임시저장 목록 보기',
          ariaLabel: '임시저장 목록 보기',
          icon: FiCircle,
          className: 'action',
          onClick: () => router.push('/posts/drafts'),
        },
        {
          id: 'draft-close',
          label: '알림 닫기',
          ariaLabel: '알림 닫기',
          icon: IoMdClose,
          className: 'close',
          onClick: () => {},
        },
      ],
    });
  }, [draftId, hasDrafts, router, showToast]);
};
