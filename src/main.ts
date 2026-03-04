import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Swiper from "swiper/bundle";
import "swiper/css/bundle";

gsap.registerPlugin(ScrollTrigger);

window.addEventListener("DOMContentLoaded", () => {
  // --- Testimonials Swiper ---
  new Swiper(".testimonials-swiper", {
    slidesPerView: 1.2,
    spaceBetween: 24,
    navigation: {
      nextEl: ".testimonials-next",
      prevEl: ".testimonials-prev",
    },
    breakpoints: {
      640: {
        slidesPerView: 2.2,
      },
      1024: {
        slidesPerView: 3.5,
      },
      1280: {
        slidesPerView: 4.5,
      },
    },
  });

  // --- Hero Section Animations ---
  const heroTl = gsap.timeline({
    defaults: { ease: "power3.out", duration: 1.2 },
  });

  heroTl
    .from("#hero img", {
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
      "-=1.5",
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

  // --- Section Header Split-Word Animations ---
  const sectionHeaders = document.querySelectorAll("section h2");
  sectionHeaders.forEach((h2) => {
    const text = h2.textContent?.trim() || "";
    const words = text.split(/\s+/);
    h2.innerHTML = words
      .map(
        (word) =>
          `<span class="inline-block overflow-hidden"><span class="inline-block translate-y-full opacity-0 origin-bottom">${word}</span></span>`,
      )
      .join(" ");

    const wordSpans = h2.querySelectorAll("span > span");

    gsap.to(wordSpans, {
      y: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.05,
      ease: "power4.out",
      scrollTrigger: {
        trigger: h2,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  });
});
