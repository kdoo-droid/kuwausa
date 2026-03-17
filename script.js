/* ============================================================
   KUWANOSATO — MAIN SCRIPT
============================================================ */

/**
 * CONFIG — set shopUrl to your live store URL when ready.
 * All shop CTAs will link to it; if blank they fall back to #products.
 */
const CONFIG = {
  shopUrl:      '', // e.g. 'https://shop.kuwanosato.com'
  formspreeId:  'xbdzpave',
};


/* ================================================================
   SHOP LINKS
================================================================ */
function setupShopLinks() {
  document.querySelectorAll('.shop-link, #nav-shop-btn').forEach(el => {
    if (CONFIG.shopUrl) {
      el.href   = CONFIG.shopUrl;
      el.target = '_blank';
      el.rel    = 'noopener noreferrer';
    } else {
      el.href = '#products';
    }
  });
}


/* ================================================================
   STICKY HEADER
   Adds .scrolled once the hero section is no longer intersecting
================================================================ */
function setupStickyHeader() {
  const header = document.getElementById('site-header');
  const hero   = document.getElementById('home');
  if (!header || !hero) return;

  const obs = new IntersectionObserver(
    ([entry]) => {
      header.classList.toggle('scrolled', !entry.isIntersecting);
    },
    { threshold: 0 }
  );
  obs.observe(hero);
}


/* ================================================================
   MOBILE NAV TOGGLE
================================================================ */
function setupMobileNav() {
  const toggle  = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (!toggle || !navMenu) return;

  function close() {
    navMenu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }

  function open() {
    navMenu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
  }

  toggle.addEventListener('click', () => {
    navMenu.classList.contains('is-open') ? close() : open();
  });

  // Close when a link is clicked
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', close);
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !navMenu.contains(e.target)) close();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      close();
      toggle.focus();
    }
  });
}


/* ================================================================
   ACTIVE NAV LINK
   Highlights the nav link for whichever section is in view
================================================================ */
function setupActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(l => l.classList.remove('active'));
      const match = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (match) match.classList.add('active');
    });
  }, {
    threshold:  0.35,
    rootMargin: `-${72}px 0px 0px 0px`,
  });

  sections.forEach(s => obs.observe(s));
}


/* ================================================================
   SCROLL REVEAL
   Sections fade + rise in; child cards stagger
================================================================ */
function setupScrollReveal() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    document.querySelectorAll('.reveal-section, .reveal-card').forEach(el => {
      el.classList.add('revealed');
    });
    return;
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const section = entry.target;
      section.classList.add('revealed');

      // Stagger cards inside this section
      section.querySelectorAll('.reveal-card').forEach((card, i) => {
        setTimeout(() => card.classList.add('revealed'), i * 90);
      });

      obs.unobserve(section);
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal-section').forEach(s => obs.observe(s));
}


/* ================================================================
   WHOLESALE INTENT
   Stores intent in sessionStorage so the contact form can
   preselect "Cafe or Wholesale" when arriving from that CTA
================================================================ */
function setupWholesaleIntent() {
  document.querySelectorAll('[data-wholesale]').forEach(el => {
    el.addEventListener('click', () => {
      sessionStorage.setItem('inquiryIntent', 'wholesale');
    });
  });
}

function applyWholesalePreselect() {
  const intent  = sessionStorage.getItem('inquiryIntent');
  const select  = document.getElementById('inquiry-type');
  if (intent && select) {
    select.value = intent;
    sessionStorage.removeItem('inquiryIntent');
  }
}


/* ================================================================
   CONTACT FORM
================================================================ */
function setupContactForm() {
  const form       = document.getElementById('contact-form');
  const submitBtn  = document.getElementById('form-submit-btn');
  const successEl  = document.getElementById('form-success');
  const errorGlobal = document.getElementById('form-error-global');

  if (!form) return;

  // Apply wholesale preselect after DOM is ready
  applyWholesalePreselect();

  // ---- Validation rules ----
  const rules = {
    'inquiry-type': v => v                       ? '' : 'Please select an inquiry type.',
    'full-name':    v => v.trim()                ? '' : 'Please enter your full name.',
    'email':        v => {
      if (!v.trim()) return 'Please enter your email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
        ? '' : 'Please enter a valid email address.';
    },
    'message':      v => v.trim()                ? '' : 'Please write a message.',
  };

  function validateField(id) {
    const input = document.getElementById(id);
    const errEl = document.getElementById(`${id}-err`);
    if (!input || !errEl || !rules[id]) return true;

    const msg = rules[id](input.value);
    errEl.textContent = msg;

    if (msg) {
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
    }
    return !msg;
  }

  // Live validation: re-validate once a field has been touched
  Object.keys(rules).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur',  () => validateField(id));
    el.addEventListener('input', () => {
      if (el.classList.contains('invalid')) validateField(id);
    });
  });

  // ---- Submit ----
  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Honeypot check
    const hp = document.getElementById('hp-website');
    if (hp && hp.value) return;

    // Validate all required fields
    const allValid = Object.keys(rules).map(id => validateField(id)).every(Boolean);
    if (!allValid) {
      const firstInvalid = form.querySelector('.invalid');
      firstInvalid?.focus();
      return;
    }

    // Loading state
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;
    errorGlobal.hidden = true;

    try {
      if (!CONFIG.formspreeId) {
        // No endpoint configured yet — show a friendly holding message
        throw new Error('Form endpoint not configured');
      }
      const res = await fetch(`https://formspree.io/f/${CONFIG.formspreeId}`, {
        method:  'POST',
        headers: { 'Accept': 'application/json' },
        body:    new FormData(form),
      });
      if (!res.ok) throw new Error('Submission failed');

      // Success
      form.hidden      = true;
      successEl.hidden = false;
      successEl.focus();

    } catch {
      errorGlobal.hidden = false;
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    }
  });
}


/* ================================================================
   SMOOTH SCROLL for anchor links (fallback for older browsers)
================================================================ */
function setupSmoothScroll() {
  if (CSS.supports('scroll-behavior', 'smooth')) return; // native handles it

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}


/* ================================================================
   INIT
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  setupShopLinks();
  setupStickyHeader();
  setupMobileNav();
  setupActiveNavLink();
  setupScrollReveal();
  setupWholesaleIntent();
  setupContactForm();
  setupSmoothScroll();
});
