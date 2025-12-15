-- Himedia 커뮤니티 데이터베이스 스키마

-- UUID 확장 활성화 (Refresh Token용)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 테이블
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('TRAINEE', 'MENTOR', 'INSTRUCTOR', 'ADMIN')),
    course VARCHAR(255),
    privacy_consent BOOLEAN NOT NULL DEFAULT false,
    approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_approved ON users(approved);
CREATE INDEX idx_users_role_approved ON users(role, approved);

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 리프레시 토큰 테이블
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    user_agent VARCHAR(500),
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_user_revoked ON refresh_tokens(user_id, revoked_at);

-- 비밀번호 재설정 테이블
CREATE TABLE password_resets (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_code ON password_resets(code);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
CREATE INDEX idx_password_resets_user_code_used ON password_resets(user_id, code, used);

-- 테이블/컬럼 설명
COMMENT ON TABLE users IS '사용자 테이블';
COMMENT ON COLUMN users.id IS '사용자 고유 ID (Snowflake ID)';
COMMENT ON COLUMN users.name IS '사용자 이름';
COMMENT ON COLUMN users.email IS '이메일 (로그인 ID)';
COMMENT ON COLUMN users.password IS '암호화된 비밀번호';
COMMENT ON COLUMN users.phone IS '전화번호';
COMMENT ON COLUMN users.role IS '역할: TRAINEE(훈련생), MENTOR(멘토), INSTRUCTOR(강사), ADMIN(관리자)';
COMMENT ON COLUMN users.course IS '과정명 및 기수';
COMMENT ON COLUMN users.privacy_consent IS '개인정보 수집 및 이용 동의 여부';
COMMENT ON COLUMN users.approved IS '관리자 승인 여부';
COMMENT ON COLUMN users.created_at IS '생성 일시';
COMMENT ON COLUMN users.updated_at IS '수정 일시';

COMMENT ON TABLE refresh_tokens IS '리프레시 토큰 테이블';
COMMENT ON COLUMN refresh_tokens.id IS '토큰 고유 ID (UUID - 보안)';
COMMENT ON COLUMN refresh_tokens.user_id IS '사용자 ID';
COMMENT ON COLUMN refresh_tokens.token_hash IS '토큰 해시값';
COMMENT ON COLUMN refresh_tokens.expires_at IS '토큰 만료 시간';
COMMENT ON COLUMN refresh_tokens.revoked_at IS '토큰 철회 시간';
COMMENT ON COLUMN refresh_tokens.user_agent IS '사용자 브라우저/기기 정보';
COMMENT ON COLUMN refresh_tokens.ip_address IS '요청 IP 주소';
COMMENT ON COLUMN refresh_tokens.created_at IS '생성 일시';

COMMENT ON TABLE password_resets IS '비밀번호 재설정 인증번호 테이블';
COMMENT ON COLUMN password_resets.id IS '고유 ID (Snowflake ID)';
COMMENT ON COLUMN password_resets.user_id IS '사용자 ID';
COMMENT ON COLUMN password_resets.code IS '인증코드 해시(bcrypt)';
COMMENT ON COLUMN password_resets.expires_at IS '인증번호 만료 시간';
COMMENT ON COLUMN password_resets.used IS '사용 여부';
COMMENT ON COLUMN password_resets.created_at IS '생성 일시';