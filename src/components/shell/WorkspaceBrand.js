import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/logo.png';
import styles from './workspaceBrand.module.css';

export default function WorkspaceBrand({ role, dark = false, onClick }) {
  return (
    <Link href="/" className={`${styles.brand} ${dark ? styles.dark : ''}`} onClick={onClick} aria-label="TechNeeds IGDTUW home">
      <span className={styles.mark}>
        <Image src={logo} alt="" width={48} height={48} sizes="48px" />
      </span>
      <span className={styles.wordmark}>TechNeeds<small>{role ? `${role} workspace` : 'IGDTUW'}</small></span>
    </Link>
  );
}
