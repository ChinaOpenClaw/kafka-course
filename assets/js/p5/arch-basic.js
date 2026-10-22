/* p5.js 架构图 1：Kafka 基础架构 */
window.P5_DIAGRAMS = window.P5_DIAGRAMS || {};
window.P5_INSTANCES = window.P5_INSTANCES || [];
window.P5_DIAGRAMS['arch-basic'] = function (container) {
  var sketch = function (p) {
    var W, H;
    p.setup = function () {
      W = container.clientWidth || 900; H = 430;
      var c = p.createCanvas(W, H); c.parent(container);
      p.textFont('-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif');
      p.frameRate(30);
    };
    p.windowResized = function () { W = container.clientWidth || 900; p.resizeCanvas(W, H); };

    function box(x, y, w, h, title, sub, col) {
      p.fill(19, 28, 49); p.stroke(col || '#38bdf8'); p.strokeWeight(1.4);
      p.rect(x, y, w, h, 10);
      p.noStroke(); p.fill(226, 232, 240);
      p.textSize(13); p.textStyle(p.BOLD); p.textAlign(p.CENTER, p.CENTER);
      p.text(title, x + w / 2, y + h / 2 - (sub ? 9 : 0));
      if (sub) { p.fill(148, 163, 184); p.textSize(11); p.textStyle(p.NORMAL); p.text(sub, x + w / 2, y + h / 2 + 12); }
    }
    function arrow(x1, y1, x2, y2, col) {
      p.stroke(col || '#475569'); p.strokeWeight(1.6); p.noFill();
      p.line(x1, y1, x2, y2);
      var a = p.atan2(y2 - y1, x2 - x1);
      p.push(); p.translate(x2, y2); p.rotate(a);
      p.fill(col || '#475569'); p.noStroke();
      p.triangle(0, 0, -9, -4.5, -9, 4.5); p.pop();
    }
    function packet(x, y, r, col) {
      p.noStroke(); p.fill(col || '#22d3ee');
      p.drawingContext.shadowBlur = 12; p.drawingContext.shadowColor = col || '#22d3ee';
      p.circle(x, y, r || 9); p.drawingContext.shadowBlur = 0;
    }
    function dashedRect(x, y, w, h, label, col) {
      p.noFill(); p.stroke(col || '#a78bfa'); p.strokeWeight(1.2);
      p.drawingContext.setLineDash([6, 6]);
      p.rect(x, y, w, h, 12); p.drawingContext.setLineDash([]);
      p.noStroke(); p.fill(col || '#a78bfa'); p.textSize(12); p.textAlign(p.LEFT, p.CENTER);
      p.text(label, x + 6, y - 8);
    }

    p.draw = function () {
      p.background(10, 16, 31);
      var t = p.millis() / 1000;

      // 标题
      p.noStroke(); p.fill(148, 163, 184); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
      p.text('Kafka 基础架构：Producer → Broker 集群 → Consumer，ZK 负责集群协调', 14, 10);

      // 中间 Broker 集群容器
      dashedRect(300, 44, 250, 300, 'Topic-A · 4 分区（跨 Broker 分布）', '#22d3ee');
      box(316, 66, 218, 74, 'Broker 0', '分区 0 / 分区 1');
      box(316, 158, 218, 74, 'Broker 1', '分区 2 / 分区 3');
      box(316, 250, 218, 74, 'Broker 2', '副本 + 元数据');

      // 生产者
      box(40, 158, 130, 74, 'Producer', '消息生产者');

      // 消费者组
      dashedRect(600, 92, 230, 210, 'Consumer Group 消费者组', '#a78bfa');
      box(618, 116, 194, 48, 'Consumer 1', '消费 分区 0');
      box(618, 176, 194, 48, 'Consumer 2', '消费 分区 1 / 2');
      box(618, 236, 194, 48, 'Consumer 3', '消费 分区 3');

      // ZK
      box(330, 372, 190, 44, 'ZooKeeper', '注册 / 元数据 / Controller');

      // 静态连线
      arrow(170, 195, 316, 103, '#22d3ee');           // producer -> broker0
      arrow(170, 195, 316, 195, '#22d3ee');           // producer -> broker1
      arrow(170, 195, 316, 287, '#22d3ee');           // producer -> broker2
      arrow(534, 103, 618, 140, '#a78bfa');           // broker0 -> c1
      arrow(534, 195, 618, 200, '#a78bfa');           // broker1 -> c2
      arrow(534, 195, 618, 260, '#a78bfa');           // broker1 -> c2 (2nd)
      arrow(534, 287, 618, 260, '#a78bfa');           // broker2 -> c3
      p.stroke('#475569'); p.strokeWeight(1.4);
      p.line(316, 324, 380, 372); p.line(534, 324, 470, 372);

      // 动画：生产消息包 producer→broker
      for (var i = 0; i < 3; i++) {
        var ph = (t * 0.35 + i * 0.33) % 1;
        var x1 = 170, y1 = 195, x2 = [316, 316, 316][i], y2 = [103, 195, 287][i];
        packet(x1 + (x2 - x1) * ph, y1 + (y2 - y1) * ph, 8, '#22d3ee');
      }
      // 动画：消费消息包 broker→consumer
      var dests = [[534, 103, 618, 140], [534, 195, 618, 200], [534, 287, 618, 260]];
      for (var j = 0; j < 3; j++) {
        var ph2 = (t * 0.3 + 0.4 + j * 0.3) % 1;
        packet(dests[j][0] + (dests[j][2] - dests[j][0]) * ph2,
               dests[j][1] + (dests[j][3] - dests[j][1]) * ph2, 7, '#a78bfa');
      }
      // 动画：ZK 心跳脉冲
      var pulse = 3 + p.sin(t * 3) * 2;
      p.noFill(); p.stroke(34, 211, 238, 160); p.strokeWeight(pulse * 0.4);
      p.arc(425, 394, 40 + p.sin(t * 3) * 8, 20 + p.sin(t * 3) * 4, p.PI, p.TWO_PI);
    };
  };
  var inst = new p5(sketch);
  window.P5_INSTANCES.push(inst);
};
