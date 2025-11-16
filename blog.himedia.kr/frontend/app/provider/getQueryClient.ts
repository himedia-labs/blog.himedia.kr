import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';

// Query Client 생성 함수
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: query => defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });

let clientForBrowser: QueryClient | undefined;

// Query Client 반환 함수
export function getQueryClient() {
  if (isServer) {
    return createQueryClient();
  }

  if (!clientForBrowser) {
    clientForBrowser = createQueryClient();
  }

  return clientForBrowser;
}
