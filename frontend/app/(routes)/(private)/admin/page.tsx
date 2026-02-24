'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { FiChevronRight, FiFileText, FiFlag, FiGrid, FiUserCheck } from 'react-icons/fi';

import { useCurrentUserQuery } from '@/app/api/auth/auth.queries';
import { adminKeys } from '@/app/api/admin/admin.keys';
import { useAuthStore } from '@/app/shared/store/authStore';
import { useAdminAuditLogsQuery, useAdminPendingUsersQuery, useAdminReportsQuery } from '@/app/api/admin/admin.queries';
import { useApproveAdminUserMutation, useUpdateAdminReportStatusMutation } from '@/app/api/admin/admin.mutations';

import styles from '@/app/(routes)/(private)/admin/AdminPage.module.css';

import type { AdminReportStatus } from '@/app/shared/types/admin';
import type { IconType } from 'react-icons';

/**
 * 관리자 페이지
 * @description 신고 목록 조회와 상태 변경 기능을 제공
 */
export default function AdminPage() {
  // 라우트 상태
  const router = useRouter();
  const queryClient = useQueryClient();

  // 인증 상태
  const accessToken = useAuthStore(state => state.accessToken);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUserQuery();
  const isAdmin = currentUser?.role === 'ADMIN';
  const canAccess = Boolean(accessToken) && isAdmin;

  // 데이터 조회
  const { data: reportsData, isLoading: isReportsLoading } = useAdminReportsQuery(canAccess);
  const { data: pendingUsersData, isLoading: isPendingUsersLoading } = useAdminPendingUsersQuery(canAccess);
  const { data: logsData, isLoading: isLogsLoading } = useAdminAuditLogsQuery(canAccess);
  const updateStatusMutation = useUpdateAdminReportStatusMutation();
  const approveUserMutation = useApproveAdminUserMutation();
  const [selectedMenu, setSelectedMenu] = useState('회원 승인');
  const pendingUsers = pendingUsersData?.items ?? [];
  const reports = reportsData?.items ?? [];
  const auditLogs = logsData?.items ?? [];
  const menuIconMap: Record<string, IconType> = {
    '회원 승인': FiUserCheck,
    '신고 관리': FiFlag,
    '감사 로그': FiFileText,
    대시보드: FiGrid,
  };
  const CurrentMenuIcon = menuIconMap[selectedMenu] ?? FiGrid;

  // 역할 라벨
  const roleLabelMap: Record<string, string> = {
    TRAINEE: '훈련생',
    GRADUATE: '수료생',
    MENTOR: '멘토',
    INSTRUCTOR: '강사',
    ADMIN: '관리자',
  };
  const formatRoleLabel = (role: string | null | undefined) => {
    if (!role) return '-';
    return roleLabelMap[role] ?? role;
  };

  /**
   * 전화번호 포맷
   * @description 숫자만 남겨 하이픈 형식으로 반환
   */
  const formatPhoneNumber = (value: string | null | undefined) => {
    if (!value) return '-';
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return value;
  };

  // 상대 시간 포맷
  const getRelativeTimeLabel = (value: string) => {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  };

  // 접근 제어
  useEffect(() => {
    if (!isInitialized) return;
    if (!accessToken) router.replace('/login?reason=auth&redirect=/admin');
  }, [accessToken, isInitialized, router]);

  useEffect(() => {
    if (!isInitialized || !accessToken || isUserLoading) return;
    if (!isAdmin) router.replace('/');
  }, [accessToken, isAdmin, isInitialized, isUserLoading, router]);

  // 상태 변경
  const handleStatusChange = async (reportId: string, status: AdminReportStatus) => {
    await updateStatusMutation.mutateAsync({ reportId, status });
    await queryClient.invalidateQueries({ queryKey: adminKeys.reports() });
    await queryClient.invalidateQueries({ queryKey: adminKeys.pendingUsers() });
    await queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs() });
  };

  // 회원 승인
  const handleUserApprove = async (userId: string) => {
    await approveUserMutation.mutateAsync(userId);
    await queryClient.invalidateQueries({ queryKey: adminKeys.pendingUsers() });
    await queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs() });
  };

  if (!isInitialized || !accessToken || isUserLoading || !isAdmin) {
    return null;
  }

  return (
    <section className={styles.container} aria-label="관리자 페이지">
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.topbarTitle}>
            <CurrentMenuIcon aria-hidden="true" />
            <FiChevronRight className={styles.topbarTitleDividerIcon} aria-hidden="true" />
            <span>{selectedMenu}</span>
          </div>
          <div className={styles.topbarRight}>
            <span className={styles.adminWelcome}>{currentUser?.name} 관리자님, 환영합니다.</span>
          </div>
        </div>
      </header>

      <div className={styles.dashboard}>
        <aside className={styles.sidebar} aria-label="관리자 사이드바">
          <Link href="/" className={styles.sidebarBrand}>
            <span className={styles.brandMark}>
              <Image src="/icon/logo.png" alt="하이미디어 로고" fill sizes="40px" draggable={false} />
            </span>
            <span className={styles.brandText}>
              하이미디어커뮤니티
              <span className={styles.brandSub}>HIMEDIA COMMUNITY</span>
            </span>
          </Link>
          <nav className={styles.sidebarNav}>
            <div className={styles.sidebarSection}>
              <p className={styles.sidebarSectionLabel}>관리</p>
              <button
                type="button"
                className={`${styles.sidebarItem} ${selectedMenu === '회원 승인' ? styles.sidebarItemActive : ''}`}
                onClick={() => setSelectedMenu('회원 승인')}
              >
                <FiUserCheck aria-hidden="true" />
                회원 승인
              </button>
              <button
                type="button"
                className={`${styles.sidebarItem} ${selectedMenu === '신고 관리' ? styles.sidebarItemActive : ''}`}
                onClick={() => setSelectedMenu('신고 관리')}
              >
                <FiFlag aria-hidden="true" />
                신고 관리
              </button>
            </div>

            <div className={styles.sidebarSection}>
              <p className={styles.sidebarSectionLabel}>모니터링</p>
              <button
                type="button"
                className={`${styles.sidebarItem} ${selectedMenu === '감사 로그' ? styles.sidebarItemActive : ''}`}
                onClick={() => setSelectedMenu('감사 로그')}
              >
                <FiFileText aria-hidden="true" />
                감사 로그
              </button>
              <button
                type="button"
                className={`${styles.sidebarItem} ${selectedMenu === '대시보드' ? styles.sidebarItemActive : ''}`}
                onClick={() => setSelectedMenu('대시보드')}
              >
                <FiGrid aria-hidden="true" />
                대시보드
              </button>
            </div>
          </nav>
        </aside>

        <main className={styles.content}>
          <div className={styles.contentInner}>
            <header className={styles.header}>
              <h1 className={styles.title}>{selectedMenu}</h1>
            </header>

            {selectedMenu === '대시보드' ? (
              <>
                <div className={styles.summaryGrid}>
                  <article className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>승인 대기</p>
                    <p className={styles.summaryValue}>{pendingUsers.length}</p>
                  </article>
                  <article className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>신고 건수</p>
                    <p className={styles.summaryValue}>{reports.length}</p>
                  </article>
                  <article className={styles.summaryCard}>
                    <p className={styles.summaryLabel}>감사 로그</p>
                    <p className={styles.summaryValue}>{auditLogs.length}</p>
                  </article>
                </div>

                <div className={styles.grid}>
                  <article className={styles.card}>
                    <h2 className={styles.cardTitle}>회원가입 승인</h2>
                    {isPendingUsersLoading ? (
                      <p className={styles.notice}>불러오는 중입니다.</p>
                    ) : pendingUsers.length ? (
                      <ul className={styles.list}>
                        {pendingUsers.slice(0, 5).map(user => (
                          <li key={user.id} className={styles.item}>
                            <div className={styles.itemText}>
                              <strong>
                                {user.name} ({user.role})
                              </strong>
                              <p>{user.email}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.notice}>승인 대기 회원이 없습니다.</p>
                    )}
                  </article>

                  <article className={styles.card}>
                    <h2 className={styles.cardTitle}>신고 목록</h2>
                    {isReportsLoading ? (
                      <p className={styles.notice}>불러오는 중입니다.</p>
                    ) : reports.length ? (
                      <ul className={styles.list}>
                        {reports.slice(0, 5).map(report => (
                          <li key={report.id} className={styles.item}>
                            <div className={styles.itemText}>
                              <strong>{report.title}</strong>
                              <span>현재 상태: {report.status}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.notice}>신고 내역이 없습니다.</p>
                    )}
                  </article>
                </div>
              </>
            ) : (
              <div className={styles.singleGrid}>
                {selectedMenu === '회원 승인' ? (
                  <article className={styles.card}>
                    {isPendingUsersLoading ? (
                      <p className={styles.notice}>불러오는 중입니다.</p>
                    ) : pendingUsers.length ? (
                      <div className={styles.tableWrap}>
                        <table className={styles.pendingTable}>
                          <thead>
                            <tr>
                              <th>Order</th>
                              <th>이름</th>
                              <th>이메일</th>
                              <th>전화번호</th>
                              <th>생년월일</th>
                              <th>신청 역할</th>
                              <th>과정</th>
                              <th>가입일</th>
                              <th>처리</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingUsers.map((user, index) => (
                              <tr key={user.id}>
                                <td>
                                  <div className={styles.orderCell}>
                                    <strong>#{index + 1}</strong>
                                    <span> ({getRelativeTimeLabel(user.createdAt)})</span>
                                  </div>
                                </td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{formatPhoneNumber(user.phone)}</td>
                                <td>{user.birthDate ?? '-'}</td>
                                <td>
                                  <span className={styles.roleBadge}>{formatRoleLabel(user.requestedRole ?? user.role)}</span>
                                </td>
                                <td>{user.course ?? 'N/A'}</td>
                                <td>
                                  {new Date(user.createdAt).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false,
                                  })}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className={styles.actionButton}
                                    onClick={() => handleUserApprove(user.id)}
                                  >
                                    승인
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className={styles.notice}>승인 대기 회원이 없습니다.</p>
                    )}
                  </article>
                ) : null}

                {selectedMenu === '신고 관리' ? (
                  <article className={styles.card}>
                    {isReportsLoading ? (
                      <p className={styles.notice}>불러오는 중입니다.</p>
                    ) : reports.length ? (
                      <ul className={styles.list}>
                        {reports.map(report => (
                          <li key={report.id} className={styles.item}>
                            <div className={styles.itemText}>
                              <strong>{report.title}</strong>
                              <p>{report.content}</p>
                              <span>현재 상태: {report.status}</span>
                            </div>
                            <div className={styles.actions}>
                              <button
                                type="button"
                                className={styles.actionButton}
                                onClick={() => handleStatusChange(report.id, 'IN_PROGRESS')}
                              >
                                진행중
                              </button>
                              <button
                                type="button"
                                className={styles.actionButton}
                                onClick={() => handleStatusChange(report.id, 'RESOLVED')}
                              >
                                해결
                              </button>
                              <button
                                type="button"
                                className={styles.actionButton}
                                onClick={() => handleStatusChange(report.id, 'REJECTED')}
                              >
                                반려
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.notice}>신고 내역이 없습니다.</p>
                    )}
                  </article>
                ) : null}

                {selectedMenu === '감사 로그' ? (
                  <article className={styles.card}>
                    {isLogsLoading ? (
                      <p className={styles.notice}>불러오는 중입니다.</p>
                    ) : auditLogs.length ? (
                      <ul className={styles.logList}>
                        {auditLogs.map(log => (
                          <li key={log.id} className={styles.logItem}>
                            <strong>{log.action}</strong>
                            <span>
                              target: {log.targetType} / {log.targetId}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.notice}>감사 로그가 없습니다.</p>
                    )}
                  </article>
                ) : null}
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
}
