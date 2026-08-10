function toggleTheme() {
  const html    = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  if (isLight) {
    html.removeAttribute('data-theme');
    localStorage.setItem('tcTheme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
    localStorage.setItem('tcTheme', 'light');
  }
  _updateThemeBtn();
}

function setAccent(accent) {
  const html = document.documentElement;
  if (accent === 'cyan') {
    html.removeAttribute('data-accent');
  } else {
    html.setAttribute('data-accent', accent);
  }
  localStorage.setItem('tcAccent', accent);
  _updateSwatches();
}

function _updateThemeBtn() {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  btn.textContent = isLight ? '🌙' : '☀️';
  btn.title = isLight ? 'מצב חושך' : 'מצב אור';
}

function _updateSwatches() {
  const accent = document.documentElement.getAttribute('data-accent') || 'cyan';
  document.querySelectorAll('.accent-swatch').forEach(function(el) {
    el.classList.toggle('active', el.dataset.accent === accent);
  });
}

function initAutoNav() {
  var sentinel = document.getElementById('nav-sentinel');
  var navbar   = document.getElementById('auto-navbar');
  if (!sentinel || !navbar) return;
  var hide;
  function show() { clearTimeout(hide); navbar.classList.add('nav-visible'); }
  function schedHide() { hide = setTimeout(function() { navbar.classList.remove('nav-visible'); }, 500); }
  sentinel.addEventListener('mouseenter', show);
  sentinel.addEventListener('mouseleave', function() { if (!navbar.matches(':hover')) schedHide(); });
  navbar.addEventListener('mouseenter', function() { clearTimeout(hide); });
  navbar.addEventListener('mouseleave', schedHide);
}

document.addEventListener('DOMContentLoaded', function() {
  _updateThemeBtn();
  _updateSwatches();
  initAutoNav();
});
