/**
 * IPL Tracker 2026
 * app.js — Navigation & App Shell
 * Commit #2: Navbar + App Shell Layout
 */

// ─── Navigation ───────────────────────────────────────────────
const hamburger   = document.getElementById('hamburger');
const navLinks    = document.getElementById('navLinks');
const navbar      = document.getElementById('navbar');
const allNavLinks = document.querySelectorAll('.nav-link');
const allPages    = document.querySelectorAll('.page');

// Hamburger toggle
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Close mobile menu on link click
navLinks.addEventListener('click', () => {
  hamburger.classList.remove('open');
  navLinks.classList.remove('open');
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ─── Client-side Routing ──────────────────────────────────────
function navigateTo(pageId) {
  // Hide all pages
  allPages.forEach(p => p.classList.remove('active'));

  // Show target page
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add('active');

  // Update active nav link
  allNavLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle all [data-page] clicks anywhere in the document
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-page]');
  if (target) {
    e.preventDefault();
    navigateTo(target.dataset.page);
  }
});

// ─── Init ─────────────────────────────────────────────────────
console.log('[IPL Tracker] App shell ready ✓');
navigateTo('home');