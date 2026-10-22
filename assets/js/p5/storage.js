/* p5.js 架构图 5：文件存储机制（Segment 与稀疏索引） */
window.P5_DIAGRAMS['storage'] = function (container) {
  var sketch = function (p) {
    var W, H;
    p.setup = function () {
      W = container.clientWidth || 900; H = 420;
      var c = p.createCanvas(W, H); c.parent(container);
      p.textFont('-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif');
    };
    p.windowResized = function () { W = container.clientWidth || 900; p.resizeCanvas(W, H); };

    function tree(x, y, w, h, label, sub, col, active) {
      p.fill(active ? 'rgba(34,211,238,0.12)' : 19, 28, 49);
      if (active) { p.fill(19, 38, 56); }
      p.stroke(col); p.strokeWeight(active ? 2 : 1.3); p.rect(x, y, w, h, 9);
      p.noStroke(); p.fill(active ? '#22d3ee' : 226, 232, 240); p.textSize(12); p.textStyle(p.BOLD);
      p.textAlign(p.LEFT, p.CENTER); p.text(label, x + 10, y + h / 2 - (sub ? 8 : 0));
      if (sub) { p.fill(148, 163, 184); p.textSize(10); p.textStyle(p.NORMAL); p.text(sub, x + 10, y + h / 2 + 10); }
    }
    function link(x1, y1, x2, y2) {
      p.stroke('#334155'); p.strokeWeight(1.2); p.line(x1, y1, x2, y2);
    }
    function packet(x, y, col) {
      p.noStroke(); p.fill(col); p.drawingContext.shadowBlur = 10; p.drawingContext.shadowColor = col;
      p.circle(x, y, 8); p.drawingContext.shadowBlur = 0;
    }

    p.draw = function () {
      p.background(10, 16, 31);
      var t = p.millis() / 1000;
      p.noStroke(); p.fill(148, 163, 184); p.textSize(12); p.textAlign(p.LEFT, p.TOP);
      p.text('Partition 物理存储：Segment 文件组 + 稀疏索引 + 二分查找', 14, 10);

      // 层级树：Topic → Partition → Segments
      tree(30, 56, 170, 56, 'Topic', '逻辑概念', '#22d3ee');
      tree(30, 140, 170, 56, 'Partition-0', '物理目录', '#22d3ee');
      link(115, 112, 115, 140);

      var segs = [
        { name: '000000.log', sub: 'segment 3 · 写入中', active: true, x: 240, y: 52 },
        { name: '000102.index', sub: '偏移量索引', active: false, x: 240, y: 124 },
        { name: '000102.timeindex', sub: '时间戳索引', active: false, x: 240, y: 196 },
        { name: '000051.log', sub: 'segment 2 · 滚动', active: false, x: 240, y: 268 },
        { name: '000000.log', sub: 'segment 1 · 过期', active: false, x: 240, y: 340 }
      ];
      segs.forEach(function (s, i) {
        tree(s.x, s.y, 230, 56, s.name, s.sub, s.active ? '#22d3ee' : '#475569', s.active);
        link(200, 168, s.x, s.y + 28);
      });

      // 稀疏索引示意
      p.fill(19, 28, 49); p.stroke('#a78bfa'); p.strokeWeight(1.3);
      p.rect(520, 52, 340, 130, 10);
      p.noStroke(); p.fill('#a78bfa'); p.textSize(12.5); p.textStyle(p.BOLD); p.textAlign(p.LEFT, p.CENTER);
      p.text('稀疏索引（.index）', 534, 70);
      p.fill(148, 163, 184); p.textSize(10.5); p.textStyle(p.NORMAL);
      p.text('每 4KB 数据建一条索引，而非每条消息', 534, 88);
      // 索引点
      var idxPts = [[560, 150], [620, 132], [680, 150], [740, 118], [800, 150]];
      idxPts.forEach(function (pt, i) {
        p.stroke('#a78bfa'); p.strokeWeight(1.2); p.line(pt[0], pt[1], pt[0], 160);
        p.noStroke(); p.fill('#a78bfa'); p.circle(pt[0], pt[1], 6);
        p.fill(148, 163, 184); p.textSize(9); p.textAlign(p.CENTER, p.CENTER);
        p.text('o=' + (i * 1000), pt[0], pt[1] - 12);
      });
      // 查找动画光点
      var ph = (t * 0.4) % 1;
      packet(540 + 300 * ph, 155, '#22d3ee', 7);

      // 二分查找流程
      p.fill(19, 28, 49); p.stroke('#38bdf8'); p.strokeWeight(1.3);
      p.rect(520, 200, 340, 110, 10);
      p.noStroke(); p.fill('#38bdf8'); p.textSize(12.5); p.textStyle(p.BOLD); p.textAlign(p.LEFT, p.CENTER);
      p.text('查找流程（以 offset=1234 为例）', 534, 220);
      var steps = ['① 二分定位 segment 文件', '② 二分定位索引条目', '③ 顺序扫描定位消息'];
      steps.forEach(function (s, i) {
        var glow = p.sin(t * 2 - i * 0.8) > 0;
        p.noStroke(); p.fill(glow ? '#22d3ee' : 148, 163, 184); p.textSize(11.5); p.textStyle(p.NORMAL);
        p.textAlign(p.LEFT, p.CENTER); p.text(s, 540, 244 + i * 22);
      });

      // 滚动条件
      p.fill(19, 28, 49); p.stroke('#fbbf24'); p.strokeWeight(1.2);
      p.rect(520, 328, 340, 66, 10);
      p.noStroke(); p.fill('#fbbf24'); p.textSize(12); p.textStyle(p.BOLD); p.textAlign(p.LEFT, p.CENTER);
      p.text('Segment 滚动条件', 534, 346);
      p.fill(148, 163, 184); p.textSize(10.5); p.textStyle(p.NORMAL);
      p.text('log.segment.bytes = 1GB（默认）或 log.roll.ms / hours 到期', 534, 368);
      p.text('active segment 永不删除，避免清空正在写的文件', 534, 384);
    };
  };
  var inst = new p5(sketch);
  window.P5_INSTANCES.push(inst);
};
