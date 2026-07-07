import type { Feature } from "@/lib/landing-data";
import styles from "./Features.module.css";

interface FeaturesProps {
  features: Feature[];
}

const iconMap: Record<string, string> = {
  iconBlue: styles.iconBlue,
  iconPurple: styles.iconPurple,
  iconCyan: styles.iconCyan,
  iconGreen: styles.iconGreen,
};

export default function Features({ features }: FeaturesProps) {
  return (
    <section id="capabilities" className={styles.section}>
      <span className={styles.sectionLabel}>Capabilities</span>
      <h2 className={styles.sectionHeadline}>
        Everything needed to secure an AI agent
      </h2>
      <p className={styles.sectionSubtext}>
        From static policy scanning to live AI vs AI adversarial simulation, Dobbies
        covers the full threat surface of a deployed language model agent.
      </p>

      <div className={styles.featuresGrid}>
        {features.map((feature) => (
          <div key={feature.label} className={styles.featureCard}>
            <div
              className={`${styles.featureIcon} ${iconMap[feature.iconClass] ?? ""}`}
            >
              {feature.label}
            </div>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureDesc}>{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
