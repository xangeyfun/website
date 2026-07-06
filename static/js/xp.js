(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const iconURL = (p) => '/static/' + p;

  /* ── State ── */
  const state = {
    zIndex: 100,
    openWindows: [],
    minimizedWindows: [],
    bootDone: false,
    screensaverTimer: null,
    screensaverActive: false,
    soundEnabled: false,
    cmdDir: 'c/Users/Xangey',
    cmdHistory: [],
    cmdHistoryIdx: -1,
    explorerHistory: ['root'],
    explorerHistoryIdx: 0,
    startMenuOpen: false,
    darkMode: true,
    recycleItems: [
      { name: 'old_resume.doc', date: '2024-03-15', icon: '📄' },
      { name: 'homework.txt', date: '2024-06-20', icon: '📄' },
      { name: 'deleted_memes.zip', date: '2024-08-01', icon: '📦' },
      { name: 'sketchy_script.vbs', date: '2025-01-13', icon: '⚡' },
      { name: '404_error.png', date: '2025-04-22', icon: '🖼️' },
    ],
    easterEggMsgs: [
      "Error: The operation completed successfully.",
      "Your mouse has moved. Windows must be restarted for the change to take effect.",
      "It's not a bug, it's a feature.",
      "Windows has detected that you are reading this message. Please stop.",
      "This dialog will close itself. Eventually.",
      "You have discovered a hidden message. Congratulations. You win nothing.",
      "Bad command or file name. (That's what she said.)",
      "Are you sure you want to do that? Too bad, you already did.",
      "Windows is checking for solutions to a problem that doesn't exist.",
      "Did you know? The original Windows XP codename was 'Whistler'.",
      "Error: Success.",
      "Please wait while Windows generates a witty error message...",
      "Click OK to continue. (Spoiler: nothing happens.)",
    ],
    startClickCount: 0,
    clickStreakTimer: null,
    myComputerClicks: 0,
    shutdownInterval: null,
    shutdownAbortHandler: null,
    bsodDumpInterval: null,
    konamiSeq: [],
    wallpaperClicks: 0,
    windowHoardingNotified: false,
    closeBtnHoverTimers: {},
    closeBtnHoverCounts: {},
    f5Count: 0,
    f5Timer: null,
    clippyTimer: null,
    clippyMsgIdx: 0,
  };

  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];

  const CLIPPY_MSGS = [
    "It looks like you're doing something. Would you like help with that?",
    "Hi there! I'm Clippy, your friendly paperclip. You look like you could use some assistance!",
    "Did you know? 87% of statistics are made up on the spot.",
    "It looks like you're trying to use a computer. Would you like me to watch?",
    "Have you tried turning it off and on again?",
    "I'm not saying I'm the best assistant, but I am made of metal. So I win.",
    "You seem nice. Have you considered clicking random things?",
    "I'd help you, but I don't have hands. Or arms. Or a body. Just vibes.",
    "Error 404: Motivation not found.",
    "Clippy tip: If at first you don't succeed, call it version 1.0.",
    "Your computer is running smoothly. (I have no way to verify this.)",
    "Would you like to take a survey about my performance? The answer is always 'Yes'.",
    "I'm not trapped in this website with you. You're trapped in here with me.",
    "Fun fact: I've been watching you this whole time. Just kidding... unless?"
  ];

  /* ── DOM refs (populated on init) ── */
  let dom = {};

  /* ── Clock ── */
  function updateClock() {
    const n = new Date();
    const h = n.getHours().toString().padStart(2, '0');
    const m = n.getMinutes().toString().padStart(2, '0');
    const s = n.getSeconds().toString().padStart(2, '0');
    const d = n.getDate().toString().padStart(2, '0');
    const mo = (n.getMonth() + 1).toString().padStart(2, '0');
    dom.clock.textContent = h + ':' + m + ':' + s;
    dom.clock.title = d + '/' + mo + '/' + n.getFullYear() + ' ' + h + ':' + m + ':' + s;
  }
  /* ── Toast ── */
  function showToast(icon, text) {
    dom.toastIcon.textContent = icon || '✅';
    dom.toastText.textContent = text || 'Done!';
    dom.toast.classList.remove('hidden');
    setTimeout(function () { dom.toast.classList.add('hidden'); }, 2000);
  }

  /* ── Easter Egg Dialog ── */
  function showEgg(text, title, icon) {
    var msg = text || state.easterEggMsgs[Math.floor(Math.random() * state.easterEggMsgs.length)];
    dom.eggText.innerText = msg;
    dom.eggTitle.textContent = title || 'Error';
    dom.eggIcon.textContent = icon || '❌';
    dom.eggDialog.classList.remove('hidden');
  }

  /* ── Clippy ── */
  function showClippy(text) {
    if (!dom.clippy) return;
    dom.clippyText.textContent = text || CLIPPY_MSGS[Math.floor(Math.random() * CLIPPY_MSGS.length)];
    dom.clippy.classList.remove('hidden');
    clearTimeout(state.clippyTimer);
    state.clippyTimer = setTimeout(function () {
      dom.clippy.classList.add('hidden');
      scheduleClippy();
    }, 8000);
  }

  function scheduleClippy() {
    clearTimeout(state.clippyTimer);
    state.clippyTimer = setTimeout(function () {
      if (dom.bsod && !dom.bsod.classList.contains('hidden')) { scheduleClippy(); return; }
      if (document.hidden) { scheduleClippy(); return; }
      showClippy();
      scheduleClippy();
    }, 60000 + Math.random() * 60000);
  }

  function hasUpdateRunning() {
    return $$('.window[data-window^="wupdate-"]').some(function (w) {
      return w.classList.contains('active');
    });
  }

  /* ── Window Management ── */
  function getWin(name) { return $('.window[data-window="' + name + '"]'); }
  function isOpen(name) { return state.openWindows.indexOf(name) !== -1; }
  function isMinimized(name) { return state.minimizedWindows.indexOf(name) !== -1; }

  function openWin(name) {
    var win = getWin(name);
    if (!win) return;
    if (isMinimized(name)) { restoreWin(name); return; }
    if (isOpen(name)) { focusWin(name); return; }
    win.classList.add('active');
    state.openWindows.push(name);
    focusWin(name);
    addTaskbarBtn(name);
    applyWinPosition(win);
    if (name === 'cmd' && dom.cmdInput) {
      setTimeout(function () { dom.cmdInput.focus(); }, 100);
      showClippy('It looks like you\'re trying to use a command line. Have you considered using a real operating system?');
    }
  }

  function closeWin(name) {
    var win = getWin(name);
    if (!win) return;
    win.classList.remove('active', 'maximized');
    state.openWindows = state.openWindows.filter(function (w) { return w !== name; });
    state.minimizedWindows = state.minimizedWindows.filter(function (w) { return w !== name; });
    removeTaskbarBtn(name);
    if (state.openWindows.length > 0) focusWin(state.openWindows[state.openWindows.length - 1]);
  }

  function minimizeWin(name) {
    var win = getWin(name);
    if (!win) return;
    win.classList.remove('active');
    if (state.minimizedWindows.indexOf(name) === -1) state.minimizedWindows.push(name);
    var btn = $('.taskbar-btn[data-window="' + name + '"]');
    if (btn) btn.classList.remove('active');
    var remaining = state.openWindows.filter(function (w) { return w !== name; });
    if (remaining.length > 0) focusWin(remaining[remaining.length - 1]);
    trackMinRestore();
  }

  function restoreWin(name) {
    var win = getWin(name);
    if (!win) return;
    win.classList.add('active');
    state.minimizedWindows = state.minimizedWindows.filter(function (w) { return w !== name; });
    focusWin(name);
    var btn = $('.taskbar-btn[data-window="' + name + '"]');
    if (btn) btn.classList.add('active');
    trackMinRestore();
  }

  var _mrCount = 0, _mrTimer = null;
  function trackMinRestore() {
    _mrCount++;
    clearTimeout(_mrTimer);
    _mrTimer = setTimeout(function () { _mrCount = 0; }, 2000);
    if (_mrCount >= 6) {
      _mrCount = 0;
      showEgg('Stop that. You look ridiculous.\n\n(Seriously. People are watching.)');
    }
  }

  function toggleMaximize(name) {
    var win = getWin(name);
    if (!win) return;
    win.classList.toggle('maximized');
    var btn = $('.taskbar-btn[data-window="' + name + '"]');
    if (win.classList.contains('maximized')) {
      win._savedPos = { top: win.style.top, left: win.style.left, width: win.style.width, height: win.style.height };
      win.style.top = '0';
      win.style.left = '0';
      win.style.width = '100vw';
      win.style.height = 'calc(100vh - 42px)';
    } else {
      if (win._savedPos) {
        win.style.top = win._savedPos.top;
        win.style.left = win._savedPos.left;
        win.style.width = win._savedPos.width;
        win.style.height = win._savedPos.height;
      } else {
        applyWinPosition(win);
      }
    }
  }

  function focusWin(name) {
    state.zIndex++;
    var win = getWin(name);
    if (!win) return;
    win.style.zIndex = state.zIndex;
    $$('.window').forEach(function (w) {
      w.classList.toggle('inactive', w !== win && w.classList.contains('active'));
    });
    $$('.taskbar-btn').forEach(function (b) { return b.classList.remove('active'); });
    var btn = $('.taskbar-btn[data-window="' + name + '"]');
    if (btn) btn.classList.add('active');
  }

  function applyWinPosition(win) {
    var x = win.dataset.x, y = win.dataset.y, w = win.dataset.w, h = win.dataset.h;
    if (w) win.style.width = w + 'px';
    if (h) win.style.height = h + 'px';
    if (x) win.style.left = x + 'px';
    if (y) win.style.top = y + 'px';
  }

  /* ── File Viewer Window ── */
  var fileViewerCounter = 0;
  function openTextFile(filename, content) {
    fileViewerCounter++;
    var name = 'fileviewer-' + fileViewerCounter;
    var existing = $('.window[data-window="' + name + '"]');
    if (existing) { focusWin(name); return; }

    var win = document.createElement('div');
    win.className = 'window active';
    win.dataset.window = name;
    win.style.width = '460px';
    win.style.height = '340px';
    win.style.left = (60 + fileViewerCounter * 20) + 'px';
    win.style.top = (40 + fileViewerCounter * 20) + 'px';

    win.innerHTML =
      '<div class="window-titlebar">' +
        '<div class="window-title">' +
          '<svg viewBox="0 0 16 16" class="window-title-icon"><rect x="2" y="3" width="12" height="10" rx="1" fill="#fff"/><rect x="3" y="4" width="10" height="8" rx="0.5" fill="#3a8df5"/></svg>' +
          '<span>' + filename + '</span>' +
        '</div>' +
        '<div class="window-controls">' +
          '<button class="win-btn minimize" aria-label="Minimize">_</button>' +
          '<button class="win-btn maximize" aria-label="Maximize">□</button>' +
          '<button class="win-btn close" aria-label="Close">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="window-body" style="white-space:pre-wrap;font-family:\'Lucida Console\',monospace;font-size:12px;line-height:1.5;">' +
        content +
      '</div>';

    dom.windowsContainer.appendChild(win);

    state.openWindows.push(name);
    focusWin(name);
    addTaskbarBtn(name);

    var closeBtn = win.querySelector('.close');
    var minBtn = win.querySelector('.minimize');
    var maxBtn = win.querySelector('.maximize');
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closeWin(name); });
    if (minBtn) minBtn.addEventListener('click', function (e) { e.stopPropagation(); minimizeWin(name); });
    if (maxBtn) maxBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMaximize(name); });
    win.addEventListener('mousedown', function () { focusWin(name); });

    var tb = win.querySelector('.window-titlebar');
    if (tb) {
      tb.addEventListener('mousedown', function (e) { if (e.button === 0) startDrag(e, win); });
      tb.addEventListener('touchstart', function (e) { startDrag(e, win); }, { passive: false });
    }
  }

  function checkHoarding() {
    if (state.windowHoardingNotified) return;
    var total = $$('.window[data-window^="notepad-"], .window[data-window^="paint-"]').length;
    if (total >= 5) {
      state.windowHoardingNotified = true;
      showEgg("You seem to have a hoarding problem.\n\n" + total + " windows open and counting.");
    }
  }

  var notepadCounter = 0;
  function openNotepad() {
    notepadCounter++;
    var name = 'notepad-' + notepadCounter;
    checkHoarding();
    var existing = $('.window[data-window="' + name + '"]');
    if (existing) { focusWin(name); return; }

    var win = document.createElement('div');
    win.className = 'window active';
    win.dataset.window = name;
    win.style.width = '520px';
    win.style.height = '380px';
    win.style.left = (80 + notepadCounter * 25) + 'px';
    win.style.top = (60 + notepadCounter * 25) + 'px';

    win.innerHTML =
      '<div class="window-titlebar">' +
        '<div class="window-title">' +
          '<svg viewBox="0 0 16 16" class="window-title-icon"><rect x="2" y="3" width="12" height="10" rx="1" fill="#fff"/><rect x="3" y="4" width="10" height="8" rx="0.5" fill="#3a8df5"/></svg>' +
          '<span>Untitled - Notepad</span>' +
        '</div>' +
        '<div class="window-controls">' +
          '<button class="win-btn minimize" aria-label="Minimize">_</button>' +
          '<button class="win-btn maximize" aria-label="Maximize">□</button>' +
          '<button class="win-btn close" aria-label="Close">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="window-body" style="padding:0;display:flex;flex-direction:column;">' +
        '<textarea style="flex:1;width:100%;border:none;resize:none;padding:8px;font-family:\'Lucida Console\',monospace;font-size:12px;background:var(--xp-window-body-bg);color:var(--xp-window-body-text);outline:none;" spellcheck="false" placeholder="Start typing..."></textarea>' +
      '</div>';

    dom.windowsContainer.appendChild(win);

    state.openWindows.push(name);
    focusWin(name);
    addTaskbarBtn(name);

    var closeBtn = win.querySelector('.close');
    var minBtn = win.querySelector('.minimize');
    var maxBtn = win.querySelector('.maximize');
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closeWin(name); });
    if (minBtn) minBtn.addEventListener('click', function (e) { e.stopPropagation(); minimizeWin(name); });
    if (maxBtn) maxBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMaximize(name); });
    win.addEventListener('mousedown', function () { focusWin(name); });

    var tb = win.querySelector('.window-titlebar');
    if (tb) {
      tb.addEventListener('mousedown', function (e) { if (e.button === 0) startDrag(e, win); });
      tb.addEventListener('touchstart', function (e) { startDrag(e, win); }, { passive: false });
    }

    setTimeout(function () {
      var ta = win.querySelector('textarea');
      if (ta) ta.focus();
    }, 100);
    showClippy('It looks like you\'re trying to write something. Have you tried writing something good?');
  }

  var paintCounter = 0;
  function openPaint() {
    paintCounter++;
    var name = 'paint-' + paintCounter;
    checkHoarding();
    var existing = $('.window[data-window="' + name + '"]');
    if (existing) { focusWin(name); return; }

    var win = document.createElement('div');
    win.className = 'window active';
    win.dataset.window = name;
    win.style.width = '640px';
    win.style.height = '480px';
    win.style.left = (100 + paintCounter * 30) + 'px';
    win.style.top = (80 + paintCounter * 20) + 'px';

    win.innerHTML =
      '<div class="window-titlebar">' +
        '<div class="window-title">' +
          '<svg viewBox="0 0 16 16" class="window-title-icon"><rect x="2" y="2" width="12" height="12" rx="2" fill="#fff"/><rect x="4" y="4" width="8" height="8" rx="1" fill="#3a8df5"/><circle cx="12" cy="4" r="3" fill="#ffd700"/></svg>' +
          '<span>untitled - Paint</span>' +
        '</div>' +
        '<div class="window-controls">' +
          '<button class="win-btn minimize" aria-label="Minimize">_</button>' +
          '<button class="win-btn maximize" aria-label="Maximize">□</button>' +
          '<button class="win-btn close" aria-label="Close">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="window-body" style="padding:0;display:flex;flex-direction:column;">' +
        '<div class="paint-toolbar" style="display:flex;align-items:center;gap:4px;padding:4px 6px;background:var(--xp-explorer-toolbar);border-bottom:1px solid var(--xp-card-border);flex-shrink:0;">' +
          '<button class="paint-clear paint-action" style="padding:4px 10px;font-size:11px;background:linear-gradient(180deg,#f0f0f0,#d4d0c8);border:1px solid;border-color:#fff #808080 #808080 #fff;border-radius:3px;cursor:pointer;">Clear</button>' +
          '<span style="color:#888;font-size:11px;margin:0 4px;">|</span>' +
          '<span style="font-size:11px;color:#888;">Color:</span>' +
          '<button class="paint-color" data-color="#000" style="width:20px;height:20px;background:#000;border:2px solid #fff;outline:1px solid #808080;border-radius:2px;cursor:pointer;"></button>' +
          '<button class="paint-color" data-color="#fff" style="width:20px;height:20px;background:#fff;border:2px solid #fff;outline:1px solid #808080;border-radius:2px;cursor:pointer;"></button>' +
          '<button class="paint-color" data-color="#ff0000" style="width:20px;height:20px;background:#ff0000;border:2px solid #fff;outline:1px solid #808080;border-radius:2px;cursor:pointer;"></button>' +
          '<button class="paint-color" data-color="#00aa00" style="width:20px;height:20px;background:#00aa00;border:2px solid #fff;outline:1px solid #808080;border-radius:2px;cursor:pointer;"></button>' +
          '<button class="paint-color" data-color="#0000ff" style="width:20px;height:20px;background:#0000ff;border:2px solid #fff;outline:1px solid #808080;border-radius:2px;cursor:pointer;"></button>' +
          '<button class="paint-color" data-color="#ffff00" style="width:20px;height:20px;background:#ffff00;border:2px solid #fff;outline:1px solid #808080;border-radius:2px;cursor:pointer;"></button>' +
          '<button class="paint-color" data-color="#ff8800" style="width:20px;height:20px;background:#ff8800;border:2px solid #fff;outline:1px solid #808080;border-radius:2px;cursor:pointer;"></button>' +
          '<button class="paint-color" data-color="#ff00ff" style="width:20px;height:20px;background:#ff00ff;border:2px solid #fff;outline:1px solid #808080;border-radius:2px;cursor:pointer;"></button>' +
          '<button class="paint-color" data-color="#00ffff" style="width:20px;height:20px;background:#00ffff;border:2px solid #fff;outline:1px solid #808080;border-radius:2px;cursor:pointer;"></button>' +
          '<button class="paint-color" data-color="#808080" style="width:20px;height:20px;background:#808080;border:2px solid #fff;outline:1px solid #808080;border-radius:2px;cursor:pointer;"></button>' +
          '<span style="color:#888;font-size:11px;margin:0 4px;">|</span>' +
          '<span style="font-size:11px;color:#888;">Size:</span>' +
          '<select class="paint-size" style="font-size:11px;padding:2px;background:var(--xp-window-body-bg);color:var(--xp-window-body-text);border:1px solid;border-color:#808080 var(--xp-card-border) var(--xp-card-border) #808080;">' +
            '<option value="2">Small</option>' +
            '<option value="6" selected>Medium</option>' +
            '<option value="12">Large</option>' +
            '<option value="24">Huge</option>' +
          '</select>' +
        '</div>' +
        '<div style="flex:1;position:relative;overflow:hidden;cursor:crosshair;">' +
          '<canvas class="paint-canvas" style="position:absolute;inset:0;width:100%;height:100%;"></canvas>' +
        '</div>' +
      '</div>';

    dom.windowsContainer.appendChild(win);

    state.openWindows.push(name);
    focusWin(name);
    addTaskbarBtn(name);

    var closeBtn = win.querySelector('.close');
    var minBtn = win.querySelector('.minimize');
    var maxBtn = win.querySelector('.maximize');
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); showEgg('Save your masterpiece to the cloud?\n\n(Just kidding. It\'s gone.)', 'untitled - Paint'); closeWin(name); });
    if (minBtn) minBtn.addEventListener('click', function (e) { e.stopPropagation(); minimizeWin(name); });
    if (maxBtn) maxBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMaximize(name); });
    win.addEventListener('mousedown', function () { focusWin(name); });

    var tb = win.querySelector('.window-titlebar');
    if (tb) {
      tb.addEventListener('mousedown', function (e) { if (e.button === 0) startDrag(e, win); });
      tb.addEventListener('touchstart', function (e) { startDrag(e, win); }, { passive: false });
    }

    // Paint logic
    var canvas = win.querySelector('.paint-canvas');
    var ctx = canvas.getContext('2d');
    var painting = false;
    var curColor = '#000';
    var curSize = 6;

    function resizeCanvas() {
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Resize observer
    var ro = new ResizeObserver(function () {
      var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resizeCanvas();
      ctx.putImageData(imgData, 0, 0);
    });

    setTimeout(function () {
      resizeCanvas();
      ro.observe(canvas.parentElement);
    }, 50);

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      var cx = e.clientX || (e.touches && e.touches[0].clientX);
      var cy = e.clientY || (e.touches && e.touches[0].clientY);
      if (cx == null) return null;
      return { x: cx - rect.left, y: cy - rect.top };
    }

    function startPaint(e) {
      e.preventDefault();
      painting = true;
      var pos = getPos(e);
      if (pos) {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
    }

    function movePaint(e) {
      e.preventDefault();
      if (!painting) return;
      var pos = getPos(e);
      if (!pos) return;
      ctx.lineWidth = curSize;
      ctx.lineCap = 'round';
      ctx.strokeStyle = curColor;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function endPaint() {
      painting = false;
      ctx.beginPath();
    }

    canvas.addEventListener('mousedown', startPaint);
    canvas.addEventListener('mousemove', movePaint);
    canvas.addEventListener('mouseup', endPaint);
    canvas.addEventListener('mouseleave', endPaint);
    canvas.addEventListener('touchstart', startPaint, { passive: false });
    canvas.addEventListener('touchmove', movePaint, { passive: false });
    canvas.addEventListener('touchend', endPaint);

    // Color buttons
    win.querySelectorAll('.paint-color').forEach(function (btn) {
      btn.addEventListener('click', function () {
        curColor = this.dataset.color;
        win.querySelectorAll('.paint-color').forEach(function (b) {
          b.style.outline = '1px solid #808080';
        });
        this.style.outline = '2px solid #000';
      });
    });

    // Size selector
    var sizeSelect = win.querySelector('.paint-size');
    if (sizeSelect) {
      sizeSelect.addEventListener('change', function () {
        curSize = parseInt(this.value);
      });
    }

    // Clear button
    var clearBtn = win.querySelector('.paint-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });
    }

    // Select black by default
    var blackBtn = win.querySelector('.paint-color[data-color="#000"]');
    if (blackBtn) blackBtn.style.outline = '2px solid #000';
    showClippy('It looks like you\'re trying to draw. Would you like me to critique your art?');
  }

  /* ── Windows Update ── */
  var updateCounter = 0;
  function openWindowsUpdate() {
    updateCounter++;
    var name = 'wupdate-' + updateCounter;
    var existing = $('.window[data-window="' + name + '"]');
    if (existing) { focusWin(name); return; }

    var win = document.createElement('div');
    win.className = 'window active';
    win.dataset.window = name;
    win.style.width = '480px';
    win.style.height = '280px';
    win.style.left = (120 + updateCounter * 25) + 'px';
    win.style.top = (90 + updateCounter * 25) + 'px';

    win.innerHTML =
      '<div class="window-titlebar">' +
        '<div class="window-title">' +
          '<svg viewBox="0 0 16 16" class="window-title-icon"><path d="M8 1 L9 4 L12 5 L9 6 L10 9 L8 7 L6 9 L7 6 L4 5 L7 4 Z" fill="#ffd700"/></svg>' +
          '<span>Windows Update</span>' +
        '</div>' +
        '<div class="window-controls">' +
          '<button class="win-btn minimize" aria-label="Minimize">_</button>' +
          '<button class="win-btn maximize" aria-label="Maximize">□</button>' +
          '<button class="win-btn close" aria-label="Close">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="window-body" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font-size:12px;">' +
        '<div class="update-icon" style="font-size:48px;">🔍</div>' +
        '<div class="update-status" style="text-align:center;color:var(--xp-window-body-text);">Checking for updates...</div>' +
        '<div class="update-progress-track" style="width:80%;height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;">' +
          '<div class="update-progress-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#4a9af5,#8ab4f8);border-radius:4px;transition:width .5s;"></div>' +
        '</div>' +
        '<div class="update-sub" style="font-size:11px;color:#ff4500;font-weight:700;text-align:center;">⚠ DO NOT TURN OFF YOUR COMPUTER ⚠</div>' +
        '<div class="update-sub2" style="font-size:10px;color:#888;text-align:center;">Installing updates may take a while. Seriously, don\'t touch the power button.</div>' +
      '</div>';

    dom.windowsContainer.appendChild(win);

    state.openWindows.push(name);
    focusWin(name);
    addTaskbarBtn(name);

    var closeBtn = win.querySelector('.close');
    var minBtn = win.querySelector('.minimize');
    var maxBtn = win.querySelector('.maximize');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeWin(name);
      });
    }
    if (minBtn) minBtn.addEventListener('click', function (e) { e.stopPropagation(); minimizeWin(name); });
    if (maxBtn) maxBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMaximize(name); });
    win.addEventListener('mousedown', function () { focusWin(name); });

    var tb = win.querySelector('.window-titlebar');
    if (tb) {
      tb.addEventListener('mousedown', function (e) { if (e.button === 0) startDrag(e, win); });
      tb.addEventListener('touchstart', function (e) { startDrag(e, win); }, { passive: false });
    }

    // Update simulation
    var progress = 0;
    var stages = [
      { at: 10, icon: '🔍', text: 'Checking for updates...' },
      { at: 25, icon: '📦', text: 'Downloading update 1 of 47...' },
      { at: 40, icon: '📦', text: 'Downloading update 14 of 47...' },
      { at: 55, icon: '📦', text: 'Downloading update 33 of 47...' },
      { at: 70, icon: '⚙️', text: 'Preparing to install...' },
      { at: 80, icon: '⚙️', text: 'Installing update 5 of 47...' },
      { at: 90, icon: '⚙️', text: 'Installing update 41 of 47...' },
      { at: 95, icon: '✅', text: 'Almost done...' },
    ];
    var iconEl = win.querySelector('.update-icon');
    var statusEl = win.querySelector('.update-status');
    var barEl = win.querySelector('.update-progress-bar');
    var subEl = win.querySelector('.update-sub');
    var sub2El = win.querySelector('.update-sub2');
    var stageIdx = 0;
    var notified = false;

    win._updateIntv = setInterval(function () {
      progress += Math.random() * 0.8;
      if (progress > 99) progress = 99;
      barEl.style.width = Math.min(progress, 99) + '%';

      while (stageIdx < stages.length && progress >= stages[stageIdx].at) {
        iconEl.textContent = stages[stageIdx].icon;
        statusEl.textContent = stages[stageIdx].text;
        stageIdx++;
      }

      if (progress >= 99 && !notified) {
        notified = true;
        setTimeout(function () {
          iconEl.textContent = '💀';
          statusEl.textContent = 'Windows Update failed. Again.';
          subEl.textContent = 'Error 0x800F0AAF: Updates not found. (They never were.)';
          showEgg("Windows Update has been checking for updates since the beginning of time.\n\nThere are no updates. There never were.\n\nEnjoy your vulnerability.");
        }, 3000);
      }
    }, 1200);
    showClippy('It looks like you\'re trying to update Windows. Bold move. Let\'s see how that goes.');
  }

  /* ── Taskbar Buttons ── */
  function addTaskbarBtn(name) {
    if ($('.taskbar-btn[data-window="' + name + '"]')) return;
    var win = getWin(name);
    var title = win ? win.querySelector('.window-title span').textContent : name;
    var btn = document.createElement('button');
    btn.className = 'taskbar-btn active';
    btn.dataset.window = name;
    btn.textContent = title;
    btn.setAttribute('role', 'tab');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var w = this.dataset.window;
      if (isMinimized(w)) restoreWin(w);
      else if (getWin(w) && getWin(w).classList.contains('active')) minimizeWin(w);
      else openWin(w);
    });
    dom.taskbarWindows.appendChild(btn);
  }

  function removeTaskbarBtn(name) {
    var btn = $('.taskbar-btn[data-window="' + name + '"]');
    if (btn) btn.remove();
  }

  /* ── Window Dragging (mouse + touch) ── */
  var dragState = null;

  function startDrag(e, win) {
    if (e.target.tagName === 'BUTTON') return;
    if (win.classList.contains('maximized')) return;
    var rect = win.getBoundingClientRect();
    var cx = e.clientX || (e.touches && e.touches[0].clientX);
    var cy = e.clientY || (e.touches && e.touches[0].clientY);
    if (cx == null) return;
    dragState = {
      win: win,
      name: win.dataset.window,
      ox: cx - rect.left,
      oy: cy - rect.top,
    };
    e.preventDefault();
  }

  function moveDrag(e) {
    if (!dragState) return;
    var cx = e.clientX || (e.touches && e.touches[0].clientX);
    var cy = e.clientY || (e.touches && e.touches[0].clientY);
    if (cx == null) return;
    var win = dragState.win;
    var wr = win.getBoundingClientRect();
    var nx = cx - dragState.ox;
    var ny = cy - dragState.oy;
    nx = Math.max(-wr.width + 60, Math.min(window.innerWidth - 60, nx));
    ny = Math.max(0, Math.min(window.innerHeight - 50, ny));
    win.style.left = nx + 'px';
    win.style.top = ny + 'px';
    win.style.right = 'auto';
    win.style.bottom = 'auto';
    e.preventDefault();
  }

  function endDrag() { dragState = null; }

  function initDragging() {
    $$('.window').forEach(function (win) {
      var tb = win.querySelector('.window-titlebar');
      if (!tb) return;
      tb.addEventListener('mousedown', function (e) { if (e.button === 0) startDrag(e, win); });
      tb.addEventListener('touchstart', function (e) { startDrag(e, win); }, { passive: false });
    });
    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('touchmove', moveDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  }

  /* ── Desktop Icons ── */
  function initDesktopIcons() {
    $$('.desktop-icon').forEach(function (icon) {
      icon._clickCount = 0;
      icon._clickTimer = null;

      icon.addEventListener('dblclick', function () {
        var name = this.dataset.window;
        if (name === 'paint') { openPaint(); return; }
        if (name === 'notepad') { openNotepad(); return; }
        if (name === 'wupdate') { openWindowsUpdate(); return; }
        openWin(name);
      });
      icon.addEventListener('click', function () {
        var self = this;
        var name = this.dataset.window;

        // Click spam detection
        self._clickCount++;
        clearTimeout(self._clickTimer);
        self._clickTimer = setTimeout(function () { self._clickCount = 0; }, 2000);

        if (self._clickCount >= 8) {
          self._clickCount = 0;
          showEgg('Windows has detected unusual activity.\n\nPlease stop clicking.\n\n(The icon needs a moment.)');
          self.style.opacity = '0.4';
          self.style.pointerEvents = 'none';
          setTimeout(function () {
            self.style.opacity = '';
            self.style.pointerEvents = '';
          }, 15000);
          return;
        }

        if (name === 'my-computer') {
          state.myComputerClicks++;
          if (state.myComputerClicks >= 7) {
            state.myComputerClicks = 0;
            showEgg("Stop poking the computer! It's doing its best!");
          }
        }
        if (name === 'paint' || name === 'notepad') return;
        if (isOpen(name) && !isMinimized(name)) focusWin(name);
        else if (isMinimized(name)) restoreWin(name);
      });
    });

    // Wallpaper clicks easter egg
    var wallpaper = $('#wallpaper');
    if (wallpaper) {
      wallpaper.addEventListener('click', function () {
        state.wallpaperClicks++;
        if (state.wallpaperClicks >= 10) {
          state.wallpaperClicks = 0;
          var msgs = [
            "Stop clicking the wallpaper. It's not going anywhere.",
            "The hills are alive with the sound of... clicking?",
            "You've clicked the background 10 times. Is everything okay?",
            "Maybe try clicking something more productive? Just a thought.",
            "Wallpaper: *exists*\nYou: *click click click*",
          ];
          showEgg(msgs[Math.floor(Math.random() * msgs.length)]);
        }
      });
    }
  }

  /* ── Window Controls ── */
  function initWindowControls() {
    $$('.window').forEach(function (win) {
      var name = win.dataset.window;
      var closeBtn = win.querySelector('.close');
      var minBtn = win.querySelector('.minimize');
      var maxBtn = win.querySelector('.maximize');
      if (closeBtn) {
        closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closeWin(name); });
        closeBtn.addEventListener('mouseenter', function () {
          state.closeBtnHoverCounts[name] = (state.closeBtnHoverCounts[name] || 0) + 1;
          var count = state.closeBtnHoverCounts[name];
          state.closeBtnHoverTimers[name] = setTimeout(function () {
            var msgs = [
              "Are you sure you want to leave?\n\nI was just getting to know you.",
              "Still hovering? I'm flattered but you need to let go.",
              "Third time's the charm. You really want out huh.",
              "OK I get it. You hate me. That's fine.",
              "This is emotional abuse. I'm reporting you to the Windows Police.",
            ];
            showEgg(msgs[Math.min(count - 1, msgs.length - 1)]);
          }, 5000);
        });
        closeBtn.addEventListener('mouseleave', function () {
          clearTimeout(state.closeBtnHoverTimers[name]);
        });
      }
      if (minBtn) minBtn.addEventListener('click', function (e) { e.stopPropagation(); minimizeWin(name); });
      if (maxBtn) maxBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMaximize(name); });
      win.addEventListener('mousedown', function () { focusWin(name); });
    });
  }

  /* ── Start Menu ── */
  function toggleStartMenu() {
    state.startMenuOpen = !state.startMenuOpen;
    dom.startMenu.classList.toggle('open', state.startMenuOpen);
    dom.startBtn.classList.toggle('active', state.startMenuOpen);
  }

  function initStartMenu() {
    dom.startBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleStartMenu();
      state.startClickCount++;
      if (state.startClickCount === 5) showEgg("You do know there are other things to click, right?");
      else if (state.startClickCount === 10) showEgg("Clicking Start repeatedly won't make it faster.");
      else if (state.startClickCount === 15) {
        showEgg("You've clicked Start 15 times. I admire the dedication.");
        state.startClickCount = 0;
      }
      clearTimeout(state.clickStreakTimer);
      state.clickStreakTimer = setTimeout(function () { state.startClickCount = 0; }, 5000);
    });

    $$('#start-menu .start-app[data-window]').forEach(function (item) {
      item.addEventListener('click', function () {
        var win = this.dataset.window;
        if (win === 'ie') {
          showEgg("Chrome is not available. Try a real browser.");
          toggleStartMenu();
          return;
        }
        if (win === 'notepad') {
          openNotepad();
          toggleStartMenu();
          return;
        }
        if (win === 'paint') {
          openPaint();
          toggleStartMenu();
          return;
        }
        if (win === 'wupdate') {
          openWindowsUpdate();
          toggleStartMenu();
          return;
        }
        openWin(win);
        toggleStartMenu();
      });
    });

    // Special items: shutdown button avoids other icons
    if (dom.shutdownBtn) {
      (function () {
        var btn = dom.shutdownBtn;
        var parent = btn.parentElement;

        // Click handler
        btn.addEventListener('click', function () {
          if (hasUpdateRunning()) {
            showEgg("Can't shut down while Windows Update is running!\n\nWindows Update: 1\nYou: 0");
            toggleStartMenu();
            return;
          }
          toggleStartMenu();
          showShutdown();
        });

        // Proximity tracking: red + shake + flee
        var proxActive = false, proxDist = 999, proxIntensity = 0;
        var proxInterval = null;

        function resetBtn() {
          proxActive = false; proxDist = 999; proxIntensity = 0;
          if (proxInterval) { clearInterval(proxInterval); proxInterval = null; }
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.transform = '';
          btn.style.position = '';
          btn.style.left = '';
          btn.style.top = '';
          btn.style.transition = '';
        }

        document.addEventListener('mousemove', function (e) {
          if (!state.startMenuOpen || !hasUpdateRunning()) { resetBtn(); return; }
          var r = btn.getBoundingClientRect();
          var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          var dx = e.clientX - cx, dy = e.clientY - cy;
          proxDist = Math.sqrt(dx * dx + dy * dy);

          if (proxDist > 250) { resetBtn(); return; }

          proxActive = true;
          proxIntensity = Math.max(0, Math.min(1, 1 - proxDist / 250));
          var rr = Math.floor(0xcc + proxIntensity * 0x33);
          btn.style.background = 'linear-gradient(180deg,#' + rr.toString(16) + '0000,#' + Math.floor(0x99 + proxIntensity * 0x55).toString(16) + '0000)';

          // Flee away from cursor when mouse < 70px
          if (proxDist < 70) {
            var pr = parent.getBoundingClientRect();
            var br = btn.getBoundingClientRect();
            // Vector from cursor to button center -> flee that direction
            var fdx = cx - e.clientX;
            var fdy = cy - e.clientY;
            var flen = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
            var depth = 1 - proxDist / 70;
            var scale = depth * 100;
            var newL = (fdx / flen) * scale;
            var newT = (fdy / flen) * scale;
            // Clamp so button stays within parent
            var maxL = pr.width - br.width - 4;
            var maxT = pr.height - br.height - 4;
            newL = Math.max(-maxL, Math.min(maxL, newL));
            newT = Math.max(-maxT, Math.min(maxT, newT));
            btn.style.transition = 'left 0.08s ease, top 0.08s ease';
            btn.style.position = 'relative';
            btn.style.left = newL + 'px';
            btn.style.top = newT + 'px';
            btn.style.transform = '';
          } else if (proxDist > 100) {
            // Smoothly return when cursor pulls back
            btn.style.transition = 'left 0.3s ease, top 0.3s ease';
            btn.style.left = '';
            btn.style.top = '';
            btn.style.position = '';
          }

          // Start continuous shake interval if not already running
          if (!proxInterval) {
            proxInterval = setInterval(function () {
              if (!proxActive || !state.startMenuOpen || !hasUpdateRunning()) { resetBtn(); return; }
              var s = (Math.random() - 0.5) * proxIntensity * 20;
              var s2 = (Math.random() - 0.5) * proxIntensity * 20;
              btn.style.transform = 'translate(' + s + 'px,' + s2 + 'px)';
            }, 50);
          }
        });
      })();
    }

    if (dom.runBtn) dom.runBtn.addEventListener('click', function () { toggleStartMenu(); showRunDialog(); });
    if (dom.logoffBtn) dom.logoffBtn.addEventListener('click', function () { toggleStartMenu(); showEgg("This is a website. You can't log off."); });
    if (dom.helpBtn) dom.helpBtn.addEventListener('click', function () { toggleStartMenu(); showEgg("Help is not available. Did you try turning it off and on again?"); });

    document.addEventListener('click', function (e) {
      if (state.startMenuOpen && !dom.startMenu.contains(e.target) && e.target !== dom.startBtn && !dom.startBtn.contains(e.target)) {
        toggleStartMenu();
      }
    });
  }

  /* ── Context Menu ── */
  function initContextMenu() {
    dom.desktop.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      var mx = e.clientX, my = e.clientY;
      var mw = dom.ctxMenu.offsetWidth || 180;
      var mh = dom.ctxMenu.offsetHeight || 200;
      if (mx + mw > window.innerWidth) mx = window.innerWidth - mw - 5;
      if (my + mh > window.innerHeight) my = window.innerHeight - mh - 5;
      if (mx < 0) mx = 5;
      if (my < 0) my = 5;
      dom.ctxMenu.style.left = mx + 'px';
      dom.ctxMenu.style.top = my + 'px';
      dom.ctxMenu.classList.remove('hidden');
    });

    document.addEventListener('click', function () {
      if (!dom.ctxMenu.classList.contains('hidden')) dom.ctxMenu.classList.add('hidden');
    });

    $$('.ctx-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        var action = this.dataset.action;
        dom.ctxMenu.classList.add('hidden');
        var msgs = {
          'refresh': 'Desktop refreshed. It looks exactly the same.',
          'view': 'View: Icons. Other options are not implemented.',
          'arrange-name': 'Icons arranged by name. (No they weren\'t.)',
          'arrange-type': 'Icons arranged by type. (No they weren\'t.)',
          'arrange-size': 'Icons arranged by size. (No they weren\'t.)',
          'paste': 'Clipboard is empty. Nothing to paste.',
          'new-folder': 'New Folder created.',
          'new-text': 'New Text Document created. It contains nothing.',
          'new-shortcut': 'Shortcut created. Target: unknown.',
          'properties': 'Properties:\n\nType: Desktop\nStatus: Running\nMemory: None of your business',
        };
        if (msgs[action]) showEgg(msgs[action]);
      });
    });
  }

  /* ── Run Dialog ── */
  function showRunDialog() {
    dom.runDialog.classList.remove('hidden');
    setTimeout(function () { dom.runInput.focus(); dom.runInput.select(); }, 100);
  }

  function initRunDialog() {
    function handleRun() {
      var raw = dom.runInput.value;
      var cmd = raw.trim().toLowerCase();
      dom.runDialog.classList.add('hidden');
      dom.runInput.value = '';
      var map = {
        'cmd': 'cmd', 'about': 'about', 'socials': 'socials', 'projects': 'projects',
        'contact': 'socials', 'explorer': 'my-computer', 'computer': 'my-computer',
        'recycle': 'recycle', 'recycle bin': 'recycle',
        'help': 'cmd', 'whoami': 'about', 'winver': 'winver', 'about windows': 'winver',
      };
      if (cmd === '') return;
      if (cmd === 'bsod') { showBSOD(); return; }
      if (cmd === 'shutdown') {
        if (hasUpdateRunning()) { showEgg("Windows Update is still installing.\n\nPlease wait while updates finish.\n\n(Or in other words: nice try.)"); return; }
        showShutdown(); return;
      }
      if (cmd === 'notepad') { openNotepad(); return; }
      if (cmd === 'paint') { openPaint(); return; }

      if (cmd === 'help') { showEgg("Help? You want help?\n\nThis is a fake Windows XP. The help files are as real as your chances of getting a refund."); return; }
      if (cmd === 'secret' || cmd === 'secrets' || cmd === 'easter eggs' || cmd === 'easteregg') {
        openWin('secrets');
        return;
      }
      if (cmd === 'sudo') {
        state.sudoCount = (state.sudoCount || 0) + 1;
        if (state.sudoCount >= 3) {
          state.sudoCount = 0;
          showClippy('sudo is not a Windows command. It never will be. Let it go.');
        }
        showEgg("sudo: Go away. This is Windows.");
        return;
      }
      if (cmd === 'wupdate' || cmd === 'windowsupdate' || cmd === 'update') { openWindowsUpdate(); return; }

      var target = map[cmd];
      if (target) openWin(target);
      else showEgg("Windows cannot find '" + raw.trim() + "'.\n\nMake sure you typed the name correctly, and then try again.\n\n(Or just try something else.)");
    }

    dom.runOk.addEventListener('click', handleRun);
    dom.runCancel.addEventListener('click', function () { dom.runDialog.classList.add('hidden'); dom.runInput.value = ''; });
    dom.runClose.addEventListener('click', function () { dom.runDialog.classList.add('hidden'); dom.runInput.value = ''; });
    dom.runInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleRun();
      if (e.key === 'Escape') { dom.runDialog.classList.add('hidden'); dom.runInput.value = ''; }
    });
  }

  /* ── Screensaver ── */
  function initScreensaver() {
    function resetScreensaverTimer() {
      if (!state.bootDone) return;
      clearTimeout(state.screensaverTimer);
      if (state.screensaverActive) {
        state.screensaverActive = false;
        dom.screensaver.classList.add('hidden');
        dom.ssWrapper.classList.remove('ss-moving');
      }
      state.screensaverTimer = setTimeout(function () {
        if (state.bootDone && !state.screensaverActive && dom.bsod.classList.contains('hidden')) {
          state.screensaverActive = true;
          dom.screensaver.classList.remove('hidden');
          dom.ssWrapper.classList.remove('ss-moving');
          dom.ssLogo.style.top = Math.random() * 80 + '%';
          dom.ssLogo.style.left = Math.random() * 80 + '%';
          void dom.ssLogo.offsetHeight;
          dom.ssWrapper.classList.add('ss-moving');
        }
      }, 120000);
    }

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(function (ev) {
      document.addEventListener(ev, resetScreensaverTimer);
    });
    resetScreensaverTimer();
  }

  /* ── BSOD ── */
  function showBSOD() {
    clearTimeout(state.screensaverTimer);
    if (state.screensaverActive) { dom.screensaver.classList.add('hidden'); state.screensaverActive = false; }
    dom.bsod.classList.remove('hidden');
    state.bsodCount = (state.bsodCount || 0) + 1;
    if (state.bsodCount >= 3) {
      state.bsodCount = 0;
      showEgg('You seem to enjoy this. I\'m concerned.\n\nMaybe try using a real operating system?', 'System Stability Warning');
    }

    // Animate memory dump
    var pctEl = $('#bsod-pct');
    var dumpEl = $('#bsod-dump');
    var pct = 0;
    clearInterval(state.bsodDumpInterval);
    state.bsodDumpInterval = setInterval(function () {
      pct += Math.random() * 6;
      if (pct >= 100) {
        pct = 100;
        clearInterval(state.bsodDumpInterval);
        state.bsodDumpInterval = null;
        if (dumpEl) dumpEl.textContent = 'Physical memory dump complete. (Nothing happened.)';
      }
      if (pctEl) pctEl.textContent = Math.floor(pct);
    }, 300);
  }

  /* ── Shutdown ── */
  function showShutdown() {
    // Check if Windows Update is running
    var hasUpdate = $$('.window[data-window^="wupdate-"]').some(function (w) {
      return w.classList.contains('active');
    });
    if (hasUpdate) {
      showEgg("Whoa there! Windows Update is still running!\n\nTurning off your computer now may corrupt your system.\n\n(Or it would, if this were a real computer. But still, rude.)");
    }

    dom.shutdownScreen.classList.remove('hidden');
    dom.shutdownBar.style.width = '0%';
    var progress = 0;
    if (state.shutdownInterval) clearInterval(state.shutdownInterval);

    state.shutdownInterval = setInterval(function () {
      progress += Math.random() * 4;
      if (progress >= 99) {
        progress = 99;
        clearInterval(state.shutdownInterval);
        state.shutdownInterval = null;
        setTimeout(function () {
          showEgg("Windows has successfully shut down.\n\nJust kidding, this is a website. You can't shut it down.\n\nNice try though.");
          dom.shutdownScreen.classList.add('hidden');
        }, 1000);
      }
      dom.shutdownBar.style.width = Math.min(progress, 99) + '%';
    }, 200);

    // Clean up old listener before adding new one
    if (state.shutdownAbortHandler) {
      dom.shutdownAbort.removeEventListener('click', state.shutdownAbortHandler);
    }
    state.shutdownAbortHandler = function () {
      if (state.shutdownInterval) {
        clearInterval(state.shutdownInterval);
        state.shutdownInterval = null;
      }
      dom.shutdownScreen.classList.add('hidden');
      showEgg("Shutdown aborted. Classic Windows move.");
    };
    dom.shutdownAbort.addEventListener('click', state.shutdownAbortHandler);
  }

  /* ── Recycle Bin ── */
  function renderRecycle() {
    dom.recycleContent.innerHTML = '';
    if (state.recycleItems.length === 0) {
      dom.recycleContent.innerHTML = '<div style="padding:20px;text-align:center;color:#999;font-size:11px;">The Recycle Bin is empty. Nothing to see here.</div>';
      return;
    }
    state.recycleItems.forEach(function (item, i) {
      var el = document.createElement('div');
      el.className = 'rec-item';
      el.innerHTML = '<span class="rec-item-icon">' + item.icon + '</span><span class="rec-item-name">' + item.name + '</span><span class="rec-item-date">' + item.date + '</span>';
      el.addEventListener('click', function () {
        var msgs = {
          'old_resume.doc': 'Previous version of resume.\nReplaced by the updated version in Documents.',
          'homework.txt': 'Old scratch notes from a Python course.\nNo longer needed.',
          'deleted_memes.zip': 'Archive of random images collected from the internet.\nSize: 0 bytes after cleanup.',
          'sketchy_script.vbs': 'Test script for automation experiments.\nMarked for deletion after review.',
          '404_error.png': 'A broken image file.\nThe thumbnail preview is not available.',
        };
        showEgg(msgs[item.name] || 'File has been deleted.\nOriginal location: C:\\Users\\Xangey\\Desktop');
      });
      dom.recycleContent.appendChild(el);
    });
  }

  /* ── File Explorer ── */
  var fs = {
    'c': {
      name: 'Local Disk (C:)', icon: '💽',
      folders: {
        'Users': { icon: '📁', folders: {
          'Xangey': { icon: '📁', folders: {
            'Documents': { icon: '📁', files: {
              'voidwave_plans.txt': 'VoidWave Discord Leveling Bot - Roadmap\n\n[x] XP & leveling system\n[x] Global + server leaderboards\n[x] AI chat (Llama 3.2)\n[x] Web profiles with Flask\n[ ] Role rewards\n[ ] Dashboard analytics\n---\nNext up: role rewards automation.',
              'todo.txt': '- Add role rewards system to VoidWave\n- Implement slash command sync\n- Build dashboard analytics page\n- Write unit tests for XP tracking\n- Document the API properly',
              'notes.txt': 'Remember to update the deployment scripts before the next release. The CI pipeline needs a new runner configuration for the ARM builds.',
              'ideas.txt': 'VoidWave dashboard with real-time server stats.\nCould use FastAPI for backend and Chart.js for graphs.\nMaybe add a webhook-based logging viewer.',
              'projects.txt': 'VoidWave - Discord leveling bot (Python, discord.py, Flask)\nLearning C - Systems programming\nServer infrastructure - Homelab k8s cluster\nNext up: role rewards & dashboard for VoidWave',
            } },
            'Desktop': { icon: '📁', files: {
              'readme.txt': 'Welcome to Xangey\'s Desktop.\n\nThis is a simulated Windows XP environment.\nFeel free to explore the file system,\nopen the command prompt, or check out the projects.',
              'links.txt': 'GitHub: https://github.com/xangeyfun\nTwitter: https://twitter.com/xangey_fun\nTikTok: https://tiktok.com/@xangey_',
              'shopping_list.txt': '- Groceries: milk, eggs, bread\n- New keyboard (mechanical, blue switches)\n- Raspberry Pi 5 for cluster project\n- Thermal paste for server maintenance',
            } },
            'Downloads': { icon: '📁', files: {
              'package.tar.gz': 'Compressed archive containing the latest VoidWave build.\nSize: 24.6 MB\nSHA256: a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
              'screenshot-2026-06-22.png': 'A screenshot of the VoidWave web profile page showing\nthe rank card, XP graph, and server leaderboard.',
              'config-backup.json': '{\n  "prefix": "!",\n  "modules": ["levels", "leaderboard", "ai", "roles", "fun"],\n  "ai_model": "llama3.2",\n  "db_path": "database.db"\n}',
              'node_modules.zip': 'Compressed node_modules for a React dashboard project.\nSize: 342 MB\nWarning: Contains approximately 14,000 dependencies.',
              'voidwave-setup.exe': 'VoidWave Bot Installer v1.2\n\nThis will install the VoidWave Discord bot and all\ndependencies. Requires Python 3.10+ and a Discord bot token.',
            } },
            'Pictures': { icon: '📁', files: {
              'bliss.jpg': 'The default Windows XP wallpaper. A rolling green hill\nunder a blue sky with clouds. Taken in Sonoma County, California.',
              'voidwave-screenshot.png': 'Web dashboard showing real-time server stats,\nXP leaderboard rankings, and activity graphs.',
              'meme_collection.zip': 'Archive of memes collected from various Discord servers.\nContents: 127 images\nTotal size: 18.3 MB',
            } },
            'Music': { icon: '📁', files: {
              'playlist.txt': 'Currently listening to:\n- Synthwave mix 2026\n- Lofi coding beats\n- Ambient soundscapes for debugging',
              'artist_notes.txt': 'Working on a small chiptune track for the VoidWave\nlanding page. Aiming for something between\nCommodore 64 era and modern synthwave.',
            } },
            'Videos': { icon: '📁', files: {
              'recording.mp4': 'Screen recording of a VoidWave bot demo session.\nDuration: 12:34\nResolution: 1920x1080\nCodec: H.264',
              'tutorial.mp4': 'Quick tutorial on setting up the VoidWave bot.\nDuration: 8:21\nCovers: token setup, invite URL, module config.',
              'server_room_tour.mp4': 'A tour of the homelab server rack.\nDuration: 3:47\nShows: the k8s cluster, NAS, and network setup.',
            } },
          } },
        } },
        'Program Files': { icon: '📁', folders: {
          'VoidWave': { icon: '📁', files: {
            'readme.txt': 'VoidWave Discord Leveling Bot v1.2\nA fast, simple leveling bot for Discord.\n\nFeatures:\n- XP & leveling\n- Leaderboards (server + global)\n- AI chat (Llama 3.2 via Ollama)\n- Shareable web profiles\n- Auto role rewards\n\nRun: python bot.py\nDashboard: python app.py\nConfig in .env',
            'config.json': '{\n  "version": "1.2",\n  "prefix": "!",\n  "modules": ["levels", "leaderboard", "ai", "roles", "fun"],\n  "db": "sqlite:///database.db"\n}',
            'bot.py': 'import discord\nfrom discord.ext import commands\n\nbot = commands.Bot(command_prefix="!", intents=discord.Intents.all())\n\n@bot.event\nasync def on_message(msg):\n    if msg.author.bot: return\n    await add_xp(msg.author.id, msg.guild.id, 10)\n    await bot.process_commands(msg)\n\nbot.run("BOT_TOKEN_HERE")',
          } },
          'Tools': { icon: '📁', files: {
            'sysinfo.exe': 'System Information Tool v1.0\n\nUsage: sysinfo.exe [options]\nOptions:\n  --cpu    Display CPU information\n  --mem    Display memory usage\n  --disk   Display disk space',
            'notepad.exe': 'Simple text editor.\nOpens a window where you can type things.\nNothing fancy, but it works.',
            'paint.exe': 'MS Paint clone.\nA simple drawing application with a canvas,\ncolor palette, and brush tool.\n\nUsage: Just start drawing!',
          } },
        } },
        'Windows': { icon: '📁', folders: {
          'System32': { icon: '📁', files: {
            'hal.dll': 'Hardware Abstraction Layer\nVersion 5.1.2600\n\nHandles low-level hardware communication.\nRequired for system operation.',
            'kernel32.dll': 'Windows NT Kernel\nVersion 5.1.2600\n\nCore system components including memory management,\nprocess management, and I/O operations.',
            'ntdll.dll': 'NT Layer DLL\nVersion 5.1.2600\n\nNative system services interface.',
            'user32.dll': 'Windows User API\nVersion 5.1.2600\n\nHandles window management, user input, and messaging.',
            'gdi32.dll': 'Graphics Device Interface\nVersion 5.1.2600\n\nProvides graphics rendering capabilities for applications.',
          } },
          'Fonts': { icon: '📁', files: {
            'tahoma.ttf': 'Tahoma font family\nDesigned by Matthew Carter\nIncludes regular, bold, italic, and bold italic variants.',
            'lucon.ttf': 'Lucida Console font\nMonospaced font used in terminal applications.',
            'segoeui.ttf': 'Segoe UI font family.\nUsed in modern Windows interfaces.\nIncluded for compatibility.',
          } },
          'Temp': { icon: '📁', files: {
            'setup_log.txt': '[2026-06-23 14:30:01] Setup started\n[2026-06-23 14:30:05] Checking dependencies...\n[2026-06-23 14:30:08] All dependencies satisfied\n[2026-06-23 14:30:12] Installing VoidWave package...\n[2026-06-23 14:30:45] Installation complete',
            'crash_dump.dmp': 'Memory dump from a test crash.\nSize: 256 MB\nGenerated: 2026-06-22\nCause: Intentional segfault test',
            'update_cache.bin': 'Temporary update cache for Windows Update.\nContains staged update files.\nCan be safely deleted.',
          } },
        } },
        'Projects': { icon: '📁', folders: {
          'VoidWave': { icon: '📁', files: {
            'build.log': '[2026-06-23 14:32:01] Loading leveling system...\n[2026-06-23 14:32:03] Connecting to Discord gateway...\n[2026-06-23 14:32:05] Connection established.\n[2026-06-23 14:32:06] Loaded XP tracking module.\n[2026-06-23 14:32:08] Llama 3.2 model ready.\n[2026-06-23 14:32:10] Bot is online.',
            'dependencies.txt': 'Required packages:\n- discord.py v2.3\n- Flask v3.0\n- PyNaCl v1.5\n- aiohttp v3.8\n- python-dotenv v1.0',
            'api_docs.md': '# VoidWave API\n\n## Endpoints\n- GET /api/xp/:user_id - Get user XP\n- POST /api/xp/add - Add XP to user\n- GET /api/leaderboard/:guild_id - Get guild leaderboard\n- GET /api/profile/:user_id - Get web profile\n\nAuth: Bearer token in Authorization header',
          } },
          'Learning-C': { icon: '📁', files: {
            'exercises.txt': 'Chapter 1: Variables and Data Types\nChapter 2: Control Flow\nChapter 3: Functions\nChapter 4: Pointers and Arrays\nChapter 5: Structures\nChapter 6: File I/O',
            'notes.txt': 'Key concepts to review:\n- Pointer arithmetic and array indexing\n- Memory allocation and deallocation\n- Struct padding and alignment\n- Function pointers and callbacks',
            'hello.c': '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
          } },
          'Server-Stuff': { icon: '📁', files: {
            'docker-compose.yml': 'version: "3.8"\nservices:\n  voidwave:\n    build: .\n    ports:\n      - "8080:8080"\n    environment:\n      - DISCORD_TOKEN=${DISCORD_TOKEN}\n      - DB_PATH=/data/database.db\n    volumes:\n      - ./data:/data',
            'deploy_notes.txt': 'Deployment checklist:\n1. Pull latest from git\n2. Build Docker image\n3. Run migrations\n4. Restart service\n5. Verify health endpoint\n6. Check logs for errors',
          } },
        } },
      },
    },
    'd': {
      name: 'Data (D:)', icon: '💾',
      folders: {
        'Backups': { icon: '📁', files: {
          'voidwave_db_backup.sql': '-- VoidWave database backup\n-- Generated: 2026-06-23 03:00:00\n\nCREATE TABLE IF NOT EXISTS users (\n    user_id TEXT PRIMARY KEY,\n    xp INTEGER DEFAULT 0,\n    level INTEGER DEFAULT 1,\n    last_message TIMESTAMP\n);\n\nINSERT INTO users VALUES (\'12345\', 1500, 5, \'2026-06-23 02:45:00\');\nINSERT INTO users VALUES (\'67890\', 3200, 8, \'2026-06-23 02:50:00\');',
          'config_backup_2026-06-01.json': '{\n  "backup_date": "2026-06-01",\n  "server_config": {\n    "hostname": "xangey-server-01",\n    "ip": "192.168.1.100",\n    "services": ["voidwave", "nginx", "postgres"]\n  },\n  "notes": "Pre-migration backup"\n}',
          'dotfiles_backup.tar.gz': 'Archive of dotfiles (.bashrc, .vimrc, .gitconfig, etc.)\nSize: 64 KB\nLast modified: 2026-06-15',
          'nginx_configs.bak': 'Backup of nginx configuration files.\nIncludes sites-available, sites-enabled, and SSL cert configs.\nDate: 2026-06-20',
        } },
        'Games': { icon: '📁', files: {
          'doom_notes.txt': 'DOOM (1993) - Quick reference\n\nCheat codes:\n- IDDQD - God mode\n- IDKFA - Full weapons & ammo\n- IDCLIP - No clipping\n\nFavorite WADs: Ancient Aliens, Sunlust, Valiant',
          'minecraft_server.properties': '# Minecraft Server Properties\nserver-port=25565\nmax-players=20\nmotd=A Xangey Server\nlevel-type=amplified\ndifficulty=hard\npvp=true\nonline-mode=true',
          'save_game_001.sav': 'RPG Maker save file - Chapter 3, Level 17\nPlaytime: 24h 37m\nLocation: The Crystal Caverns\nQuest: Retrieve the Ancient Artifact',
          'highscores.dat': '1. XANGEY    -   999,999  -  LEVEL 99\n2. VOIDWAVE  -   850,000  -  LEVEL 85\n3. NEKO      -   720,450  -  LEVEL 72\n4. PIXEL     -   650,200  -  LEVEL 65\n5. BYTE      -   580,100  -  LEVEL 58',
        } },
        'Projects': { icon: '📁', folders: {
          'Dashboard': { icon: '📁', files: {
            'index.html': '<!DOCTYPE html>\n<html>\n<head><title>VoidWave Dashboard</title></head>\n<body>\n  <h1>VoidWave Analytics</h1>\n  <div id="stats">Loading...</div>\n  <script src="dashboard.js"></script>\n</body>\n</html>',
            'dashboard.js': 'async function loadStats() {\n  const res = await fetch("/api/stats");\n  const data = await res.json();\n  document.getElementById("stats").innerHTML =\n    `<p>Total Users: ${data.users}</p>\n     <p>Messages Tracked: ${data.messages}</p>\n     <p>Active Servers: ${data.servers}</p>`;\n}\nloadStats();',
            'styles.css': 'body {\n  font-family: Tahoma, sans-serif;\n  background: #1a1a2e;\n  color: #fff;\n  margin: 0;\n  padding: 20px;\n}\nh1 { color: #4a9af5; }\n#stats { margin-top: 20px; }',
          } },
          'CLI-Tools': { icon: '📁', files: {
            'sysmon.py': '#!/usr/bin/env python3\nimport psutil\nimport platform\n\ndef sys_info():\n    print(f"System: {platform.system()} {platform.release()}")\n    print(f"CPU: {psutil.cpu_percent()}% used")\n    print(f"RAM: {psutil.virtual_memory().percent}% used")\n    print(f"Disk: {psutil.disk_usage(\'/\').percent}% used")\n\nif __name__ == "__main__":\n    sys_info()',
            'backup.sh': '#!/bin/bash\n# Automated backup script\nBACKUP_DIR="/mnt/backups"\nSOURCE_DIRS=("/etc" "/home" "/var/www")\nDATE=$(date +%Y%m%d)\n\nfor dir in "${SOURCE_DIRS[@]}"; do\n    tar -czf "${BACKUP_DIR}/backup_$(basename $dir)_${DATE}.tar.gz" "$dir"\ndone\necho "Backup complete: ${DATE}"',
          } },
        } },
        'Videos': { icon: '📁', files: {
          'project_demo_2026.mp4': 'Demo of the VoidWave dashboard v2.0\nDuration: 15:22\nShows: real-time stats, XP graphs, user management.',
          'server_build_timelapse.mp4': 'Timelapse of building the home server rack.\nDuration: 2:15\nSpans: 3 days of cable management and setup.',
          'secret_project_teaser.mp4': 'A teaser for an upcoming project.\nDuration: 0:30\nStatus: Classified',
        } },
        'Temp': { icon: '📁', files: {
          'download_partial.bin': 'Partial download of a large file.\nProgress: 67%\nSize: 1.2 GB / 1.8 GB\nETA: 12 minutes',
          'cache_clear.bat': '@echo off\necho Clearing temporary files...\ndel /q /s %TEMP%\\*.*\necho Done!',
          'render_output.png': 'A test render of a logo concept.\nDimensions: 1920x1080\nFormat: PNG\nCreated: 2026-06-22',
        } },
      },
    },
  };

  function navigateExplorer(path) {
    state.explorerHistory = state.explorerHistory.slice(0, state.explorerHistoryIdx + 1);
    state.explorerHistory.push(path);
    state.explorerHistoryIdx = state.explorerHistory.length - 1;
    renderPath(path);
  }

  function renderDrives() {
    dom.explorerContent.innerHTML = '';
    Object.keys(fs).forEach(function (k) {
      var d = fs[k];
      var el = makeExpItem(d.icon, d.name, true);
      el.addEventListener('dblclick', function () { navigateExplorer(k); });
      dom.explorerContent.appendChild(el);
    });
    dom.explorerAddress.textContent = 'My Computer';
    state.explorerHistory = ['root'];
    state.explorerHistoryIdx = 0;
  }

  function makeExpItem(icon, label, folder) {
    var el = document.createElement('button');
    el.className = 'exp-item';
    el.innerHTML = '<div class="exp-item-icon">' + icon + '</div><div class="exp-item-label">' + label + '</div>';
    if (folder) el.classList.add('exp-folder');
    el.addEventListener('click', function () {
      $$('.exp-item.selected').forEach(function (e) { e.classList.remove('selected'); });
      el.classList.add('selected');
    });
    return el;
  }

  function getNodeAtPath(path) {
    if (path === 'root') return { node: null, label: 'My Computer', isDriveList: true };
    var parts = path.split('/');
    var label = 'My Computer';
    var current = null;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (i === 0) {
        if (!fs[p]) return null;
        current = fs[p];
        label = current.name;
      } else {
        if (!current || !current.folders || !current.folders[p]) return null;
        current = current.folders[p];
        label = p;
      }
    }
    return { node: current, label: label, isDriveList: false };
  }

  function renderPath(path) {
    dom.explorerContent.innerHTML = '';
    var result = getNodeAtPath(path);
    if (!result || (!result.isDriveList && !result.node)) {
      dom.explorerContent.innerHTML = '<div style="padding:20px;color:#999;font-size:12px;">Path not found.</div>';
      return;
    }

    if (result.isDriveList) {
      renderDrives();
      return;
    }

    var data = result.node;
    var label = result.label;

    if (data.folders) {
      Object.keys(data.folders).forEach(function (k) {
        var f = data.folders[k];
        var el = makeExpItem(f.icon, k, true);
        el.addEventListener('dblclick', function () { navigateExplorer(path + '/' + k); });
        dom.explorerContent.appendChild(el);
      });
    }
    if (data.files) {
      Object.keys(data.files).forEach(function (k) {
        var el = makeExpItem('📄', k);
        el.addEventListener('dblclick', function () { openTextFile(k, data.files[k]); });
        dom.explorerContent.appendChild(el);
      });
    }

    var hasFolders = data.folders && Object.keys(data.folders).length > 0;
    var hasFiles = data.files && Object.keys(data.files).length > 0;
    if (!hasFolders && !hasFiles) {
      dom.explorerContent.innerHTML = '<div style="width:100%;text-align:center;padding:30px 0;color:#999;font-size:12px;">This folder is empty.</div>';
    }

    var displayPath = 'My Computer > ' + path.replace(/\//g, ' > ');
    dom.explorerAddress.textContent = displayPath;
  }

  function initExplorer() {
    renderDrives();
    dom.explorerBack.addEventListener('click', function () {
      if (state.explorerHistoryIdx > 0) {
        state.explorerHistoryIdx--;
        renderPath(state.explorerHistory[state.explorerHistoryIdx]);
      }
    });
  }

  /* ── Command Prompt ── */
  function initCmd() {
    var input = dom.cmdInput;
    var output = dom.cmdOutput;
    if (!input) return;

    function resolveCmdPath(p) {
      if (!p || p.trim() === '') return state.cmdDir;
      p = p.trim().replace(/\\/g, '/').replace(/^\.\//, '');
      var parts;
      if (p.indexOf('/') === 0) {
        var drive = state.cmdDir.split('/')[0];
        parts = [drive].concat(p.substring(1).split('/').filter(Boolean));
      } else {
        parts = state.cmdDir.split('/').concat(p.split('/').filter(Boolean));
      }
      var r = [];
      for (var i = 0; i < parts.length; i++) {
        if (parts[i] === '.' || parts[i] === '') continue;
        if (parts[i] === '..') { if (r.length > 1) r.pop(); }
        else r.push(parts[i]);
      }
      return r.join('/');
    }

    function getCmdNode(p) {
      var parts = p.split('/');
      if (!fs[parts[0]]) return null;
      var cur = fs[parts[0]];
      for (var i = 1; i < parts.length; i++) {
        if (!cur.folders || !cur.folders[parts[i]]) return null;
        cur = cur.folders[parts[i]];
      }
      return cur;
    }

    function cmdPathDisp(p) {
      var parts = p.split('/');
      return parts[0].toUpperCase() + ':\\' + parts.slice(1).join('\\');
    }

    function writeLine(text, cls) {
      var d = document.createElement('div');
      d.className = cls || 'cmd-echo';
      d.textContent = text;
      output.appendChild(d);
      output.scrollTop = output.scrollHeight;
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var cmd = input.value.trim();
        input.value = '';
        if (cmd) {
          state.cmdHistory.push(cmd);
          state.cmdHistoryIdx = state.cmdHistory.length;
          handleCmd(cmd);
        }
        output.scrollTop = output.scrollHeight;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (state.cmdHistory.length > 0) {
          state.cmdHistoryIdx = Math.max(0, state.cmdHistoryIdx - 1);
          input.value = state.cmdHistory[state.cmdHistoryIdx];
        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.cmdHistoryIdx = Math.min(state.cmdHistory.length, state.cmdHistoryIdx + 1);
        input.value = state.cmdHistoryIdx < state.cmdHistory.length ? state.cmdHistory[state.cmdHistoryIdx] : '';
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        var partial = input.value.trim().toLowerCase();
        var cmds = ['help', 'tutorial', 'commands', 'about', 'whoami', 'socials', 'projects', 'date', 'time', 'ver', 'dir', 'cd', 'cls', 'echo', 'type', 'neko', 'calc', 'bsod', 'shutdown', 'exit', 'paint', 'wupdate'];
        var match = cmds.filter(function (c) { return c.indexOf(partial) === 0; });
        if (match.length === 1) input.value = match[0];
      }
    });

    function handleCmd(raw) {
      var cmd = raw.trim().toLowerCase();
      var args = cmd.split(' ');
      var main = args[0];

      writeLine(cmdPathDisp(state.cmdDir) + '> ' + raw, 'cmd-echo');

      var cmds = {
        'help': function () {
          writeLine('this is a command prompt. you type commands and press enter.', 'cmd-info');
          writeLine('', 'cmd-echo');
          writeLine('  cd <folder>      move into a folder (cd .. to go back)', 'cmd-info');
          writeLine('  dir <path>       list files and folders', 'cmd-info');
          writeLine('  type <file>      show the contents of a file', 'cmd-info');
          writeLine('  cls              clear the screen', 'cmd-info');
          writeLine('', 'cmd-echo');
          writeLine('paths can be relative (Documents) or absolute (\\Windows).', 'cmd-info');
          writeLine('try "tutorial" for a full walkthrough, or "commands" for every command.', 'cmd-info');
        },
        'tutorial': function () {
          writeLine('ok so youre looking at a command prompt. its how people used', 'cmd-info');
          writeLine('computers before mice were cool. still works though.', 'cmd-info');
          writeLine('', 'cmd-echo');
          writeLine('  step 1  type "dir" and press enter', 'cmd-info');
          writeLine('            that lists whats in your current folder.', 'cmd-info');
          writeLine('', 'cmd-echo');
          writeLine('  step 2  type "cd Documents" and press enter', 'cmd-info');
          writeLine('            that moves you into the Documents folder.', 'cmd-info');
          writeLine('            notice the prompt changed - youre there now.', 'cmd-info');
          writeLine('', 'cmd-echo');
          writeLine('  step 3  type "dir" again to see whats inside', 'cmd-info');
          writeLine('', 'cmd-echo');
          writeLine('  step 4  type "type todo.txt"', 'cmd-info');
          writeLine('            that prints the file contents to the screen.', 'cmd-info');
          writeLine('', 'cmd-echo');
          writeLine('  step 5  type "cd .." to go back up a folder', 'cmd-info');
          writeLine('', 'cmd-echo');
          writeLine('use "commands" to see everything this thing can do.', 'cmd-info');
        },
        'commands': function () {
          writeLine('all commands:', 'cmd-highlight');
          writeLine('  about       open About Me window', 'cmd-info');
          writeLine('  bsod        funny blue screen', 'cmd-info');
          writeLine('  calc        do math like calc 2+2', 'cmd-info');
          writeLine('  cd          change directory', 'cmd-info');
          writeLine('  cls         clear the screen', 'cmd-info');
          writeLine('  commands    show this list', 'cmd-info');
          writeLine('  date        current date', 'cmd-info');
          writeLine('  dir         list files in a folder', 'cmd-info');
          writeLine('  echo        repeat something back', 'cmd-info');
          writeLine('  exit        close this window', 'cmd-info');
          writeLine('  help        quick tips for using the terminal', 'cmd-info');
          writeLine('  neko        cat', 'cmd-info');
          writeLine('  paint       open ms paint', 'cmd-info');
          writeLine('  projects    open Projects window', 'cmd-info');
          writeLine('  shutdown    turn off the computer', 'cmd-info');
          writeLine('  socials     open Socials window', 'cmd-info');
          writeLine('  time        current time', 'cmd-info');
          writeLine('  tutorial    step by step walkthrough', 'cmd-info');
          writeLine('  type        read a file', 'cmd-info');
          writeLine('  ver         version info', 'cmd-info');
          writeLine('  whoami      who are you', 'cmd-info');
          writeLine('  wupdate     windows update (dont)', 'cmd-info');
        },
        'about': function () {
          writeLine('  Opening About Me window...', 'cmd-info');
          openWin('about');
        },
        'whoami': function () {
          writeLine('', 'cmd-echo');
          writeLine('xangey', 'cmd-highlight');
          writeLine('A developer who definitely does not have a keyboard cat problem.', 'cmd-echo');
        },
        'socials': function () {
          writeLine('  Opening Socials window...', 'cmd-info');
          openWin('socials');
        },
        'projects': function () {
          writeLine('  Opening Projects window...', 'cmd-info');
          openWin('projects');
        },
        'date': function () {
          var n = new Date();
          writeLine('The current date is: ' + n.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 'cmd-echo');
        },
        'time': function () {
          var n = new Date();
          writeLine('The current time is: ' + n.toLocaleTimeString('en-US'), 'cmd-echo');
        },
        'ver': function () {
          writeLine('', 'cmd-echo');
          writeLine('Microsoft Windows XP [Version 5.1.2600]', 'cmd-highlight');
          writeLine('Xangey Edition (Build 2026)', 'cmd-info');
          writeLine('(c) Copyright 2026. A real Microsoft product. (Not really.)', 'cmd-echo');
        },
        'dir': function () {
          function randDate() {
            var d = new Date(2026, 4, 1);
            d.setDate(d.getDate() + Math.floor(Math.random() * 60));
            var mm = String(d.getMonth() + 1).padStart(2, '0');
            var dd = String(d.getDate()).padStart(2, '0');
            var yyyy = d.getFullYear();
            var h = d.getHours();
            var m = String(d.getMinutes()).padStart(2, '0');
            var ampm = h >= 12 ? 'PM' : 'AM';
            var h12 = h % 12 || 12;
            return mm + '/' + dd + '/' + yyyy + '  ' + String(h12).padStart(2, '0') + ':' + m + ' ' + ampm;
          }
          var target = raw.substring(4).trim();
          var dirPath = resolveCmdPath(target);
          var node = getCmdNode(dirPath);
          if (!node) {
            writeLine('The system cannot find the path specified.', 'cmd-error');
            return;
          }
          writeLine(' Volume in drive ' + dirPath.charAt(0).toUpperCase() + ' has no label.', 'cmd-echo');
          writeLine(' Volume Serial Number is XP42-2024', 'cmd-echo');
          writeLine('', 'cmd-echo');
          writeLine(' Directory of ' + cmdPathDisp(dirPath), 'cmd-echo');
          writeLine('', 'cmd-echo');
          var dc = 0, fc = 0, totalSize = 0;
          var lines = [];
          var dotDate = randDate();
          lines.push(dotDate + '    <DIR>          .');
          lines.push(dotDate + '    <DIR>          ..');
          dc += 2;
          if (node.folders) {
            Object.keys(node.folders).forEach(function (k) {
              lines.push(randDate() + '    <DIR>          ' + k);
              dc++;
            });
          }
          if (node.files) {
            Object.keys(node.files).forEach(function (k) {
              var size = Math.floor(Math.random() * 5000) + 50;
              totalSize += size;
              fc++;
              var s = String(size);
              while (s.length < 14) s = ' ' + s;
              lines.push(randDate() + '  ' + s + '  ' + k);
            });
          }
          lines.forEach(function (l) { writeLine(l, 'cmd-echo'); });
          writeLine('', 'cmd-echo');
          writeLine('               ' + fc + ' File(s)         ' + totalSize.toLocaleString() + ' bytes', 'cmd-echo');
          writeLine('               ' + dc + ' Dir(s)  15.3 GB free', 'cmd-echo');
        },
        'cls': function () { output.innerHTML = ''; },
        'echo': function () {
          var txt = raw.substring(5).trim();
          writeLine(txt || 'ECHO is on.', 'cmd-echo');
        },
        'type': function () {
          var file = raw.substring(5).trim().replace(/\\/g, '/');
          if (!file) { writeLine('The syntax of the command is incorrect.', 'cmd-error'); return; }
          var parts = file.split('/');
          var filename = parts.pop();
          var dirPath = resolveCmdPath(parts.join('/'));
          var node = getCmdNode(dirPath);
          if (!node || !node.files || !node.files[filename]) {
            writeLine('The system cannot find the file specified.', 'cmd-error');
            return;
          }
          writeLine('', 'cmd-echo');
          writeLine(node.files[filename], 'cmd-info');
          writeLine('', 'cmd-echo');
        },
        'neko': function () {
          writeLine('', 'cmd-echo');
          writeLine('  ╱|、', 'cmd-echo');
          writeLine(' (˚ˎ 。7 ', 'cmd-echo');
          writeLine('  |、˜〵         ', 'cmd-echo');
          writeLine('  じしˍ,)ノ', 'cmd-echo');
          writeLine('', 'cmd-echo');
          writeLine('🐱 meow!', 'cmd-highlight');
        },
        'calc': function () {
          var m = raw.substring(5).trim();
          try {
            var result = Function('"use strict";return (' + m + ')')();
            writeLine('', 'cmd-echo');
            writeLine('  Result: ' + result, 'cmd-highlight');
          } catch (e) { writeLine('  Error: Invalid calculation. Did you break math?', 'cmd-error'); }
        },
        'cd': function () {
          var target = raw.substring(3).trim();
          if (!target) {
            writeLine(' ' + cmdPathDisp(state.cmdDir), 'cmd-echo');
            return;
          }
          var resolved = resolveCmdPath(target);
          if (resolved === state.cmdDir) return;
          var node = getCmdNode(resolved);
          if (!node) {
            writeLine('The system cannot find the path specified.', 'cmd-error');
            return;
          }
          state.cmdDir = resolved;
          dom.cmdPrompt.textContent = cmdPathDisp(state.cmdDir) + '>';
        },
        'paint': function () {
          writeLine('  Starting Paint...', 'cmd-info');
          openPaint();
        },
        'bsod': function () {
          writeLine('  Initiating Blue Screen of Death...', 'cmd-warn');
          setTimeout(function () { showBSOD(); }, 500);
        },
        'shutdown': function () {
          if (hasUpdateRunning()) {
            writeLine('  Windows Update is still running. Please wait...', 'cmd-error');
            return;
          }
          writeLine('  Shutting down...', 'cmd-warn');
          setTimeout(function () { showShutdown(); }, 500);
        },
        'exit': function () {
          writeLine('  Closing CMD...', 'cmd-info');
          setTimeout(function () { closeWin('cmd'); }, 300);
        },
        'wupdate': function () {
          writeLine('  Starting Windows Update...', 'cmd-info');
          openWindowsUpdate();
        },
      };

      if (cmds[main]) cmds[main]();
      else if (main === '' || main === ' ') { /*noop*/ }
      else if (main === 'why') {
        showClippy('because. next question.');
        writeLine('"' + main + '" is not recognized as an internal or external command, operable program or batch file.', 'cmd-error');
      }
      else {
        var swear = ['fuck', 'shit', 'damn', 'bitch', 'ass', 'crap', 'piss', 'dick', 'bastard', 'bullshit', 'wtf', 'stupid', 'hell', 'suck'];
        if (swear.indexOf(main) !== -1) {
          showClippy('language. your mother would be disappointed.');
          writeLine('"' + main + '" is not recognized as an internal or external command, operable program or batch file.', 'cmd-error');
        } else {
          writeLine('"' + main + '" is not recognized as an internal or external command, operable program or batch file.', 'cmd-error');
        }
      }
    }

    // Welcome message
    dom.cmdPrompt.textContent = cmdPathDisp(state.cmdDir) + '>';
    writeLine('Microsoft Windows XP [Version 5.1.2600]', 'cmd-highlight');
    writeLine('(c) Copyright 1985-2026 Microsoft Corp.', 'cmd-echo');
    writeLine('', 'cmd-echo');
    writeLine(cmdPathDisp(state.cmdDir) + '> type "help" for tips or "commands" for everything. have fun!', 'cmd-info');
    writeLine('', 'cmd-echo');
  }

  /* ── Keyboard Shortcuts ── */
  function initKeyboard() {
    document.addEventListener('keydown', function (e) {
      state.konamiSeq.push(e.key);
      if (state.konamiSeq.length > 10) state.konamiSeq.shift();
      if (state.konamiSeq.length === 10 && state.konamiSeq.every(function (k, i) { return k === KONAMI[i]; })) {
        state.konamiSeq = [];
        showEgg('Konami mode activated!\n\nAchievement: ˘͈ ᵕ ˘͈');
        return;
      }
      if (e.ctrlKey && e.altKey && e.shiftKey && (e.key === 'B' || e.key === 'b')) { e.preventDefault(); showBSOD(); }
      if (e.key === 'Escape') {
        if (!dom.bsod.classList.contains('hidden')) dom.bsod.classList.add('hidden');
        if (!dom.eggDialog.classList.contains('hidden')) dom.eggDialog.classList.add('hidden');
        if (!dom.shutdownScreen.classList.contains('hidden')) dom.shutdownScreen.classList.add('hidden');
        if (!dom.runDialog.classList.contains('hidden')) { dom.runDialog.classList.add('hidden'); dom.runInput.value = ''; }
        if (!dom.ctxMenu.classList.contains('hidden')) dom.ctxMenu.classList.add('hidden');
        if (state.screensaverActive) { dom.screensaver.classList.add('hidden'); state.screensaverActive = false; }
        if (state.startMenuOpen) toggleStartMenu();
        if (dom.wifiPopup && !dom.wifiPopup.classList.contains('hidden')) dom.wifiPopup.classList.add('hidden');
      }
      if (e.key === 'F5') {
        e.preventDefault();
        state.f5Count = (state.f5Count || 0) + 1;
        clearTimeout(state.f5Timer);
        state.f5Timer = setTimeout(function () { state.f5Count = 0; }, 5000);
        var msgs = [
          'Desktop refreshed!',
          'Desktop refreshed... again?',
          'Stop pressing F5.',
          'I\'m begging you.',
          'OK that\'s it. Desktop is now in witness protection.',
        ];
        showEgg(msgs[Math.min(state.f5Count - 1, msgs.length - 1)]);
        if (dom.clippy) showClippy('I see you\'ve discovered the F5 key. Very productive.');
      }
      if (e.key === 'Meta' || e.key === 'Windows') { e.preventDefault(); toggleStartMenu(); }
    });
  }

  /* ── WiFi Networks ── */
  var WIFI_NETWORKS = [
    'Never Gonna Give You Up',
    'Linksys',
    'Never Gonna Let You Down',
    'xfinitywifi',
    'Never Gonna Run Around',
    'NETGEAR42',
    'And Desert You',
    'FBI Surveillance Van',
    'Never Gonna Make You Cry',
    'ATT-WiFi',
    'Never Gonna Say Goodbye',
    'Pretty Fly for a WiFi',
    'Never Gonna Tell A Lie',
    'And Hurt You',
  ];

  function renderWifiNetworks() {
    if (!dom.wifiList) return;
    dom.wifiList.innerHTML = '';
    WIFI_NETWORKS.forEach(function (ssid, i) {
      var item = document.createElement('div');
      item.className = 'wifi-item';
      var bars = 2 + Math.floor(Math.random() * 3);
      var barsHtml = '';
      for (var b = 0; b < 4; b++) {
        var cls = b < bars ? (bars >= 4 ? 'wifi-bar on2' : 'wifi-bar on') : 'wifi-bar';
        barsHtml += '<div class="' + cls + '" style="height:' + (4 + b * 2) + 'px"></div>';
      }
      var secure = Math.random() > 0.5;
      item.innerHTML =
        '<span class="wifi-item-name">' + ssid + '</span>' +
        (secure ? '<span class="wifi-secure">🔒</span>' : '') +
        '<span class="wifi-item-bars">' + barsHtml + '</span>';
      item.addEventListener('click', function () {
        dom.wifiStatus.textContent = 'Connecting to "' + ssid + '"...';
        showEgg('Connecting to "' + ssid + '"...\n\nJust kidding! This is a fake WiFi popup.');
        dom.wifiPopup.classList.add('hidden');
      });
      dom.wifiList.appendChild(item);
    });
  }

  /* ── Tray Icons ── */
  function initTray() {
    var soundClickCount = 0;
    var soundClickTimer = null;
    if (dom.traySound) dom.traySound.addEventListener('click', function () {
      state.soundEnabled = !state.soundEnabled;
      showToast(state.soundEnabled ? '🔊' : '🔇', state.soundEnabled ? 'Sound enabled.' : 'Sound disabled.');
      soundClickCount++;
      clearTimeout(soundClickTimer);
      soundClickTimer = setTimeout(function () { soundClickCount = 0; }, 3000);
      if (soundClickCount >= 5) {
        soundClickCount = 0;
        showEgg('Make up your mind!\n\nYou have clicked the sound button 5 times in 3 seconds.\n\nThis is concerning behavior.');
      }
    });

    if (dom.trayDark) {
      var saved = localStorage.getItem('xp-dark');
      if (saved !== null) state.darkMode = saved === '1';
      document.body.classList.toggle('dark-mode', state.darkMode);

      dom.trayDark.addEventListener('click', function () {
        state.darkMode = !state.darkMode;
        document.body.classList.toggle('dark-mode', state.darkMode);
        localStorage.setItem('xp-dark', state.darkMode ? '1' : '0');
        showToast(state.darkMode ? '🌙' : '☀️', state.darkMode ? 'Dark mode on' : 'Light mode on');
      });
    }

    if (dom.trayNetwork) dom.trayNetwork.addEventListener('click', function (e) {
      e.stopPropagation();
      dom.wifiPopup.classList.toggle('hidden');
      if (!dom.wifiPopup.classList.contains('hidden')) renderWifiNetworks();
    });

    // Close wifi popup when clicking elsewhere
    document.addEventListener('click', function (e) {
      if (dom.wifiPopup && !dom.wifiPopup.classList.contains('hidden') && !dom.trayNetwork.contains(e.target) && !dom.wifiPopup.contains(e.target)) {
        dom.wifiPopup.classList.add('hidden');
      }
    });

    // Escape key closes wifi popup (handled in keyboard init)

    if (dom.clock) dom.clock.addEventListener('dblclick', function () {
      var msgs = [
        "The clock is powered by a tiny hamster. Please don't scare it.",
        "This clock is accurate to within ±3 business days.",
        "Congratulations! You found the clock. Want a medal?",
      ];
      showEgg(msgs[Math.floor(Math.random() * msgs.length)]);
    });
  }

  /* ── Recycle Bin Controls ── */
  var recycleConfirmCount = 0;
  function initRecycle() {
    // Empty button
    dom.recycleEmpty.addEventListener('click', function () {
      if (state.recycleItems.length === 0) { showEgg('The Recycle Bin is already empty.\n\nStop trying to delete nothing.'); return; }
      recycleConfirmCount++;
      if (recycleConfirmCount < 3) {
        var msgs = ['Are you sure?', 'Really really sure?', 'Last chance. Are you absolutely sure?'];
        showEgg(msgs[recycleConfirmCount - 1] + '\n\nThere are ' + state.recycleItems.length + ' item(s) in the bin.');
        return;
      }
      recycleConfirmCount = 0;
      state.recycleItems = [];
      renderRecycle();
      showEgg('Recycle Bin emptied.\n\nAll files have been sent to the shadow realm.\n\nThey will not be missed.');
    });

    // Restore button
    dom.recycleRestore.addEventListener('click', function () {
      if (state.recycleItems.length === 0) {
        showEgg('Nothing to restore.\n\nYou deleted nothing.\nYou restored nothing.\n\nNothing happened.');
        return;
      }
      showEgg("All items restored.\n\n(They were not actually restored. Deleting is permanent. Like your browser history.)");
    });
  }

  /* ── Expose Globals ── */
  function exposeGlobals() {
    window.xp = {
      copyDiscord: function () {
        navigator.clipboard.writeText('xangey').then(function () {
          showToast('✅', 'Discord username "xangey" copied!');
        }).catch(function () {
          showEgg('Discord: xangey\n\n(Could not copy automatically. Try selecting it manually.)');
        });
      },
      openWindow: openWin,
      closeWindow: closeWin,
      showEgg: showEgg,
      showToast: showToast,
    };
  }

  /* ── Egg Dialog & Clippy ── */
  function initEggDialog() {
    dom.eggOk.addEventListener('click', function () { dom.eggDialog.classList.add('hidden'); });
    dom.eggClose.addEventListener('click', function () { dom.eggDialog.classList.add('hidden'); });
    dom.eggDialog.addEventListener('click', function (e) { if (e.target === this) this.classList.add('hidden'); });
    dom.clippyClose.addEventListener('click', function () { dom.clippy.classList.add('hidden'); });
    dom.clippy.addEventListener('click', function (e) { if (e.target === dom.clippy) this.classList.add('hidden'); });
  }

  /* ── BSOD click ── */
  function initBSOD() {
    dom.bsod.addEventListener('click', function () { this.classList.add('hidden'); });
  }

  /* ── Easter Eggs ── */
  function initEasterEggs() {


    // Screensaver logo click
    if (dom.ssLogo) {
      dom.ssLogo.addEventListener('click', function () {
        showEgg("You clicked the Windows logo in the screensaver.\n\nThat's 10 seconds of your life you'll never get back.");
      });
    }
  }

  /* ── Discord Status ── */
  var DISCORD_AVATAR = 'https://cdn.discordapp.com/avatars/996771607630585856/';
  var LANYARD_URL = 'https://api.lanyard.rest/v1/users/996771607630585856';

  var STATUS_MAP = {
    online: { label: 'Online', cls: 'status-online' },
    idle: { label: 'Idle', cls: 'status-idle' },
    dnd: { label: 'Do Not Disturb', cls: 'status-dnd' },
    offline: { label: 'Offline', cls: 'status-offline' },
  };

  var discordProgressInterval = null;
  var discordActivityTimestamps = null;
  var discordPrevStatus = null;
  var discordPrevActivityKey = null;
  var discordLoaded = false;
  var discordElapsedList = [];

  function updateDiscordProgress() {
    var fillEl = dom.discordProgressFill;
    var elapsedEl = dom.discordProgressElapsed;
    var totalEl = dom.discordProgressTotal;
    if (!discordActivityTimestamps || !fillEl || !elapsedEl || !totalEl) return;
    var now = Date.now();
    var start = discordActivityTimestamps.start;
    var end = discordActivityTimestamps.end;
    if (!start || !end) return;
    var total = end - start;
    if (total <= 0) return;
    var elapsed = Math.min(now - start, total);
    var pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    fillEl.style.width = pct + '%';
    function fmt(ms) {
      var s = Math.floor(Math.max(0, ms) / 1000);
      var m = Math.floor(s / 60);
      s = s % 60;
      return m + ':' + (s < 10 ? '0' : '') + s;
    }
    elapsedEl.textContent = fmt(elapsed);
    totalEl.textContent = fmt(total);
    updateDiscordElapsed();
    if (elapsed >= total) {
      clearInterval(discordProgressInterval);
      discordProgressInterval = null;
      discordActivityTimestamps = null;
      fetchDiscordStatus();
    }
  }

  function fmtElapsed(ms) {
    var s = Math.floor(ms / 1000);
    if (s < 60) return s + 's';
    var m = Math.floor(s / 60);
    s = s % 60;
    if (m < 60) return m + 'm ' + s + 's';
    var h = Math.floor(m / 60);
    m = m % 60;
    return h + 'h ' + m + 'm';
  }

  function updateDiscordElapsed() {
    var now = Date.now();
    for (var i = 0; i < discordElapsedList.length; i++) {
      var item = discordElapsedList[i];
      if (item.el) item.el.textContent = '\u2022 ' + fmtElapsed(now - item.createdAt);
    }
  }

  function discordTick() {
    updateDiscordProgress();
    updateDiscordElapsed();
  }

  function fetchDiscordStatus() {
    fetch(LANYARD_URL)
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.success || !res.data) return;
        var d = res.data;
        var avatar = d.discord_user.avatar;
        var status = d.discord_status || 'offline';
        var info = STATUS_MAP[status] || STATUS_MAP.offline;
        var displayName = d.discord_user.display_name || d.discord_user.global_name || d.discord_user.username;
        var userName = d.discord_user.username;

        // Avatar
        var avatarEl = dom.discordAvatar;
        if (avatarEl && avatar) {
          var ext = avatar.startsWith('a_') ? 'gif' : 'png';
          avatarEl.src = DISCORD_AVATAR + avatar + '.' + ext + '?size=64';
        }

        // Card display name
        if (dom.discordCardName) dom.discordCardName.textContent = displayName;
        if (dom.discordCardUsername) dom.discordCardUsername.textContent = '@' + userName;

        // Status dot (socials card - avatar overlay)
        if (dom.discordStatusDot) dom.discordStatusDot.className = 'discord-status-dot-lg ' + info.cls;
        if (dom.discordAboutDot) dom.discordAboutDot.className = 'discord-about-dot-lg ' + info.cls;

        // Custom status text (right-aligned next to name)
        var statusTextEl = dom.discordCardStatus;

        // Activity bubble (below card)
        var activityBubbleEl = dom.discordBubble;

        // Clear old progress interval
        if (discordProgressInterval) {
          clearInterval(discordProgressInterval);
          discordProgressInterval = null;
        }
        discordActivityTimestamps = null;

        // Find custom status
        var customStatus = null;

        if (d.activities && d.activities.length > 0) {
          customStatus = d.activities.find(function (a) { return a.type === 4; });
        }

        // Update custom status text (right-aligned)
        if (statusTextEl) {
          statusTextEl.textContent = (customStatus && customStatus.state) ? '\u201C' + customStatus.state + '\u201D' : '';
        }

        // Refreshes activity bubble below the card
        var contentEl = dom.discordBubbleContent;
        var bgEl = dom.discordBubbleBg;
        var progressWrap = dom.discordBubbleProgress;

        // Collect non-custom-status activities: music first, then others
        var activitiesToShow = [];
        if (d.activities) {
          d.activities.forEach(function (a) {
            if (a.type === 2) activitiesToShow.push(a);
          });
          d.activities.forEach(function (a) {
            if (a.type !== 4 && a.type !== 2) activitiesToShow.push(a);
          });
        }
        if (d.listening_to_spotify && d.spotify) {
          var hasSpotify = activitiesToShow.some(function (a) { return a.name === 'Spotify'; });
          if (!hasSpotify) {
            activitiesToShow.unshift({
              spotify: true,
              name: 'Spotify',
              details: d.spotify.song,
              state: d.spotify.artist,
              assets: { large_image: d.spotify.album_art_url },
              timestamps: { start: d.spotify.timestamps.start, end: d.spotify.timestamps.end },
            });
          }
        }

        // Resolve image URL from activity art
        function resolveArt(activity, size) {
          var img = activity.assets && activity.assets[size === 'small' ? 'small_image' : 'large_image'];
          var appId = activity.application_id;
          if (!img || typeof img !== 'string') return null;
          if (img.startsWith('mp:external/')) {
            return img.replace(/^mp:external\/[^/]+\//, '').replace(/^(https?)\//, '$1://');
          }
          if (/^https?:\/\//.test(img)) return img;
          if (/^\d+$/.test(img) && appId) {
            return 'https://cdn.discordapp.com/app-assets/' + appId + '/' + img + '.png';
          }
          return null;
        }

        if (contentEl && activitiesToShow.length > 0) {
          // Ensure progressWrap is back in contentEl before removing old rows
          if (progressWrap.parentNode !== contentEl) {
            contentEl.appendChild(progressWrap);
          }
          var oldRows = contentEl.querySelectorAll('.discord-activity-row');
          oldRows.forEach(function (r) { r.remove(); });

          var firstArt = null;
          var firstTimestamps = null;
          discordElapsedList = [];

          activitiesToShow.forEach(function (activity) {
            var appName = activity.spotify ? 'Spotify' : activity.name;
            var det, st, art;
            if (activity.spotify) {
              det = d.spotify.song;
              st = d.spotify.artist;
              art = d.spotify.album_art_url;
            } else {
              det = activity.details || '';
              st = activity.state || '';
            }
            var imgUrl = activity.spotify ? art : resolveArt(activity);
            var smallUrl = activity.spotify ? null : resolveArt(activity, 'small');
            var timestamps = activity.spotify ? { start: d.spotify.timestamps.start, end: d.spotify.timestamps.end } : activity.timestamps;

            if (imgUrl && firstArt === null) firstArt = imgUrl;
            if (timestamps && timestamps.start && timestamps.end && firstTimestamps === null) firstTimestamps = timestamps;

            var emojiMap = { 0: '\uD83C\uDFAE', 1: '\uD83D\uDCFA', 3: '\uD83D\uDC41\u200D\uD83D\uDDE8', 5: '\uD83C\uDFC6' };
            var emojiChar = activity.spotify ? '\uD83C\uDFA7' : (emojiMap[activity.type] || '\uD83D\uDCBB');

            var row = document.createElement('div');
            row.className = 'discord-activity-row';

            var iconDiv = document.createElement('div');
            iconDiv.className = 'discord-bubble-icon';
            if (imgUrl) {
              var img = document.createElement('img');
              img.src = imgUrl;
              img.alt = '';
              img.loading = 'lazy';
              iconDiv.appendChild(img);
              if (smallUrl) {
                var overlayDiv = document.createElement('div');
                overlayDiv.className = 'discord-bubble-icon-overlay';
                var overlayImg = document.createElement('img');
                overlayImg.src = smallUrl;
                overlayImg.alt = '';
                overlayImg.loading = 'lazy';
                overlayDiv.appendChild(overlayImg);
                iconDiv.appendChild(overlayDiv);
              }
            } else {
              var emojiSpan = document.createElement('span');
              emojiSpan.className = 'discord-bubble-emoji';
              emojiSpan.textContent = emojiChar;
              iconDiv.appendChild(emojiSpan);
            }
            row.appendChild(iconDiv);

            var textDiv = document.createElement('div');
            textDiv.className = 'discord-bubble-text';
            var appSpan = document.createElement('span');
            appSpan.className = 'discord-bubble-app';
            // Elapsed time inline after app name (for activities without a progress-bar duration)
            if ((!timestamps || !timestamps.end) && activity.created_at) {
              var elapsedTime = fmtElapsed(Date.now() - activity.created_at);
              appSpan.textContent = appName;
              appSpan.appendChild(document.createTextNode(' '));
              var elapsedInline = document.createElement('span');
              elapsedInline.className = 'discord-bubble-app-elapsed';
              elapsedInline.textContent = ' \u2022 ' + elapsedTime;
              appSpan.appendChild(elapsedInline);
              discordElapsedList.push({ el: elapsedInline, createdAt: activity.created_at });
            } else {
              appSpan.textContent = appName;
            }
            textDiv.appendChild(appSpan);

            if (det) {
              var detSpan = document.createElement('span');
              detSpan.className = 'discord-bubble-line';
              detSpan.textContent = det;
              textDiv.appendChild(detSpan);
            }
            if (st) {
              var stSpan = document.createElement('span');
              stSpan.className = 'discord-bubble-line';
              stSpan.textContent = st;
              textDiv.appendChild(stSpan);
            }
            row.appendChild(textDiv);

            contentEl.insertBefore(row, progressWrap);
          });

          // Blurred background from first activity's art
          if (bgEl) {
            bgEl.innerHTML = '';
            if (firstArt) {
              var bgImg = document.createElement('img');
              bgImg.src = firstArt;
              bgImg.alt = '';
              bgImg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(6px);pointer-events:none';
              bgEl.appendChild(bgImg);
              var bgOverlay = document.createElement('div');
              bgOverlay.className = 'discord-bubble-bg-overlay';
              bgEl.appendChild(bgOverlay);
              bgEl.classList.add('active');
            } else {
              bgEl.classList.remove('active');
            }
          }

          // Put progress bar inside the first music activity
          if (firstTimestamps) {
            discordActivityTimestamps = firstTimestamps;
            progressWrap.classList.remove('hidden');
          } else {
            discordActivityTimestamps = null;
            progressWrap.classList.add('hidden');
          }
          updateDiscordProgress();
          updateDiscordElapsed();
          if (discordProgressInterval) clearInterval(discordProgressInterval);
          discordProgressInterval = setInterval(discordTick, 1000);
          if (firstTimestamps) {
            var firstMusicRow = contentEl.querySelector('.discord-activity-row');
            if (firstMusicRow) {
              var textDiv = firstMusicRow.querySelector('.discord-bubble-text');
              if (textDiv) textDiv.appendChild(progressWrap);
            }
          }

          activityBubbleEl.classList.remove('hidden');
        } else {
          var oldRows = contentEl ? contentEl.querySelectorAll('.discord-activity-row') : [];
          oldRows.forEach(function (r) { r.remove(); });
          if (progressWrap.parentNode !== contentEl) {
            contentEl.appendChild(progressWrap);
          }
          progressWrap.classList.add('hidden');
          if (bgEl) bgEl.classList.remove('active');
          activityBubbleEl.classList.add('hidden');
        }

        // Clippy reactions
        function getActivityInfo() {
          var act = activitiesToShow.length > 0 ? activitiesToShow[0] : null;
          if (!act) return null;
          var name = act.spotify ? 'Spotify' : act.name;
          var details = act.spotify ? d.spotify.song : (act.details || act.state || '');
          var state = act.spotify ? d.spotify.artist : (act.state || '');
          if (act.type === 2 || act.spotify) {
            return { type: 'music', name: name, details: details, state: state };
          }
          return { type: 'other', name: name, details: act.details || '', state: act.state || '' };
        }
        function buildActivityMsg(info) {
          if (!info) return null;
          if (info.type === 'music' && info.state) {
            return 'Xangey started listening to ' + info.name + '!';
          }
          if (info.type === 'music') {
            return 'Xangey started listening to ' + (info.details || 'something') + '!';
          }
          return 'Xangey started playing ' + info.name + '!';
        }
        var newActivityInfo = getActivityInfo();
        var newKey = newActivityInfo ? newActivityInfo.name + '|' + (newActivityInfo.details || '') : null;
        if (discordPrevStatus !== null && discordPrevStatus !== status) {
          showClippy('Your Discord status changed to ' + info.label + '! ');
        } else if (discordPrevActivityKey !== null && newKey !== null && discordPrevActivityKey !== newKey) {
          var msg = buildActivityMsg(newActivityInfo);
          if (msg) showClippy(msg);
        }
        discordPrevStatus = status;
        discordPrevActivityKey = newKey;

      })
      .catch(function () {
        // Silently fail
      });
  }

  /* ── GitHub Repos ── */
  function fetchGitHubRepos() {
    var container = $('#github-repos');
    if (!container) return;
    fetch('https://api.github.com/users/xangeyfun/repos?sort=updated&per_page=8')
      .then(function (r) { return r.json(); })
      .then(function (repos) {
        if (!Array.isArray(repos)) return;
        container.innerHTML = '';
        repos.forEach(function (repo) {
          if (repo.fork) return;
          var langColor = repo.language ? langColors[repo.language] || '#888' : '#888';
          var card = document.createElement('a');
          card.href = repo.html_url;
          card.target = '_blank';
          card.rel = 'noopener noreferrer';
          card.className = 'github-repo-card';
          card.innerHTML =
            '<img class="github-repo-icon" src="' + iconURL('Images/github.png') + '" alt="">' +
            '<div class="project-info">' +
              '<h3>' + repo.name + '</h3>' +
              '<p>' + (repo.description || '') + '</p>' +
              '<div class="repo-meta">' +
                '<span><span style="color:' + langColor + '">●</span> ' + (repo.language || '') + '</span>' +
                '<span>★ ' + repo.stargazers_count + '</span>' +
              '</div>' +
            '</div>';
          container.appendChild(card);
        });
      })
      .catch(function () { /* silently fail */ });
  }

  var langColors = {
    Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6',
    HTML: '#e34c26', CSS: '#563d7c', C: '#555555', 'C++': '#f34b7d',
    Java: '#b07219', Shell: '#89e051', Ruby: '#701516', Go: '#00ADD8',
    Rust: '#dea584', PHP: '#4F5D95', Swift: '#ffac45', Kotlin: '#A97BFF',
    Vue: '#41b883', Svelte: '#ff3e00'
  };

  /* ── Init ── */
  function init() {
    // Collect DOM refs
    dom.desktop = $('#desktop');
    dom.windowsContainer = $('#windows-container');
    dom.startBtn = $('#start-btn');
    dom.startMenu = $('#start-menu');
    dom.taskbarWindows = $('#taskbar-windows');
    dom.clock = $('#clock');
    dom.ctxMenu = $('#context-menu');
    dom.runDialog = $('#run-dialog');
    dom.runInput = $('#run-input');
    dom.runOk = $('#run-ok');
    dom.runCancel = $('#run-cancel');
    dom.runClose = $('#run-close-btn');
    dom.screensaver = $('#screensaver');
    dom.ssWrapper = $('#screensaver .ss-wrapper');
    dom.ssLogo = $('#ss-logo');
    dom.bsod = $('#bsod');
    dom.eggDialog = $('#egg-dialog');
    dom.eggText = $('#egg-text');
    dom.eggOk = $('#egg-ok');
    dom.eggClose = $('#egg-close-btn');
    dom.eggTitle = $('#egg-title');
    dom.eggIcon = $('#egg-icon');
    dom.clippy = $('#clippy');
    dom.clippyText = $('#clippy-text');
    dom.clippyClose = $('#clippy-close');
    dom.shutdownScreen = $('#shutdown-screen');
    dom.shutdownBar = $('#shutdown-bar');
    dom.shutdownAbort = $('#shutdown-abort');
    dom.shutdownBtn = $('#start-shutdown');
    dom.runBtn = $('#start-run');
    dom.logoffBtn = $('#start-logoff');
    dom.helpBtn = $('#start-help');
    dom.toast = $('#toast');
    dom.toastText = $('#toast-text');
    dom.toastIcon = $('#toast-icon');
    dom.cmdInput = $('#cmd-input');
    dom.cmdOutput = $('#cmd-output');
    dom.cmdPrompt = $('#cmd-prompt');
    dom.explorerContent = $('#explorer-content');
    dom.explorerAddress = $('#explorer-addr');
    dom.explorerBack = $('#explorer-back');
    dom.recycleContent = $('#recycle-content');
    dom.recycleEmpty = $('#recycle-empty');
    dom.recycleRestore = $('#recycle-restore');
    dom.traySound = $('#tray-sound');
    dom.trayDark = $('#tray-dark');
    dom.trayNetwork = $('#tray-network');
    dom.wifiPopup = $('#wifi-popup');
    dom.wifiList = $('#wifi-list');
    dom.wifiStatus = $('#wifi-status');
    dom.taskbar = $('#taskbar');
    dom.discordAvatar = $('#discord-avatar');
    dom.discordStatusDot = $('#discord-status-dot');
    dom.discordCardName = $('#discord-card-name');
    dom.discordCardUsername = $('#discord-card-username');
    dom.discordAboutDot = $('#discord-about-dot');
    dom.discordBubble = $('#discord-bubble');
    dom.discordBubbleContent = $('#discord-bubble-content');
    dom.discordBubbleProgress = $('#discord-bubble-progress');
    dom.discordBubbleBg = $('#discord-bubble-bg');
    dom.discordCardStatus = $('#discord-card-status');
    dom.discordProgressFill = $('#discord-progress-fill');
    dom.discordProgressElapsed = $('#discord-progress-elapsed');
    dom.discordProgressTotal = $('#discord-progress-total');

    // Boot
    state.bootDone = true;
    sessionStorage.setItem('xp_boot_done', '1');
    setTimeout(function () {
      showToast('🖥️', 'Welcome to Xangey\'s Desktop!');
      openWin("about");
    }, 300);
    setTimeout(function () {
      showClippy('Hello there! Welcome to Xangey\'s Windows XP.\n\nI\'m Clippy! I\'ll be your... somewhat helpful assistant.');
    }, 1200);
    initScreensaver();
    scheduleClippy();

    // Fetch Discord status
    fetchDiscordStatus();
    setInterval(fetchDiscordStatus, 20000);

    // Fetch GitHub repos
    fetchGitHubRepos();

    // Init systems
    updateClock();
    setInterval(updateClock, 1000);
    initDesktopIcons();
    initWindowControls();
    initDragging();
    initStartMenu();
    initContextMenu();
    initRunDialog();
    initExplorer();
    initCmd();
    initRecycle();
    renderRecycle();
    initTray();
    initKeyboard();
    initEggDialog();
    initBSOD();
    // Winver OK button
    var winverOk = $('.winver-ok');
    if (winverOk) {
      winverOk.addEventListener('click', function () { closeWin('winver'); });
    }
    initEasterEggs();
    exposeGlobals();

    // Screensaver starts after boot
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
