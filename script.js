(function () {
  var root = document.documentElement;
  var btn = document.querySelector('.theme-toggle');

  function label() {
    btn.textContent = root.dataset.theme === 'light' ? 'Dark mode' : 'Light mode';
  }

  if (btn) {
    label();
    btn.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
      label();
    });
  }

  var year = document.querySelector('.year');
  if (year) year.textContent = new Date().getFullYear();
})();
