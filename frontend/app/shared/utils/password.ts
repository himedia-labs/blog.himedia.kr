// 비밀번호 유효성 검사 (최소 8자, 영문+숫자+특수문자)
const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * 비밀번호 검증
 * @description 비밀번호 정책을 만족하는지 확인
 */
export const isValidPassword = (value: string): boolean => PASSWORD_PATTERN.test(value);
