/* ECharts：生产者压力测试曲线（课时 81） */
window.CHARTS['stress'] = function (chart) {
  chart.setOption({
    grid: { left: 8, right: 20, top: 46, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a2540', borderColor: '#24304f', textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: function (ps) {
        var s = ps[0].name;
        ps.forEach(function (p) { s += '<br/>' + p.marker + p.seriesName + '：<b>' + p.value + ' MB/s</b>'; });
        return s;
      }
    },
    title: {
      text: '压测曲线：batch.size 与 linger.ms 对吞吐量的边际收益递减',
      left: 'center', top: 0, textStyle: { color: '#94a3b8', fontSize: 12 }
    },
    legend: { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 12 }, data: ['batch.size 阶梯', 'linger.ms 阶梯'] },
    xAxis: {
      type: 'category', data: ['16', '64', '256', '512', '1024'],
      name: 'KB / ms', nameTextStyle: { color: '#64748b' },
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#24304f' } }, axisTick: { show: false }
    },
    yAxis: {
      type: 'value', name: 'MB/s', nameTextStyle: { color: '#64748b' },
      axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(36,48,79,0.6)' } }
    },
    series: [
      {
        name: 'batch.size 阶梯', type: 'line', smooth: true, data: [22, 38, 55, 66, 72],
        symbol: 'circle', symbolSize: 9,
        lineStyle: { color: '#22d3ee', width: 3 },
        itemStyle: { color: '#22d3ee' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(34,211,238,0.25)' }, { offset: 1, color: 'rgba(34,211,238,0)' }] }
        },
        markPoint: {
          data: [{ type: 'max', name: '峰值' }],
          itemStyle: { color: '#22d3ee' }, label: { color: '#0b1220', fontSize: 10, fontWeight: 'bold' }
        }
      },
      {
        name: 'linger.ms 阶梯', type: 'line', smooth: true, data: [30, 45, 58, 62, 64],
        symbol: 'triangle', symbolSize: 9,
        lineStyle: { color: '#fbbf24', width: 3, type: 'dashed' },
        itemStyle: { color: '#fbbf24' },
        markLine: {
          symbol: 'none',
          lineStyle: { color: '#f87171', type: 'dotted' },
          label: { color: '#f87171', fontSize: 10, formatter: '512KB / 20ms 后收益趋平' },
          data: [{ xAxis: 3 }]
        }
      }
    ]
  });
};
