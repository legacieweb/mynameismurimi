(() => {
  const nav = document.querySelector(".nav");
  const menu = document.querySelector(".menu-button");
  if (nav && menu) {
    menu.addEventListener("click", () => {
      const open = menu.getAttribute("aria-expanded") !== "true";
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      menu.textContent = open ? "×" : "☰";
      nav.classList.toggle("mobile-open", open);
    });
    nav.querySelectorAll(".nav-links a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("mobile-open");
      menu.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-label", "Open navigation");
      menu.textContent = "☰";
    }));
  }

  const year = document.querySelectorAll("[data-year]");
  year.forEach(node => node.textContent = new Date().getFullYear());

  const animated = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    animated.forEach(node => observer.observe(node));
  } else {
    animated.forEach(node => node.classList.add("visible"));
  }
})();
