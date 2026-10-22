/* p5.js 架构图 7：KRaft 模式架构 */
window.P5_DIAGRAMS['kraft'] = function (container) {
  var sketch = function (p) {
    var W, H;
    p.setup = function () {
      W = container.clientWidth || 900; H = 420;
      var c = p.createCanvas(W, H); c.parent(container);
      p.textFont('-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif');
    };
    p.windowResized = function () { W = container.clientWidth || 900; p.resizeCanvas(W, H); };

    function node(x, y, w, h, title, sub, col, fill) {
      p.fill(fill || 19, 28, 49); p.stroke(col); p.strokeWeight(1.5); p.rect(x, y, w, h, 10);
      p.noStroke(); p.fill(226, 232, 240); p.textSize(12.5); p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER); p.text(title, x + w / 2, y + (sub ? 19 : h / 2));
      if (sub) { p.fill(148, 163, 184); p.textSize(10); p.textStyle(p.NORMAL); p.text(sub, x + w / 2, y + 38); }
    }
    function arrow(x1, y1, x2, y2, col, dashed) {
      p.stroke(col); p.strokeWeight(1.4);
      if (dashed) p.drawingContext.setLineDash([5, 5]);
      p.line(x1, y1, x2, y2); p.drawingContext.setLineDash([]);
      var a = p.atan2(y2 - y1, x2 - x1);
      p.push(); p.translate(x2, y2); p.rotate(a); p.fill(col); p.noStroke();
      p.triangle(0, 0, -8, -4, -8, 4); p.pop();
    }
    function packet(x, y, col) {
      p.noStroke(); p.fill(col); p.drawingContext.shadowBlur = 12; p.drawingContext.shadowColor = col;
      p.circle(x, y, 8); p.drawingContext.shadowBlur = 0;
    }

    p.draw = function () {
      p.background(10, 16, 31);
      var t = p.millis() / 1000;
      p.noStroke(); p.fill(148, 163, 184); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
      p.text('KRaft：Controller 集群通过 Raft 协议复制元数据日志，替代 ZooKeeper', 14, 10);

      // Controller Quorum（上）
      p.noFill(); p.stroke('#a78bfa'); p.strokeWeight(1.3); p.drawingContext.setLineDash([7, 7]);
      p.rect(60, 50, 780, 118, 14); p.drawingContext.setLineDash([]);
      p.noStroke(); p.fill('#a78bfa'); p.textSize(12.5); p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.CENTER); p.text('Controller Quorum（Raft 共识组，奇数节点）', 74, 42);

      node(90, 70, 200, 78, 'Controller 1', 'Leader · 活跃', '#fbbf24', 30, 24, 12);
      node(350, 70, 200, 78, 'Controller 2', 'Follower', '#a78bfa');
      node(610, 70, 200, 78, 'Controller 3', 'Follower', '#a78bfa');

      // Raft 日志复制动画
      arrow(290, 100, 350, 100, '#fbbf24');
      arrow(290, 118, 350, 118, '#fbbf24');
      arrow(550, 100, 610, 100, '#fbbf24');
      arrow(550, 118, 610, 118, '#fbbf24');
      var ph1 = (t * 0.5) % 1;
      packet(290 + 60 * ph1, 100, '#fbbf24', 7);
      var ph2 = (t * 0.5 + 0.5) % 1;
      packet(550 + 60 * ph2, 118, '#a78bfa', 7);

      // 元数据主题（中）
      p.fill(19, 28, 49); p.stroke('#22d3ee'); p.strokeWeight(1.5);
      p.rect(190, 200, 520, 62, 12);
      p.noStroke(); p.fill('#22d3ee'); p.textSize(13); p.textStyle(p.BOLD);
      p.textAlign(p.CENTER, p.CENTER); p.text('__cluster_metadata 元数据主题（Raft 日志）', 450, 224);
      p.fill(148, 163, 184); p.textSize(10.5); p.textStyle(p.NORMAL);
      p.text('Topic / 分区 / 副本 / Broker 注册 / 配置变更全部由此日志驱动', 450, 244);
      // 日志条目
      for (var i = 0; i < 8; i++) {
        var glow = (p.millis() / 200) % 8 | 0;
        p.fill(i === glow ? 'rgba(34,211,238,0.35)' : 'rgba(34,211,238,0.08)');
        p.noStroke(); p.rect(210 + i * 60, 288, 48, 16, 4);
        p.fill(34, 211, 238); p.textSize(9); p.textAlign(p.CENTER, p.CENTER);
        p.text('rec ' + (i + 1), 234 + i * 60, 296);
      }
      arrow(450, 148, 450, 200, '#22d3ee');

      // Broker 层（下）
      p.noFill(); p.stroke('#38bdf8'); p.strokeWeight(1.2); p.drawingContext.setLineDash([6, 6]);
      p.rect(60, 318, 780, 84, 12); p.drawingContext.setLineDash([]);
      p.noStroke(); p.fill('#38bdf8'); p.textSize(11.5); p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.CENTER); p.text('Broker 集群（从 Controller 获取元数据，通过 Metadata RPC 保持同步）', 74, 310);
      node(90, 334, 190, 56, 'Broker 0', '数据面', '#38bdf8');
      node(320, 334, 190, 56, 'Broker 1', '数据面', '#38bdf8');
      node(550, 334, 190, 56, 'Broker 2', '数据面', '#38bdf8');
      // 元数据同步虚线
      arrow(450, 262, 450, 320, '#22d3ee', true);
      [185, 415, 645].forEach(function (bx, i) {
        var ph = (t * 0.4 + i * 0.3) % 1;
        packet(450 + (bx - 450) * ph, 262 + 58 * ph, '#22d3ee', 6);
      });

      // 右侧对比说明
      var notes = [
        { t: 'vs ZK 模式', d: '移除 ZK，一套系统运维', c: '#a78bfa' },
        { t: '秒级切换', d: 'Raft 选举替代会话等待', c: '#fbbf24' },
        { t: '百万分区', d: '元数据规模不再受限', c: '#22d3ee' }
      ];
      notes.forEach(function (n, i) {
        var x = 700, y = 176 + i * 40;
        p.fill(19, 28, 49); p.stroke(n.c); p.strokeWeight(1.1); p.rect(x, y, 170, 34, 8);
        p.noStroke(); p.fill(n.c); p.textSize(10.5); p.textStyle(p.BOLD); p.textAlign(p.LEFT, p.CENTER);
        p.text(n.t, x + 10, y + 17);
        p.fill(148, 163, 184); p.textSize(9); p.textStyle(p.NORMAL);
        p.text(n.d, x + 82, y + 17);
      });
    };
  };
  var inst = new p5(sketch);
  window.P5_INSTANCES.push(inst);
};
