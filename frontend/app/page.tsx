import Banner from './(routes)/(public)/main/components/banner/banner';
import PostListSection from './(routes)/(public)/main/components/postList/postList';

/**
 * 홈 페이지
 * @description 메인 배너와 포스트 리스트를 표시
 */
export default function Home() {
  return (
    <>
      <Banner />
      <PostListSection />
    </>
  );
}
