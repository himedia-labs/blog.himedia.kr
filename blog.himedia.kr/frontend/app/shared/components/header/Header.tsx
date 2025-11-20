'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CiBellOff, CiBellOn, CiMenuBurger, CiSearch, CiUser } from 'react-icons/ci';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { IconType } from 'react-icons';

import styles from './Header.module.css';

type NavItem = {
  label: string;
  href?: string;
  Icon: IconType;
};

const NAV_ITEMS: NavItem[] = [
  { label: '알림', Icon: CiBellOn },
  { label: '검색', Icon: CiSearch },
  { label: '로그인', href: '/login', Icon: CiUser },
];

export default function Header() {
  const pathname = usePathname();
  const [isBellOn, setIsBellOn] = useState(true);

  return (
    <header className={styles.container}>
      <div className={styles.wrap}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>
            <Image src="/icon/logo.png" alt="하이미디어아카데미 로고" fill priority sizes="90px" draggable={false} />
          </span>
          <span className={styles.logoText}>Himedia Community</span>
        </Link>

        <nav className={styles.nav} aria-label="주요 메뉴">
          <ul>
            {NAV_ITEMS.map(item => {
              const isLink = Boolean(item.href);
              const isActive =
                isLink && item.href
                  ? item.href !== '/'
                    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                    : pathname === '/'
                  : false;
              const linkClassName = isActive ? `${styles.navLink} ${styles.navActive}` : styles.navLink;
              const isBellItem = item.label === '알림';
              const IconComponent = isBellItem ? (isBellOn ? CiBellOn : CiBellOff) : item.Icon;

              return (
                <li key={item.label}>
                  {isLink ? (
                    <Link
                      href={item.href as string}
                      className={linkClassName}
                      aria-label={item.label}
                      title={item.label}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <IconComponent aria-hidden="true" focusable="false" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.navLink} ${styles.navButton}`}
                      aria-label={item.label}
                      title={item.label}
                      onClick={isBellItem ? () => setIsBellOn(prev => !prev) : undefined}
                    >
                      <IconComponent aria-hidden="true" focusable="false" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile Menu Button */}
        <button className={styles.menuButton} aria-label="메뉴 열기">
          <CiMenuBurger />
        </button>
      </div>
    </header>
  );
}
