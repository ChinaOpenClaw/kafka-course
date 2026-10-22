/* p5.js 架构图 2：生产者发送流程 */
window.P5_DIAGRAMS['producer-flow'] = function (container) {
  var sketch = function (p) {
    var W, H;
    p.setup = function () {
      W = container.clientWidth || 900; H = 400;
      var c = p.createCanvas(W, H); c.parent(container);
      p.textFont('-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif');
    };
    p.windowResized = function () { W = container.clientWidth || 900; p.resizeCanvas(W, H); };

    function stage(x, y, w, h, title, sub, col) {
      p.fill(19, 28, 49); p.stroke(col); p.strokeWeight(1.4); p.rect(x, y, w, h, 10);
      p.noStroke(); p.fill(226, 232, 240); p.textSize(12.5); p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER); p.text(title, x + w / 2, y + (sub ? 19 : h / 2));
      if (sub) { p.fill(148, 163, 184); p.textSize(10.5); p.textStyle(p.NORMAL); p.text(sub, x + w / 2, y + 37); }
    }
    function arrow(x1, y1, x2, y2) {
      p.stroke('#475569'); p.strokeWeight(1.5); p.line(x1, y1, x2, y2);
      var a = p.atan2(y2 - y1, x2 - x1);
      p.push(); p.translate(x2, y2); p.rotate(a); p.fill('#475569'); p.noStroke();
      p.triangle(0, 0, -8, -4, -8, 4); p.pop();
    }
    function packet(x, y, col) {
      p.noStroke(); p.fill(col); p.drawingContext.shadowBlur = 10; p.drawingContext.shadowColor = col;
      p.circle(x, y, 8); p.drawingContext.shadowBlur = 0;
    }

    p.draw = function () {
      p.background(10, 16, 31);
      var t = p.millis() / 1000;
      p.noStroke(); p.fill(148, 163, 184); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
      p.text('生产者双线程架构：main 线程入缓冲 → Sender 线程批量发送', 14, 10);

      // 上排：main 线程流水线
      var y1 = 70, h = 74;
      var xs = [40, 190, 340, 490];
      var titles = [['① 拦截器', 'Interceptor'], ['② 序列化', 'Serializer'], ['③ 分区器', 'Partitioner'], ['④ 累加器', 'RecordAccumulator']];
      var cols = ['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa'];
      for (var i = 0; i < 4; i++) {
        stage(xs[i], y1, 130, h, titles[i][0], titles[i][1], cols[i]);
        if (i < 3) arrow(xs[i] + 130, y1 + h / 2, xs[i + 1], y1 + h / 2);
      }

      // 线程标注
      p.noStroke(); p.fill(34, 211, 238, 25); p.rect(20, 52, 620, 108, 12);
      p.fill(34, 211, 238); p.textSize(11); p.textAlign(p.LEFT, p.CENTER);
      p.text('main 线程（同步链路）', 28, 66);

      // 累加器分区桶可视化
      p.fill(19, 28, 49); p.stroke('#a78bfa'); p.strokeWeight(1.4);
      p.rect(490, y1 + h + 26, 130, 60, 10);
      p.noStroke(); p.fill(226, 232, 240); p.textSize(11); p.textAlign(p.CENTER, p.CENTER);
      p.text('Topic-Partition 队列', 555, y1 + h + 42);
      for (var b = 0; b < 3; b++) {
        p.fill(34, 211, 238, 120 + b * 30); p.noStroke();
        p.rect(502 + b * 38, y1 + h + 54, 26, 6 + b * 4, 3);
      }
      arrow(555, y1 + h, 555, y1 + h + 26);

      // 下排：Sender 线程
      p.fill(167, 139, 250, 22); p.rect(20, y1 + h + 100, 620, 96, 12);
      p.fill(167, 139, 250); p.textSize(11); p.textAlign(p.LEFT, p.CENTER);
      p.text('Sender 线程（异步批量）', 28, y1 + h + 114);
      stage(40, y1 + h + 124, 150, 58, '⑤ 批量拉取', 'drain batches', '#a78bfa');
      stage(220, y1 + h + 124, 150, 58, '⑥ 按 Leader 分组', 'ProduceRequest', '#a78bfa');
      stage(400, y1 + h + 124, 150, 58, '⑦ 发送 Broker', '等待 ack 确认', '#a78bfa');
      arrow(190, y1 + h + 153, 220, y1 + h + 153);
      arrow(370, y1 + h + 153, 400, y1 + h + 153);
      arrow(555, y1 + h + 86, 555, y1 + h + 124);

      // 动画：main 线程消息包
      for (var m = 0; m < 4; m++) {
        var ph = (t * 0.6 + m * 0.25) % 1;
        var sx = xs[m] + 130, sy = y1 + h / 2;
        if (m < 3) packet(sx + 60 * ph, sy, cols[m]);
      }
      // 动画：Sender 拉取与发送
      var ph2 = (t * 0.5) % 1;
      packet(40 + 180 * ph2, y1 + h + 153, '#22d3ee');
      var ph3 = (t * 0.4 + 0.5) % 1;
      packet(370 + 180 * ph3, y1 + h + 153, '#fbbf24');

      // ack 回流标注
      p.noStroke(); p.fill(251, 191, 36); p.textSize(10.5); p.textAlign(p.CENTER, p.CENTER);
      p.text('← ack 确认 / 元数据更新', 560, y1 + h + 158);
    };
  };
  var inst = new p5(sketch);
  window.P5_INSTANCES.push(inst);
};
