/* p5.js 架构图 6：消费者组工作原理 */
window.P5_DIAGRAMS['consumer-group'] = function (container) {
  var sketch = function (p) {
    var W, H;
    p.setup = function () {
      W = container.clientWidth || 900; H = 420;
      var c = p.createCanvas(W, H); c.parent(container);
      p.textFont('-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif');
    };
    p.windowResized = function () { W = container.clientWidth || 900; p.resizeCanvas(W, H); };

    function arrow(x1, y1, x2, y2, col, dashed) {
      p.stroke(col); p.strokeWeight(1.5);
      if (dashed) p.drawingContext.setLineDash([5, 5]);
      p.line(x1, y1, x2, y2); p.drawingContext.setLineDash([]);
      var a = p.atan2(y2 - y1, x2 - x1);
      p.push(); p.translate(x2, y2); p.rotate(a); p.fill(col); p.noStroke();
      p.triangle(0, 0, -9, -4.5, -9, 4.5); p.pop();
    }
    function packet(x, y, col) {
      p.noStroke(); p.fill(col); p.drawingContext.shadowBlur = 12; p.drawingContext.shadowColor = col;
      p.circle(x, y, 8); p.drawingContext.shadowBlur = 0;
    }

    p.draw = function () {
      p.background(10, 16, 31);
      var t = p.millis() / 1000;
      p.noStroke(); p.fill(148, 163, 184); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
      p.text('消费者组：组内分区独占分配，rebalance 时触发重分配', 14, 10);

      // Topic 4 分区（左侧）
      p.fill(19, 28, 49); p.stroke('#22d3ee'); p.strokeWeight(1.3);
      p.rect(30, 56, 130, 300, 12);
      p.noStroke(); p.fill('#22d3ee'); p.textSize(12.5); p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER); p.text('Topic-A', 95, 76);
      p.textSize(10); p.textStyle(p.NORMAL); p.fill(148, 163, 184); p.text('4 个分区', 95, 92);
      var partY = [120, 180, 240, 300];
      var assign = [0, 1, 2, 3]; // 分区 i → 消费者 assign[i]
      partY.forEach(function (y, i) {
        p.fill(30, 41, 59); p.stroke('#38bdf8'); p.strokeWeight(1.2);
        p.rect(46, y - 18, 98, 36, 8);
        p.noStroke(); p.fill(226, 232, 240); p.textSize(11); p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER); p.text('分区 ' + i, 95, y);
        // 分区内消息小点
        for (var d = 0; d < 3; d++) {
          p.fill(34, 211, 238, 150); p.circle(56 + d * 10, y + 10, 3);
        }
      });

      // 消费者组容器（右侧）
      p.noFill(); p.stroke('#a78bfa'); p.strokeWeight(1.3); p.drawingContext.setLineDash([7, 7]);
      p.rect(300, 66, 560, 280, 14); p.drawingContext.setLineDash([]);
      p.noStroke(); p.fill('#a78bfa'); p.textSize(12.5); p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.CENTER); p.text('Consumer Group（4 个消费者）', 314, 58);

      var consY = [110, 180, 250, 320];
      var consCols = ['#22d3ee', '#38bdf8', '#a78bfa', '#fbbf24'];
      var consNames = ['C1', 'C2', 'C3', 'C4'];
      consY.forEach(function (y, i) {
        p.fill(19, 28, 49); p.stroke(consCols[i]); p.strokeWeight(1.5);
        p.rect(460, y - 26, 150, 52, 10);
        p.noStroke(); p.fill(226, 232, 240); p.textSize(12.5); p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER); p.text('Consumer ' + consNames[i], 535, y - 6);
        p.fill(148, 163, 184); p.textSize(10); p.textStyle(p.NORMAL);
        var mine = [];
        partY.forEach(function (_, pi) { if (assign[pi] === i) mine.push('分区 ' + pi); });
        p.text(mine.join(' + '), 535, y + 12);
      });

      // 分配连线（分区 → 消费者）
      partY.forEach(function (y, i) {
        var ci = assign[i];
        var cy = consY[ci];
        arrow(144, y, 460, cy, consCols[ci], true);
        // 消息流动光点
        var ph = (t * 0.4 + i * 0.25) % 1;
        packet(144 + (460 - 144) * ph, y + (cy - y) * ph, consCols[ci], 7);
      });

      // 右侧说明面板
      var notes = [
        { t: '分配规则', d: '一个分区只能被组内一个消费者消费', c: '#22d3ee' },
        { t: '并行度上限', d: '有效消费者数 ≤ 分区数', c: '#38bdf8' },
        { t: 'rebalance 触发', d: '成员增减 / 分区变更 / 心跳超时', c: '#a78bfa' },
        { t: '组间隔离', d: '不同 group 各自消费全部消息', c: '#fbbf24' }
      ];
      notes.forEach(function (n, i) {
        var x = 690, y = 84 + i * 62;
        p.fill(19, 28, 49); p.stroke(n.c); p.strokeWeight(1.2); p.rect(x, y, 180, 52, 10);
        p.noStroke(); p.fill(n.c); p.textSize(11.5); p.textStyle(p.BOLD); p.textAlign(p.LEFT, p.CENTER);
        p.text(n.t, x + 12, y + 17);
        p.fill(148, 163, 184); p.textSize(9.5); p.textStyle(p.NORMAL);
        p.text(n.d, x + 12, y + 35);
      });
    };
  };
  var inst = new p5(sketch);
  window.P5_INSTANCES.push(inst);
};
