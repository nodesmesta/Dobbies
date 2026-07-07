"use client";

import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Orchestration from "@/components/landing/Orchestration";
import Scope from "@/components/landing/Scope";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { features, orchestrationSteps, faqs } from "@/lib/landing-data";
import styles from "./page.module.css";

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  function toggleFaq(index: number) {
    setActiveFaq(activeFaq === index ? null : index);
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <Hero />
      <Features features={features} />
      <Orchestration
        steps={orchestrationSteps}
        activeStep={activeStep}
        onStepChange={setActiveStep}
      />
      <Scope />
      <FAQ faqs={faqs} activeFaq={activeFaq} onToggle={toggleFaq} />
      <CTA />
      <Footer />
    </div>
  );
}
