-- notifications 타입 제약에 신고 상태 알림 타입 추가
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('POST_LIKE', 'POST_COMMENT', 'COMMENT_LIKE', 'COMMENT_REPLY', 'REPORT_RECEIVED', 'REPORT_RESOLVED', 'REPORT_REJECTED'));
