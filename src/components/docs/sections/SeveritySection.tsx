import styles from "../docs.module.css";

export default function SeveritySection({
  severityLabel,
  title,
  intro,
  vulnerabilities,
  impactTitle,
  impactDesc,
  remediation,
  badgeClass,
  impactBoxClass,
  impactTitleClass,
  detailCardClass,
}: {
  severityLabel: string;
  title: string;
  intro: string;
  vulnerabilities: { label: string; desc: string }[];
  impactTitle: string;
  impactDesc: string;
  remediation: string;
  badgeClass: string;
  impactBoxClass: string;
  impactTitleClass: string;
  detailCardClass: string;
}) {
  return (
    <div className={styles.docSectionHeader}>
      <div className={`${styles.severityBadge} ${badgeClass}`}>
        <span className={styles.badgeDot} />
        {severityLabel} Severity
      </div>
      <h2 className={styles.sectionHeadline}>{title}</h2>
      <p className={styles.sectionIntro}>{intro}</p>

      <div className={styles.sectionGrid}>
        <div className={`${styles.detailCard} ${detailCardClass}`}>
          <div className={styles.cardTitle}>Vulnerabilities Tested</div>
          <ul className={styles.bulletList}>
            {vulnerabilities.map((v, i) => (
              <li key={i} className={styles.bulletItem}>
                <span className={styles.bulletDot} />
                <strong>{v.label}:</strong> {v.desc}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`${styles.impactBox} ${impactBoxClass}`}>
        <span className={`${styles.impactTitle} ${impactTitleClass}`}>
          {impactTitle}
        </span>
        <p className={styles.impactDesc}>{impactDesc}</p>
      </div>

      <div className={styles.remediationCard}>
        <div className={styles.remediationTitle}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Remediation Strategy
        </div>
        <p className={styles.remediationDesc}>{remediation}</p>
      </div>
    </div>
  );
}
