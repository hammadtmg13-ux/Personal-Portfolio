const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = [...document.querySelectorAll(".nav-link")];
const backToTop = document.querySelector(".back-to-top");
const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = themeToggle.querySelector(".theme-icon");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let savedTheme = null;
try {
  savedTheme = localStorage.getItem("portfolio-theme");
} catch {
  savedTheme = null;
}

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const initialTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : systemTheme;

function setTheme(theme, savePreference = false) {
  const isDark = theme === "dark";
  const nextTheme = isDark ? "dark" : "light";
  const actionLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  document.documentElement.dataset.theme = nextTheme;
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", actionLabel);
  themeToggle.title = actionLabel;
  themeIcon.textContent = isDark ? "☀" : "☾";
  themeColorMeta.content = isDark ? "#15141b" : "#f4f7f8";

  if (savePreference) {
    try {
      localStorage.setItem("portfolio-theme", nextTheme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }
}

setTheme(initialTheme);
themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme, true);
});

// Keep the mobile menu, header treatment, and back-to-top control in sync with navigation.
function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  navLinks.classList.remove("open");
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  navLinks.classList.toggle("open", !isOpen);
});

navItems.forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

function updateScrollState() {
  const scrollY = window.scrollY;
  const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
  const scrollProgress = scrollableDistance > 0 ? scrollY / scrollableDistance : 0;
  header.classList.toggle("scrolled", scrollY > 20);
  backToTop.classList.toggle("visible", scrollY > 500);
  document.documentElement.style.setProperty("--scroll-progress", String(scrollProgress));
}

updateScrollState();
window.addEventListener("scroll", updateScrollState, { passive: true });

// Reveal sections on entry, with a graceful fallback for older browsers.
const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

// Type the role once; keep the full phrase available to assistive technology.
const typingTarget = document.querySelector("[data-typing]");
if (typingTarget && !reduceMotion) {
  const fullText = typingTarget.dataset.typing;
  typingTarget.textContent = "";
  let characterIndex = 0;
  const typeNext = () => {
    typingTarget.textContent = fullText.slice(0, characterIndex + 1);
    characterIndex += 1;
    if (characterIndex < fullText.length) window.setTimeout(typeNext, 43);
  };
  window.setTimeout(typeNext, 380);
}

// Keep the active navigation item aligned with the visible section.
const sections = [...document.querySelectorAll("main section[id]")];
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navItems.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.15, 0.4] });
  sections.forEach((section) => sectionObserver.observe(section));
}

// Filter the project cards by their listed technologies.
const filterButtons = document.querySelectorAll(".filter-button");
const projectCards = document.querySelectorAll(".project-card");
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    projectCards.forEach((card) => {
      const technologies = card.dataset.technologies.split(" ");
      card.hidden = filter !== "all" && !technologies.includes(filter);
    });
  });
});

// Validate locally, then hand the message to the visitor's configured email app.
const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");
const emailAddress = "hammadtmg13@gmail.com";

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const values = Object.fromEntries(formData.entries());
  const errors = {
    name: values.name.trim().length < 2 ? "Please enter your name." : "",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ? "" : "Enter a valid email address.",
    message: values.message.trim().length < 10 ? "Please write a message of at least 10 characters." : "",
  };

  Object.entries(errors).forEach(([field, message]) => {
    const errorElement = document.querySelector(`[data-error-for="${field}"]`);
    const input = contactForm.elements.namedItem(field);
    errorElement.textContent = message;
    input.setAttribute("aria-invalid", String(Boolean(message)));
  });

  const firstInvalidField = Object.keys(errors).find((field) => errors[field]);
  if (firstInvalidField) {
    contactForm.elements.namedItem(firstInvalidField).focus();
    formStatus.textContent = "Please correct the highlighted fields and try again.";
    return;
  }

  const subject = encodeURIComponent(`Portfolio inquiry from ${values.name.trim()}`);
  const body = encodeURIComponent(`${values.message.trim()}\n\nFrom: ${values.name.trim()} (${values.email.trim()})`);
  formStatus.textContent = "Your email app is opening with your message ready to send.";
  window.location.href = `mailto:${emailAddress}?subject=${subject}&body=${body}`;
});