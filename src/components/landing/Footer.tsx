import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer id="footer" className={styles.footer}>
      {/* Subtle top glow */}
      <div className={styles.footerGlow} />

      <div className={styles.footerContainer}>
        <div className={styles.footerGrid}>
          {/* Brand */}
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.footerLogo}>
              <div className={styles.footerLogoMark}>
                <Image
                  src="/dobbies.png"
                  alt="Dobbies Logo"
                  width={24}
                  height={24}
                  style={{ objectFit: "contain" }}
                />
              </div>
              <span>Dobbies</span>
            </Link>
            <p className={styles.footerTagline}>
              Automated AI Agent Security Auditor — RAG-powered static analysis
              combined with multi-turn red-teaming simulation.
            </p>
            <div className={styles.footerSocial}>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerSocialLink}
                aria-label="GitHub"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerSocialLink}
                aria-label="Twitter / X"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Product</h4>
            <Link href="/docs" className={styles.footerLink}>
              Documentation
            </Link>
            <a href="#capabilities" className={styles.footerLink}>
              Features
            </a>
            <a href="#orchestration" className={styles.footerLink}>
              How It Works
            </a>
            <Link href="/login" className={styles.footerLink}>
              Start Auditing
            </Link>
          </div>

          {/* Resources */}
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Resources</h4>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              GitHub
            </a>
            <a href="#faq" className={styles.footerLink}>
              FAQ
            </a>
            <a href="#scope" className={styles.footerLink}>
              Coverage Scope
            </a>
          </div>

          {/* Company */}
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Company</h4>
            <span className={styles.footerLinkMuted}>About</span>
            <span className={styles.footerLinkMuted}>Blog</span>
            <span className={styles.footerLinkMuted}>Careers</span>
            <span className={styles.footerLinkMuted}>Contact</span>
          </div>
        </div>

        {/* Bottom */}
        <div className={styles.footerBottom}>
          <span className={styles.footerCopyright}>
            &copy; {new Date().getFullYear()} Dobbies. All rights reserved.
          </span>
          <div className={styles.footerBottomLinks}>
            <Link href="/docs#privacy" className={styles.footerBottomLink}>Privacy Policy</Link>
            <Link href="/docs#terms" className={styles.footerBottomLink}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
