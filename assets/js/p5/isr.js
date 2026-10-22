/* p5.js 架构图 4：ISR 副本同步与 ack 机制 */
window.P5_DIAGRAMS['isr'] = function (container) {
  var sketch = function (p) {
    var W, H;
    p.setup = function () {
      W = container.clientWidth || 900; H = 420;
      var c = p.createCanvas(W, H); c.parent(container);
      p.textFont('-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif');
    };
    p.windowResized = function () { W = container.clientWidth || 900; p.resizeCanvas(W, H); };

    function node(x, y, w, h, title, sub, col, fill) {
      p.fill(fill || 19, 28, 49); p.stroke(col); p.strokeWeight(1.6); p.rect(x, y, w, h, 10);
      p.noStroke(); p.fill(226, 232, 240); p.textSize(13); p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER); p.text(title, x + w / 2, y + (sub ? 20 : h / 2));
      if (sub) { p.fill(148, 163, 184); p.textSize(10.5); p.textStyle(p.NORMAL); p.text(sub, x + w / 2, y + 39); }
    }
    function arrow(x1, y1, x2, y2, col, dashed) {
      p.stroke(col); p.strokeWeight(1.4);
      if (dashed) p.drawingContext.setLineDash([5, 5]);
      p.line(x1, y1, x2, y2);
      p.drawingContext.setLineDash([]);
      var a = p.atan2(y2 - y1, x2 - x1);
      p.push(); p.translate(x2, y2); p.rotate(a); p.fill(col); p.noStroke();
      p.triangle(0, 0, -8, -4, -8, 4); p.pop();
    }
    function packet(x, y, col, r) {
      p.noStroke(); p.fill(col); p.drawingContext.shadowBlur = 12; p.drawingContext.shadowColor = col;
      p.circle(x, y, r || 9); p.drawingContext.shadowBlur = 0;
    }

    p.draw = function () {
      p.background(10, 16, 31);
      var t = p.millis() / 1000;
      p.noStroke(); p.fill(148, 163, 184); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
      p.text('ISR 同步副本集合：Leader 读写入口，Follower 拉取同步，ack=all 需 ISR 全部确认', 14, 10);

      // Producer
      node(30, 170, 130, 70, 'Producer', 'acks=all', '#22d3ee');

      // ISR 容器
      p.noFill(); p.stroke('#a78bfa'); p.strokeWeight(1.3);
      p.drawingContext.setLineDash([7, 7]);
      p.rect(230, 60, 420, 250, 14); p.drawingContext.setLineDash([]);
      p.noStroke(); p.fill('#a78bfa'); p.textSize(12); p.textAlign(p.LEFT, p.CENTER);
      p.text('ISR（In-Sync Replicas 同步副本集合）', 240, 50);

      // Leader + Followers
      node(260, 120, 160, 90, 'Leader', '分区主副本 · 读写', '#fbbf24', 30, 24, 12);
      node(470, 90, 160, 70, 'Follower 1', '同步中 ✓', '#a78bfa');
      node(470, 200, 160, 70, 'Follower 2', '同步中 ✓', '#a78bfa');

      // OSR（滞后副本）
      node(470, 300, 160, 60, 'Follower 3', '滞后 → OSR ✗', '#64748b');

      // HW 水位线
      p.stroke('#f87171'); p.strokeWeight(1.6); p.drawingContext.setLineDash([3, 4]);
      p.line(300, 120, 300, 210); p.drawingContext.setLineDash([]);
      p.noStroke(); p.fill('#f87171'); p.textSize(10.5); p.textAlign(p.CENTER, p.CENTER);
      p.text('HW 高水位', 300, 222);
      p.stroke('#34d399'); p.strokeWeight(1.6);
      p.line(340, 120, 340, 225); p.noStroke(); p.fill('#34d399');
      p.text('LEO 末端', 340, 237);

      // 静态箭头
      arrow(160, 205, 260, 165, '#22d3ee');
      arrow(420, 150, 470, 125, '#a78bfa', true);
      arrow(420, 180, 470, 235, '#a78bfa', true);
      arrow(470, 160, 420, 130, '#38bdf8');   // fetch 请求
      arrow(470, 235, 420, 200, '#38bdf8');

      // 动画：写请求
      var ph1 = (t * 0.5) % 1;
      packet(160 + 100 * ph1, 205 - 40 * ph1, '#22d3ee');
      // 动画：follower fetch
      var ph2 = (t * 0.45 + 0.3) % 1;
      packet(420 - 50 * ph2, 130 + 25 * ph2, '#38bdf8', 7);
      // 动画：ack 回流
      var ph3 = (t * 0.55 + 0.6) % 1;
      packet(260 + (160 - 260) * ph3, 165 + (205 - 165) * ph3, '#fbbf24', 7);

      // ack 三级别面板
      var acks = [
        { v: 'acks=0', d: '不等确认 · 最高吞吐', c: '#64748b', tps: '★★★★★', safe: '★' },
        { v: 'acks=1', d: 'Leader 落盘即确认', c: '#fbbf24', tps: '★★★☆', safe: '★★★' },
        { v: 'acks=all', d: 'ISR 全部同步才确认', c: '#34d399', tps: '★★☆', safe: '★★★★★' }
      ];
      acks.forEach(function (a, i) {
        var x = 690, y = 80 + i * 96;
        p.fill(19, 28, 49); p.stroke(a.c); p.strokeWeight(1.2); p.rect(x, y, 180, 80, 10);
        p.noStroke(); p.fill(a.c); p.textSize(13); p.textStyle(p.BOLD); p.textAlign(p.LEFT, p.CENTER);
        p.text(a.v, x + 12, y + 20);
        p.fill(148, 163, 184); p.textSize(10); p.textStyle(p.NORMAL);
        p.text(a.d, x + 12, y + 38);
        p.textSize(10); p.textAlign(p.RIGHT, p.CENTER);
        p.fill(34, 211, 238); p.text('吞吐 ' + a.tps, x + 168, y + 58);
        p.fill(52, 211, 153); p.text('可靠 ' + a.safe, x + 168, y + 72);
      });
    };
  };
  var inst = new p5(sketch);
  window.P5_INSTANCES.push(inst);
};
