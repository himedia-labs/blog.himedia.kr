export type ViewMode = 'list' | 'card';

export type Post = {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  category: string;
  date: string;
  timeAgo: string;
  views: number;
  likeCount: number;
  commentCount: number;
};

export type TopPost = {
  id: string;
  title: string;
};

export interface Category {
  id: string;
  name: string;
}

export type CategoryListResponse = Category[];

export interface TagSuggestion {
  id: string;
  name: string;
  postCount: number;
}

export type TagSuggestionResponse = TagSuggestion[];

export type PostStatus = 'DRAFT' | 'PUBLISHED';
export type PostSortOption = 'createdAt' | 'publishedAt' | 'viewCount' | 'likeCount';
export type SortOrder = 'ASC' | 'DESC';

export interface PostListQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: PostStatus;
  sort?: PostSortOption;
  order?: SortOrder;
}

export interface PostCategoryRef {
  id: string;
  name: string;
}

export interface PostAuthorRef {
  id: string;
  name: string;
}

export interface PostListItem {
  id: string;
  title: string;
  content?: string;
  thumbnailUrl?: string | null;
  status: PostStatus;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  publishedAt: string | null;
  category: PostCategoryRef | null;
  author: PostAuthorRef | null;
}

export interface PostListResponse {
  items: PostListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type MutableRef<T> = {
  current: T;
};

export type TagCommit = (value: string) => boolean;

export type SelectionRange = {
  start: number;
  end: number;
};

export type InlinePattern = {
  type: 'code' | 'image' | 'link' | 'autolink' | 'bold' | 'strike' | 'underline' | 'italic';
  regex: RegExp;
};

export interface CreatePostRequest {
  title: string;
  content: string;
  categoryId?: string | null;
  status?: PostStatus;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface CreatePostResponse {
  id: string;
}

export interface UpdatePostRequest {
  id: string;
  title?: string;
  content?: string;
  categoryId?: string | null;
  status?: PostStatus;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface UpdatePostResponse {
  id: string;
}

export interface PostTagRef {
  id: string;
  name: string;
}

export interface PostDetailResponse {
  id: string;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  status: PostStatus;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  category: PostCategoryRef | null;
  author: PostAuthorRef | null;
  tags: PostTagRef[];
}
