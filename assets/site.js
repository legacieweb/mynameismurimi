document.documentElement.classList.add('js');

const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menuButton.textContent = open ? '×' : '☰';
    nav.classList.toggle('mobile-open', open);
  });

  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('mobile-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    menuButton.textContent = '☰';
  }));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      nav.classList.remove('mobile-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      menuButton.textContent = '☰';
    }
  });
}

const revealItems = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
}

const progress = document.querySelector('[data-progress]');
if (progress) {
  let scheduled = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  updateProgress();
}

document.querySelectorAll('[data-year]').forEach(node => {
  node.textContent = new Date().getFullYear();
});



const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  const topic = new URLSearchParams(window.location.search).get('topic');
  const inquirySelect = contactForm.elements.inquiryType;
  if (topic === 'investor') inquirySelect.value = 'investor';

  document.querySelectorAll('[data-inquiry="investor"]').forEach(link => {
    link.addEventListener('click', () => { inquirySelect.value = 'investor'; });
  });

  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    const status = contactForm.querySelector('[data-form-status]');
    const submit = contactForm.querySelector('button[type="submit"]');
    const data = new FormData(contactForm);
    const payload = Object.fromEntries(data.entries());
    if (!contactForm.reportValidity()) return;
    status.textContent = 'Sending your message…';
    submit.disabled = true;
    try {
      const response = await fetch('https://iyonicorp.onrender.com/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || 'We couldn’t send your message. Please try again or email iyonicorp@gmail.com.');
      contactForm.reset();
      status.textContent = result.confirmationSent
        ? 'Your message was sent to Iyonicorp, and a copy was sent to your email.'
        : 'Your message was sent to Iyonicorp. We couldn’t send the email copy, but the team received your note.';
    } catch (error) {
      status.textContent = error.message === 'Failed to fetch'
        ? 'We couldn’t reach Iyonicorp’s email service. Please try again or email iyonicorp@gmail.com.'
        : (error.message || 'We couldn’t send your message. Please try again.');
    } finally {
      submit.disabled = false;
    }
  });
}
