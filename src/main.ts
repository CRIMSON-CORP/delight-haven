import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Swiper from "swiper/bundle";
import "swiper/css/bundle";
import Lenis from "lenis";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

window.addEventListener("DOMContentLoaded", () => {
  // --- Initialize Lenis Smooth Scrolling ---
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  });

  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Sync Lenis with ScrollTrigger
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // --- Testimonials Swiper ---
  new Swiper(".testimonials-swiper", {
    slidesPerView: "auto",
    spaceBetween: 8,
    navigation: {
      nextEl: ".testimonials-next",
      prevEl: ".testimonials-prev",
    },
  });

  // --- Services Hero: Stacked Image Reveal ---
  const servicesHeroGroup = document.querySelector<HTMLElement>("#services-hero-group");
  if (servicesHeroGroup) {
    const [mainImg, leftImg, rightImg] = [
      ...servicesHeroGroup.querySelectorAll<HTMLElement>("img"),
    ];

    // Compute pixel offset to place each side image dead-centre behind the main image.
    // Both side images have CSS `top: 50%` + `left/right: -20px` (no CSS transforms now).
    // We read offsetWidth after the browser has laid things out so the calc is exact.
    const mainW = mainImg.offsetWidth;
    const sideW = leftImg.offsetWidth;
    // How far right to push leftImg so its visual centre aligns with main image's centre:
    //   leftImg base left edge = wrapper.left - 20px (from -left-5)
    //   mainImg centre (relative to wrapper) ≈ mainW / 2
    //   sideImg needs its centre at mainW / 2  →  startX = mainW / 2 - sideW / 2 + 20
    const startX = mainW / 2 - sideW / 2 + 20;

    // Set side images to their starting state (stacked on center, vertically centred)
    gsap.set([leftImg, rightImg], { y: "-50%" });
    gsap.set(leftImg, { x: startX });
    gsap.set(rightImg, { x: -startX });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.15 });

    // 1. Main image zooms out from enlarged to natural size
    tl.fromTo(mainImg, { scale: 1.5 }, { scale: 1, duration: 1.4, ease: "expo.out" });

    // 2. Left image slides out from behind the center (staggered)
    tl.fromTo(
      leftImg,
      { x: startX, y: "-50%", opacity: 0 },
      { x: -(sideW + 20), y: "-50%", opacity: 1, duration: 1.4, ease: "expo.out" },
      "-=1.15",
    );

    // 3. Right image slides out from behind the center (staggered)
    tl.fromTo(
      rightImg,
      { x: -startX, y: "-50%", opacity: 0 },
      { x: sideW + 20, y: "-50%", opacity: 1, duration: 1.4, ease: "expo.out" },
      "-=1.25",
    );
  }

  // --- Hero Section Animations ---
  const heroTl = gsap.timeline({
    defaults: { ease: "power3.out", duration: 1.2 },
  });

  heroTl
    .from("#hero img:not(#services-hero-group img)", {
      scale: 1.4,
      duration: 3,
      delay: 0.25,
      ease: "expo.out",
    })
    .from(
      "#hero .max-w-190 > div:first-child, #hero h1, #hero p",
      {
        y: 60,
        opacity: 0,
        stagger: 0.25,
      },
      "-=2.5",
    )
    .from(
      "#hero .mt-5 a",
      {
        scale: 0.75,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "back.out(1.3)",
      },
      "-=1.75",
    );

  // --- Why Section Animations ---
  const whySection = document.querySelector("#why");
  if (whySection) {
    const whyTl = gsap.timeline({
      scrollTrigger: {
        trigger: whySection,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    // 1. Girl image fades in from bottom
    whyTl.from("#why-girl", {
      y: 200,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
    });

    // 2. Bulb fades in from its bottom
    whyTl.from("#bulb", {
      y: 100,
      x: 100,
      opacity: 0,
      duration: 0.75,
      ease: "back.out(1.5)",
    });

    // 3. Bulb rays animate path length (infinite loop)
    const rays = document.querySelectorAll("#bulb-rays path");
    rays.forEach((ray) => {
      const length = (ray as SVGPathElement).getTotalLength();
      // Set initial state: stroke visible but using dash to hide it potentially?
      // Actually, user wants them to animate path length.
      gsap.set(ray, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(ray, {
        strokeDashoffset: 0,
        duration: 0.5,
        repeat: -1,
        ease: "sine.inOut",
        delay: Math.random() * 0.5,
      });
    });

    // 4. Second SVG: Spine path length animation (via mask)
    const spineDrawPath = document.querySelector("#spine-draw-path") as SVGPathElement;
    if (spineDrawPath) {
      const spineLength = spineDrawPath.getTotalLength();
      gsap.set(spineDrawPath, {
        strokeDasharray: spineLength,
        strokeDashoffset: -spineLength,
      });

      whyTl.to(
        spineDrawPath,
        {
          strokeDashoffset: 0,
          duration: 2,
          ease: "power1.inOut",
        },
        "-=0.5",
      );
    }

    // 5. Items fade in staggered
    whyTl.from(
      ".item",
      {
        opacity: 0,
        y: 20,
        stagger: 0.25,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=1.5",
    );
  }

  // --- Approach Section: CSS Clip-Path Diagonal Reveal + Infinite Wave Draw ---
  const approachWrap = document.querySelector("#approach-svg-wrap") as HTMLElement | null;
  const approachSvg = document.querySelector("#approach-svg");

  if (approachWrap && approachSvg) {
    // Polygon: a parallelogram that sweeps left → right.
    // The left edge of the wipe is a 45° diagonal: top corner leads, bottom corner trails by 100%.
    // Start: entire polygon is off the left edge (nothing visible).
    // End:   polygon covers the full element plus overshoot to the right.
    //   from: polygon(0% 0%,  0% 0%,  -100% 100%,  -100% 100%)  ← collapsed at top-left
    //   to:   polygon(0% 0%,  200% 0%,  100% 100%,  0% 100%)     ← full reveal + overshoot
    gsap.fromTo(
      approachWrap,
      { clipPath: "polygon(0% 0%, 0% 0%, -100% 100%, -100% 100%)" },
      {
        clipPath: "polygon(0% 0%, 200% 0%, 100% 100%, 0% 100%)",
        duration: 3,
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: approachWrap,
          start: "top 78%",
          toggleActions: "play none none none",
        },
      },
    );

    // Infinite wave-draw: cycle strokeDashoffset on every wavy path so they flow continuously
    const wavyPathGroups = approachSvg.querySelectorAll<SVGGElement>(".wavy-path-group");
    wavyPathGroups.forEach((pathGroup, i) => {
      const paths = [...pathGroup.children] as SVGPathElement[];
      paths.forEach((path, j) => {
        const len = Math.ceil(path.getTotalLength() + 10);
        const isLastPath = j === paths.length - 1;
        const from = isLastPath ? len : -len;
        const to = isLastPath ? -len : len;
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: from });
        gsap.to(path, {
          strokeDashoffset: to,
          duration: 1.5,
          repeat: -1,
          ease: "power2.inOut",
          delay: j * 0.25 + i * 0.25,
          repeatDelay: 0.5,
        });
      });
    });
  }

  // --- Section Header Split-Word Animations with SplitType ---
  const sectionHeaders = document.querySelectorAll<HTMLElement>("section h2");
  sectionHeaders.forEach((h2) => {
    // Preserve any existing children like the animated underline span
    const underlineSpan = h2.querySelector("span.absolute");

    // Apply SplitType directly
    // Note: SplitType wraps text in words and lines, but if there's inline HTML elements,
    // we need to be careful. The easiest is to extract the text, split it, and re-append the underline.
    // To cleanly separate the underline, we'll temporarily remove it
    if (underlineSpan) {
      h2.removeChild(underlineSpan);
    }

    const text = new SplitType(h2, { types: "words,chars" });

    // Re-append the underline if it existed
    if (underlineSpan) {
      h2.appendChild(underlineSpan);
    }

    if (text.words) {
      gsap.from(text.words, {
        y: "100%",
        opacity: 0,
        duration: 1,
        stagger: 0.05,
        ease: "power4.out",
        scrollTrigger: {
          trigger: h2,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    }
  });

  // --- Magnetic Buttons ---
  const magneticButtons = document.querySelectorAll<HTMLElement>(".magnetic-btn");
  magneticButtons.forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const h = rect.height / 2;
      const w = rect.width / 2;
      const x = (e.clientX - rect.left - w) * 0.3; // 0.3 controls the magnet strength
      const y = (e.clientY - rect.top - h) * 0.3;

      gsap.to(btn, { x: x, y: y, duration: 0.4, ease: "power2.out" });
    });

    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
    });
  });
});
