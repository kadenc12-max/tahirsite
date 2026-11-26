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

  // Click-to-play YouTube: show a thumbnail until clicked, then load the
  // real player in place, so six embeds don't slow the page down.
  document.querySelectorAll('.clip-thumb[data-yt]').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(thumb.dataset.yt) + '?autoplay=1&rel=0';
      frame.title = thumb.dataset.title || 'YouTube video';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      // Swap the <button> for a plain frame: a player can't live inside a button.
      var player = document.createElement('div');
      player.className = 'clip-thumb is-playing';
      player.appendChild(frame);
      thumb.replaceWith(player);
      frame.focus();
    });
  });

  var year = document.querySelector('.year');
  if (year) year.textContent = new Date().getFullYear();
})();
