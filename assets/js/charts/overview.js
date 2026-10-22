/* ECharts：总览页 - 各章课时分布 */
window.CHARTS = window.CHARTS || {};
window.CHARTS['overview'] = function (chart) {
  function parseDur(d) { var m = d.split(':'); return (+m[0]) + (+m[1]) / 60; }
  var names = [], vals = [], counts = [];
  (window.CHAPTERS || []).forEach(function (ch) {
    var dur = ch.lessons.reduce(function (s, l) { return s + parseDur(l.duration); }, 0);
    names.push(ch.title.length > 10 ? ch.title.slice(0, 9) + '…' : ch.title);
    vals.push(Math.round(dur));
    counts.push(ch.lessons.length);
  });
  chart.setOption({
    grid: { left: 8, right: 30, top: 36, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: '#1a2540', borderColor: '#24304f', textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: function (ps) {
        var p = ps[0];
        return p.name + '<br/>时长：<b style="color:#22d3ee">' + p.value + '</b> 分钟<br/>课时：' + counts[p.dataIndex] + ' 节';
      }
    },
    xAxis: {
      type: 'category', data: names,
      axisLabel: { color: '#94a3b8', fontSize: 10, interval: 0, rotate: names.length > 8 ? 38 : 0 },
      axisLine: { lineStyle: { color: '#24304f' } }, axisTick: { show: false }
    },
    yAxis: {
      type: 'value', name: '分钟', nameTextStyle: { color: '#64748b' },
      axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(36,48,79,0.6)' } }
    },
    series: [{
      type: 'bar', data: vals, barWidth: '52%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#22d3ee' }, { offset: 1, color: '#0e7490' }]
        }
      },
      label: { show: true, position: 'top', color: '#94a3b8', fontSize: 10, formatter: '{c}' },
      emphasis: { itemStyle: { color: '#67e8f9' } }
    }]
  });
};
