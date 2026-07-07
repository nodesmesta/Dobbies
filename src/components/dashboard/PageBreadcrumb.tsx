"use client";

interface Crumb {
  label: string;
  /** Optional — if provided, renders as a clickable item */
  onClick?: () => void;
}

interface PageBreadcrumbProps {
  crumbs: Crumb[];
}

/**
 * Renders a breadcrumb nav: Dashboard > Overview  (or deeper levels).
 * The last crumb is always the current page and is non-clickable.
 */
export default function PageBreadcrumb({ crumbs }: PageBreadcrumbProps) {
  return (
    <nav className="page-breadcrumb" aria-label="Breadcrumb">
      <ol className="page-breadcrumb-list">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="page-breadcrumb-item">
              {!isLast && crumb.onClick ? (
                <button
                  className="page-breadcrumb-link"
                  onClick={crumb.onClick}
                  type="button"
                >
                  {crumb.label}
                </button>
              ) : (
                <span
                  className="page-breadcrumb-current"
                  aria-current={isLast ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <svg
                  className="page-breadcrumb-sep"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4.5 2.5l3 3-3 3"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
