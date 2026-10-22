/* p5.js 架构图 3：分区策略 */
window.P5_DIAGRAMS['partition-strategy'] = function (container) {
  var sketch = function (p) {
    var W, H;
    p.setup = function () {
      W = container.clientWidth || 900; H = 420;
      var c = p.createCanvas(W, H); c.parent(container);
      p.textFont('-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif');
    };
    p.windowResized = function () { W = container.clientWidth || 900; p.resizeCanvas(W, H); };

    var strategies = [
      { name: '① 指定分区', desc: 'ProducerRecord 直接指定，优先级最高', keys: [0, 1, 2, 3], color: '#22d3ee' },
      { name: '② 有 Key 哈希', desc: 'murmur2(key) % 分区数，同 key 同分区', keys: [0, 1, 0, 1], color: '#38bdf8' },
      { name: '③ Sticky 粘性', desc: '2.4.1+ 默认：随机选分区灌满一个 batch', keys: [1, 1, 3, 3], color: '#a78bfa' },
      { name: '④ 自定义分区', desc: '实现 Partitioner，按业务字段路由', keys: [0, 2, 1, 3], color: '#fbbf24' }
    ];

    function arrow(x1, y1, x2, y2, col) {
      p.stroke(col); p.strokeWeight(1.4); p.line(x1, y1, x2, y2);
      var a = p.atan2(y2 - y1, x2 - x1);
      p.push(); p.translate(x2, y2); p.rotate(a); p.fill(col); p.noStroke();
      p.triangle(0, 0, -7, -3.5, -7, 3.5); p.pop();
    }

    p.draw = function () {
      p.background(10, 16, 31);
      var t = p.millis() / 1000;
      p.noStroke(); p.fill(148, 163, 184); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
      p.text('四种分区策略：同 4 条消息（A/B/C/D）在不同策略下落入不同分区', 14, 10);

      var rowH = 88, top = 52, partX = 640;
      // 分区列标题
      p.noStroke(); p.fill(148, 163, 184); p.textSize(11.5); p.textAlign(p.CENTER, p.CENTER);
      for (var q = 0; q < 4; q++) p.text('分区 ' + q, partX + 30 + q * 56, 44);

      strategies.forEach(function (s, si) {
        var y = top + si * rowH + 16;
        // 策略说明
        p.fill(19, 28, 49); p.stroke(s.color); p.strokeWeight(1.2);
        p.rect(30, y, 240, 56, 10);
        p.noStroke(); p.fill(226, 232, 240); p.textSize(12); p.textStyle(p.BOLD);
        p.textAlign(p.LEFT, p.CENTER); p.text(s.name, 42, y + 19);
        p.fill(148, 163, 184); p.textSize(10); p.textStyle(p.NORMAL);
        p.text(s.desc, 42, y + 37);

        // 消息包 → 分区
        var labels = ['A', 'B', 'C', 'D'];
        for (var m = 0; m < 4; m++) {
          var target = s.keys[m];
          var mx = 300 + m * 60, my = y + 28;
          var tx = partX + 30 + target * 56, ty = y + 28;
          arrow(mx + 14, my, tx - 20, ty, s.color);
          // 流动光点
          var ph = (t * 0.5 + si * 0.2 + m * 0.25) % 1;
          p.noStroke(); p.fill(s.color); p.drawingContext.shadowBlur = 8; p.drawingContext.shadowColor = s.color;
          p.circle(mx + 14 + (tx - 20 - mx - 14) * ph, my, 7); p.drawingContext.shadowBlur = 0;
          // 消息标签
          p.fill(226, 232, 240); p.textSize(11); p.textStyle(p.BOLD); p.textAlign(p.CENTER, p.CENTER);
          p.text(labels[m], mx, my);
          // 分区接收计数
          p.noStroke();
        }
        // 分区落点标记
        var counts = {};
        s.keys.forEach(function (k) { counts[k] = (counts[k] || 0) + 1; });
        for (var kk = 0; kk < 4; kk++) {
          var cx = partX + 30 + kk * 56;
          p.fill(19, 28, 49); p.stroke(counts[kk] ? s.color : '#24304f'); p.strokeWeight(1.2);
          p.circle(cx, y + 28, 30);
          p.noStroke(); p.fill(counts[kk] ? s.color : '#475569');
          p.textSize(12); p.textStyle(p.BOLD); p.textAlign(p.CENTER, p.CENTER);
          p.text(counts[kk] || '·', cx, y + 29);
        }
      });

      // 底部结论
      p.noStroke(); p.fill(251, 191, 36); p.textSize(11.5); p.textAlign(p.LEFT, p.CENTER);
      p.text('💡 有顺序要求的业务：固定 key → 永远落到同一分区 → 分区内 FIFO 有序', 30, top + 4 * rowH + 20);
    };
  };
  var inst = new p5(sketch);
  window.P5_INSTANCES.push(inst);
};
