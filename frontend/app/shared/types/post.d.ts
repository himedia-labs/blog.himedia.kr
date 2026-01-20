import type {
  ChangeEvent,
  CompositionEvent,
  Dispatch,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  RefObject,
  SetStateAction,
} from 'react';
import type { IconType } from 'react-icons';

export type ViewMode = 'list' | 'card';

export type SortFilter = 'latest' | 'top' | 'following';

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
export type PostFeedOption = 'following';

export interface PostListQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: PostStatus;
  sort?: PostSortOption;
  order?: SortOrder;
  feed?: PostFeedOption;
}

export interface PostCategoryRef {
  id: string;
  name: string;
}

export type UserRole = 'TRAINEE' | 'GRADUATE' | 'MENTOR' | 'INSTRUCTOR' | 'ADMIN';

export interface PostAuthorRef {
  id: string;
  name: string;
  role: UserRole;
}

export interface PostListItem {
  id: string;
  title: string;
  content?: string;
  thumbnailUrl?: string | null;
  status: PostStatus;
  viewCount: number;
  likeCount: number;
  shareCount: number;
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

export type MarkdownImageUploadParams = {
  content: string;
  contentRef: RefObject<HTMLTextAreaElement | null>;
  setContentValue: Dispatch<SetStateAction<string>>;
  setContentAndSelection: (nextValue: string, selectionStart: number, selectionEnd?: number) => void;
};

export type MarkdownEditorParams = {
  content: string;
  setContentValue: Dispatch<SetStateAction<string>>;
};

export type SplitViewOptions = {
  defaultValue?: number;
  min?: number;
  max?: number;
};

export type PostPayloadInput = {
  title: string;
  content: string;
  categoryId: string | null;
  thumbnailUrl: string;
  tags: string[];
};

export type PostPayloadStatus = 'DRAFT' | 'PUBLISHED';

export type DraftNoticeParams = {
  draftId: string | null;
  hasDrafts: boolean;
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
  liked: boolean;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  category: PostCategoryRef | null;
  author: PostAuthorRef | null;
  tags: PostTagRef[];
}

export interface PostShareResponse {
  shareCount: number;
}

export interface PostViewResponse {
  viewCount: number;
}

export interface PostLikeResponse {
  likeCount: number;
  liked: boolean;
}

export type PostDetailActionsParams = {
  data?: PostDetailResponse | null;
  postId: string;
};

export type PostTocItem = {
  id: string;
  level: 1 | 2 | 3;
  text: string;
};



// Draft 관련
export type DraftData = {
  title: string;
  categoryId: string;
  thumbnailUrl: string;
  content: string;
  tags: string[];
};

export type DraftSaveOptions = {
  silent?: boolean;
};

export type DraftSaverParams = {
  draftId: string | null;
  formData: DraftData;
  isAuthenticated: boolean;
};

export type AutoSaveParams = {
  formData: DraftData;
  isAuthenticated: boolean;
  saveDraft: (options?: { silent?: boolean }) => Promise<void>;
};

// 컴포넌트 Props
export type DraftNoticeModalProps = {
  onClose: () => void;
};

export type PostDetailsFormCategory = {
  categoryId: string;
  categories: Array<{ id: string; name: string }> | undefined;
  isLoading: boolean;
  onCategoryChange: (event: ChangeEvent<HTMLSelectElement>) => void;
};

export type PostDetailsFormThumbnail = {
  thumbnailUrl: string;
  thumbnailInputRef: RefObject<HTMLInputElement | null>;
  isThumbnailUploading: boolean;
  onThumbnailChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onThumbnailFileClick: () => void;
  onThumbnailFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
};

export type PostDetailsFormTag = {
  tagInput: string;
  tags: string[];
  tagLengthError: boolean;
  hasTagSuggestions: boolean;
  tagSuggestions: TagSuggestion[];
  onTagChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTagKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onTagBlur: (event: FocusEvent<HTMLInputElement>) => void;
  onTagCompositionStart: () => void;
  onTagCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => void;
  onRemoveTag: (tag: string) => void;
  onTagSuggestionMouseDown: (tagName: string) => (event: MouseEvent<HTMLButtonElement>) => void;
};

export type PostDetailsFormProps = {
  category: PostDetailsFormCategory;
  thumbnail: PostDetailsFormThumbnail;
  tag: PostDetailsFormTag;
};

export type ToolbarItem =
  | { type: 'separator' }
  | { type: 'heading'; level: 1 | 2 | 3; icon: IconType; label: string }
  | {
      type: 'action';
      action: 'bold' | 'italic' | 'underline' | 'strike' | 'quote' | 'code' | 'link' | 'image' | 'bullet' | 'numbered';
      icon: IconType;
      label: string;
    };

export type EditorToolbarProps = {
  onHeading: (level: 1 | 2 | 3) => void;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onStrike: () => void;
  onQuote: () => void;
  onCode: () => void;
  onLink: () => void;
  onImage: () => void;
  onBullet: () => void;
  onNumbered: () => void;
};

export type PostPreviewProps = {
  title: string;
  categoryName: string;
  authorName: string;
  dateLabel: string;
  previewStats: {
    views: number;
    likeCount: number;
    commentCount: number;
  };
  thumbnailUrl: string;
  content: ReactNode;
  tags: string[];
};
