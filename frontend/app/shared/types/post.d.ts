export type ViewMode = 'list' | 'card';

export type Post = {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  category: string;
  date: string;
  readTime: string;
  views: number;
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
