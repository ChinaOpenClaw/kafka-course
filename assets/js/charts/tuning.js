/* ECharts：生产者吞吐量调优阶梯（课时 17 / 77） */
window.CHARTS['tuning'] = function (chart) {
  chart.setOption({
    grid: { left: 8, right: 24, top: 42, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: '#1a2540', borderColor: '#24304f', textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: function (ps) {
        var p = ps[0];
        return p.name + '<br/>吞吐量：<b style="color:#22d3ee">' + p.value + ' MB/s</b>';
      }
    },
    title: {
      text: '调优阶梯：每加一项优化，吞吐量持续攀升（1024B 消息 · 单机实测口径）',
      left: 'center', top: 0, textStyle: { color: '#94a3b8', fontSize: 12 }
    },
    xAxis: {
      type: 'category',
      data: ['默认配置\nbatch=16KB', 'batch.size\n→ 512KB', '+ linger.ms\n→ 20ms', '+ compression\n→ zstd', '+ buffer.memory\n→ 128MB'],
      axisLabel: { color: '#94a3b8', fontSize: 10.5, interval: 0, lineHeight: 15 },
      axisLine: { lineStyle: { color: '#24304f' } }, axisTick: { show: false }
    },
    yAxis: {
      type: 'value', name: 'MB/s', nameTextStyle: { color: '#64748b' },
      axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(36,48,79,0.6)' } }
    },
    series: [{
      type: 'bar', data: [28, 55, 72, 96, 108], barWidth: '46%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: function (cp) {
          var stops = ['#64748b', '#0ea5e9', '#22d3ee', '#34d399', '#fbbf24'];
          return stops[cp.dataIndex] || '#22d3ee';
        }
      },
      label: { show: true, position: 'top', color: '#e2e8f0', fontSize: 11, fontWeight: 'bold' },
      markLine: {
        symbol: 'none', label: { color: '#94a3b8', fontSize: 10 },
        lineStyle: { color: '#f87171', type: 'dashed' },
        data: [{ yAxis: 28, label: { formatter: '基线 28 MB/s' } }]
      }
    }]
  });
};
