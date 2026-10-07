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
    return n.toLocaleString('zh-CN');
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
      var err = new Error((data && data.error) || ('请求失败（' + res.status + '）'));
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

    customer: { screen: 'login', summary: null, transactions: null, loading: false, checkinError: '', lastCheckinPoints: 0, loginError: '' },

    staffAuth: { form: { username: '', password: '' }, error: '', busy: false },
    staff: {
      tab: 'code',
      code: null,
      members: [],
      memberSearch: '',
      selectedMember: null,
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
    { id: 'customer', label: '顾客端', icon: 'coffee', ctx: 'LINE 会员卡（手机视角）' },
    { id: 'staff', label: '店员收银台', icon: 'wallet', ctx: '门店收银 / 平板 Kiosk 视角' },
    { id: 'admin', label: '商家后台', icon: 'sliders', ctx: '管理员后台，设定积分规则与查看数据' }
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
    return '<div class="loading-wrap"><div class="spinner"></div><div>' + esc(label || '载入中…') + '</div></div>';
  }

  /* ================= 启动：抓目前登入状态 ================= */
  async function boot() {
    var params = new URLSearchParams(location.search);
    if (params.get('login_error')) {
      state.customer.loginError = params.get('login_error');
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
  }

  /* ================= master render ================= */
  function render() {
    renderChrome();
    if (!state.booted) {
      document.getElementById('app').innerHTML = loadingBlock('正在连线到服务器…');
      return;
    }
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

  function custHeader(title, opts) {
    opts = opts || {};
    var left = opts.back ? '<button data-act="back">' + svg('chevronLeft') + '</button>' : '<span class="side"></span>';
    var right = opts.logout ? '<button class="txt-btn" data-act="logout">登出</button>' : '<span class="side"></span>';
    return '<div class="linebar"><div class="side">' + left + '</div><h2>' + esc(title) + '</h2><div class="side" style="width:auto; justify-content:flex-end;">' + right + '</div></div>';
  }

  function renderCustomer() {
    var c = state.customer;
    var scr = state.session.member ? c.screen : 'login';
    var body = '', header = '', showNav = false;

    if (scr === 'login') {
      header = custHeader('本町咖啡 会员卡');
      body =
        '<div class="login-hero">' +
        '<div class="badge">' + svg('coffee') + '</div>' +
        '<h3>开启你的积分之旅</h3>' +
        '<p>登入后即可到店签到、消费累积积分，积分还能直接折抵消费金额，杯杯都划算。</p>' +
        '</div>' +
        (c.loginError ? '<div class="banner crit">' + svg('alert') + '<span>' + esc(c.loginError) + '</span></div>' : '') +
        '<button class="btn line block" data-act="linelogin" style="border:1px solid var(--border);">' + svg('coffee') + ' 使用 LINE 帐号继续</button>' +
        '<p class="login-legal">继续即代表你同意《会员服务条款》与《隐私权政策》</p>';
    } else if (scr === 'home') {
      header = custHeader('我的会员卡', { logout: true });
      showNav = true;
      if (c.loading || !c.summary) {
        body = loadingBlock();
      } else {
        var s = c.summary;
        var recent = (c.transactions || []).slice(0, 3);
        body =
          '<div class="points-hero">' +
          '<div class="lbl">' + svg('star') + ' 可用积分</div>' +
          '<div class="val num">' + fmt(s.points) + '<span>点</span></div>' +
          '<div class="sub">约可折抵消费 ' + fmt(s.pointsValue) + ' 元</div>' +
          '</div>' +
          '<button class="cta-checkin ' + (s.checkedInToday ? 'off' : 'on') + '" data-act="gocheckin">' +
          '<div class="ic">' + svg('ticket') + '</div>' +
          '<div class="tx"><b>' + (s.checkedInToday ? '今日已签到' : '到店签到 领积分') + '</b><span>' + (s.checkedInToday ? '明天再来赚积分吧' : '向店员出示签到码，立得 ' + s.rules.checkinPoints + ' 积分') + '</span></div>' +
          (s.checkedInToday ? svg('check', 'chev') : svg('chevronRight', 'chev')) +
          '</button>' +
          '<div class="stat2">' +
          '<div class="tile"><div class="t">累计消费</div><div class="v num">' + fmt(s.totalSpent) + ' 元</div></div>' +
          '<div class="tile"><div class="t">本月已获积分</div><div class="v num">' + fmt(s.monthEarned) + ' 点</div></div>' +
          '</div>' +
          '<div>' +
          '<div class="sec-head"><h4>最近动态</h4><a data-act="gohistory">查看全部 ' + svg('chevronRight') + '</a></div>' +
          (recent.length ? '<div>' + recent.map(txRowHtml).join('') + '</div>' : '<div class="empty">' + svg('list') + '<div>还没有消费或签到纪录</div></div>') +
          '</div>';
      }
    } else if (scr === 'history') {
      header = custHeader('消费记录', { back: true });
      showNav = true;
      var all = c.transactions || [];
      body = c.loading ? loadingBlock() : (all.length ? '<div>' + all.map(txRowHtml).join('') + '</div>' : '<div class="empty">' + svg('list') + '<div>还没有任何纪录</div></div>');
    } else if (scr === 'checkin') {
      header = custHeader('到店签到', { back: true });
      body =
        '<div class="code-entry">' +
        '<div class="badge" style="width:60px;height:60px;">' + svg('ticket') + '</div>' +
        '<div class="msg">请向店员出示手机，并输入店内当前显示的 6 位签到码</div>' +
        '<div class="digits" id="digitswrap">' +
        [0, 1, 2, 3, 4, 5].map(function (i) { return '<input maxlength="1" inputmode="numeric" data-i="' + i + '">'; }).join('') +
        '</div>' +
        '<div class="code-error">' + esc(c.checkinError) + '</div>' +
        '<button class="btn primary block" data-act="submitcheckin" ' + (c.busy ? 'disabled' : '') + '>' + (c.busy ? '确认中…' : '确认签到') + '</button>' +
        '</div>';
    } else if (scr === 'checkinSuccess') {
      header = custHeader('到店签到', { back: true });
      body =
        '<div class="checkin-success">' +
        '<div class="ring">' + svg('check') + '</div>' +
        '<h3>签到成功！</h3>' +
        '<p>获得 <b class="num" style="color:var(--brand)">+' + c.lastCheckinPoints + '</b> 积分，欢迎光临本町咖啡 ☕</p>' +
        '<button class="btn primary block" data-act="gohome" style="margin-top:8px;">返回首页</button>' +
        '</div>';
    }

    var nav = showNav
      ? '<div class="bottomnav">' +
        '<button data-act="gohome" class="' + (scr === 'home' ? 'active' : '') + '">' + svg('home') + '<span>首页</span></button>' +
        '<button data-act="gohistory" class="' + (scr === 'history' ? 'active' : '') + '">' + svg('list') + '<span>消费记录</span></button>' +
        '</div>'
      : '';

    document.getElementById('app').innerHTML =
      '<div class="phonewrap"><div class="phone"><div class="notch"></div>' + header + '<div class="phonebody">' + body + '</div>' + nav + '</div></div>';
    bindCustomerEvents();
  }

  function txRowHtml(t) {
    var isCheckin = t.type === 'checkin';
    var isBonus = t.type === 'bonus';
    var iconName = isCheckin ? 'ticket' : (isBonus ? 'gift' : 'cup');
    var bg = isCheckin || isBonus ? 'var(--good-soft)' : 'var(--brand-soft)';
    var color = isCheckin || isBonus ? 'var(--good)' : 'var(--brand)';
    var title = isCheckin ? '到店签到' : (isBonus ? (t.note || '新会员礼') : (t.note || '消费'));
    var netPoints = (t.earnedPoints || 0) - (t.redeemedPoints || 0);
    var amtLine = (t.type === 'purchase') ? ('<small>付 ' + fmt(t.paidAmount) + ' 元' + (t.redeemedPoints ? '（折抵' + fmt(t.discount) + '元）' : '') + '</small>') : '';
    return '<div class="tx-row">' +
      '<div class="ic" style="background:' + bg + ';color:' + color + '">' + svg(iconName) + '</div>' +
      '<div class="mid"><b>' + esc(title) + '</b><span>' + fmtTime(t.ts) + (t.staffName ? ' · ' + esc(t.staffName) : '') + '</span></div>' +
      '<div class="amt" style="color:' + (netPoints >= 0 ? 'var(--brand)' : 'var(--blue)') + '">' + fmtSigned(netPoints) + amtLine + '</div>' +
      '</div>';
  }

  function bindCustomerEvents() {
    var app = document.getElementById('app');
    app.querySelectorAll('[data-act]').forEach(function (el) {
      el.addEventListener('click', async function () {
        var act = el.getAttribute('data-act');
        var c = state.customer;
        if (act === 'linelogin') {
          location.href = '/api/auth/line/login';
        } else if (act === 'back') {
          c.screen = (c.screen === 'checkin' || c.screen === 'checkinSuccess' || c.screen === 'history') ? 'home' : 'login';
          render();
        } else if (act === 'logout') {
          await api('POST', '/api/auth/member/logout').catch(function () {});
          state.session.member = null;
          state.customer = { screen: 'login', summary: null, transactions: null, loading: false, checkinError: '', lastCheckinPoints: 0, loginError: '' };
          render();
        } else if (act === 'gohome') {
          c.screen = 'home';
          render();
          loadCustomerHome();
        } else if (act === 'gohistory') {
          c.screen = 'history';
          render();
        } else if (act === 'gocheckin') {
          if (c.summary && c.summary.checkedInToday) { toast('今日已经签到过囉，明天再来吧！'); return; }
          c.checkinError = '';
          c.screen = 'checkin';
          render();
        } else if (act === 'submitcheckin') {
          var inputs = app.querySelectorAll('#digitswrap input');
          var code = '';
          inputs.forEach(function (i) { code += (i.value || '').trim(); });
          if (code.length !== 6) { c.checkinError = '请输入完整的 6 位数字'; render(); return; }
          c.busy = true; c.checkinError = ''; render();
          try {
            var res = await api('POST', '/api/me/checkin', { code: code });
            c.lastCheckinPoints = res.pointsEarned;
            c.screen = 'checkinSuccess';
            c.busy = false;
            render();
            loadCustomerHome();
          } catch (e) {
            c.busy = false;
            c.checkinError = e.message;
            render();
          }
        }
      });
    });

    var digitInputs = app.querySelectorAll('#digitswrap input');
    if (digitInputs.length) {
      digitInputs.forEach(function (inp, idx) {
        inp.addEventListener('input', function () {
          inp.value = inp.value.replace(/[^0-9]/g, '').slice(0, 1);
          if (inp.value && digitInputs[idx + 1]) digitInputs[idx + 1].focus();
        });
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Backspace' && !inp.value && digitInputs[idx - 1]) digitInputs[idx - 1].focus();
          if (e.key === 'Enter') app.querySelector('[data-act="submitcheckin"]').click();
        });
      });
      digitInputs[0].focus();
    }
  }

  /* ================================================================ */
  /* ======================  店员 / 管理员登入  ====================== */
  /* ================================================================ */

  function renderStaffLoginForm(onLoggedInMessage) {
    var a = state.staffAuth;
    return '<div class="staff-login-wrap"><div class="card staff-login">' +
      '<div class="lg"><div class="badge">' + svg('lock') + '</div><h3>店员 / 管理员登入</h3><p>' + esc(onLoggedInMessage || '请使用店家提供的帐号密码登入') + '</p></div>' +
      (a.error ? '<div class="banner crit">' + svg('alert') + '<span>' + esc(a.error) + '</span></div>' : '') +
      '<div class="field"><label>帐号</label><input class="input" id="staffuser" value="' + esc(a.form.username) + '" autocomplete="username"></div>' +
      '<div class="field"><label>密码</label><input class="input" id="staffpass" type="password" value="' + esc(a.form.password) + '" autocomplete="current-password"></div>' +
      '<button class="btn primary block" data-act="stafflogin" ' + (a.busy ? 'disabled' : '') + '>' + (a.busy ? '登入中…' : '登入') + '</button>' +
      '<div class="hint-box">首次部署的预设管理员帐号请见后端 <code>.env</code> / README 的 <b>SEED_ADMIN_USERNAME</b> 设定；请尽快在「商家后台 → 员工帐号」新增其他帐号并修改预设密码。</div>' +
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
        if (!a.form.username || !a.form.password) { a.error = '请输入帐号与密码'; render(); return; }
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
    state.session.staff = null;
    state.staff.code = null;
    state.admin.overview = null;
    render();
  }

  /* ================================================================ */
  /* =========================  店员收银台  ========================== */
  /* ================================================================ */

  var codeTickerHandle = null;

  function stopCodeTicker() {
    if (codeTickerHandle) { clearInterval(codeTickerHandle); codeTickerHandle = null; }
  }

  async function loadStaffTab() {
    var t = state.staff.tab;
    if (t === 'code') {
      await refreshStaffCode();
      stopCodeTicker();
      codeTickerHandle = setInterval(function () {
        if (state.role !== 'staff' || state.staff.tab !== 'code' || !state.session.staff) { stopCodeTicker(); return; }
        refreshStaffCode(true);
      }, 1000);
    } else {
      stopCodeTicker();
      if (t === 'checkout') await searchStaffMembers();
      if (t === 'log') await refreshTodayLog();
    }
  }

  async function refreshStaffCode(silent) {
    try {
      var data = await api('GET', '/api/staff/code');
      state.staff.code = data;
      if (silent) updateCodeWidgetDom(); else render();
    } catch (e) {
      if (!silent) { toast(e.message, 'err'); render(); }
    }
  }
  function updateCodeWidgetDom() {
    var c = state.staff.code;
    if (!c) return;
    var txt = document.getElementById('codebigtext');
    var cap = document.getElementById('codecap');
    var arc = document.getElementById('codearc');
    var cnt = document.getElementById('todaycheckincount');
    if (txt) txt.textContent = c.code;
    if (cap) cap.textContent = '顾客到店后请出示此码，约 ' + c.secondsRemaining + ' 秒后自动更新';
    if (cnt) cnt.textContent = c.todayCheckins;
    if (arc && state.admin.rules) {
      var ttl = state.admin.rules.codeTTL || 60;
      var frac = 1 - c.secondsRemaining / ttl;
      arc.setAttribute('stroke-dashoffset', String(163.4 * frac));
    }
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
      document.getElementById('app').innerHTML = renderStaffLoginForm('登入后即可使用签到码显示与收银结账功能');
      bindStaffLoginEvents();
      return;
    }

    var tabs = '<div class="tabbar">' +
      ['code', 'checkout', 'log'].map(function (t) {
        var lbl = t === 'code' ? '签到码' : (t === 'checkout' ? '收银结账' : '今日流水');
        var icon = t === 'code' ? 'ticket' : (t === 'checkout' ? 'wallet' : 'list');
        return '<button data-tab="' + t + '" class="' + (state.staff.tab === t ? 'active' : '') + '">' + svg(icon) + lbl + '</button>';
      }).join('') + '</div>';

    var content = '';
    if (state.staff.tab === 'code') {
      var c = state.staff.code;
      content = c
        ? '<div class="card codeboard">' +
          '<div class="codering"><svg viewBox="0 0 60 60"><circle class="track" cx="30" cy="30" r="26"></circle><circle class="bar" id="codearc" cx="30" cy="30" r="26" stroke-dasharray="163.4" stroke-dashoffset="0"></circle></svg>' +
          '<div class="digitsbig num" id="codebigtext">' + esc(c.code) + '</div></div>' +
          '<div class="cap" id="codecap">顾客到店后请出示此码，约 ' + c.secondsRemaining + ' 秒后自动更新</div>' +
          '<div class="stub"><span>本町咖啡 · 到店签到票</span><span class="num" id="checkinpts">积分</span></div>' +
          '<button class="btn ghost sm" data-act="regen">' + svg('refresh') + ' 立即更换签到码</button>' +
          '<div class="today-checkins">' + svg('users') + ' 今日已有 <b class="num" id="todaycheckincount">' + c.todayCheckins + '</b> 人次到店签到</div>' +
          '</div>'
        : loadingBlock();
    } else if (state.staff.tab === 'checkout') {
      content = renderStaffCheckout();
    } else {
      var log = state.staff.todayLog;
      if (!log) {
        content = loadingBlock();
      } else {
        var rows = log.transactions.map(function (t) {
          var net = (t.earnedPoints || 0) - (t.redeemedPoints || 0);
          return '<tr><td>' + fmtTime(t.ts).split(' ')[1] + '</td><td class="name">' + esc(t.memberName) + '</td>' +
            '<td>' + (t.type === 'checkin' ? '<span class="pill good">签到</span>' : '<span class="pill blue">消费</span>') + '</td>' +
            '<td class="num">' + (t.type === 'purchase' ? fmt(t.paidAmount) + ' 元' : '—') + '</td>' +
            '<td class="num delta ' + (net >= 0 ? 'pos' : 'neg') + '">' + fmtSigned(net) + '</td></tr>';
        }).join('');
        content = '<div class="card padcard stack">' +
          '<div class="tablewrap"><table class="logtable"><thead><tr><th>时间</th><th>会员</th><th>类型</th><th>金额</th><th>积分变化</th></tr></thead><tbody>' +
          (rows || '<tr><td colspan="5"><div class="empty">' + svg('list') + '<div>今日尚无纪录</div></div></td></tr>') +
          '</tbody></table></div>' +
          '<div class="foottotals"><span>今日营收 <b class="num">' + fmt(log.revenue) + ' 元</b></span><span>今日发放积分 <b class="num" style="color:var(--brand)">+' + fmt(log.issued) + '</b></span><span>今日核销积分 <b class="num" style="color:var(--blue)">-' + fmt(log.redeemed) + '</b></span></div>' +
          '</div>';
      }
    }

    document.getElementById('app').innerHTML =
      '<div class="staffwrap"><div class="staffcard">' +
      '<div class="staff-head"><h2>收银台</h2><div class="top-actions"><div class="op-badge"><span class="dot"></span>' + esc(state.session.staff.name) + '（' + (state.session.staff.role === 'admin' ? '管理员' : '店员') + '）</div><button class="icon-btn" data-act="stafflogout" title="登出">' + svg('logout') + '</button></div></div>' +
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
            '<div class="info"><b>' + esc(m.displayName) + '</b><span>' + esc(m.phone || 'LINE 会员') + '</span></div>' +
            '<div class="pts num">' + fmt(m.points) + ' 点</div>' +
            '</button>';
        }).join('')
      : '<div class="empty">' + svg('search') + '<div>找不到符合的会员</div></div>';

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

    return '<div class="card padcard stack">' +
      '<div class="field"><label>选择会员</label>' +
      '<div class="member-search">' + svg('search') + '<input class="input" id="staffsearch" placeholder="搜寻姓名或电话" value="' + esc(s.memberSearch) + '"></div>' +
      '</div>' +
      '<div class="member-list">' + memberListHtml + '</div>' +
      (sel ? '<div class="selected-bar"><div class="av" style="background:' + avatarColor(sel.id) + '">' + esc(initials(sel.displayName)) + '</div><b>' + esc(sel.displayName) + '</b><span>目前 ' + fmt(sel.points) + ' 点</span><button class="chg" data-act="clearmember">更换</button></div>' : '') +
      '<div class="field amountbox"><label>订单金额（元）</label><input class="input num" id="orderamount" type="number" min="0" inputmode="decimal" placeholder="0" value="' + esc(f.orderAmount) + '" ' + (sel ? '' : 'disabled') + '></div>' +
      '<div class="redeem-row"><span style="font-size:13px;font-weight:700;">使用积分折抵</span>' +
      '<label class="switch"><input type="checkbox" id="redeemtoggle" ' + (f.redeemOn ? 'checked' : '') + ' ' + (sel && maxUse > 0 ? '' : 'disabled') + '><span class="track"></span><span class="knob"></span></label>' +
      '</div>' +
      (f.redeemOn && sel
        ? '<div class="redeem-panel">' +
          '<input type="range" class="redeem-slider" id="redeemslider" min="0" max="' + maxUse + '" step="1" value="' + redeemPts + '" ' + (maxUse <= 0 ? 'disabled' : '') + '>' +
          '<div class="field" style="flex-direction:row; align-items:center; gap:8px;"><span class="hint">折抵</span><input class="input num" id="redeemnum" type="number" min="0" max="' + maxUse + '" value="' + redeemPts + '" style="width:90px;"><span class="hint">积分（最多 ' + maxUse + ' 点，即本单 ' + maxRedeemPercent + '% 上限）</span></div>' +
          '</div>'
        : '') +
      '<div class="summary">' +
      '<div class="row"><span>订单金额</span><b class="num">' + fmt(amount) + ' 元</b></div>' +
      '<div class="row"><span>积分折抵</span><b class="num" style="color:var(--blue);">- ' + fmt(discount) + ' 元</b></div>' +
      '<div class="row total"><span>应付金额</span><b class="num">' + fmt(payable) + ' 元</b></div>' +
      '<div class="row earn"><span>本次预计获得积分</span><b class="num">+' + earn + ' 点</b></div>' +
      '</div>' +
      '<button class="btn primary block" data-act="confirmpay" ' + (sel && amount > 0 && !state.staff.busy ? '' : 'disabled') + '>' + svg('check') + (state.staff.busy ? ' 处理中…' : ' 确认收款') + '</button>' +
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
        } else if (act === 'regen') {
          try {
            state.staff.code = Object.assign({}, state.staff.code, await api('POST', '/api/staff/code/regenerate'));
            toast('已产生新的签到码');
            render();
          } catch (e) { toast(e.message, 'err'); }
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
            toast(res.member.displayName + ' 获得 ' + res.transaction.earnedPoints + ' 积分' + (res.transaction.redeemedPoints > 0 ? '，本单折抵 ' + fmt(res.transaction.discount) + ' 元' : '') + '，收款成功！');
            s.selectedMember = null;
            s.checkoutForm = { orderAmount: '', redeemOn: false, redeemPoints: 0 };
            s.busy = false;
            render();
            searchStaffMembers();
          } catch (e) {
            s.busy = false;
            toast(e.message, 'err');
            render();
          }
        }
      });
    });

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
    { id: 'overview', label: '总览', icon: 'trend' },
    { id: 'members', label: '会员管理', icon: 'users' },
    { id: 'rules', label: '积分规则', icon: 'sliders' },
    { id: 'ledger', label: '积分记录', icon: 'list' },
    { id: 'staffacct', label: '员工帐号', icon: 'shield' }
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
      document.getElementById('app').innerHTML = renderStaffLoginForm('登入后即可管理会员、积分规则与查看营运数据');
      bindStaffLoginEvents();
      return;
    }
    if (state.session.staff.role !== 'admin') {
      document.getElementById('app').innerHTML =
        '<div class="card perm-block"><div class="ic">' + svg('alert') + '</div><h3>此帐号没有后台管理权限</h3>' +
        '<p>「' + esc(state.session.staff.name) + '」目前是店员帐号，只能使用收银台。如需查看后台，请用管理员帐号登入。</p>' +
        '<button class="btn ghost sm" data-act="stafflogout2">登出，改用其他帐号</button></div>';
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
      '<div style="display:flex;justify-content:flex-end;"><button class="icon-btn" data-act="stafflogout" title="登出">' + svg('logout') + '</button></div>' +
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
      kpiTile('users', '总会员数', fmt(o.memberCount), '累计注册会员', 'var(--brand)', 'var(--brand-soft)') +
      kpiTile('ticket', '今日到店签到', fmt(o.todayCheckins), '人次 · 今日', 'var(--good)', 'var(--good-soft)') +
      kpiTile('arrowUpRight', '今日发放积分', '+' + fmt(o.todayIssued), '消费 + 签到', 'var(--brand)', 'var(--brand-soft)') +
      kpiTile('tag', '今日核销积分', '-' + fmt(o.todayRedeemed), '用于折抵消费', 'var(--blue)', 'var(--blue-soft)') +
      '</div>' +
      '<div class="card chartcard">' +
      '<div class="chart-head"><h3>近 7 日 · 积分发放 vs 核销</h3>' +
      '<div class="legend"><span class="lg"><span class="sw" style="background:var(--brand)"></span>发放</span><span class="lg"><span class="sw" style="background:var(--blue)"></span>核销</span></div>' +
      '</div>' +
      '<div class="chartarea" id="chartarea" data-series=\'' + JSON.stringify(series).replace(/'/g, '&#39;') + '\'>' + svgChart + '<div class="bartip" id="bartip"></div></div>' +
      '</div>' +
      '<div class="card liab"><div class="ic">' + svg('wallet') + '</div><div><div class="val num">' + fmt(o.totalLiability) + ' 元</div><div class="lbl">全体会员未核销积分・折现估值（积分负债）</div></div></div>' +
      '</div>';
  }

  function renderAdminMembers() {
    var q = state.admin.memberSearch;
    var list = state.admin.members;
    var todayKeyLocal = new Date().toISOString().slice(0, 10);
    var rows = list.map(function (m) {
      return '<tr><td class="name">' + esc(m.displayName) + '</td><td>' + esc(m.phone || '—') + '</td><td>' + esc(String(m.joinedAt).slice(0, 10)) + '</td>' +
        '<td class="num" style="color:var(--gold-ink);font-weight:700;">' + fmt(m.points) + '</td>' +
        '<td class="num">' + fmt(m.totalSpent) + ' 元</td>' +
        '<td>' + (m.lastCheckinDate ? esc(m.lastCheckinDate) : '<span class="pill neutral">尚未签到</span>') + '</td></tr>';
    }).join('');
    return '<div class="card padcard stack">' +
      '<div class="searchbar">' + svg('search') + '<input class="input" id="adminsearch" placeholder="搜寻姓名或电话" value="' + esc(q) + '"></div>' +
      '<div class="tablewrap"><table class="logtable"><thead><tr><th>会员</th><th>电话</th><th>加入日期</th><th>目前积分</th><th>累计消费</th><th>最近到店</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6"><div class="empty">' + svg('search') + '<div>找不到符合的会员</div></div></td></tr>') +
      '</tbody></table></div>' +
      '</div>';
  }

  function renderAdminRules() {
    var r = state.admin.rules;
    if (!r) return loadingBlock();
    return '<div class="card padcard stack">' +
      '<div><div class="section-title">积分规则设定</div><div class="section-sub">调整后立即套用于顾客端与收银台，无需另外发布。</div></div>' +
      '<div class="rules-grid">' +
      ruleItem('earnRate', '消费兑换积分', '每消费', r.earnRate, '元 得 1 积分') +
      ruleItem('checkinPoints', '到店签到积分', '每次签到获得', r.checkinPoints, '积分') +
      ruleItem('redeemRate', '积分折现比例', '每', r.redeemRate, '积分 可折抵 1 元') +
      rangeItem('maxRedeemPercent', '单笔最高折抵比例', r.maxRedeemPercent, '%（订单金额）', 0, 100) +
      '</div>' +
      rangeItem('codeTTL', '店员签到码有效期', r.codeTTL, '秒后自动更新', 20, 180) +
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
    var chips = [['all', '全部'], ['checkin', '签到'], ['purchase', '消费']];
    var rows = state.admin.ledger.map(function (t) {
      var net = (t.earnedPoints || 0) - (t.redeemedPoints || 0);
      return '<tr><td>' + fmtDateTime(t.ts) + '</td><td class="name">' + esc(t.memberName) + '</td>' +
        '<td>' + (t.type === 'checkin' ? '<span class="pill good">签到</span>' : (t.redeemedPoints > 0 ? '<span class="pill blue">消费+折抵</span>' : '<span class="pill neutral">消费</span>')) + '</td>' +
        '<td class="num">' + (t.type === 'purchase' ? fmt(t.paidAmount) + ' 元' : '—') + '</td>' +
        '<td class="num delta ' + (net >= 0 ? 'pos' : 'neg') + '">' + fmtSigned(net) + '</td>' +
        '<td>' + esc(t.note || '—') + '</td></tr>';
    }).join('');
    return '<div class="card padcard stack">' +
      '<div class="filterchips">' + chips.map(function (c) { return '<button data-filter="' + c[0] + '" class="' + (filter === c[0] ? 'active' : '') + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      '<div class="tablewrap"><table class="logtable"><thead><tr><th>时间</th><th>会员</th><th>类型</th><th>金额</th><th>积分变动</th><th>备注</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6"><div class="empty">' + svg('list') + '<div>没有符合的纪录</div></div></td></tr>') +
      '</tbody></table></div>' +
      '</div>';
  }

  function renderAdminStaffAccounts() {
    var f = state.admin.newStaffForm;
    var rows = state.admin.staffList.map(function (u) {
      return '<div class="staff-acct-row"><div class="av2">' + esc(initials(u.name)) + '</div>' +
        '<div class="info"><b>' + esc(u.name) + '</b><span>@' + esc(u.username) + ' · ' + (u.role === 'admin' ? '管理员' : '店员') + '</span></div>' +
        (u.id === state.session.staff.id ? '' : '<button class="del" data-act="delstaff" data-id="' + u.id + '" title="删除帐号">' + svg('trash') + '</button>') +
        '</div>';
    }).join('');
    return '<div class="card padcard stack">' +
      '<div><div class="section-title">员工帐号</div><div class="section-sub">管理可以登入收银台 / 后台的帐号。「管理员」可以进入后台，「店员」只能使用收银台。</div></div>' +
      '<div class="stack" style="gap:8px;">' + (rows || '<div class="empty">' + svg('users') + '<div>还没有其他帐号</div></div>') + '</div>' +
      '<hr class="divider">' +
      '<div class="section-title" style="font-size:13.5px;">新增帐号</div>' +
      '<div class="new-staff-form">' +
      '<div class="field"><label>帐号</label><input class="input" id="newu" value="' + esc(f.username) + '"></div>' +
      '<div class="field"><label>密码</label><input class="input" id="newp" type="password" value="' + esc(f.password) + '"></div>' +
      '<div class="field"><label>姓名</label><input class="input" id="newn" value="' + esc(f.name) + '"></div>' +
      '<div class="field"><label>角色</label><select class="select" id="newr"><option value="staff" ' + (f.role === 'staff' ? 'selected' : '') + '>店员</option><option value="admin" ' + (f.role === 'admin' ? 'selected' : '') + '>管理员</option></select></div>' +
      '</div>' +
      '<button class="btn primary sm" data-act="createstaff" style="align-self:flex-start;">' + svg('key') + ' 新增帐号</button>' +
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
          state.admin.autosaveMsg = '变更已自动储存';
          var msgEl = document.getElementById('autosaveMsg');
          if (msgEl) msgEl.innerHTML = svg('check') + ' 变更已自动储存';
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
        tip.innerHTML = '<b>' + s.date + '</b><br>发放 +' + fmt(s.issued) + ' · 核销 -' + fmt(s.redeemed);
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
          toast('已新增帐号「' + f.username + '」');
          state.admin.newStaffForm = { username: '', password: '', name: '', role: 'staff' };
          state.admin.staffList = await api('GET', '/api/admin/staff');
          render();
        } catch (e) { toast(e.message, 'err'); }
      });
    }
    app.querySelectorAll('[data-act="delstaff"]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var id = b.getAttribute('data-id');
        if (!confirm('确定要删除这个帐号吗？此操作无法复原。')) return;
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
