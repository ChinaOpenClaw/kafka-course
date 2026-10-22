/* ECharts：acks 三级别权衡（课时 18） */
window.CHARTS['ack'] = function (chart) {
  chart.setOption({
    grid: { left: 8, right: 16, top: 44, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: '#1a2540', borderColor: '#24304f', textStyle: { color: '#e2e8f0', fontSize: 12 }
    },
    title: {
      text: 'acks 三级别：吞吐量与可靠性的经典权衡',
      left: 'center', top: 0, textStyle: { color: '#94a3b8', fontSize: 12 }
    },
    legend: {
      bottom: 0, textStyle: { color: '#94a3b8', fontSize: 12 },
      data: ['相对吞吐量', '数据可靠性']
    },
    xAxis: {
      type: 'category', data: ['acks=0\n不等确认', 'acks=1\nLeader 落盘', 'acks=all\nISR 全部同步'],
      axisLabel: { color: '#94a3b8', fontSize: 11, interval: 0, lineHeight: 15 },
      axisLine: { lineStyle: { color: '#24304f' } }, axisTick: { show: false }
    },
    yAxis: {
      type: 'value', name: '相对指数', nameTextStyle: { color: '#64748b' }, max: 100,
      axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(36,48,79,0.6)' } }
    },
    series: [
      {
        name: '相对吞吐量', type: 'bar', data: [100, 72, 45], barWidth: '34%',
        itemStyle: {
          borderRadius: [5, 5, 0, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#22d3ee' }, { offset: 1, color: '#0e7490' }] }
        },
        label: { show: true, position: 'top', color: '#22d3ee', fontSize: 11, fontWeight: 'bold' }
      },
      {
        name: '数据可靠性', type: 'line', data: [20, 62, 100], smooth: true,
        symbol: 'circle', symbolSize: 10,
        lineStyle: { color: '#fbbf24', width: 3 },
        itemStyle: { color: '#fbbf24', borderColor: '#0b1220', borderWidth: 2 },
        label: { show: true, position: 'top', color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
        areaStyle: { color: 'rgba(251,191,36,0.08)' }
      },
      {
        name: '提示', type: 'scatter', data: [], markLine: {
          symbol: 'none',
          lineStyle: { color: '#34d399', type: 'dotted', width: 1.5 },
          label: { color: '#34d399', fontSize: 10, formatter: '生产推荐：acks=all + min.insync.replicas≥2' },
          data: [{ xAxis: 2 }]
        }
      }
    ]
  });
};
