-- Initial seed data

BEGIN;

INSERT INTO categories (id, name)
VALUES
  (1, 'Frontend'),
  (2, 'Backend'),
  (3, 'Full Stack'),
  (4, 'DevOps'),
  (5, 'AI Engineer'),
  (6, 'Data Engineer'),
  (7, 'Android'),
  (8, 'iOS'),
  (9, 'QA'),
  (10, 'Product Manager (PM)'),
  (11, 'UI/UX Designer');

INSERT INTO users (id, name, email, password, phone, role, requested_role, course, privacy_consent, approved)
VALUES
  (1, 'Demo User', 'demo@example.com', 'hashed_password', '01000000000', 'TRAINEE', NULL, 'Web Bootcamp', true, true);

INSERT INTO posts (id, author_id, category_id, title, content, status, published_at, view_count, like_count)
VALUES
  (1, 1, 1, '프론트엔드 성능 개선 체크리스트', '렌더링 최적화와 이미지 전략을 정리했습니다.', 'PUBLISHED', CURRENT_TIMESTAMP, 120, 15),
  (2, 1, 2, 'NestJS 에러 핸들링 패턴', '에러 코드와 메시지를 분리해 프론트에서 바로 대응하는 방법.', 'PUBLISHED', CURRENT_TIMESTAMP, 85, 8),
  (3, 1, 3, '풀스택 프로젝트 구조 정리', '모노레포에서 공통 타입과 API 규칙을 맞추는 팁.', 'PUBLISHED', CURRENT_TIMESTAMP, 240, 32),
  (4, 1, 4, '배포 파이프라인 간단 구성', 'CI에서 빌드/테스트/배포까지 최소 구성으로 정리.', 'PUBLISHED', CURRENT_TIMESTAMP, 60, 4),
  (5, 1, 5, 'AI 엔지니어 입문 로드맵', '모델보다는 데이터 준비와 실험 기록이 중요합니다.', 'PUBLISHED', CURRENT_TIMESTAMP, 310, 40),
  (6, 1, 6, '데이터 파이프라인 장애 대응', '재처리 전략과 재현 가능한 로그 설계를 다룹니다.', 'PUBLISHED', CURRENT_TIMESTAMP, 45, 3),
  (7, 1, 7, 'Android 스튜디오 세팅 팁', '프로젝트 템플릿과 기본 설정을 빠르게 맞추기.', 'PUBLISHED', CURRENT_TIMESTAMP, 180, 12),
  (8, 1, 8, 'iOS 테스트 자동화 시작', 'Xcode 테스트 타깃 구성과 기본 실행 흐름.', 'PUBLISHED', CURRENT_TIMESTAMP, 95, 6),
  (9, 1, 9, 'QA 관점의 릴리즈 점검', '스모크 테스트와 회귀 테스트 기준 정리.', 'PUBLISHED', CURRENT_TIMESTAMP, 130, 9),
  (10, 1, 10, 'PM이 보는 요구사항 정리법', '기능 범위와 우선순위를 합의하는 문서화 팁.', 'PUBLISHED', CURRENT_TIMESTAMP, 70, 5);

INSERT INTO comments (id, post_id, author_id, content, parent_id, depth)
VALUES
  (1, 1, 1, '첫 번째 댓글입니다.', NULL, 0),
  (2, 1, 1, '첫 번째 댓글에 대한 대댓글입니다.', 1, 1),
  (3, 1, 1, '대댓글에 대한 답글입니다.', 2, 2),
  (4, 1, 1, '두 번째 댓글입니다.', NULL, 0),
  (5, 1, 1, '두 번째 댓글에 대한 대댓글입니다.', 4, 1),
  (6, 2, 1, '간단히 정리 감사합니다.', NULL, 0),
  (7, 3, 1, '구조 참고했습니다.', NULL, 0),
  (8, 3, 1, '모노레포 팁 좋네요.', NULL, 0),
  (9, 5, 1, '로드맵 도움돼요.', NULL, 0),
  (10, 5, 1, '데이터 준비 공감합니다.', NULL, 0),
  (11, 5, 1, '질문 하나 있어요.', NULL, 0),
  (12, 5, 1, '좋은 질문이에요!', 11, 1),
  (13, 6, 1, '재처리 전략 궁금했어요.', NULL, 0),
  (14, 8, 1, '테스트 타깃 구성 좋네요.', NULL, 0),
  (15, 8, 1, 'Xcode 팁 감사합니다.', NULL, 0),
  (16, 9, 1, '체크리스트 유용합니다.', NULL, 0),
  (17, 10, 1, '요구사항 정리 팁 좋습니다.', NULL, 0),
  (18, 10, 1, '우선순위 기준 공유 감사합니다.', NULL, 0);

COMMIT;
