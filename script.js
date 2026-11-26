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

  // Departure board: every few seconds the board lands on the next related
  // pair of skills. Pairs live in the board's data-pairs.
  // Wide screens: 20 split-flap letter tiles per row that scramble into place.
  // Phones: one whole-word flap panel per skill that flips over, which reads
  // far more easily than tiny letter tiles.
  var board = document.querySelector('.board[data-pairs]');
  if (board) {
    var pairs = JSON.parse(board.dataset.pairs);
    var rowsBox = board.querySelector('.board-rows');
    var cat = board.querySelector('.board-cat');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var narrow = window.matchMedia('(max-width: 560px)');
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&';
    var COLS = 20;
    var current = 0, paused = false, rows = [];

    var build = function () {
      var p = pairs[current];
      rowsBox.replaceChildren();
      rows = [];
      rowsBox.classList.toggle('is-panels', narrow.matches);
      [p[1], p[2]].forEach(function (skill) {
        var row = document.createElement('div');
        if (narrow.matches) {
          row.className = 'board-panel';
          row.textContent = skill;
        } else {
          row.className = 'board-row';
          var t = skill.toUpperCase();
          for (var c = 0; c < COLS; c++) {
            var cell = document.createElement('span');
            cell.className = 'cell';
            cell.textContent = t.charAt(c) && t.charAt(c) !== ' ' ? t.charAt(c) : ' ';
            row.appendChild(cell);
          }
        }
        rowsBox.appendChild(row);
        rows.push(row);
      });
    };

    var scrambleRow = function (row, text, delay) {
      var cells = row.children, target = text.toUpperCase();
      for (var i = 0; i < cells.length; i++) {
        (function (cell, ch, ticks) {
          var final = ch === ' ' ? ' ' : ch;
          if (reduce) { cell.textContent = final; return; }
          setTimeout(function () {
            var n = 0;
            var t = setInterval(function () {
              if (n++ >= ticks) { clearInterval(t); cell.textContent = final; cell.classList.remove('flip'); return; }
              cell.classList.add('flip');
              cell.textContent = chars.charAt(Math.floor(Math.random() * chars.length));
            }, 45);
          }, delay);
        })(cells[i], target.charAt(i) || ' ', 4 + Math.floor(Math.random() * 8) + i);
      }
    };

    var flipPanel = function (panel, text, delay) {
      if (reduce) { panel.textContent = text; return; }
      setTimeout(function () {
        panel.classList.add('flap-out');
        setTimeout(function () {
          panel.textContent = text;
          panel.classList.remove('flap-out');
        }, 180);
      }, delay);
    };

    var showNext = function () {
      if (!paused) {
        current = (current + 1) % pairs.length;
        var p = pairs[current];
        cat.classList.add('is-changing');
        setTimeout(function () { cat.textContent = p[0]; cat.classList.remove('is-changing'); }, 250);
        [p[1], p[2]].forEach(function (skill, i) {
          if (rows[i].classList.contains('board-panel')) flipPanel(rows[i], skill, i * 160);
          else scrambleRow(rows[i], skill, i * 250);
        });
      }
      // Phones get a little longer on each pair.
      setTimeout(showNext, narrow.matches ? 5000 : 4200);
    };

    build();
    if (narrow.addEventListener) narrow.addEventListener('change', build);
    board.addEventListener('mouseenter', function () { paused = true; });
    board.addEventListener('mouseleave', function () { paused = false; });
    setTimeout(showNext, narrow.matches ? 5000 : 4200);
  }

  var year = document.querySelector('.year');
  if (year) year.textContent = new Date().getFullYear();
})();
