import { useQuery } from '@tanstack/react-query';

import { tagsApi } from '@/app/api/tags/tags.api';
import { tagsKeys } from '@/app/api/tags/tags.keys';

import type { TagSuggestionResponse } from '@/app/shared/types/post';

// 태그 추천 조회
export const useTagSuggestionsQuery = (query: string, limit?: number) => {
  return useQuery<TagSuggestionResponse, Error>({
    queryKey: tagsKeys.suggest(query, limit),
    queryFn: () => tagsApi.getTagSuggestions(query, limit),
    enabled: query.length > 0,
  });
};
