"use client";

import type { FAQ } from "@/lib/landing-data";
import styles from "./FAQ.module.css";

interface FAQProps {
  faqs: FAQ[];
  activeFaq: number | null;
  onToggle: (index: number) => void;
}

export default function FAQ({ faqs, activeFaq, onToggle }: FAQProps) {
  return (
    <section id="faq" className={styles.section}>
      <div className={styles.faqContainer}>
        <div className={styles.faqHeader}>
          <p className={styles.sectionLabel}>FAQ</p>
          <h2 className={styles.sectionHeadline}>Frequently Asked Questions</h2>
          <p className={styles.sectionSubtext}>
            Everything you need to know about the product and how it integrates
            into your workflow.
          </p>
        </div>
        <div className={styles.faqList}>
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={faq.id}
                className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ""}`}
              >
                <button
                  className={styles.faqQuestion}
                  onClick={() => onToggle(idx)}
                >
                  <span>{faq.question}</span>
                  <div
                    className={`${styles.faqIcon} ${isOpen ? styles.faqIconRotate : ""}`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div
                  className={styles.faqAnswerWrapper}
                  style={{ maxHeight: isOpen ? "500px" : "0" }}
                >
                  <div className={styles.faqAnswer}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
