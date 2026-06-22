import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import HomeSectionReveal from "./HomeSectionReveal";

const ShippingGlobe = dynamic(() => import("../globe/ShippingGlobe"), {
  ssr: false,
  loading: () => (
    <div className="home-globe-skeleton" aria-hidden>
      <div className="home-globe-skeleton__shimmer" />
    </div>
  ),
});

function useGlobeInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.08),
      { threshold: [0, 0.08, 0.2] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, inView };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function HomeGlobeSection() {
  const { ref, inView } = useGlobeInView();
  const reducedMotion = useReducedMotion();
  const [height, setHeight] = useState(580);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const update = () => setHeight(window.innerWidth < 768 ? 420 : 580);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div ref={ref} className="home-globe-section-wrap">
      <HomeSectionReveal className="home-globe-section mb-10" variant="fadeIn" delay={0.06}>
        <ShippingGlobe
          mode="home"
          active={inView && tabVisible}
          reducedMotion={reducedMotion}
          height={height}
          className="home-globe-section__canvas"
        />
      </HomeSectionReveal>
    </div>
  );
}