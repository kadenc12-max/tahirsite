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

  // Departure board: every few seconds both rows scramble and land on the
  // next related pair of skills. Pairs live in the board's data-pairs.
  // On phones the board uses 12 tiles per row and wraps each skill onto two
  // lines so the tiles stay big enough to read.
  var board = document.querySelector('.board[data-pairs]');
  if (board) {
    var pairs = JSON.parse(board.dataset.pairs);
    var rowsBox = board.querySelector('.board-rows');
    var cat = board.querySelector('.board-cat');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var narrow = window.matchMedia('(max-width: 560px)');
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ&';
    var current = 0, paused = false, rows = [];

    // Split a skill into the lines it occupies: one line wide, two lines narrow.
    var linesFor = function (text) {
      if (!narrow.matches) return [text];
      var out = [''];
      text.split(' ').forEach(function (word) {
        var last = out[out.length - 1];
        if (!last) out[out.length - 1] = word;
        else if ((last + ' ' + word).length <= 12) out[out.length - 1] = last + ' ' + word;
        else out.push(word);
      });
      while (out.length < 2) out.push('');
      return out.slice(0, 2);
    };

    var build = function () {
      var cols = narrow.matches ? 12 : 20;
      var perSkill = narrow.matches ? 2 : 1;
      rowsBox.style.setProperty('--cols', cols);
      rowsBox.replaceChildren();
      rows = [];
      for (var r = 0; r < perSkill * 2; r++) {
        var row = document.createElement('div');
        row.className = 'board-row' + (r === perSkill ? ' next-skill' : '');
        for (var c = 0; c < cols; c++) {
          var cell = document.createElement('span');
          cell.className = 'cell';
          cell.textContent = ' ';
          row.appendChild(cell);
        }
        rowsBox.appendChild(row);
        rows.push(row);
      }
      var p = pairs[current];
      var lines = linesFor(p[1]).concat(linesFor(p[2]));
      rows.forEach(function (row, i) {
        var t = (lines[i] || '').toUpperCase();
        for (var c = 0; c < row.children.length; c++) row.children[c].textContent = t.charAt(c) && t.charAt(c) !== ' ' ? t.charAt(c) : ' ';
      });
    };

    var flipRow = function (row, text, delay) {
      var cells = row.children, target = text.toUpperCase();
      for (var i = 0; i < cells.length; i++) {
        (function (cell, ch, ticks) {
          var final = ch === ' ' ? '\u00a0' : ch;
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

    var showNext = function () {
      if (paused) return;
      current = (current + 1) % pairs.length;
      var p = pairs[current];
      cat.classList.add('is-changing');
      setTimeout(function () { cat.textContent = p[0]; cat.classList.remove('is-changing'); }, 250);
      var lines = linesFor(p[1]).concat(linesFor(p[2]));
      var half = lines.length / 2;
      rows.forEach(function (row, i) { flipRow(row, lines[i] || '', i < half ? 0 : 250); });
    };

    build();
    if (narrow.addEventListener) narrow.addEventListener('change', build);
    board.addEventListener('mouseenter', function () { paused = true; });
    board.addEventListener('mouseleave', function () { paused = false; });
    setInterval(showNext, 4200);
  }

  var year = document.querySelector('.year');
  if (year) year.textContent = new Date().getFullYear();
})();
