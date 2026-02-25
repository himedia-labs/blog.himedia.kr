'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { FiChevronDown, FiChevronRight, FiFileText, FiFlag, FiLogIn, FiUserCheck, FiUsers } from 'react-icons/fi';

import { useCurrentUserQuery } from '@/app/api/auth/auth.queries';
import { useToast } from '@/app/shared/components/toast/toast';
import { useAuthStore } from '@/app/shared/store/authStore';
import {
  useAdminAccessLogsQuery,
  useAdminAuditLogsQuery,
  useAdminPendingUsersQuery,
  useAdminReportsQuery,
  useAdminUsersQuery,
} from '@/app/api/admin/admin.queries';
import {
  useApproveAdminUserMutation,
  useTrackAdminAccessMutation,
  useUpdateAdminUserRoleMutation,
  useUpdateAdminReportStatusMutation,
} from '@/app/api/admin/admin.mutations';
import { ADMIN_MENU_LABELS } from '@/app/(routes)/(private)/admin/constants/menu.constants';
import { ADMIN_QUERY_KEYS } from '@/app/(routes)/(private)/admin/constants/query.constants';
import { ADMIN_PENDING_SORT } from '@/app/(routes)/(private)/admin/constants/sort.constants';
import { createHandleSelectMenu, createHandleSelectSort, createSyncAdminUrlState } from '@/app/(routes)/(private)/admin/handlers/adminUrl.handlers';
import {
  createToggleRoleSort,
  createToggleCourseSort,
  createTogglePendingSort,
  createHandleSelectRoleFilter,
  createHandleSelectCourseFilter,
  createHandleSelectPendingSort,
} from '@/app/(routes)/(private)/admin/handlers/adminFilter.handlers';
import { createHandleStatusChange } from '@/app/(routes)/(private)/admin/handlers/adminReport.handlers';
import {
  createHandleUserEdit,
  createHandleUserApprove,
  createHandleSaveAllUserRoles,
  createHandleChangeUserRoleDraft,
} from '@/app/(routes)/(private)/admin/handlers/adminUser.handlers';
import { useAdminAccessGuard } from '@/app/(routes)/(private)/admin/hooks/useAdminAccessGuard';
import { useTrackAdminAccess } from '@/app/(routes)/(private)/admin/hooks/useTrackAdminAccess';
import { useAccessLogsInfiniteScroll } from '@/app/(routes)/(private)/admin/hooks/useAccessLogsInfiniteScroll';
import { usePendingUsersSort } from '@/app/(routes)/(private)/admin/hooks/usePendingUsersSort';
import { formatDateTime } from '@/app/(routes)/(private)/admin/utils/formatDateTime.utils';
import {
  getRoleBadgeClassName,
  getReportBodyText,
  getReportImageUrls,
  formatReporterLabel,
  getReportStatusLabel,
  getAccessStatusBadgeClassName,
  getReportStatusBadgeClassName,
  getAuditResultBadgeClassName,
} from '@/app/(routes)/(private)/admin/utils/adminDisplay.utils';
import {
  parseAdminMenuFromQuery,
  parseAdminSortFromQuery,
} from '@/app/(routes)/(private)/admin/utils/adminUrlState.utils';
import { formatRoleLabel } from '@/app/(routes)/(private)/admin/utils/formatRoleLabel.utils';
import { formatPhoneNumber } from '@/app/(routes)/(private)/admin/utils/formatPhoneNumber.utils';
import { getRelativeTimeLabel } from '@/app/(routes)/(private)/admin/utils/getRelativeTimeLabel.utils';
import { formatUserAgentLabel } from '@/app/(routes)/(private)/admin/utils/formatUserAgentLabel.utils';
import { formatSessionDuration } from '@/app/(routes)/(private)/admin/utils/formatSessionDuration.utils';
import { formatAuditAfterLabel, formatAuditActionLabel, formatAuditBeforeLabel, formatAuditResultLabel, formatAuditTargetLabel } from '@/app/(routes)/(private)/admin/utils/formatAuditLog.utils';

import styles from '@/app/(routes)/(private)/admin/AdminPage.module.css';

import type { IconType } from 'react-icons';

/**
 * 관리자 페이지
 * @description 신고 목록 조회와 상태 변경 기능을 제공
 */
