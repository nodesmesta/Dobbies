import styles from "../docs.module.css";

export function sevBadge(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return styles.badgeCritical;
    case "high":
      return styles.badgeHigh;
    case "medium":
      return styles.badgeMedium;
    case "low":
      return styles.badgeLow;
    default:
      return "";
  }
}
