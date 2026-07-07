import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './CTA.module.css';

export default function CTA() {
  return (
    <section id="cta" className={styles.ctaSection}>
      <div className={styles.ctaContainer}>
        <div className={styles.ctaBadge}>Get Started</div>
        <h2 className={styles.ctaHeadline}>Secure your AI agents today</h2>
        <p className={styles.ctaSubtext}>
          Get comprehensive security insights and protect your AI agents from the
          latest threats.
        </p>
        <div className={styles.ctaActions}>
          <Link href="/docs" className={styles.ctaPrimaryBtn}>
            Start for Free
            <ArrowRight className={styles.ctaBtnIcon} size={18} />
          </Link>
          <Link href="/dashboard" className={styles.ctaGhostBtn}>
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
