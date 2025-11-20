import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.container}>
      <div className={styles.wrap}>
        <div className={styles.footer_bottom}>
          <p className={styles.copyright}>© {new Date().getFullYear()} Himedia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
