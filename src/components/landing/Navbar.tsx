"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""}`}>
        <Link href="/" className={styles.navLogo}>
          <div className={styles.navLogoMark}>
            <Image
              src="/dobbies.png"
              alt="Dobbies Logo"
              width={28}
              height={28}
              style={{ objectFit: "contain" }}
            />
          </div>
          Dobbies
        </Link>

        <div className={styles.navLinks}>
          <a href="#capabilities" className={styles.navLink}>
            Capabilities
          </a>
          <a href="#orchestration" className={styles.navLink}>
            Orchestration
          </a>
          <a href="#scope" className={styles.navLink}>
            Scope
          </a>
          <a href="#faq" className={styles.navLink}>
            FAQ
          </a>
        </div>

        <div className={styles.navActions}>
          <Link href="/dashboard" className={styles.btnGhost}>
            Sign In
          </Link>
        </div>

        <button
          className={styles.navHamburger}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 3l12 12M15 3L3 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M2 5h14M2 9h14M2 13h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </nav>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuBackdrop} onClick={() => setMenuOpen(false)} />
          <div className={styles.mobileMenuPanel}>
            <a
              href="#capabilities"
              className={styles.mobileMenuLink}
              onClick={() => setMenuOpen(false)}
            >
              Capabilities
            </a>
            <a
              href="#orchestration"
              className={styles.mobileMenuLink}
              onClick={() => setMenuOpen(false)}
            >
              Orchestration
            </a>
            <a
              href="#scope"
              className={styles.mobileMenuLink}
              onClick={() => setMenuOpen(false)}
            >
              Scope
            </a>
            <a
              href="#faq"
              className={styles.mobileMenuLink}
              onClick={() => setMenuOpen(false)}
            >
              FAQ
            </a>
            <div className={styles.mobileMenuDivider} />
            <Link
              href="/dashboard"
              className={styles.mobileMenuLink}
              onClick={() => setMenuOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
