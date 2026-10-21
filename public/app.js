(function () {
  'use strict';

  /* ================= 基础工具 ================= */
  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n) {
    n = Math.round(Number(n) || 0);
    return n.toLocaleString('ja-JP');
  }
  // ポイント → 円換算（お会計で使える金額）
  function yenOf(points, redeemRate) {
    return Math.floor((Number(points) || 0) / (Number(redeemRate) || 10));
  }
  function fmtSigned(n) {
    n = Math.round(Number(n) || 0);
    return (n > 0 ? '+' : '') + fmt(n);
  }
  var AV_COLORS = ['#E07A5F', '#3A6FD1', '#8B6FD9', '#2F9E44', '#C9971C', '#D1638C', '#3AA6A0'];
  function avatarColor(id) {
    var h = 0;
    var s = String(id || '?');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return AV_COLORS[h % AV_COLORS.length];
  }
  function initials(name) {
    return name ? name.slice(0, 1) : '?';
  }
  function debounce(fn, ms) {
    var t = null;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }
  function fmtTime(iso) {
    var d = new Date(iso);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  }
  function fmtDateTime(iso) {
    var d = new Date(iso);
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  }
  function p2(n) { return n < 10 ? '0' + n : '' + n; }

  /* ================= 图标（沿用原型的手绘线性图标）================= */
  function ic(name) {
    var P = {
      chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
      chevronRight: '<path d="M9 5l7 7-7 7"/>',
      close: '<path d="M6 6l12 12M18 6L6 18"/>',
      check: '<path d="M5 13l4 4L19 7"/>',
      coffee: '<path d="M4 9h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5V9z"/><path d="M17 10h1.5a2.5 2.5 0 010 5H17"/><path d="M7 3c0 1-1 1-1 2s1 1 1 2M12 3c0 1-1 1-1 2s1 1 1 2"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
      users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 13.2A5.2 5.2 0 0121.5 19"/>',
      sliders: '<path d="M4 6h9M17 6h3M4 12h3M9 12h11M4 18h13M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="7" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
      list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.3" fill="currentColor" stroke="none"/>',
      star: '<path d="M12 3l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L12 16.6 6.5 19.6l1.4-6.1L3.2 9.3l6.2-.6z"/>',
      home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
      ticket: '<path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4z"/><path d="M12 6v2M12 11v2M12 16v2"/>',
      zap: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
      qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4h-4M17 17v.01"/>',
      gift: '<rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M3 13h18M12 9v12"/><path d="M12 9c-1.5 0-4-1-4-3.2A2.3 2.3 0 0112 5c0-1.3-1-2-2.3-2M12 9c1.5 0 4-1 4-3.2A2.3 2.3 0 0012 5c0-1.3 1-2 2.3-2"/>',
      arrowUpRight: '<path d="M7 17L17 7M9 7h8v8"/>',
      logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
      wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="14" r="1.3" fill="currentColor" stroke="none"/>',
      refresh: '<path d="M21 12a9 9 0 10-2.6 6.4"/><path d="M21 5v6h-6"/>',
      tag: '<path d="M20.6 12.6L12 21.2 2.8 12 3 3l9-.2z"/><circle cx="8" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>',
      trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
      shield: '<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
      cup: '<path d="M6 10h9v6a4 4 0 01-4 4H10a4 4 0 01-4-4z"/><path d="M15 11h1.5a2 2 0 010 4H15"/><path d="M9 3s-1.2.8-1.2 1.8S9 6.6 9 6.6M13 3s-1.2.8-1.2 1.8S13 6.6 13 6.6"/>',
      alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.5 18a1.8 1.8 0 001.6 2.7h15.8a1.8 1.8 0 001.6-2.7L13.7 3.9a1.8 1.8 0 00-3.4 0z"/>',
      lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
      trash: '<path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-8 0l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12"/>',
      key: '<circle cx="8" cy="15" r="4"/><path d="M10.5 12.5L20 3m-4 0h4v4m-9 5l2.5 2.5"/>'
    };
    return P[name] || '';
  }
  function svg(name, cls) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="' + (cls || '') + '">' + ic(name) + '</svg>';
  }

  /* ================= API 请求封装 ================= */
  async function api(method, url, body) {
    var res = await fetch(url, {
      method: method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    var data = null;
    var text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch (e) { /* 非 JSON 回应 */ }
    }
    if (!res.ok) {
      var err = new Error((data && data.error) || ('リクエストに失敗しました（' + res.status + '）'));
      err.status = res.status;
      throw err;
    }
    return data;
  }

  /* ================= toast ================= */
  function toast(msg, kind) {
    var wrap = document.getElementById('toastwrap');
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = svg(kind === 'err' ? 'close' : 'check') + '<span>' + esc(msg) + '</span>';
    wrap.appendChild(el);
    setTimeout(function () {
      el.className = 'toast out';
      setTimeout(function () { el.remove(); }, 250);
    }, 2600);
  }

  /* ================= 全局状态 ================= */
  var state = {
    session: { member: null, staff: null },
    booted: false,
    role: 'customer',

    customer: { screen: 'login', summary: null, transactions: null, loading: false, busy: false, lastCheckin: null, qr: null, qrError: '', loginError: '', inviteInput: '', inviteStatus: null, invites: null },

    staffAuth: { form: { username: '', password: '' }, error: '', busy: false },
    staff: {
      tab: 'checkout',
      members: [],
      memberSearch: '',
      selectedMember: null,
      scan: { active: false, error: '', busy: false, input: '' },
      lastInvite: null,
      searchOpen: false,
      checkoutForm: { orderAmount: '', redeemOn: false, redeemPoints: 0 },
      todayLog: null,
      busy: false
    },

    admin: {
      tab: 'overview',
      overview: null,
      members: [],
      memberSearch: '',
      rules: null,
      autosaveMsg: '',
      ledgerFilter: 'all',
      ledger: [],
      staffList: [],
      newStaffForm: { username: '', password: '', name: '', role: 'staff' }
    }
  };

  /* ================= 顶部导览 ================= */
  var ROLES = [
    { id: 'customer', label: 'お客様用', icon: 'coffee', ctx: 'LINE会員カード（スマホ表示）' },
    { id: 'staff', label: 'レジ（スタッフ）', icon: 'wallet', ctx: '店舗レジ / タブレット表示' },
    { id: 'admin', label: '管理画面', icon: 'sliders', ctx: '管理者向け：ポイントルールの設定とデータ確認' }
  ];
  function renderChrome() {
    var rs = document.getElementById('roleswitch');
    rs.innerHTML = ROLES.map(function (r) {
      return '<button data-role="' + r.id + '" class="' + (state.role === r.id ? 'active' : '') + '">' + svg(r.icon) + '<span>' + r.label + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(rs.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        state.role = b.getAttribute('data-role');
        onRoleEnter();
        render();
      });
    });
    var cur = ROLES.filter(function (r) { return r.id === state.role; })[0];
    document.getElementById('contextline').innerHTML = svg('arrowUpRight') + '<span>' + cur.ctx + '</span>';
  }

  function onRoleEnter() {
    if (state.role === 'customer' && state.session.member && !state.customer.summary) loadCustomerHome();
    if (state.role === 'staff' && state.session.staff) loadStaffTab();
    if (state.role === 'admin' && state.session.staff && state.session.staff.role === 'admin') loadAdminTab();
  }

  function loadingBlock(label) {
    return '<div class="loading-wrap"><div class="spinner"></div><div>' + esc(label || '読み込み中…') + '</div></div>';
  }

  /* ================= 启动：抓目前登入状态 ================= */
  async function boot() {
    var params = new URLSearchParams(location.search);
    var inviteNotice = '';
    if (params.get('login_error')) {
      state.customer.loginError = params.get('login_error');
    }
    if (params.get('invite')) {
      state.customer.inviteInput = params.get('invite').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(.{4})(.+)$/, '$1-$2');
    }
    if (params.get('invite_result')) {
      var ir = params.get('invite_result');
      var bonus = parseInt(params.get('invite_bonus'), 10) || 0;
      inviteNotice = ir === 'ok' ? { msg: '登録完了！紹介ボーナス +' + bonus + ' ポイントを付与しました', kind: 'ok' }
        : ir === 'existing' ? { msg: 'すでに会員のため、招待コードは新規会員のみ利用できます。このコードは消費されていません', kind: 'err' }
        : ir === 'used' ? { msg: 'この招待コードはすでに使用されているため、紹介ボーナスはありません', kind: 'err' }
        : ir === 'self' ? { msg: 'ご自身の招待コードは使用できません', kind: 'err' }
        : { msg: '招待コードが無効のため、紹介ボーナスはありません', kind: 'err' };
    }
    if (params.get('login_error') || params.get('invite') || params.get('invite_result')) {
      history.replaceState({}, '', location.pathname);
    }
    try {
      var me = await api('GET', '/api/auth/me');
      state.session.member = me.member;
      state.session.staff = me.staff;
    } catch (e) {
      // 拿不到登入状态就当作都还没登入
    }
    state.customer.screen = state.session.member ? 'home' : 'login';
    state.booted = true;
    render();
    onRoleEnter();
    if (inviteNotice) toast(inviteNotice.msg, inviteNotice.kind);
  }

  /* ================= master render ================= */
  function render() {
    renderChrome();
    if (!state.booted) {
      document.getElementById('app').innerHTML = loadingBlock('サーバーに接続中…');
      return;
    }
    if (!(state.role === 'staff' && state.staff.tab === 'checkout' && state.session.staff)) stopScan();
    if (state.role === 'customer') renderCustomer();
    else if (state.role === 'staff') renderStaff();
    else renderAdmin();
  }

  /* ================================================================ */
  /* =========================  顾客端  ============================= */
  /* ================================================================ */

  async function loadCustomerHome() {
    state.customer.loading = true;
    render();
    try {
      var summary = await api('GET', '/api/me/summary');
      var txs = await api('GET', '/api/me/transactions');
      state.customer.summary = summary;
      state.customer.transactions = txs;
    } catch (e) {
      toast(e.message, 'err');
    }
    state.customer.loading = false;
    render();
  }

  // 画面をローディング表示に切り替えずに最新のポイント・履歴を再取得
  async function refreshCustomerHome() {
    var c = state.customer;
    if (c.refreshing) return;
    c.refreshing = true;
    render();
    try {
      var res = await Promise.all([api('GET', '/api/me/summary'), api('GET', '/api/me/transactions')]);
      c.summary = res[0];
      c.transactions = res[1];
      toast('最新の情報に更新しました', 'ok');
    } catch (e) {
      toast(e.message, 'err');
    }
    c.refreshing = false;
    render();
  }

  function copyText(text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      toast(ok ? okMsg : 'コピーに失敗しました。文字を長押ししてコピーしてください', ok ? 'ok' : 'err');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fallback);
    } else fallback();
  }

  /* ---------- 第三方库（只在需要时才载入）---------- */
  var scriptPromises = {};
  function loadScriptOnce(src) {
    if (!scriptPromises[src]) {
      scriptPromises[src] = new Promise(function (resolve, reject) {
        var el = document.createElement('script');
        el.src = src;
        el.onload = resolve;
        el.onerror = function () { delete scriptPromises[src]; reject(new Error('読み込みに失敗しました：' + src)); };
        document.head.appendChild(el);
      });
    }
    return scriptPromises[src];
  }

  /* ---------- 顾客：会员二维码 ---------- */
  var qrTimerHandle = null;
  function stopQrTimer() {
    if (qrTimerHandle) { clearInterval(qrTimerHandle); qrTimerHandle = null; }
  }
  function qrSvgHtml(text) {
    var q = window.qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }
  function updateQrDom() {
    var c = state.customer;
    var box = document.getElementById('qrbox');
    if (!box) return;
    var cap = document.getElementById('qrcap');
    if (c.qrError) {
      box.innerHTML = '<div class="qr-fail">' + esc(c.qrError) + '</div>';
      if (cap) cap.textContent = '';
      return;
    }
    if (!c.qr) { box.innerHTML = '<div class="qr-fail">生成中…</div>'; return; }
    if (box.getAttribute('data-code') !== c.qr.code) {
      try { box.innerHTML = qrSvgHtml(c.qr.code); box.setAttribute('data-code', c.qr.code); }
      catch (e) { box.innerHTML = '<div class="qr-fail">QRコードの生成に失敗しました</div>'; }
    }
    var left = Math.max(0, Math.ceil(c.qr.refreshIn - (Date.now() - c.qr.at) / 1000));
    if (cap) cap.textContent = left + ' 秒後に自動更新';
    var bar = document.getElementById('qrbar');
    if (bar) bar.style.width = (100 * left / c.qr.refreshIn) + '%';
  }
  async function loadQr() {
    var c = state.customer;
    try {
      await loadScriptOnce('/vendor/qrcode.js');
      var data = await api('GET', '/api/me/qr');
      c.qr = { code: data.code, refreshIn: data.refreshIn || 60, at: Date.now(), displayName: data.displayName, points: data.points };
      c.qrError = '';
    } catch (e) {
      c.qrError = e.message || '会員コードを取得できません';
    }
    updateQrDom();
  }
  function startQrTimer() {
    stopQrTimer();
    loadQr();
    qrTimerHandle = setInterval(function () {
      var c = state.customer;
      if (state.role !== 'customer' || c.screen !== 'qr') { stopQrTimer(); return; }
      if (!c.qr || (Date.now() - c.qr.at) / 1000 >= c.qr.refreshIn) loadQr(); else updateQrDom();
    }, 1000);
  }
  document.addEventListener('visibilitychange', function () {
    var c = state.customer;
    if (!document.hidden && state.role === 'customer' && c.screen === 'qr') loadQr();
  });

  function custHeader(title, opts) {
    opts = opts || {};
    var left = opts.back ? '<button data-act="back">' + svg('chevronLeft') + '</button>' : '<span class="side"></span>';
    var right = opts.logout ? '<button class="txt-btn" data-act="logout">ログアウト</button>' : '<span class="side"></span>';
    return '<div class="linebar"><div class="side">' + left + '</div><h2>' + esc(title) + '</h2><div class="side" style="width:auto; justify-content:flex-end;">' + right + '</div></div>';
  }

  function renderCustomer() {
    var c = state.customer;
    var scr = state.session.member ? c.screen : 'login';
    var body = '', header = '', showNav = false;
    if (scr !== 'qr') stopQrTimer();

    if (scr === 'login') {
      header = custHeader('本町珈琲 会員カード');
      body =
        '<div class="login-hero">' +
        '<div class="badge">' + svg('coffee') + '</div>' +
        '<h3>ポイントを貯めはじめましょう</h3>' +
        '<p>ログイン後は毎日のチェックインやご利用でポイントが貯まり、貯めたポイントはそのままお会計に使えます。</p>' +
        '</div>' +
        (c.loginError ? '<div class="banner crit">' + svg('alert') + '<span>' + esc(c.loginError) + '</span></div>' : '') +
        '<div class="invite-box"><label for="invitecode">招待コードをお持ちですか？（任意・新規会員のみ）</label>' +
        '<input class="input" id="invitecode" autocomplete="off" autocapitalize="characters" maxlength="9" placeholder="例：K7M4-Q9XT" value="' + esc(c.inviteInput) + '">' +
        '<div class="invite-status ' + (c.inviteStatus ? c.inviteStatus.kind : '') + '" id="invitestatus">' + esc(c.inviteStatus ? c.inviteStatus.text : '') + '</div></div>' +
        '<button class="btn line block" data-act="linelogin" style="border:1px solid var(--border);">' + svg('coffee') + ' LINEアカウントで続ける</button>' +
        '<p class="login-legal">続けることで「会員規約」と「プライバシーポリシー」に同意したものとみなされます</p>';
    } else if (scr === 'home') {
      header = custHeader('マイ会員カード', { logout: true });
      showNav = true;
      if (c.loading || !c.summary) {
        body = loadingBlock();
      } else {
        var s = c.summary;
        var recent = (c.transactions || []).slice(0, 3);
        body =
          '<div class="points-hero">' +
          '<button class="qr-btn" data-act="goqr">' + svg('qr') + '<span>会員コード</span></button>' +
          '<div class="lbl">' + svg('star') + ' 利用可能ポイント' +
          '<button class="refresh-btn' + (c.refreshing ? ' spinning' : '') + '" data-act="refreshhome" aria-label="最新の情報に更新"' + (c.refreshing ? ' disabled' : '') + '>' + svg('refresh') + '</button></div>' +
          '<div class="val num">' + fmt(s.points) + '<span>ポイント</span></div>' +
          '<div class="sub">約 ' + fmt(s.pointsValue) + ' 円分のお会計に利用できます</div>' +
          '</div>' +
          streakCardHtml(s, c) +
          '<button class="invite-card" data-act="goinvites">' +
          '<div class="ic">' + svg('gift') + '</div>' +
          '<div class="tx"><b>お友達紹介</b>' +
          '<div class="ic-rewards"><span class="rw-pill">あなた <b class="num">' + fmt(yenOf(s.rules.inviterBonus, s.rules.redeemRate)) + '円分</b></span>' +
          '<span class="rw-pill">お友達 <b class="num">' + fmt(yenOf(s.rules.inviteeBonus, s.rules.redeemRate)) + '円分</b></span></div>' +
          '<span>' + (s.unusedInvites ? 'お渡しできる招待コードが ' + s.unusedInvites + ' 件あります' : 'ご利用後にスタッフが招待コードをお渡しします') + '</span></div>' +
          svg('chevronRight', 'chev') + '</button>' +
          '<div class="stat1"><div class="t">今月の獲得ポイント</div><div class="v num">' + fmt(s.monthEarned) + ' ポイント</div></div>' +
          '<div>' +
          '<div class="sec-head"><h4>最近の履歴</h4><a data-act="gohistory">すべて見る ' + svg('chevronRight') + '</a></div>' +
          (recent.length ? '<div>' + recent.map(txRowHtml).join('') + '</div>' : '<div class="empty">' + svg('list') + '<div>ご利用・チェックインの履歴はまだありません</div></div>') +
          '</div>';
      }
    } else if (scr === 'history') {
      header = custHeader('利用履歴', { back: true });
      showNav = true;
      var all = c.transactions || [];
      body = c.loading ? loadingBlock() : (all.length ? '<div>' + all.map(txRowHtml).join('') + '</div>' : '<div class="empty">' + svg('list') + '<div>履歴はまだありません</div></div>');
    } else if (scr === 'invites') {
      header = custHeader('お友達紹介', { back: true });
      showNav = true;
      var iv = c.invites;
      var listHtml = '';
      if (!iv) listHtml = loadingBlock();
      else if (!iv.codes.length) listHtml = '<div class="empty">' + svg('gift') + '<div>招待コードはまだありません。ご利用のたびにスタッフがお渡しします。</div></div>';
      else listHtml = iv.codes.map(function (k, idx) {
        return k.used
          ? '<div class="inv-row used"><div class="inv-code num">' + esc(k.code) + '</div><div class="inv-meta">' + esc(k.usedByName || '新規会員') + ' さんが使用済み</div></div>'
          : '<div class="inv-row"><div class="inv-code num">' + esc(k.code) + '</div><div class="inv-meta">利用可能 · 新規会員のみ</div>' +
            '<div class="inv-btns"><button class="btn ghost sm" data-act="copycode" data-i="' + idx + '">コードをコピー</button>' +
            '<button class="btn primary sm" data-act="copylink" data-i="' + idx + '">リンクをコピー</button></div></div>';
      }).join('');
      var rewardTile = function (who, pts) {
        return '<div class="rw-tile"><div class="rw-who">' + who + '</div>' +
          '<div class="rw-yen num">' + fmt(yenOf(pts, iv.redeemRate)) + '<span>円分</span></div>' +
          '<div class="rw-pts num">' + fmt(pts) + ' ポイント</div></div>';
      };
      body =
        (iv ? '<div class="invite-reward">' +
          '<div class="rw-head">' + svg('gift') + '<b>紹介が成立すると、ふたりともうれしい！</b></div>' +
          '<div class="rw-grid">' + rewardTile('あなたに', iv.inviterBonus) + '<div class="rw-plus">＋</div>' + rewardTile('お友達に', iv.inviteeBonus) + '</div>' +
          '</div>' : '') +
        '<div class="invite-intro"><b>ご利用のたびに、スタッフが招待コードをお渡しします</b>' +
        '<p>お友達が初めて LINE で登録するときにコードを入力（またはあなたの招待リンクを開く）すると、上記のポイントがお互いに付与されます。コードは1回のみ有効で、ご自身では使えません。</p></div>' +
        '<div class="inv-list">' + listHtml + '</div>';
    } else if (scr === 'qr') {
      header = custHeader('会員コード', { back: true });
      showNav = true;
      var sm = c.summary || {};
      body =
        '<div class="qr-screen">' +
        '<div class="qr-card"><div id="qrbox" class="qrbox"><div class="qr-fail">生成中…</div></div></div>' +
        '<div class="qr-name"><b>' + esc((c.qr && c.qr.displayName) || sm.displayName || '') + '</b></div>' +
        '<div class="qr-bar"><div id="qrbar"></div></div>' +
        '<div class="qr-cap" id="qrcap"></div>' +
        '<p class="qr-tip">お会計の際にこの画面をスタッフにスキャンしてもらうと、ポイントの獲得・利用ができます。QRコードは60秒ごとに自動更新されるため、スクリーンショットは長くは使えません。</p>' +
        '</div>';
    } else if (scr === 'checkinSuccess') {
      header = custHeader('毎日チェックイン', { back: true });
      var r = c.lastCheckin || {};
      body =
        '<div class="checkin-success">' +
        '<div class="ring">' + svg('check') + '</div>' +
        '<h3>チェックイン完了！</h3>' +
        '<p>本日のチェックインで <b class="num" style="color:var(--brand)">+' + (r.basePoints || 0) + '</b> ポイント獲得</p>' +
        (r.bonusPoints
          ? '<div class="bonus-pop">' + svg('gift') + '<div><b>連続チェックイン ' + r.bonusDay + ' 日目ボーナス +' + r.bonusPoints + ' ポイント</b><span>' +
            (r.streak >= r.cycleDays ? '' + r.cycleDays + ' 日達成おめでとうございます！明日からまた1日目から数えます' : 'この調子で、次のボーナスが待っています') + '</span></div></div>'
          : '') +
        '<div class="streak-line">連続チェックイン <b class="num">' + (r.streak || 1) + '</b> 日' + (r.nextMilestone ? ' · ' + nextHintText(r.streak >= r.cycleDays ? 0 : r.streak, r.nextMilestone, true) : '') + '</div>' +
        '<button class="btn primary block" data-act="gohome" style="margin-top:8px;">ホームに戻る</button>' +
        '</div>';
    }

    var nav = showNav
      ? '<div class="bottomnav">' +
        '<button data-act="gohome" class="' + (scr === 'home' ? 'active' : '') + '">' + svg('home') + '<span>ホーム</span></button>' +
        '<button data-act="goqr" class="' + (scr === 'qr' ? 'active' : '') + '">' + svg('qr') + '<span>会員コード</span></button>' +
        '<button data-act="gohistory" class="' + (scr === 'history' ? 'active' : '') + '">' + svg('list') + '<span>利用履歴</span></button>' +
        '</div>'
      : '';

    document.getElementById('app').innerHTML =
      '<div class="phonewrap"><div class="phone"><div class="notch"></div>' + header + '<div class="phonebody">' + body + '</div>' + nav + '</div></div>';
    bindCustomerEvents();
    if (scr === 'qr') updateQrDom();
  }

  function nextHintText(streak, nm, checkedToday) {
    // streak: 目前有效连续天数；nm: {day, points}
    var remain = nm.day - streak;
    if (remain <= 0) return '';
    if (remain === 1 && !checkedToday) return '今日チェックインすると ' + nm.day + ' 日目ボーナス +' + nm.points;
    if (remain === 1) return '明日チェックインで ' + nm.day + ' 日目ボーナス +' + nm.points;
    return 'あと ' + remain + ' 日連続（' + nm.day + ' 日目）でボーナス +' + nm.points;
  }

  function streakCardHtml(s, c) {
    var cycle = s.cycleDays || 10;
    var streak = s.streak || 0;
    var b5 = s.rules.streak5Bonus || 0, b10 = s.rules.streak10Bonus || 0;
    var dots = '';
    for (var d = 1; d <= cycle; d++) {
      var done = d <= streak;
      var bonus = d === 5 ? b5 : (d === cycle ? b10 : 0);
      dots += '<div class="sdot ' + (done ? 'done' : '') + (bonus ? ' milestone' : '') + '">' +
        '<div class="c">' + (done ? svg('check') : (bonus ? svg('gift') : '<span class="num">' + d + '</span>')) + '</div>' +
        '<div class="l num">' + (bonus ? '+' + bonus : d + '日目') + '</div></div>';
    }
    var hint = s.nextMilestone
      ? nextHintText(streak >= cycle ? 0 : streak, s.nextMilestone, s.checkedInToday)
      : '';
    var btnLabel = s.checkedInToday ? '本日チェックイン済み' : (c.busy ? '処理中…' : 'チェックイン +' + s.rules.checkinPoints + ' ポイント');
    return '<div class="card streak-card">' +
      '<div class="sc-head"><div><b>毎日チェックイン</b><span>連続 ' + streak + ' 日' + (streak ? '' : ' · 今日から開始') + '</span></div>' +
      '<div class="rule-tip">5日目 +' + b5 + ' · ' + cycle + '日目 +' + b10 + '</div></div>' +
      '<div class="sdots">' + dots + '</div>' +
      (hint ? '<div class="sc-hint">' + svg('zap') + '<span>' + esc(hint) + '</span></div>' : '') +
      '<button class="btn primary block cta-sign" data-act="docheckin" ' + (s.checkedInToday || c.busy ? 'disabled' : '') + '>' + svg(s.checkedInToday ? 'check' : 'ticket') + ' ' + btnLabel + '</button>' +
      '<div class="sc-foot">チェックインは1日1回。1日でも休むと、連続日数は1日目からやり直しになります</div>' +
      '</div>';
  }

  function txRowHtml(t) {
    var isCheckin = t.type === 'checkin';
    var isBonus = t.type === 'bonus';
    var iconName = isCheckin ? 'ticket' : (isBonus ? 'gift' : 'cup');
    var bg = isCheckin || isBonus ? 'var(--good-soft)' : 'var(--brand-soft)';
    var color = isCheckin || isBonus ? 'var(--good)' : 'var(--brand)';
    var title = isCheckin ? (t.note || '毎日チェックイン') : (isBonus ? (t.note || '新規入会ボーナス') : (t.note || 'ご利用'));
    var netPoints = (t.earnedPoints || 0) - (t.redeemedPoints || 0);
    var amtLine = (t.type === 'purchase') ? ('<small>お支払い ' + fmt(t.paidAmount) + ' 円' + (t.redeemedPoints ? '（ポイント利用 ' + fmt(t.discount) + ' 円）' : '') + '</small>') : '';
    return '<div class="tx-row">' +
      '<div class="ic" style="background:' + bg + ';color:' + color + '">' + svg(iconName) + '</div>' +
      '<div class="mid"><b>' + esc(title) + '</b><span>' + fmtTime(t.ts) + (t.staffName ? ' · ' + esc(t.staffName) : '') + '</span></div>' +
      '<div class="amt" style="color:' + (netPoints >= 0 ? 'var(--brand)' : 'var(--blue)') + '">' + fmtSigned(netPoints) + amtLine + '</div>' +
      '</div>';
  }

  var checkInviteDebounced = debounce(async function () {
    var c = state.customer;
    var raw = (c.inviteInput || '').replace(/[^A-Za-z0-9]/g, '');
    if (raw.length !== 8) { c.inviteStatus = raw ? { kind: 'err', text: '招待コードは英数字8文字です' } : null; updateInviteStatusDom(); return; }
    try {
      var r = await api('GET', '/api/auth/invite/check?code=' + encodeURIComponent(raw));
      c.inviteStatus = r.status === 'ok' ? { kind: 'ok', text: '招待コードは有効です！登録すると ' + r.inviteeBonus + ' ポイント獲得できます' }
        : r.status === 'used' ? { kind: 'err', text: 'この招待コードはすでに使用されています' }
        : { kind: 'err', text: '招待コードが見つかりません。もう一度ご確認ください' };
    } catch (e) { c.inviteStatus = null; }
    updateInviteStatusDom();
  }, 350);
  function updateInviteStatusDom() {
    var el = document.getElementById('invitestatus');
    var c = state.customer;
    if (!el) return;
    el.className = 'invite-status ' + (c.inviteStatus ? c.inviteStatus.kind : '');
    el.textContent = c.inviteStatus ? c.inviteStatus.text : '';
  }

  function bindCustomerEvents() {
    var app = document.getElementById('app');
    var inviteEl = app.querySelector('#invitecode');
    if (inviteEl) {
      inviteEl.addEventListener('input', function () {
        var raw = inviteEl.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        inviteEl.value = raw.length > 4 ? raw.slice(0, 4) + '-' + raw.slice(4) : raw;
        state.customer.inviteInput = inviteEl.value;
        checkInviteDebounced();
      });
      if (state.customer.inviteInput && !state.customer.inviteStatus) checkInviteDebounced();
    }
    app.querySelectorAll('[data-act]').forEach(function (el) {
      el.addEventListener('click', async function () {
        var act = el.getAttribute('data-act');
        var c = state.customer;
        if (act === 'linelogin') {
          var inv = (c.inviteInput || '').replace(/[^A-Za-z0-9]/g, '');
          location.href = '/api/auth/line/login' + (inv ? '?invite=' + encodeURIComponent(inv) : '');
        } else if (act === 'back') {
          c.screen = (c.screen === 'checkinSuccess' || c.screen === 'history' || c.screen === 'qr' || c.screen === 'invites') ? 'home' : 'login';
          render();
        } else if (act === 'logout') {
          await api('POST', '/api/auth/member/logout').catch(function () {});
          state.session.member = null;
          state.customer = { screen: 'login', summary: null, transactions: null, loading: false, lastCheckin: null, loginError: '' };
          render();
        } else if (act === 'gohome') {
          c.screen = 'home';
          render();
          loadCustomerHome();
        } else if (act === 'goinvites') {
          c.screen = 'invites';
          render();
          try { c.invites = await api('GET', '/api/me/invites'); } catch (e) { toast(e.message, 'err'); }
          render();
        } else if (act === 'copycode' || act === 'copylink') {
          var kk = c.invites && c.invites.codes[parseInt(el.getAttribute('data-i'), 10)];
          if (kk) copyText(act === 'copycode' ? kk.code : kk.shareUrl, act === 'copycode' ? '招待コードをコピーしました' : '招待リンクをコピーしました。お友達に送りましょう');
        } else if (act === 'refreshhome') {
          refreshCustomerHome();
        } else if (act === 'goqr') {
          c.screen = 'qr';
          render();
          startQrTimer();
        } else if (act === 'gohistory') {
          c.screen = 'history';
          render();
        } else if (act === 'docheckin') {
          if (c.busy || (c.summary && c.summary.checkedInToday)) return;
          c.busy = true; render();
          try {
            var res = await api('POST', '/api/me/checkin');
            c.lastCheckin = res;
            c.screen = 'checkinSuccess';
            c.busy = false;
            render();
            loadCustomerHome();
          } catch (e) {
            c.busy = false;
            toast(e.message, 'err');
            render();
            loadCustomerHome();
          }
        }
      });
    });
  }

  /* ================================================================ */
  /* ======================  店员 / 管理员登入  ====================== */
  /* ================================================================ */

  function renderStaffLoginForm(onLoggedInMessage) {
    var a = state.staffAuth;
    return '<div class="staff-login-wrap"><div class="card staff-login">' +
      '<div class="lg"><div class="badge">' + svg('lock') + '</div><h3>スタッフ / 管理者ログイン</h3><p>' + esc(onLoggedInMessage || 'お店から案内されたアカウントとパスワードでログインしてください') + '</p></div>' +
      (a.error ? '<div class="banner crit">' + svg('alert') + '<span>' + esc(a.error) + '</span></div>' : '') +
      '<div class="field"><label>アカウント</label><input class="input" id="staffuser" value="' + esc(a.form.username) + '" autocomplete="username"></div>' +
      '<div class="field"><label>パスワード</label><input class="input" id="staffpass" type="password" value="' + esc(a.form.password) + '" autocomplete="current-password"></div>' +
      '<button class="btn primary block" data-act="stafflogin" ' + (a.busy ? 'disabled' : '') + '>' + (a.busy ? 'ログイン中…' : 'ログイン') + '</button>' +
      '<div class="hint-box">初回デプロイ時のデフォルト管理者アカウントは、バックエンドの <code>.env</code> / README の <b>SEED_ADMIN_USERNAME</b> 設定をご確認ください。早めに「管理画面 → スタッフアカウント」で別のアカウントを追加し、デフォルトのパスワードを変更してください。</div>' +
      '</div></div>';
  }

  function bindStaffLoginEvents(afterLoginRoleCheck) {
    var app = document.getElementById('app');
    var userEl = app.querySelector('#staffuser');
    var passEl = app.querySelector('#staffpass');
    if (userEl) userEl.addEventListener('input', function () { state.staffAuth.form.username = userEl.value; });
    if (passEl) passEl.addEventListener('input', function () { state.staffAuth.form.password = passEl.value; });
    var btn = app.querySelector('[data-act="stafflogin"]');
    if (btn) {
      var submit = async function () {
        var a = state.staffAuth;
        if (!a.form.username || !a.form.password) { a.error = 'アカウントとパスワードを入力してください'; render(); return; }
        a.busy = true; a.error = ''; render();
        try {
          var staff = await api('POST', '/api/auth/staff/login', { username: a.form.username, password: a.form.password });
          state.session.staff = staff;
          state.staffAuth = { form: { username: '', password: '' }, error: '', busy: false };
          render();
          onRoleEnter();
        } catch (e) {
          a.busy = false;
          a.error = e.message;
          render();
        }
      };
      btn.addEventListener('click', submit);
      [userEl, passEl].forEach(function (el) {
        if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      });
    }
  }

  async function staffLogoutClick() {
    await api('POST', '/api/auth/staff/logout').catch(function () {});
    stopScan();
    state.session.staff = null;
    state.admin.overview = null;
    render();
  }

  /* ================================================================ */
  /* =========================  店员收银台  ========================== */
  /* ================================================================ */

  async function loadStaffTab() {
    var t = state.staff.tab;
    if (t === 'checkout' && state.staff.searchOpen) await searchStaffMembers();
    if (t === 'log') await refreshTodayLog();
  }

  /* ---------- 收银台：扫描会员二维码 ---------- */
  var scanStream = null;
  var scanTimer = null;
  var scanDetector = null;
  var scanCanvas = null;
  var scanLooking = false;
  var lastBadCode = { code: '', at: 0 };

  function stopScan() {
    if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
    if (scanStream) { scanStream.getTracks().forEach(function (t) { t.stop(); }); scanStream = null; }
    scanLooking = false;
    if (state.staff && state.staff.scan) state.staff.scan.active = false;
  }

  async function startScan() {
    var sc = state.staff.scan;
    sc.error = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      sc.error = 'このブラウザではカメラを使用できません（https のURLが必要です）。バーコードリーダーを使うか、下に手入力してください。';
      render();
      return;
    }
    try {
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    } catch (e) {
      sc.error = 'カメラを起動できません。ブラウザでカメラを許可するか、バーコードリーダー / 手入力をご利用ください。';
      render();
      return;
    }
    try { await loadScriptOnce('/vendor/jsQR.js'); } catch (e) { /* 有 BarcodeDetector 的浏览器不需要它 */ }
    scanDetector = null;
    if ('BarcodeDetector' in window) {
      try { scanDetector = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { scanDetector = null; }
    }
    sc.active = true;
    render();
  }

  function attachScanVideo() {
    var v = document.getElementById('scanvideo');
    if (!v || !scanStream) return;
    v.srcObject = scanStream;
    v.play().catch(function () {});
    if (scanTimer) clearInterval(scanTimer);
    scanTimer = setInterval(function () { scanFrame(v); }, 200);
  }

  async function scanFrame(v) {
    if (scanLooking || !scanStream || v.readyState < 2 || !v.videoWidth) return;
    scanLooking = true;
    try {
      var found = null;
      if (scanDetector) {
        try {
          var codes = await scanDetector.detect(v);
          if (codes && codes.length) found = codes[0].rawValue;
        } catch (e) { scanDetector = null; }
      }
      if (!found && !scanDetector && window.jsQR) {
        var w = Math.min(640, v.videoWidth);
        var h = Math.round(w * v.videoHeight / v.videoWidth);
        if (!scanCanvas) scanCanvas = document.createElement('canvas');
        scanCanvas.width = w; scanCanvas.height = h;
        var ctx = scanCanvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(v, 0, 0, w, h);
        var img = ctx.getImageData(0, 0, w, h);
        var r = window.jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
        if (r) found = r.data;
      }
      if (found) await handleScanned(found);
    } finally {
      scanLooking = false;
    }
  }

  async function handleScanned(code) {
    var sc = state.staff.scan;
    code = String(code || '').trim();
    if (!code || sc.busy) return;
    if (code.indexOf('BMQ:') !== 0) {
      // 不是会员码（例如扫到别的 QR）：提示一下，同一张 2 秒内不重复提示
      if (lastBadCode.code === code && Date.now() - lastBadCode.at < 2000) return;
      lastBadCode = { code: code, at: Date.now() };
      sc.error = '会員のQRコードではありません。お客様に LINE の「会員コード」画面を開いてもらってください。';
      updateScanErrorDom();
      return;
    }
    sc.busy = true;
    try {
      var res = await api('POST', '/api/staff/scan', { code: code });
      stopScan();
      state.staff.selectedMember = res.member;
      state.staff.checkoutForm = { orderAmount: '', redeemOn: false, redeemPoints: 0 };
      sc.error = ''; sc.input = ''; sc.busy = false;
      toast('会員を認識しました：' + res.member.displayName);
      render();
    } catch (e) {
      sc.busy = false;
      sc.error = e.message;
      if (scanStream) updateScanErrorDom(); else render();
    }
  }

  function updateScanErrorDom() {
    var el = document.getElementById('scanerr');
    if (el) el.textContent = state.staff.scan.error || '';
  }

  async function searchStaffMembers() {
    try {
      var q = encodeURIComponent(state.staff.memberSearch || '');
      state.staff.members = await api('GET', '/api/staff/members?q=' + q);
      render();
    } catch (e) { toast(e.message, 'err'); }
  }
  var debouncedStaffSearch = debounce(searchStaffMembers, 250);

  async function refreshTodayLog() {
    try {
      state.staff.todayLog = await api('GET', '/api/staff/today-log');
      render();
    } catch (e) { toast(e.message, 'err'); }
  }

  function renderStaff() {
    if (!state.session.staff) {
      document.getElementById('app').innerHTML = renderStaffLoginForm('ログインするとお会計と本日の取引を利用できます');
      bindStaffLoginEvents();
      return;
    }

    var tabs = '<div class="tabbar">' +
      ['checkout', 'log'].map(function (t) {
        var lbl = t === 'checkout' ? 'お会計' : '本日の取引';
        var icon = t === 'checkout' ? 'wallet' : 'list';
        return '<button data-tab="' + t + '" class="' + (state.staff.tab === t ? 'active' : '') + '">' + svg(icon) + lbl + '</button>';
      }).join('') + '</div>';

    var content = '';
    if (state.staff.tab === 'checkout') {
      content = renderStaffCheckout();
    } else {
      var log = state.staff.todayLog;
      if (!log) {
        content = loadingBlock();
      } else {
        var rows = log.transactions.map(function (t) {
          var net = (t.earnedPoints || 0) - (t.redeemedPoints || 0);
          return '<tr><td>' + fmtTime(t.ts).split(' ')[1] + '</td><td class="name">' + esc(t.memberName) + '</td>' +
            '<td>' + (t.type === 'checkin' ? '<span class="pill good">チェックイン</span>' : (t.type === 'bonus' ? '<span class="pill gold">ボーナス</span>' : '<span class="pill blue">ご利用</span>')) + '</td>' +
            '<td class="num">' + (t.type === 'purchase' ? fmt(t.paidAmount) + ' 円' : '—') + '</td>' +
            '<td class="num delta ' + (net >= 0 ? 'pos' : 'neg') + '">' + fmtSigned(net) + '</td></tr>';
        }).join('');
        content = '<div class="card padcard stack">' +
          '<div class="tablewrap"><table class="logtable"><thead><tr><th>時刻</th><th>会員</th><th>種別</th><th>金額</th><th>ポイント増減</th></tr></thead><tbody>' +
          (rows || '<tr><td colspan="5"><div class="empty">' + svg('list') + '<div>本日の記録はありません</div></div></td></tr>') +
          '</tbody></table></div>' +
          '<div class="foottotals"><span>本日の売上 <b class="num">' + fmt(log.revenue) + ' 円</b></span><span>本日の付与ポイント <b class="num" style="color:var(--brand)">+' + fmt(log.issued) + '</b></span><span>本日の利用ポイント <b class="num" style="color:var(--blue)">-' + fmt(log.redeemed) + '</b></span></div>' +
          '</div>';
      }
    }

    document.getElementById('app').innerHTML =
      '<div class="staffwrap"><div class="staffcard">' +
      '<div class="staff-head"><h2>レジ</h2><div class="top-actions"><div class="op-badge"><span class="dot"></span>' + esc(state.session.staff.name) + '（' + (state.session.staff.role === 'admin' ? '管理者' : 'スタッフ') + '）</div><button class="icon-btn" data-act="stafflogout" title="ログアウト">' + svg('logout') + '</button></div></div>' +
      tabs + content +
      '</div></div>';
    bindStaffEvents();
  }

  function renderStaffCheckout() {
    var s = state.staff;
    var sel = s.selectedMember;
    var memberListHtml = s.members.length
      ? s.members.map(function (m) {
          return '<button class="member-pick ' + (sel && sel.id === m.id ? 'selected' : '') + '" data-act="pickmember" data-id="' + m.id + '">' +
            '<div class="av" style="background:' + avatarColor(m.id) + '">' + esc(initials(m.displayName)) + '</div>' +
            '<div class="info"><b>' + esc(m.displayName) + '</b><span>' + esc(m.phone || 'LINE会員') + '</span></div>' +
            '<div class="pts num">' + fmt(m.points) + ' ポイント</div>' +
            '</button>';
        }).join('')
      : '<div class="empty">' + svg('search') + '<div>該当する会員が見つかりません</div></div>';

    var f = s.checkoutForm;
    var amount = parseFloat(f.orderAmount) || 0;
    var rules = state.admin.rules; // 可能尚未载入，先用保守预设值显示
    var redeemRate = rules ? rules.redeemRate : 10;
    var maxRedeemPercent = rules ? rules.maxRedeemPercent : 50;
    var earnRate = rules ? rules.earnRate : 10;
    var maxUse = sel ? Math.max(0, Math.min(sel.points, Math.floor((amount * maxRedeemPercent) / 100 * redeemRate))) : 0;
    var redeemPts = f.redeemOn ? Math.min(f.redeemPoints || 0, maxUse) : 0;
    var discount = redeemPts / redeemRate;
    var payable = Math.max(0, amount - discount);
    var earn = Math.floor(payable / earnRate);

    var sc = s.scan;
    var memberPart;
    if (sel) {
      memberPart = '<div class="selected-bar"><div class="av" style="background:' + avatarColor(sel.id) + '">' + esc(initials(sel.displayName)) + '</div><b>' + esc(sel.displayName) + '</b><span>現在 ' + fmt(sel.points) + ' ポイント</span><button class="chg" data-act="clearmember">別の会員</button></div>';
    } else {
      memberPart = '<div class="scanpanel">' +
        '<div class="st">お客様の会員QRコードをスキャン</div>' +
        (sc.active
          ? '<div class="scanbox"><video id="scanvideo" playsinline muted></video><div class="frame"></div></div>' +
            '<button class="btn ghost block" data-act="stopscan">' + svg('close') + ' カメラを閉じる</button>'
          : '<button class="btn primary block" data-act="startscan">' + svg('qr') + ' カメラでスキャン</button>') +
        '<div class="scanerr" id="scanerr">' + esc(sc.error) + '</div>' +
        '<div class="field"><label>バーコードリーダー、または会員コードを貼り付け</label>' +
        '<input class="input" id="scaninput" autocomplete="off" placeholder="ここにカーソルを置いてバーコードリーダーでスキャン" value="' + esc(sc.input) + '"></div>' +
        '<div class="scanhint">会員コードはお客様の LINE の「会員コード」画面に表示され、60秒ごとに自動更新されます。期限切れのコードは受け付けられません。</div>' +
        '<button class="linkbtn" data-act="togglesearch">' + (s.searchOpen ? '閉じる' : 'スキャンできない場合は氏名・電話番号で検索') + '</button>' +
        (s.searchOpen
          ? '<div class="member-search">' + svg('search') + '<input class="input" id="staffsearch" placeholder="氏名または電話番号で検索" value="' + esc(s.memberSearch) + '"></div>' +
            '<div class="member-list">' + memberListHtml + '</div>'
          : '') +
        '</div>';
    }

    var inviteBanner = s.lastInvite
      ? '<div class="invite-banner"><div class="ib-top">' + svg('gift') + '<div><b>招待コードを ' + esc(s.lastInvite.memberName) + ' さんにお渡しください</b>' +
        '<span>ご利用ごとに1つ進呈。新規会員が初回登録時に入力すると、双方にポイントが付与されます。お客様は LINE の「お友達紹介」でも確認できます。</span></div></div>' +
        '<div class="ib-code num">' + esc(s.lastInvite.code) + '</div>' +
        '<div class="ib-btns"><button class="btn ghost sm" data-act="copyinvite">コピー</button><button class="btn ghost sm" data-act="closeinvite">閉じる</button></div></div>'
      : '';

    return '<div class="card padcard stack">' +
      inviteBanner +
      memberPart +
      '<div class="field amountbox"><label>お会計金額（円）</label><input class="input num" id="orderamount" type="number" min="0" inputmode="decimal" placeholder="0" value="' + esc(f.orderAmount) + '" ' + (sel ? '' : 'disabled') + '></div>' +
      '<div class="redeem-row"><span style="font-size:13px;font-weight:700;">ポイント利用</span>' +
      '<label class="switch"><input type="checkbox" id="redeemtoggle" ' + (f.redeemOn ? 'checked' : '') + ' ' + (sel && maxUse > 0 ? '' : 'disabled') + '><span class="track"></span><span class="knob"></span></label>' +
      '</div>' +
      (f.redeemOn && sel
        ? '<div class="redeem-panel">' +
          '<input type="range" class="redeem-slider" id="redeemslider" min="0" max="' + maxUse + '" step="1" value="' + redeemPts + '" ' + (maxUse <= 0 ? 'disabled' : '') + '>' +
          '<div class="field" style="flex-direction:row; align-items:center; gap:8px;"><span class="hint">利用</span><input class="input num" id="redeemnum" type="number" min="0" max="' + maxUse + '" value="' + redeemPts + '" style="width:90px;"><span class="hint">ポイント（最大 ' + maxUse + ' ポイント・今回のお会計の ' + maxRedeemPercent + '% が上限）</span></div>' +
          '</div>'
        : '') +
      '<div class="summary">' +
      '<div class="row"><span>お会計金額</span><b class="num">' + fmt(amount) + ' 円</b></div>' +
      '<div class="row"><span>ポイント利用</span><b class="num" style="color:var(--blue);">- ' + fmt(discount) + ' 円</b></div>' +
      '<div class="row total"><span>お支払い金額</span><b class="num">' + fmt(payable) + ' 円</b></div>' +
      '<div class="row earn"><span>今回の獲得予定ポイント</span><b class="num">+' + earn + ' ポイント</b></div>' +
      '</div>' +
      '<button class="btn primary block" data-act="confirmpay" ' + (sel && amount > 0 && !state.staff.busy ? '' : 'disabled') + '>' + svg('check') + (state.staff.busy ? ' 処理中…' : ' 会計を確定') + '</button>' +
      '</div>';
  }

  function bindStaffEvents() {
    var app = document.getElementById('app');
    app.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.staff.tab = b.getAttribute('data-tab');
        render();
        loadStaffTab();
      });
    });
    app.querySelectorAll('[data-act]').forEach(function (el) {
      el.addEventListener('click', async function () {
        var act = el.getAttribute('data-act');
        var s = state.staff;
        if (act === 'stafflogout') {
          staffLogoutClick();
        } else if (act === 'copyinvite') {
          if (s.lastInvite) copyText(s.lastInvite.code, '招待コードをコピーしました');
        } else if (act === 'closeinvite') {
          s.lastInvite = null;
          render();
        } else if (act === 'startscan') {
          startScan();
        } else if (act === 'stopscan') {
          stopScan();
          render();
        } else if (act === 'togglesearch') {
          s.searchOpen = !s.searchOpen;
          render();
          if (s.searchOpen) searchStaffMembers();
        } else if (act === 'pickmember') {
          var id = el.getAttribute('data-id');
          s.selectedMember = s.members.filter(function (m) { return m.id === id; })[0] || null;
          s.checkoutForm = { orderAmount: '', redeemOn: false, redeemPoints: 0 };
          render();
        } else if (act === 'clearmember') {
          s.selectedMember = null;
          s.checkoutForm = { orderAmount: '', redeemOn: false, redeemPoints: 0 };
          render();
        } else if (act === 'confirmpay') {
          var f = s.checkoutForm;
          var amount = parseFloat(f.orderAmount) || 0;
          if (!s.selectedMember || amount <= 0) return;
          s.busy = true; render();
          try {
            var res = await api('POST', '/api/staff/checkout', {
              memberId: s.selectedMember.id,
              orderAmount: amount,
              redeemPoints: f.redeemOn ? (f.redeemPoints || 0) : 0
            });
            s.lastInvite = { memberName: res.member.displayName, code: res.inviteCode, url: res.inviteShareUrl };
            toast(res.member.displayName + ' さんに ' + res.transaction.earnedPoints + ' ポイント付与' + (res.transaction.redeemedPoints > 0 ? '、ポイント利用 ' + fmt(res.transaction.discount) + ' 円' : '') + '。会計が完了しました！');
            s.selectedMember = null;
            s.checkoutForm = { orderAmount: '', redeemOn: false, redeemPoints: 0 };
            s.busy = false;
            render();
            if (s.searchOpen) searchStaffMembers();
          } catch (e) {
            s.busy = false;
            toast(e.message, 'err');
            render();
          }
        }
      });
    });

    var scanInput = app.querySelector('#scaninput');
    if (scanInput) {
      scanInput.addEventListener('input', function () { state.staff.scan.input = scanInput.value; });
      scanInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); handleScanned(scanInput.value); }
      });
      // 平板 / 电脑上自动把光标放进来，扫码枪才能直接使用；手机上不自动弹出键盘
      if (!state.staff.scan.active && window.matchMedia && window.matchMedia('(pointer: fine)').matches) scanInput.focus();
    }
    if (state.staff.scan.active) attachScanVideo();
    var searchEl = app.querySelector('#staffsearch');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        state.staff.memberSearch = searchEl.value;
        debouncedStaffSearch();
      });
      focusEnd(searchEl);
    }
    var amtEl = app.querySelector('#orderamount');
    if (amtEl) {
      amtEl.addEventListener('input', function () { state.staff.checkoutForm.orderAmount = amtEl.value; render(); });
      focusEnd(amtEl);
    }
    var toggleEl = app.querySelector('#redeemtoggle');
    if (toggleEl) toggleEl.addEventListener('change', function () { state.staff.checkoutForm.redeemOn = toggleEl.checked; render(); });
    var sliderEl = app.querySelector('#redeemslider');
    if (sliderEl) sliderEl.addEventListener('input', function () { state.staff.checkoutForm.redeemPoints = parseInt(sliderEl.value, 10) || 0; render(); });
    var redeemNumEl = app.querySelector('#redeemnum');
    if (redeemNumEl) {
      redeemNumEl.addEventListener('input', function () { state.staff.checkoutForm.redeemPoints = parseInt(redeemNumEl.value, 10) || 0; render(); });
      focusEnd(redeemNumEl);
    }
  }
  function focusEnd(el) {
    el.focus();
    if (el.setSelectionRange && el.value) { try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} }
  }

  /* ================================================================ */
  /* ===========================  商家后台  =========================== */
  /* ================================================================ */

  var ADMIN_TABS = [
    { id: 'overview', label: '概要', icon: 'trend' },
    { id: 'members', label: '会員管理', icon: 'users' },
    { id: 'rules', label: 'ポイントルール', icon: 'sliders' },
    { id: 'ledger', label: 'ポイント履歴', icon: 'list' },
    { id: 'staffacct', label: 'スタッフアカウント', icon: 'shield' }
  ];

  async function loadAdminTab() {
    var t = state.admin.tab;
    try {
      if (t === 'overview') state.admin.overview = await api('GET', '/api/admin/overview');
      if (t === 'members') await searchAdminMembers();
      if (t === 'rules' && !state.admin.rules) state.admin.rules = await api('GET', '/api/admin/rules');
      if (t === 'ledger') await loadLedger();
      if (t === 'staffacct') state.admin.staffList = await api('GET', '/api/admin/staff');
      // 后台一旦载入规则，收银台的折抵计算才会精准（同一份 rules 快取共用）
      if (!state.admin.rules) state.admin.rules = await api('GET', '/api/admin/rules');
      render();
    } catch (e) {
      toast(e.message, 'err');
      render();
    }
  }
  async function searchAdminMembers() {
    var q = encodeURIComponent(state.admin.memberSearch || '');
    state.admin.members = await api('GET', '/api/admin/members?q=' + q);
  }
  var debouncedAdminMemberSearch = debounce(function () { searchAdminMembers().then(render); }, 250);

  async function loadLedger() {
    var f = state.admin.ledgerFilter;
    var qs = f === 'all' ? '' : ('?type=' + f);
    state.admin.ledger = await api('GET', '/api/admin/ledger' + qs);
  }

  function renderAdmin() {
    if (!state.session.staff) {
      document.getElementById('app').innerHTML = renderStaffLoginForm('ログインすると会員・ポイントルールの管理と営業データの確認ができます');
      bindStaffLoginEvents();
      return;
    }
    if (state.session.staff.role !== 'admin') {
      document.getElementById('app').innerHTML =
        '<div class="card perm-block"><div class="ic">' + svg('alert') + '</div><h3>このアカウントには管理画面の権限がありません</h3>' +
        '<p>「' + esc(state.session.staff.name) + '」は現在スタッフアカウントのため、レジのみ利用できます。管理画面を見るには管理者アカウントでログインしてください。</p>' +
        '<button class="btn ghost sm" data-act="stafflogout2">ログアウトして別のアカウントを使う</button></div>';
      var b = document.querySelector('[data-act="stafflogout2"]');
      if (b) b.addEventListener('click', staffLogoutClick);
      return;
    }

    var nav = '<div class="card adminnav">' + ADMIN_TABS.map(function (t) {
      return '<button data-atab="' + t.id + '" class="' + (state.admin.tab === t.id ? 'active' : '') + '">' + svg(t.icon) + '<span>' + t.label + '</span></button>';
    }).join('') + '</div>';

    var content = '';
    if (state.admin.tab === 'overview') content = renderAdminOverview();
    else if (state.admin.tab === 'members') content = renderAdminMembers();
    else if (state.admin.tab === 'rules') content = renderAdminRules();
    else if (state.admin.tab === 'ledger') content = renderAdminLedger();
    else content = renderAdminStaffAccounts();

    document.getElementById('app').innerHTML =
      '<div class="admin-grid">' + nav + '<div class="stack">' +
      '<div style="display:flex;justify-content:flex-end;"><button class="icon-btn" data-act="stafflogout" title="ログアウト">' + svg('logout') + '</button></div>' +
      content + '</div></div>';
    bindAdminEvents();
  }

  function kpiTile(iconName, label, val, cap, color, soft) {
    return '<div class="card kpi"><div class="top"><span class="lbl">' + label + '</span><div class="ic" style="background:' + soft + ';color:' + color + '">' + svg(iconName) + '</div></div><div class="val num">' + val + '</div><div class="cap">' + cap + '</div></div>';
  }

  function renderAdminOverview() {
    var o = state.admin.overview;
    if (!o) return loadingBlock();
    var series = o.series;
    var maxVal = Math.max(10, Math.max.apply(null, series.map(function (s) { return Math.max(s.issued, s.redeemed); })));
    var W = 560, H = 190, padL = 8, padR = 8, padT = 18, padB = 26;
    var groupW = (W - padL - padR) / series.length;
    var barW = Math.min(20, groupW * 0.28);
    function y(v) { return H - padB - (v / maxVal) * (H - padT - padB); }
    var gridLines = [0, 0.5, 1].map(function (f) {
      var yy = padT + (H - padT - padB) * (1 - f);
      return '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '" stroke="var(--border)" stroke-width="1"/>' +
        '<text x="' + padL + '" y="' + (yy - 4) + '" font-size="9" fill="var(--ink-muted)">' + Math.round(maxVal * f) + '</text>';
    }).join('');
    var bars = series.map(function (s, idx) {
      var cx = padL + groupW * idx + groupW / 2;
      var x1 = cx - barW - 2, x2 = cx + 2;
      var yi = y(s.issued), yr = y(s.redeemed);
      var base = H - padB;
      return '<g class="bargroup" data-idx="' + idx + '">' +
        '<rect x="' + x1 + '" y="' + yi + '" width="' + barW + '" height="' + Math.max(1, base - yi) + '" rx="3" fill="var(--brand)"></rect>' +
        '<rect x="' + x2 + '" y="' + yr + '" width="' + barW + '" height="' + Math.max(1, base - yr) + '" rx="3" fill="var(--blue)"></rect>' +
        '<text x="' + cx + '" y="' + (H - 8) + '" font-size="9.5" text-anchor="middle" fill="var(--ink-muted)">' + s.label + '</text>' +
        '<rect x="' + (cx - groupW / 2) + '" y="' + padT + '" width="' + groupW + '" height="' + (H - padT - padB) + '" fill="transparent" class="hitzone"></rect>' +
        '</g>';
    }).join('');
    var svgChart = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="overflow:visible; display:block;">' + gridLines + bars + '</svg>';

    return '<div class="stack">' +
      '<div class="kpi-grid">' +
      kpiTile('users', '会員数合計', fmt(o.memberCount), '累計登録会員', 'var(--brand)', 'var(--brand-soft)') +
      kpiTile('ticket', '本日のチェックイン', fmt(o.todayCheckins), '件 · お客様のセルフチェックイン', 'var(--good)', 'var(--good-soft)') +
      kpiTile('arrowUpRight', '本日の付与ポイント', '+' + fmt(o.todayIssued), 'ご利用 + チェックイン + ボーナス', 'var(--brand)', 'var(--brand-soft)') +
      kpiTile('tag', '本日の利用ポイント', '-' + fmt(o.todayRedeemed), 'お会計の割引に利用', 'var(--blue)', 'var(--blue-soft)') +
      '</div>' +
      '<div class="card chartcard">' +
      '<div class="chart-head"><h3>直近7日間 · ポイント付与 vs 利用</h3>' +
      '<div class="legend"><span class="lg"><span class="sw" style="background:var(--brand)"></span>付与</span><span class="lg"><span class="sw" style="background:var(--blue)"></span>利用</span></div>' +
      '</div>' +
      '<div class="chartarea" id="chartarea" data-series=\'' + JSON.stringify(series).replace(/'/g, '&#39;') + '\'>' + svgChart + '<div class="bartip" id="bartip"></div></div>' +
      '</div>' +
      '<div class="card liab"><div class="ic">' + svg('wallet') + '</div><div><div class="val num">' + fmt(o.totalLiability) + ' 円</div><div class="lbl">全会員の未利用ポイント・円換算評価額（ポイント負債）</div></div></div>' +
      '</div>';
  }

  function renderAdminMembers() {
    var q = state.admin.memberSearch;
    var list = state.admin.members;
    var todayKeyLocal = new Date().toISOString().slice(0, 10);
    var rows = list.map(function (m) {
      return '<tr><td class="name">' + esc(m.displayName) + '</td><td>' + esc(m.phone || '—') + '</td><td>' + esc(String(m.joinedAt).slice(0, 10)) + '</td>' +
        '<td class="num" style="color:var(--gold-ink);font-weight:700;">' + fmt(m.points) + '</td>' +
        '<td class="num">' + fmt(m.totalSpent) + ' 円</td>' +
        '<td>' + (m.lastCheckinDate ? esc(m.lastCheckinDate) : '<span class="pill neutral">チェックインなし</span>') + '</td></tr>';
    }).join('');
    return '<div class="card padcard stack">' +
      '<div class="searchbar">' + svg('search') + '<input class="input" id="adminsearch" placeholder="氏名または電話番号で検索" value="' + esc(q) + '"></div>' +
      '<div class="tablewrap"><table class="logtable"><thead><tr><th>会員</th><th>電話番号</th><th>登録日</th><th>現在のポイント</th><th>累計ご利用額</th><th>最終チェックイン</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6"><div class="empty">' + svg('search') + '<div>該当する会員が見つかりません</div></div></td></tr>') +
      '</tbody></table></div>' +
      '</div>';
  }

  function renderAdminRules() {
    var r = state.admin.rules;
    if (!r) return loadingBlock();
    return '<div class="card padcard stack">' +
      '<div><div class="section-title">ポイントルール設定</div><div class="section-sub">変更はお客様用画面とレジにすぐ反映されます。別途公開する必要はありません。</div></div>' +
      '<div class="rules-grid">' +
      ruleItem('earnRate', 'ご利用ポイント付与', 'ご利用', r.earnRate, '円ごとに 1 ポイント') +
      ruleItem('checkinPoints', '毎日チェックインポイント', '1日のチェックインで', r.checkinPoints, 'ポイント') +
      ruleItem('streak5Bonus', '連続チェックイン 5 日ボーナス', '5 日目に追加', r.streak5Bonus, 'ポイント') +
      ruleItem('streak10Bonus', '連続チェックイン 10 日ボーナス', '10 日目に追加', r.streak10Bonus, 'ポイント（付与後リセット）') +
      ruleItem('inviterBonus', '紹介ボーナス（紹介した方）', 'お友達の登録成功で紹介した方に', r.inviterBonus, 'ポイント') +
      ruleItem('inviteeBonus', '紹介ボーナス（新規会員）', '招待コードで登録した新規会員に', r.inviteeBonus, 'ポイント（別途 新規入会ボーナスあり）') +
      ruleItem('redeemRate', 'ポイント換算レート', '', r.redeemRate, 'ポイント = 1 円分') +
      rangeItem('maxRedeemPercent', '1回の利用上限', r.maxRedeemPercent, '%（お会計金額）', 0, 100) +
      '</div>' +
      '<div class="section-sub" style="margin:0;">チェックインのルール：お客様が1日1回スマホでチェックインします。連続 5 日目・10 日目は追加ポイントがあり、10 日目の付与後は1日目からやり直しです。1日でも休むとやり直しになります。ボーナスを 0 にすると、その段階のボーナスは無効になります。</div>' +
      '<div class="autosave" id="autosaveMsg">' + (state.admin.autosaveMsg ? svg('check') + ' ' + esc(state.admin.autosaveMsg) : '') + '</div>' +
      '</div>';
  }
  function ruleItem(key, title, prefix, val, suffix) {
    return '<div class="rule-item"><div class="rt">' + title + '</div><div class="re">' + prefix + ' <input type="number" class="input" data-rule="' + key + '" value="' + val + '" min="0"> ' + suffix + '</div></div>';
  }
  function rangeItem(key, title, val, suffix, min, max) {
    return '<div class="rule-item"><div class="rt">' + title + '</div><div class="re"><input type="range" data-rule="' + key + '" min="' + min + '" max="' + max + '" value="' + val + '"><span class="num" style="min-width:64px;text-align:right;font-weight:700;" id="rangeval-' + key + '">' + val + ' ' + suffix + '</span></div></div>';
  }

  function renderAdminLedger() {
    var filter = state.admin.ledgerFilter;
    var chips = [['all', 'すべて'], ['checkin', 'チェックイン'], ['bonus', 'ボーナス'], ['purchase', 'ご利用']];
    var rows = state.admin.ledger.map(function (t) {
      var net = (t.earnedPoints || 0) - (t.redeemedPoints || 0);
      return '<tr><td>' + fmtDateTime(t.ts) + '</td><td class="name">' + esc(t.memberName) + '</td>' +
        '<td>' + (t.type === 'checkin' ? '<span class="pill good">チェックイン</span>' : (t.type === 'bonus' ? '<span class="pill gold">ボーナス</span>' : t.redeemedPoints > 0 ? '<span class="pill blue">ご利用+ポイント利用</span>' : '<span class="pill neutral">ご利用</span>')) + '</td>' +
        '<td class="num">' + (t.type === 'purchase' ? fmt(t.paidAmount) + ' 円' : '—') + '</td>' +
        '<td class="num delta ' + (net >= 0 ? 'pos' : 'neg') + '">' + fmtSigned(net) + '</td>' +
        '<td>' + esc(t.note || '—') + '</td></tr>';
    }).join('');
    return '<div class="card padcard stack">' +
      '<div class="filterchips">' + chips.map(function (c) { return '<button data-filter="' + c[0] + '" class="' + (filter === c[0] ? 'active' : '') + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      '<div class="tablewrap"><table class="logtable"><thead><tr><th>日時</th><th>会員</th><th>種別</th><th>金額</th><th>ポイント増減</th><th>備考</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6"><div class="empty">' + svg('list') + '<div>該当する記録はありません</div></div></td></tr>') +
      '</tbody></table></div>' +
      '</div>';
  }

  function renderAdminStaffAccounts() {
    var f = state.admin.newStaffForm;
    var rows = state.admin.staffList.map(function (u) {
      return '<div class="staff-acct-row"><div class="av2">' + esc(initials(u.name)) + '</div>' +
        '<div class="info"><b>' + esc(u.name) + '</b><span>@' + esc(u.username) + ' · ' + (u.role === 'admin' ? '管理者' : 'スタッフ') + '</span></div>' +
        (u.id === state.session.staff.id ? '' : '<button class="del" data-act="delstaff" data-id="' + u.id + '" title="アカウントを削除">' + svg('trash') + '</button>') +
        '</div>';
    }).join('');
    return '<div class="card padcard stack">' +
      '<div><div class="section-title">スタッフアカウント</div><div class="section-sub">レジ / 管理画面にログインできるアカウントを管理します。「管理者」は管理画面に入れ、「スタッフ」はレジのみ利用できます。</div></div>' +
      '<div class="stack" style="gap:8px;">' + (rows || '<div class="empty">' + svg('users') + '<div>他のアカウントはまだありません</div></div>') + '</div>' +
      '<hr class="divider">' +
      '<div class="section-title" style="font-size:13.5px;">アカウント追加</div>' +
      '<div class="new-staff-form">' +
      '<div class="field"><label>アカウント</label><input class="input" id="newu" value="' + esc(f.username) + '"></div>' +
      '<div class="field"><label>パスワード</label><input class="input" id="newp" type="password" value="' + esc(f.password) + '"></div>' +
      '<div class="field"><label>氏名</label><input class="input" id="newn" value="' + esc(f.name) + '"></div>' +
      '<div class="field"><label>権限</label><select class="select" id="newr"><option value="staff" ' + (f.role === 'staff' ? 'selected' : '') + '>スタッフ</option><option value="admin" ' + (f.role === 'admin' ? 'selected' : '') + '>管理者</option></select></div>' +
      '</div>' +
      '<button class="btn primary sm" data-act="createstaff" style="align-self:flex-start;">' + svg('key') + ' アカウントを追加</button>' +
      '</div>';
  }

  function bindAdminEvents() {
    var app = document.getElementById('app');
    app.querySelectorAll('[data-atab]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.admin.tab = b.getAttribute('data-atab');
        render();
        loadAdminTab();
      });
    });
    var logoutBtn = app.querySelector('[data-act="stafflogout"]');
    if (logoutBtn) logoutBtn.addEventListener('click', staffLogoutClick);

    var s1 = app.querySelector('#adminsearch');
    if (s1) {
      s1.addEventListener('input', function () { state.admin.memberSearch = s1.value; debouncedAdminMemberSearch(); });
      focusEnd(s1);
    }
    app.querySelectorAll('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.admin.ledgerFilter = b.getAttribute('data-filter');
        render();
        loadLedger().then(render);
      });
    });
    app.querySelectorAll('[data-rule]').forEach(function (inp) {
      inp.addEventListener('input', debounce(async function () {
        var key = inp.getAttribute('data-rule');
        var v = parseFloat(inp.value);
        if (isNaN(v)) return;
        var rv = document.getElementById('rangeval-' + key);
        if (rv) { var suf = rv.textContent.replace(/^[-0-9.]+\s*/, ''); rv.textContent = v + ' ' + suf; }
        try {
          var patch = {}; patch[key] = v;
          state.admin.rules = await api('PUT', '/api/admin/rules', patch);
          state.admin.autosaveMsg = '変更を自動保存しました';
          var msgEl = document.getElementById('autosaveMsg');
          if (msgEl) msgEl.innerHTML = svg('check') + ' 変更を自動保存しました';
        } catch (e) { toast(e.message, 'err'); }
      }, 450));
    });

    var chartarea = app.querySelector('#chartarea');
    if (chartarea) {
      var tip = chartarea.querySelector('#bartip');
      var series = JSON.parse(chartarea.getAttribute('data-series').replace(/&#39;/g, "'"));
      chartarea.querySelectorAll('.bargroup').forEach(function (g) {
        g.addEventListener('mouseenter', function () { showTip(g); });
        g.addEventListener('mousemove', positionTip);
        g.addEventListener('mouseleave', function () { tip.classList.remove('show'); });
      });
      function showTip(g) {
        var idx = parseInt(g.getAttribute('data-idx'), 10);
        var s = series[idx];
        tip.innerHTML = '<b>' + s.date + '</b><br>付与 +' + fmt(s.issued) + ' · 利用 -' + fmt(s.redeemed);
        tip.classList.add('show');
      }
      function positionTip(e) {
        var rect = chartarea.getBoundingClientRect();
        tip.style.left = (e.clientX - rect.left) + 'px';
        tip.style.top = (e.clientY - rect.top) + 'px';
      }
    }

    var newu = app.querySelector('#newu'), newp = app.querySelector('#newp'), newn = app.querySelector('#newn'), newr = app.querySelector('#newr');
    var f = state.admin.newStaffForm;
    if (newu) newu.addEventListener('input', function () { f.username = newu.value; });
    if (newp) newp.addEventListener('input', function () { f.password = newp.value; });
    if (newn) newn.addEventListener('input', function () { f.name = newn.value; });
    if (newr) newr.addEventListener('change', function () { f.role = newr.value; });

    var createBtn = app.querySelector('[data-act="createstaff"]');
    if (createBtn) {
      createBtn.addEventListener('click', async function () {
        try {
          await api('POST', '/api/admin/staff', f);
          toast('アカウント「' + f.username + '」を追加しました');
          state.admin.newStaffForm = { username: '', password: '', name: '', role: 'staff' };
          state.admin.staffList = await api('GET', '/api/admin/staff');
          render();
        } catch (e) { toast(e.message, 'err'); }
      });
    }
    app.querySelectorAll('[data-act="delstaff"]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var id = b.getAttribute('data-id');
        if (!confirm('このアカウントを削除しますか？この操作は取り消せません。')) return;
        try {
          await api('DELETE', '/api/admin/staff/' + id);
          state.admin.staffList = await api('GET', '/api/admin/staff');
          render();
        } catch (e) { toast(e.message, 'err'); }
      });
    });
  }

  boot();
})();
