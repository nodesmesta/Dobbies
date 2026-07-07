"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { OrchestrationStep } from "@/lib/landing-data";
import styles from "./Orchestration.module.css";

interface OrchestrationProps {
  steps: OrchestrationStep[];
  activeStep: number;
  onStepChange: (step: number) => void;
}

/** Icons for flow chart nodes */
const flowIcons: React.ReactNode[] = [
  <svg key="file" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>,
  <svg key="bolt" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>,
  <svg key="grid" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>,
  <svg key="shield" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>,
];

const flowLabels = ["Ingest", "Analyze", "Simulate", "Report"];

/* ─── Wheel geometry ───────────────────────────────── */
const WHEEL_SIZE = 280;
const WHEEL_RADIUS = 100;
const CX = WHEEL_SIZE / 2;
const CY = WHEEL_SIZE / 2;

/** 4 fixed physical positions on the wheel (top, right, bottom, left) */
const NODE_POSITIONS = [
  { x: CX, y: CY - WHEEL_RADIUS },  // top
  { x: CX + WHEEL_RADIUS, y: CY },  // right
  { x: CX, y: CY + WHEEL_RADIUS },  // bottom
  { x: CX - WHEEL_RADIUS, y: CY },  // left
];

export default function Orchestration({
  steps,
  activeStep,
  onStepChange,
}: OrchestrationProps) {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleStep, setVisibleStep] = useState(activeStep);
  const sectionRef = useRef<HTMLElement>(null);
  const [isWheelFixed, setIsWheelFixed] = useState(false);

  /* ── Fix left column at 100px the moment section enters view ── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const scrollSection = section;

    function handleScroll() {
      const rect = scrollSection.getBoundingClientRect();
      // Fixed when section top is near/past navbar AND section bottom is
      // still in view (prevents leftover fixed after scrolling past)
      setIsWheelFixed(rect.top <= 100 && rect.bottom > 400);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ── IntersectionObserver: track which step is scrolled into view ── */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const count = steps.length;

    for (let i = 0; i < count; i++) {
      const el = stepRefs.current[i];
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleStep(i);
            onStepChange(i);
          }
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0.1 },
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => {
      observers.forEach((obs, i) => {
        const el = stepRefs.current[i];
        if (el) obs.unobserve(el);
      });
    };
  }, [steps.length, onStepChange]);

  /* Sync visibleStep when activeStep changes from parent */
  useEffect(() => {
    setVisibleStep(activeStep);
  }, [activeStep]);

  const isActive = useCallback(
    (i: number) => visibleStep === i || (visibleStep < 0 && i === 0),
    [visibleStep],
  );

  /* ── Click circle → smooth scroll to step ── */
  const scrollToStep = useCallback(
    (i: number) => {
      const el = stepRefs.current[i];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      onStepChange(i);
    },
    [onStepChange],
  );

  /* ── Map logical step index to physical wheel position ── */
  const stepToPosition = useCallback(
    (stepIndex: number) => ((stepIndex - activeStep) % 4 + 4) % 4,
    [activeStep],
  );

  /* ── Memoised position for each step node ── */
  const nodePositions = useMemo(
    () =>
      steps.map((_, i) => {
        const posIdx = stepToPosition(i);
        const pos = NODE_POSITIONS[posIdx];
        return { dx: pos.x - CX, dy: pos.y - CY };
      }),
    [steps, stepToPosition],
  );

  return (
    <section id="orchestration" className={styles.orchestrationSection}>
      {/* Two-column layout */}
      <div className={styles.orchestrationContainer}>
        {/* ─── Left Column: Rotating Wheel Flowchart ─── */}
        <div className={styles.wheelOuter}>
          {/* Section header inside left column, above the wheel */}
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Orchestration</p>
            <h2 className={styles.sectionHeadline}>Orchestration Pipeline</h2>
            <p className={styles.sectionSubtext}>
              A robust, 4-stage automated auditing framework designed specifically
              for AI Agents.
            </p>
          </div>

          <div
            className={styles.wheelContainer}
            style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
          >
            {/* SVG: track circle + arc connectors */}
            <svg
              className={styles.wheelSvg}
              width={WHEEL_SIZE}
              height={WHEEL_SIZE}
              viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
            >
              {/* Full dashed circle track — always visible, full opacity */}
              <circle
                cx={CX}
                cy={CY}
                r={WHEEL_RADIUS}
                fill="none"
                stroke="rgba(52, 211, 153, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="5 7"
                strokeLinecap="round"
              />
            </svg>

            {/* Animated node circles */}
            {steps.map((step, i) => {
              const active = isActive(i);
              const isDanger = step.statusType === "danger";
              const { dx, dy } = nodePositions[i];

              let circleClass = styles.wheelNodeCircle;
              if (active) {
                circleClass += isDanger
                  ? ` ${styles.wheelNodeCircleDanger}`
                  : ` ${styles.wheelNodeCircleActive}`;
              }

              return (
                <div
                  key={step.index}
                  className={styles.wheelNode}
                  style={{
                    transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
                  }}
                  onClick={() => scrollToStep(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      scrollToStep(i);
                  }}
                  aria-label={`Go to step ${step.index}: ${step.title}`}
                >
                  <div className={circleClass}>
                    <div className={styles.wheelNodeIcon}>
                      {flowIcons[i] ?? flowIcons[0]}
                    </div>
                  </div>
                  <span className={styles.wheelNodeLabel}>
                    {flowLabels[i] ?? step.shortDesc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Right Column: Scrollable Steps ─── */}
        <div className={styles.orchestrationScroll}>
          {steps.map((step, i) => {
            const active = isActive(i);
            let activeClass = "";
            if (active) {
              if (step.statusType === "danger") {
                activeClass = styles.pipelineStepActiveCompromised;
              } else if (step.statusType === "warning") {
                activeClass = styles.pipelineStepActiveWarning;
              } else {
                activeClass = styles.pipelineStepActive;
              }
            }

            return (
              <div
                key={step.index}
                id={`orch-step-${i}`}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className={`${styles.pipelineStep} ${activeClass}`}
              >
                {/* Vertical flow indicator column */}
                <div className={styles.pipelineFlowCol}>
                  {i !== 0 && (
                    <div className={styles.pipelineConnectorIncoming} />
                  )}
                  <div className={styles.pipelineStepBadge}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  {i !== steps.length - 1 && (
                    <div className={styles.pipelineConnectorOutgoing} />
                  )}
                </div>

                {/* Horizontal connector arrow */}
                <div className={styles.pipelineHorizontalConnector} />

                {/* Content column */}
                <div className={styles.pipelineContentCol}>
                  <div className={styles.pipelineStepHeader}>
                    <span className={styles.pipelineStepNumber}>
                      STEP {step.index}
                    </span>
                    {step.statusType === "danger" && (
                      <span className={styles.stepStatusBadgeCompromised}>
                        Compromised
                      </span>
                    )}
                    {step.statusType === "warning" && (
                      <span className={styles.stepStatusBadgeWarning}>
                        Warning
                      </span>
                    )}
                    {step.statusType === "success" && active && (
                      <span className={styles.stepStatusBadgeActive}>
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className={styles.pipelineStepTitle}>{step.title}</h3>
                  {step.shortDesc && (
                    <p className={styles.pipelineStepSubtitle}>
                      {step.shortDesc}
                    </p>
                  )}
                  <p className={styles.pipelineStepDesc}>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