export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // 인증 상태
  const accessToken = useAuthStore(state => state.accessToken);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUserQuery();
  const isAdmin = currentUser?.role === 'ADMIN';
  const canAccess = Boolean(accessToken) && isAdmin;

  // 데이터 조회
  const { data: reportsData, isLoading: isReportsLoading } = useAdminReportsQuery(canAccess);
  const { data: pendingUsersData, isLoading: isPendingUsersLoading } = useAdminPendingUsersQuery(canAccess);
  const { data: usersData, isLoading: isUsersLoading } = useAdminUsersQuery(canAccess);
  const { data: logsData, isLoading: isLogsLoading } = useAdminAuditLogsQuery(canAccess);
  const {
    data: accessLogsData,
    isLoading: isAccessLogsLoading,
    isFetchingNextPage: isAccessLogsFetchingMore,
    hasNextPage: hasNextAccessLogsPage,
    fetchNextPage: fetchNextAccessLogsPage,
  } = useAdminAccessLogsQuery(canAccess);
  const updateStatusMutation = useUpdateAdminReportStatusMutation();
  const approveUserMutation = useApproveAdminUserMutation();
  const updateUserRoleMutation = useUpdateAdminUserRoleMutation();
  const trackAdminAccessMutation = useTrackAdminAccessMutation();
  const accessLogsLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const [isRoleSortOpen, setIsRoleSortOpen] = useState(false);
  const [isCourseSortOpen, setIsCourseSortOpen] = useState(false);
  const [isPendingSortOpen, setIsPendingSortOpen] = useState(false);
  const [isUsersEditMode, setIsUsersEditMode] = useState(false);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [userRoleDrafts, setUserRoleDrafts] = useState<Record<string, string>>({});
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const selectedMenu = parseAdminMenuFromQuery(searchParams.get(ADMIN_QUERY_KEYS.TAB));
  const pendingSort = parseAdminSortFromQuery(searchParams.get(ADMIN_QUERY_KEYS.SORT));
  const pendingUsers = useMemo(() => pendingUsersData?.items ?? [], [pendingUsersData]);
  const allUsers = useMemo(() => usersData?.items ?? [], [usersData]);
  const reports = reportsData?.items ?? [];
  const auditLogs = logsData?.items ?? [];
  const accessLogs = useMemo(() => {
    return accessLogsData?.pages.flatMap(page => page.items) ?? [];
  }, [accessLogsData]);
  const sortedPendingUsers = usePendingUsersSort(pendingUsers, pendingSort);
  const courseFilterOptions = useMemo(() => {
    const options = Array.from(new Set(pendingUsers.map(user => user.course).filter(Boolean))) as string[];
    return options.sort((a, b) => a.localeCompare(b, 'ko'));
  }, [pendingUsers]);
  const filteredPendingUsers = useMemo(() => {
    return sortedPendingUsers.filter(user => {
      const userRole = user.requestedRole ?? user.role;
      const matchedRole = selectedRoleFilter === 'ALL' || userRole === selectedRoleFilter;
      const matchedCourse = selectedCourseFilter === 'ALL' || user.course === selectedCourseFilter;
      return matchedRole && matchedCourse;
    });
  }, [selectedCourseFilter, selectedRoleFilter, sortedPendingUsers]);
  const menuIconMap: Record<string, IconType> = {
    [ADMIN_MENU_LABELS.PENDING_USERS]: FiUserCheck,
    [ADMIN_MENU_LABELS.USERS]: FiUsers,
    [ADMIN_MENU_LABELS.REPORTS]: FiFlag,
    [ADMIN_MENU_LABELS.AUDIT_LOGS]: FiFileText,
    [ADMIN_MENU_LABELS.ACCESS_LOGS]: FiLogIn,
  };
  const CurrentMenuIcon = menuIconMap[selectedMenu] ?? FiUserCheck;

  useAdminAccessGuard({ accessToken, isInitialized, isUserLoading, isAdmin });
  useTrackAdminAccess({
    canAccess,
    queryClient,
    mutate: trackAdminAccessMutation.mutate,
  });
  useAccessLogsInfiniteScroll({
    selectedMenu,
    hasNextPage: hasNextAccessLogsPage,
    isFetchingNextPage: isAccessLogsFetchingMore,
    loadMoreRef: accessLogsLoadMoreRef,
    fetchNextPage: fetchNextAccessLogsPage,
  });

  const syncAdminUrlState = createSyncAdminUrlState({ pathname, router, searchParams });
  const handleSelectMenu = createHandleSelectMenu({ pendingSort, syncAdminUrlState });
  const handleSelectSort = createHandleSelectSort({ selectedMenu, syncAdminUrlState });
  const toggleRoleSort = createToggleRoleSort({ setIsRoleSortOpen, setIsCourseSortOpen, setIsPendingSortOpen });
  const toggleCourseSort = createToggleCourseSort({ setIsRoleSortOpen, setIsCourseSortOpen, setIsPendingSortOpen });
  const togglePendingSort = createTogglePendingSort({ setIsRoleSortOpen, setIsCourseSortOpen, setIsPendingSortOpen });
  const handleSelectRoleFilter = createHandleSelectRoleFilter({ setSelectedRoleFilter, setIsRoleSortOpen });
  const handleSelectCourseFilter = createHandleSelectCourseFilter({ setSelectedCourseFilter, setIsCourseSortOpen });
  const handleSelectPendingSort = createHandleSelectPendingSort({ handleSelectSort, setIsPendingSortOpen });
  const handleStatusChange = createHandleStatusChange({
    queryClient,
    mutateAsync: updateStatusMutation.mutateAsync,
    showToast,
  });
  const handleUserApprove = createHandleUserApprove({
    queryClient,
    mutateAsync: approveUserMutation.mutateAsync,
    showToast,
  });
  const handleUserEdit = createHandleUserEdit(setIsUsersEditMode);
  const handleSaveAllUserRoles = createHandleSaveAllUserRoles({
    allUsers,
    userRoleDrafts,
    queryClient,
    setIsUsersEditMode,
    mutateAsync: updateUserRoleMutation.mutateAsync,
    showToast,
  });
  const handleChangeUserRoleDraft = createHandleChangeUserRoleDraft(setUserRoleDrafts);
  const handleToggleReportExpand = (reportId: string) => {
    setExpandedReports(prev => ({ ...prev, [reportId]: !prev[reportId] }));
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
            <div className={styles.sidebarTopMenu}>
              <button
                type="button"
                className={`${styles.sidebarItem} ${selectedMenu === ADMIN_MENU_LABELS.USERS ? styles.sidebarItemActive : ''}`}
                onClick={() => handleSelectMenu(ADMIN_MENU_LABELS.USERS)}
              >
                <FiUsers aria-hidden="true" />
                전체 회원
              </button>
            </div>

            <div className={styles.sidebarSection}>
              <p className={styles.sidebarSectionLabel}>관리</p>
              <button
                type="button"
                className={`${styles.sidebarItem} ${selectedMenu === ADMIN_MENU_LABELS.PENDING_USERS ? styles.sidebarItemActive : ''}`}
                onClick={() => handleSelectMenu(ADMIN_MENU_LABELS.PENDING_USERS)}
              >
                <FiUserCheck aria-hidden="true" />
                회원 승인
              </button>
              <button
                type="button"
                className={`${styles.sidebarItem} ${selectedMenu === ADMIN_MENU_LABELS.REPORTS ? styles.sidebarItemActive : ''}`}
                onClick={() => handleSelectMenu(ADMIN_MENU_LABELS.REPORTS)}
              >
                <FiFlag aria-hidden="true" />
                신고 관리
              </button>
            </div>

            <div className={styles.sidebarSection}>
              <p className={styles.sidebarSectionLabel}>모니터링</p>
              <button
                type="button"
                className={`${styles.sidebarItem} ${selectedMenu === ADMIN_MENU_LABELS.AUDIT_LOGS ? styles.sidebarItemActive : ''}`}
                onClick={() => handleSelectMenu(ADMIN_MENU_LABELS.AUDIT_LOGS)}
              >
                <FiFileText aria-hidden="true" />
                감사 로그
              </button>
              <button
                type="button"
                className={`${styles.sidebarItem} ${selectedMenu === ADMIN_MENU_LABELS.ACCESS_LOGS ? styles.sidebarItemActive : ''}`}
                onClick={() => handleSelectMenu(ADMIN_MENU_LABELS.ACCESS_LOGS)}
              >
                <FiLogIn aria-hidden="true" />
                관리자 접속일지
              </button>
            </div>
          </nav>
        </aside>

        <main className={styles.content}>
          <div className={styles.contentInner}>
            <header className={styles.header}>
              <div className={styles.headerTitleRow}>
                <h1 className={styles.title}>{selectedMenu}</h1>
                {selectedMenu === ADMIN_MENU_LABELS.PENDING_USERS ? (
                  <div className={styles.headerActions}>
                    <div className={styles.pendingFilterGroup}>
                      <div className={`${styles.filterDropdown} ${styles.roleFilterDropdown}`}>
                        <button type="button" className={styles.filterButton} onClick={togglePendingSort}>
                          가입일
                          <FiChevronDown className={styles.filterChevron} aria-hidden="true" />
                        </button>
                        {isPendingSortOpen ? (
                          <div className={styles.filterMenu}>
                            <button
                              type="button"
                              className={`${styles.filterItem} ${pendingSort === ADMIN_PENDING_SORT.OLDEST ? styles.filterItemActive : ''}`}
                              onClick={() => handleSelectPendingSort(ADMIN_PENDING_SORT.OLDEST)}
                            >
                              오래된 가입 순
                            </button>
                            <button
                              type="button"
                              className={`${styles.filterItem} ${pendingSort === ADMIN_PENDING_SORT.NEWEST ? styles.filterItemActive : ''}`}
                              onClick={() => handleSelectPendingSort(ADMIN_PENDING_SORT.NEWEST)}
                            >
                              최근 가입 순
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <div className={`${styles.filterDropdown} ${styles.roleFilterDropdown}`}>
                        <button type="button" className={styles.filterButton} onClick={toggleRoleSort}>
                          {selectedRoleFilter === 'ALL' ? '역할' : formatRoleLabel(selectedRoleFilter)}
                          <FiChevronDown className={styles.filterChevron} aria-hidden="true" />
                        </button>
                        {isRoleSortOpen ? (
                          <div className={styles.filterMenu}>
                            <button
                              type="button"
                              className={`${styles.filterItem} ${selectedRoleFilter === 'ALL' ? styles.filterItemActive : ''}`}
                              onClick={() => handleSelectRoleFilter('ALL')}
                            >
                              전체 역할
                            </button>
                            <button
                              type="button"
                              className={`${styles.filterItem} ${
                                selectedRoleFilter === 'TRAINEE' ? styles.filterItemActive : ''
                              }`}
                              onClick={() => handleSelectRoleFilter('TRAINEE')}
                            >
                              훈련생
                            </button>
                            <button
                              type="button"
                              className={`${styles.filterItem} ${
                                selectedRoleFilter === 'GRADUATE' ? styles.filterItemActive : ''
                              }`}
                              onClick={() => handleSelectRoleFilter('GRADUATE')}
                            >
                              수료생
                            </button>
                            <button
                              type="button"
                              className={`${styles.filterItem} ${selectedRoleFilter === 'MENTOR' ? styles.filterItemActive : ''}`}
                              onClick={() => handleSelectRoleFilter('MENTOR')}
                            >
                              멘토
                            </button>
                            <button
                              type="button"
                              className={`${styles.filterItem} ${
                                selectedRoleFilter === 'INSTRUCTOR' ? styles.filterItemActive : ''
                              }`}
                              onClick={() => handleSelectRoleFilter('INSTRUCTOR')}
                            >
                              강사
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <div className={styles.filterDropdown}>
                        <button type="button" className={styles.filterButton} onClick={toggleCourseSort}>
                          {selectedCourseFilter === 'ALL' ? '과정' : selectedCourseFilter}
                          <FiChevronDown className={styles.filterChevron} aria-hidden="true" />
                        </button>
                        {isCourseSortOpen ? (
                          <div className={styles.filterMenu}>
                            <button
                              type="button"
                              className={`${styles.filterItem} ${selectedCourseFilter === 'ALL' ? styles.filterItemActive : ''}`}
                              onClick={() => handleSelectCourseFilter('ALL')}
                            >
                              전체 과정
                            </button>
                            {courseFilterOptions.map(course => (
                              <button
                                key={course}
                                type="button"
                                className={`${styles.filterItem} ${
                                  selectedCourseFilter === course ? styles.filterItemActive : ''
                                }`}
                                onClick={() => handleSelectCourseFilter(course)}
                              >
                                {course}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
                {selectedMenu === ADMIN_MENU_LABELS.USERS ? (
                  <div className={styles.usersActionDropdown}>
                    <button
                      type="button"
                      className={`${styles.filterButton} ${styles.usersActionButton}`}
                      onClick={isUsersEditMode ? handleSaveAllUserRoles : handleUserEdit}
                    >
                      {isUsersEditMode ? '저장' : '회원 편집'}
                    </button>
                  </div>
                ) : null}
              </div>
              {selectedMenu === ADMIN_MENU_LABELS.ACCESS_LOGS ? (
                <p className={styles.description}>※ 관리자 접속일지는 30일 이후 DB에서 자동으로 삭제됩니다.</p>
              ) : null}
            </header>

            <div className={styles.singleGrid}>
              {selectedMenu === ADMIN_MENU_LABELS.PENDING_USERS ? (
                <article className={`${styles.card} ${styles.tableCard}`}>
                  {isPendingUsersLoading ? (
                    <p className={styles.notice}>불러오는 중입니다.</p>
                  ) : filteredPendingUsers.length ? (
                    <>
                      <div className={styles.tableWrap}>
                        <table className={styles.pendingTable}>
                          <thead className={styles.pendingTableHead}>
                            <tr>
                              <th>순서</th>
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
                          <tbody className={styles.pendingTableBody}>
                            {filteredPendingUsers.map((user, index) => (
                              <tr key={user.id}>
                                <td>
                                  <div className={styles.orderCell}>
                                    <strong className={styles.orderIndex}>#{index + 1}</strong>
                                    <span className={styles.orderAgo}>({getRelativeTimeLabel(user.createdAt)})</span>
                                  </div>
                                </td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{formatPhoneNumber(user.phone)}</td>
                                <td>{user.birthDate ?? '-'}</td>
                                <td>
                                  <span
                                    className={`${styles.roleBadge} ${getRoleBadgeClassName(styles, user.requestedRole ?? user.role)}`}
                                  >
                                    {formatRoleLabel(user.requestedRole ?? user.role)}
                                  </span>
                                </td>
                                <td>{user.course ?? 'N/A'}</td>
                                <td>{formatDateTime(user.createdAt)}</td>
                                <td>
                                  <button
                                    type="button"
                                    className={`${styles.actionButton} ${styles.approveActionButton}`}
                                    onClick={() => handleUserApprove(user.id)}
                                  >
                                    승인 하기
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className={styles.notice}>승인 대기 회원이 없습니다.</p>
                  )}
                </article>
              ) : null}

              {selectedMenu === ADMIN_MENU_LABELS.USERS ? (
                <article className={`${styles.card} ${styles.tableCard}`}>
                  {isUsersLoading ? (
                    <p className={styles.notice}>불러오는 중입니다.</p>
                  ) : allUsers.length ? (
                    <div className={styles.tableWrap}>
                      <table className={styles.pendingTable}>
                        <thead className={styles.pendingTableHead}>
                          <tr>
                            <th>순서</th>
                            <th>이름</th>
                            <th>이메일</th>
                            <th>회원번호</th>
                            <th>전화번호</th>
                            <th>생년월일</th>
                            <th>역할</th>
                            <th>과정</th>
                            <th>가입일</th>
                          </tr>
                        </thead>
                        <tbody className={styles.pendingTableBody}>
                          {allUsers.map((user, index) => (
                            <tr key={user.id}>
                              <td>#{index + 1}</td>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>{user.id}</td>
                              <td>{formatPhoneNumber(user.phone)}</td>
                              <td>{user.birthDate ?? '-'}</td>
                              <td>
                                {isUsersEditMode ? (
                                  <select
                                    className={styles.userRoleSelect}
                                    value={userRoleDrafts[user.id] ?? user.requestedRole ?? user.role}
                                    onChange={event => handleChangeUserRoleDraft(user.id, event.target.value)}
                                  >
                                    <option value="TRAINEE">훈련생</option>
                                    <option value="GRADUATE">수료생</option>
                                    <option value="MENTOR">멘토</option>
                                    <option value="INSTRUCTOR">강사</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`${styles.roleBadge} ${getRoleBadgeClassName(styles, user.requestedRole ?? user.role)}`}
                                  >
                                    {formatRoleLabel(user.requestedRole ?? user.role)}
                                  </span>
                                )}
                              </td>
                              <td>{user.course ?? 'N/A'}</td>
                              <td>{formatDateTime(user.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className={styles.notice}>회원 목록이 없습니다.</p>
                  )}
                </article>
              ) : null}

              {selectedMenu === ADMIN_MENU_LABELS.REPORTS ? (
                <article className={`${styles.card} ${styles.tableCard}`}>
                  {isReportsLoading ? (
                    <p className={styles.notice}>불러오는 중입니다.</p>
                  ) : reports.length ? (
                    <div className={styles.tableWrap}>
                      <table className={styles.pendingTable}>
                        <thead className={styles.pendingTableHead}>
                          <tr>
                            <th>순서</th>
                            <th>제목</th>
                            <th>내용</th>
                            <th>첨부 이미지</th>
                            <th>신고자</th>
                            <th>접수일</th>
                            <th>상태</th>
                            <th>처리</th>
                          </tr>
                        </thead>
                        <tbody className={styles.pendingTableBody}>
                          {reports.map((report, index) => {
                            const isExpanded = Boolean(expandedReports[report.id]);
                            const reportBodyText = getReportBodyText(report.content);
                            const reportImageUrls = getReportImageUrls(report.content);
                            const canExpand = report.title.length > 26 || reportBodyText.length > 80;
                            const isOpen = report.status === 'OPEN';
                            const isResolved = report.status === 'RESOLVED';
                            const isRejected = report.status === 'REJECTED';
                            const isClosed = isResolved || isRejected;

                            return (
                              <tr key={report.id}>
                                <td>#{index + 1}</td>
                                <td>
                                  <div className={styles.reportTitleRow}>
                                    <p className={`${styles.reportTitleCell} ${isExpanded ? styles.reportCellExpanded : ''}`}>
                                      {report.title}
                                    </p>
                                    {canExpand ? (
                                      <button
                                        type="button"
                                        className={styles.reportExpandButton}
                                        onClick={() => handleToggleReportExpand(report.id)}
                                        aria-label={isExpanded ? '신고 내용 접기' : '신고 내용 펼치기'}
                                      >
                                        <FiChevronDown
                                          className={`${styles.reportExpandIcon} ${isExpanded ? styles.reportExpandIconOpen : ''}`}
                                          aria-hidden="true"
                                        />
                                      </button>
                                    ) : null}
                                  </div>
                                </td>
                                <td>
                                  <div className={styles.reportContentRow}>
                                    <p className={`${styles.reportContentCell} ${isExpanded ? styles.reportCellExpanded : ''}`}>
                                      {reportBodyText}
                                    </p>
                                  </div>
                                </td>
                                <td>
                                  {reportImageUrls.length ? (
                                    <div className={styles.reportImageList}>
                                      {reportImageUrls.map(imageUrl => (
                                        <a
                                          key={`${report.id}-${imageUrl}`}
                                          className={styles.reportImageLink}
                                          href={imageUrl}
                                          target="_blank"
                                          rel="noreferrer noopener"
                                          title="원본 이미지 열기"
                                        >
                                          <Image
                                            src={imageUrl}
                                            alt="신고 첨부 이미지"
                                            width={56}
                                            height={56}
                                            className={styles.reportImageThumbnail}
                                            unoptimized
                                          />
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <span>N/A</span>
                                  )}
                                </td>
                                <td>{formatReporterLabel(report.reporterUserId, report.reporterName, report.reporterEmail)}</td>
                                <td>{formatDateTime(report.createdAt)}</td>
                                <td>
                                  <span
                                    className={`${styles.auditResultBadge} ${getReportStatusBadgeClassName(styles, report.status)}`}
                                  >
                                    <span className={styles.auditResultDot} aria-hidden="true" />
                                    {getReportStatusLabel(report.status)}
                                  </span>
                                </td>
                                <td>
                                  {!isClosed ? (
                                    <div className={styles.reportActionGroup}>
                                      {isOpen ? (
                                        <button
                                          type="button"
                                          className={styles.reportActionButton}
                                          onClick={() => handleStatusChange(report.id, 'IN_PROGRESS')}
                                        >
                                          검토 시작
                                        </button>
                                      ) : null}
                                      <button
                                        type="button"
                                        className={styles.reportActionButton}
                                        onClick={() => handleStatusChange(report.id, 'RESOLVED')}
                                      >
                                        해결
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.reportActionButton}
                                        onClick={() => handleStatusChange(report.id, 'REJECTED')}
                                      >
                                        반려
                                      </button>
                                    </div>
                                  ) : null}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className={styles.notice}>신고 내역이 없습니다.</p>
                  )}
                </article>
              ) : null}

              {selectedMenu === ADMIN_MENU_LABELS.AUDIT_LOGS ? (
                <article className={`${styles.card} ${styles.tableCard}`}>
                  {isLogsLoading ? (
                    <p className={styles.notice}>불러오는 중입니다.</p>
                  ) : auditLogs.length ? (
                    <div className={styles.tableWrap}>
                      <table className={styles.pendingTable}>
                        <thead className={styles.pendingTableHead}>
                          <tr>
                            <th>순서</th>
                            <th>작업</th>
                            <th>대상</th>
                            <th>변경 전</th>
                            <th className={styles.auditDiffArrowCell} aria-label="변경 방향">
                              <FiChevronRight aria-hidden="true" />
                            </th>
                            <th>변경 후</th>
                            <th>시각</th>
                            <th>결과</th>
                          </tr>
                        </thead>
                        <tbody className={styles.pendingTableBody}>
                          {auditLogs.map((log, index) => (
                            <tr key={log.id}>
                              <td>#{index + 1}</td>
                              <td>{formatAuditActionLabel(log.action)}</td>
                              <td>
                                {formatAuditTargetLabel(log.targetType, log.targetId, log.targetName, log.targetEmail)}
                              </td>
                              <td>{formatAuditBeforeLabel(log.payload)}</td>
                              <td className={styles.auditDiffArrowCell}>
                                <FiChevronRight aria-hidden="true" />
                              </td>
                              <td>{formatAuditAfterLabel(log.payload)}</td>
                              <td>{formatDateTime(log.createdAt)}</td>
                              <td>
                                <span
                                  className={`${styles.auditResultBadge} ${getAuditResultBadgeClassName(styles, log.payload)}`}
                                >
                                  <span className={styles.auditResultDot} aria-hidden="true" />
                                  {formatAuditResultLabel(log.payload)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className={styles.notice}>감사 로그가 없습니다.</p>
                  )}
                </article>
              ) : null}

              {selectedMenu === ADMIN_MENU_LABELS.ACCESS_LOGS ? (
                <article className={`${styles.card} ${styles.tableCard}`}>
                  {isAccessLogsLoading ? (
                    <p className={styles.notice}>불러오는 중입니다.</p>
                  ) : accessLogs.length ? (
                    <>
                      <div className={styles.tableWrap}>
                        <table className={styles.pendingTable}>
                          <thead className={styles.pendingTableHead}>
                            <tr>
                              <th>순서</th>
                              <th>관리자</th>
                              <th>로그인 시각</th>
                              <th>로그아웃 시각</th>
                              <th>접속 IP</th>
                              <th>브라우저</th>
                              <th>세션 시간</th>
                              <th>상태</th>
                            </tr>
                          </thead>
                          <tbody className={styles.pendingTableBody}>
                            {accessLogs.map((log, index) => (
                              <tr key={log.id}>
                                <td>#{index + 1}</td>
                                <td>{`${log.adminName} (${log.adminEmail})`}</td>
                                <td>{formatDateTime(log.loginAt)}</td>
                                <td>{log.logoutAt ? formatDateTime(log.logoutAt) : 'N/A'}</td>
                                <td>{log.ipAddress}</td>
                                <td>{formatUserAgentLabel(log.userAgent)}</td>
                                <td>{formatSessionDuration(log.sessionDurationSec)}</td>
                                <td>
                                  <span
                                    className={`${styles.auditResultBadge} ${getAccessStatusBadgeClassName(styles, log.status)}`}
                                  >
                                    <span className={styles.auditResultDot} aria-hidden="true" />
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div
                          ref={accessLogsLoadMoreRef}
                          className={styles.accessLogsLoadMoreTrigger}
                          aria-hidden="true"
                        />
                      </div>
                      {isAccessLogsFetchingMore ? (
                        <p className={styles.notice}>다음 로그를 불러오는 중입니다.</p>
                      ) : null}
                      {!hasNextAccessLogsPage ? <p className={styles.notice}>모든 로그를 확인했습니다.</p> : null}
                    </>
                  ) : (
                    <p className={styles.notice}>접속 이력이 없습니다.</p>
                  )}
                </article>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}
