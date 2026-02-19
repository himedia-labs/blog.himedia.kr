import type { CreatePostRequest, PostPayloadInput, PostPayloadStatus } from '@/app/shared/types/post';

// 게시글 payload 구성
export const buildPostPayload = (
  input: PostPayloadInput,
  status: PostPayloadStatus,
): CreatePostRequest => ({
  tags: input.tags,
  title: input.title,
  status,
  content: input.content,
  categoryId: input.categoryId,
});
