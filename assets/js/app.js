/* ============ 尚硅谷Kafka交互学习站 · 应用核心 ============ */
(function () {
  'use strict';

  /* ---------- 数据索引 ---------- */
  var CHAPTERS = window.CHAPTERS || [];
  var ALL_LESSONS = [];
  CHAPTERS.forEach(function (ch) {
    ch.lessonList = ch.lessons.map(function (l) {
      var lesson = Object.assign({}, l, { chapterId: ch.id, chapterTitle: ch.title, chapterIcon: ch.icon });
      ALL_LESSONS.push(lesson);
      return lesson;
    });
  });

  function parseDur(d) { var m = d.split(':'); return (+m[0]) * 60 + (+m[1]); }
  function fmtDur(sec) {
    var h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    return h > 0 ? h + ' 小时 ' + m + ' 分' : m + ' 分钟';
  }
  var TOTAL_SEC = ALL_LESSONS.reduce(function (s, l) { return s + parseDur(l.duration); }, 0);

  /* ---------- 学习进度（localStorage） ---------- */
  var PROGRESS_KEY = 'kafka-course-progress-v1';
  function getProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch (e) { return {}; }
  }
  function setProgress(p) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
  function toggleDone(id) {
    var p = getProgress();
    if (p[id]) delete p[id]; else p[id] = true;
    setProgress(p); return !!p[id];
  }

  /* ---------- 侧边栏 ---------- */
  function renderSidebar(activeId) {
    var stats = document.getElementById('side-stats');
    stats.innerHTML =
      '<div class="stat-chip"><b>' + ALL_LESSONS.length + '</b><span>课时</span></div>' +
      '<div class="stat-chip"><b>' + CHAPTERS.length + '</b><span>章节</span></div>' +
      '<div class="stat-chip"><b>' + fmtDur(TOTAL_SEC).replace(' ', '') + '</b><span>总时长</span></div>';

    var progress = getProgress();
    var doneCount = Object.keys(progress).length;
    document.getElementById('progress-text').textContent = doneCount + ' / ' + ALL_LESSONS.length;
    document.getElementById('progress-inner').style.width = (doneCount / ALL_LESSONS.length * 100) + '%';

    var toc = document.getElementById('toc');
    toc.innerHTML = '';
    CHAPTERS.forEach(function (ch) {
      var chDur = ch.lessons.reduce(function (s, l) { return s + parseDur(l.duration); }, 0);
      var wrap = document.createElement('div');
      wrap.className = 'toc-chapter' + (activeId && ch.lessons.some(function (l) { return l.id === activeId; }) ? ' open' : '');
      wrap.dataset.chapter = ch.id;

      var head = document.createElement('div');
      head.className = 'toc-chapter-head';
      head.innerHTML = '<span class="toc-icon">' + ch.icon + '</span><span>' + ch.title + '</span>' +
        '<span class="toc-count">' + ch.lessons.length + ' 课</span><span class="toc-arrow">▶</span>';
      head.onclick = function () { wrap.classList.toggle('open'); };
      wrap.appendChild(head);

      var list = document.createElement('div');
      list.className = 'toc-lessons';
      ch.lessons.forEach(function (l) {
        var a = document.createElement('a');
        a.className = 'toc-lesson' + (l.id === activeId ? ' active' : '') + (progress[l.id] ? ' done' : '');
        a.href = '#/lesson/' + l.id;
        a.dataset.search = (ch.title + ' ' + l.title + ' ' + (l.summary || '') + ' ' + (l.points || []).join(' ')).toLowerCase();
        a.innerHTML = '<span class="toc-done">✓</span><span class="toc-num">' + l.id + '</span><span>' + l.title + '</span><span class="toc-dur">' + l.duration + '</span>';
        list.appendChild(a);
      });
      wrap.appendChild(list);
      toc.appendChild(wrap);
    });

    var input = document.getElementById('search-input');
    input.oninput = function () {
      var q = input.value.trim().toLowerCase();
      document.querySelectorAll('.toc-lesson').forEach(function (a) {
        var hit = !q || a.dataset.search.indexOf(q) !== -1;
        a.classList.toggle('search-hidden', !hit);
      });
      document.querySelectorAll('.toc-chapter').forEach(function (c) {
        var visible = c.querySelectorAll('.toc-lesson:not(.search-hidden)').length > 0;
        c.style.display = visible ? '' : 'none';
        if (q && visible) c.classList.add('open');
      });
    };
  }

  /* ---------- 渲染工具 ---------- */
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function codeBlock(code) {
    var map = { java: 'Java', bash: 'Bash', yaml: 'YAML', scala: 'Scala', sql: 'SQL', json: 'JSON' };
    var block = el('<div class="code-block"><div class="code-head"><b>' + esc(code.title || map[code.lang] || code.lang) +
      '</b><span>' + esc(map[code.lang] || code.lang) + '</span></div><pre><code class="language-' + code.lang + '"></code></pre></div>');
    block.querySelector('code').textContent = code.src;
    return block;
  }

  function dataTable(table) {
    var html = '<table class="data-table"><thead><tr>';
    table.head.forEach(function (h) { html += '<th>' + esc(h) + '</th>'; });
    html += '</tr></thead><tbody>';
    table.rows.forEach(function (r) {
      html += '<tr>'; r.forEach(function (c) { html += '<td>' + esc(c) + '</td>'; }); html += '</tr>';
    });
    return el(html + '</tbody></table>');
  }

  function mountChart(container, key) {
    if (!window.CHARTS || !window.CHARTS[key]) return;
    var div = el('<div class="chart-box" style="height:360px"></div>');
    container.appendChild(div);
    var chart = echarts.init(div);
    window.CHARTS[key](chart);
    window.addEventListener('resize', function () { chart.resize(); });
  }

  function mountDiagram(container, key) {
    if (!window.P5_DIAGRAMS || !window.P5_DIAGRAMS[key]) return;
    var names = { 'arch-basic': 'Kafka 基础架构', 'producer-flow': '生产者发送流程', 'partition-strategy': '分区策略', 'isr': 'ISR 副本同步与 ack', 'storage': '文件存储机制', 'consumer-group': '消费者组工作原理', 'kraft': 'KRaft 模式架构' };
    var box = el('<figure class="diagram-box"><div class="diagram-label"><b>🎨 ' + (names[key] || '架构图') + '</b><span>p5.js 交互绘制 · 可点击探索</span></div><div class="p5-container"></div></figure>');
    container.appendChild(box);
    window.P5_DIAGRAMS[key](box.querySelector('.p5-container'));
  }

  /* ---------- 课程总览页 ---------- */
  function renderOverview() {
    var cover = 'assets/img/Futuristic_dark_navy_blue_tech_2026-10-22T08-32-46.png';
    var content = document.getElementById('content');

    var hero = el('<section class="hero anim-in"><img src="' + cover + '" alt="Kafka课程封面"><div class="hero-overlay">' +
      '<div class="hero-tag"><span>尚硅谷</span><span>96 课时</span><span>结构化学习</span></div>' +
      '<h1>Apache <em>Kafka</em> 全链路学习站</h1>' +
      '<p>从消息队列基础到源码剖析：15 章 96 课时系统整理，配 p5.js 交互架构图、ECharts 数据图表与 IMA 知识库实战案例。</p></div></section>');
    content.appendChild(hero);

    var stats = el('<div class="overview-stats anim-in">' +
      '<div class="ov-stat"><b>' + ALL_LESSONS.length + '</b><span>总课时</span></div>' +
      '<div class="ov-stat"><b>' + CHAPTERS.length + '</b><span>章节</span></div>' +
      '<div class="ov-stat"><b>' + fmtDur(TOTAL_SEC) + '</b><span>课程总时长</span></div>' +
      '<div class="ov-stat"><b>7 + 6</b><span>p5 架构图 + ECharts 图表</span></div></div>');
    content.appendChild(stats);

    var t1 = el('<div class="section-title">📖 章节导览<small>点击卡片进入第一章</small></div>');
    content.appendChild(t1);
    var grid = el('<div class="chapter-grid anim-in"></div>');
    CHAPTERS.forEach(function (ch) {
      var dur = ch.lessons.reduce(function (s, l) { return s + parseDur(l.duration); }, 0);
      var card = el('<div class="chapter-card"><div class="cc-icon">' + ch.icon + '</div><h3>' + esc(ch.title) + '</h3>' +
        '<p>' + esc(ch.lessons[0].summary.slice(0, 46)) + '…</p>' +
        '<div class="cc-meta"><span><b>' + ch.lessons.length + '</b> 课时</span><span><b>' + fmtDur(dur) + '</b></span></div></div>');
      card.onclick = function () { location.hash = '#/lesson/' + ch.lessons[0].id; };
      grid.appendChild(card);
    });
    content.appendChild(grid);

    var t2 = el('<div class="section-title">📊 各章课时分布<small>数据来自课程原始目录</small></div>');
    content.appendChild(t2);
    var chartPanel = el('<div class="panel-box anim-in"><div class="chart-title">章节课时时长对比</div><div class="chart-desc">横轴为章节，纵轴为时长（分钟）；调优与源码章节体量最大，需重点投入。</div></div>');
    content.appendChild(chartPanel);
    mountChart(chartPanel, 'overview');

    var t3 = el('<div class="section-title">🧰 站点特性</div>');
    content.appendChild(t3);
    var feats = el('<div class="feature-grid anim-in">' +
      '<div class="feature-item"><div class="f-icon">🎨</div><h4>p5.js 交互架构图</h4><p>7 幅手绘代码级架构图：基础架构、生产者流程、分区策略、ISR 同步、文件存储、消费者组、KRaft，全部动画可交互。</p></div>' +
      '<div class="feature-item"><div class="f-icon">📈</div><h4>ECharts 数据图表</h4><p>MQ 选型雷达、调优前后吞吐对比、acks 权衡、分区分配移动量、压力测试曲线，用数据说话。</p></div>' +
      '<div class="feature-item"><div class="f-icon">📚</div><h4>IMA 知识库案例</h4><p>检索 IMA 知识库填充真实案例：消息队列七种场景、爱奇艺 AutoMQ 演进、零拷贝原理、酷狗音乐架构等。</p></div></div>');
    content.appendChild(feats);
  }

  /* ---------- 课时页 ---------- */
  function renderLesson(lesson) {
    var content = document.getElementById('content');
    var progress = getProgress();
    var done = !!progress[lesson.id];

    var head = el('<div class="lesson-head anim-in"><div class="lh-badges">' +
      '<span class="badge b-num">#' + lesson.id + '</span>' +
      '<span class="badge">' + lesson.chapterIcon + ' ' + esc(lesson.chapterTitle) + '</span>' +
      '<span class="badge b-dur">⏱ ' + lesson.duration + '</span>' +
      (done ? '<span class="badge" style="color:var(--green);border-color:rgba(52,211,153,.4)">✓ 已学完</span>' : '') +
      '</div><h1>' + esc(lesson.title) + '</h1><p class="lesson-summary">' + esc(lesson.summary) + '</p>' +
      '<div class="lesson-actions"><button class="btn ' + (done ? 'done' : 'primary') + '">' + (done ? '✓ 已学完（点击取消）' : '✓ 标记为已学完') + '</button></div></div>');
    head.querySelector('button').onclick = function () { renderLesson(lesson); renderSidebar(lesson.id); };
    content.appendChild(head);

    if (lesson.image) {
      var fig = el('<figure class="lesson-image anim-in" style="margin-bottom:24px"><img src="' + lesson.image + '" alt="配图"><figcaption>🎨 本章配图 · 本地生图引擎生成</figcaption></figure>');
      content.appendChild(fig);
    }
    if (lesson.points && lesson.points.length) {
      var pb = el('<div class="content-block anim-in"><h3 class="block-title">核心要点</h3></div>');
      var ul = el('<ul class="point-list"></ul>');
      lesson.points.forEach(function (p) { ul.appendChild(el('<li>' + esc(p) + '</li>')); });
      pb.appendChild(ul);
      content.appendChild(pb);
    }
    if (lesson.diagram) {
      var db = el('<div class="content-block anim-in"><h3 class="block-title">架构图解</h3></div>');
      content.appendChild(db);
      mountDiagram(db, lesson.diagram);
    }
    if (lesson.chart) {
      var cb = el('<div class="content-block anim-in"><h3 class="block-title">数据图表</h3></div>');
      content.appendChild(cb);
      mountChart(cb, lesson.chart);
    }
    if (lesson.table) {
      var tb = el('<div class="content-block anim-in"><h3 class="block-title">对比速查</h3></div>');
      tb.appendChild(dataTable(lesson.table));
      content.appendChild(tb);
    }
    if (lesson.code) {
      var kb = el('<div class="content-block anim-in"><h3 class="block-title">代码 / 命令</h3></div>');
      kb.appendChild(codeBlock(lesson.code));
      content.appendChild(kb);
    }
    if (lesson.cases && lesson.cases.length) {
      var cs = el('<div class="content-block anim-in"><h3 class="block-title">📚 IMA 知识库案例</h3></div>');
      lesson.cases.forEach(function (c) {
        cs.appendChild(el('<div class="case-card"><div class="case-icon">📄</div><div><h4>' + esc(c.title) + '</h4>' +
          '<div class="case-src">' + esc(c.source) + '</div><p>' + esc(c.desc) + '</p></div></div>'));
      });
      content.appendChild(cs);
    }

    // 上下课导航
    var idx = ALL_LESSONS.findIndex(function (l) { return l.id === lesson.id; });
    var nav = document.getElementById('lesson-nav');
    nav.innerHTML = '';
    var prev = ALL_LESSONS[idx - 1], next = ALL_LESSONS[idx + 1];
    if (prev) {
      var a = el('<a class="prev" href="#/lesson/' + prev.id + '"><span class="nav-label">← 上一课</span><span class="nav-title">' + esc(prev.title) + '</span></a>');
      nav.appendChild(a);
    } else { nav.appendChild(el('<a class="nav-placeholder"></a>')); }
    if (next) {
      var b = el('<a class="next" href="#/lesson/' + next.id + '"><span class="nav-label">下一课 →</span><span class="nav-title">' + esc(next.title) + '</span></a>');
      nav.appendChild(b);
    } else { nav.appendChild(el('<a class="nav-placeholder"></a>')); }
  }

  /* ---------- 路由 ---------- */
  function route() {
    var hash = location.hash || '#/';
    var content = document.getElementById('content');
    var nav = document.getElementById('lesson-nav');
    content.innerHTML = ''; nav.innerHTML = '';
    if (window.P5_INSTANCES) { window.P5_INSTANCES.forEach(function (p) { p.remove(); }); window.P5_INSTANCES = []; }
    window.scrollTo(0, 0);

    var m = hash.match(/^#\/lesson\/(\d+)$/);
    var lesson = m ? ALL_LESSONS.find(function (l) { return l.id === m[1]; }) : null;
    if (lesson) { renderSidebar(lesson.id); renderLesson(lesson); }
    else { renderSidebar(null); renderOverview(); }
    if (window.hljs) { document.querySelectorAll('pre code').forEach(function (b) { hljs.highlightElement(b); }); }
  }
  window.addEventListener('hashchange', route);
  route();
})();
