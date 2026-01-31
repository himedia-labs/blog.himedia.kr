// 댓글 쿼리 키
export const commentsKeys = {
  all: ['comments'] as const,
  list: (postId?: string) => [...commentsKeys.all, 'list', postId ?? ''] as const,
  myList: () => [...commentsKeys.all, 'my'] as const,
};
