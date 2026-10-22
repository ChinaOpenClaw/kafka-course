/* ECharts：rebalance 分配策略对比（课时 49-51） */
window.CHARTS['rebalance'] = function (chart) {
  chart.setOption({
    grid: { left: 8, right: 20, top: 46, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: '#1a2540', borderColor: '#24304f', textStyle: { color: '#e2e8f0', fontSize: 12 }
    },
    title: {
      text: '场景：4 消费者消费 8 分区，C4 宕机退出触发 rebalance',
      left: 'center', top: 0, textStyle: { color: '#94a3b8', fontSize: 12 }
    },
    legend: { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 12 }, data: ['Range', 'RoundRobin', 'Sticky'] },
    xAxis: {
      type: 'category', data: ['Range 分配', 'RoundRobin 轮询', 'Sticky 粘性'],
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { lineStyle: { color: '#24304f' } }, axisTick: { show: false }
    },
    yAxis: {
      type: 'value', name: '分区数', nameTextStyle: { color: '#64748b' }, max: 8,
      axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(36,48,79,0.6)' } }
    },
    series: [
      {
        name: '移动的分区数', type: 'bar', data: [
          { value: 8, itemStyle: { color: '#f87171', borderRadius: [5, 5, 0, 0] } },
          { value: 8, itemStyle: { color: '#fbbf24', borderRadius: [5, 5, 0, 0] } },
          { value: 2, itemStyle: { color: '#34d399', borderRadius: [5, 5, 0, 0] } }
        ],
        barWidth: '38%',
        label: { show: true, position: 'top', color: '#e2e8f0', fontSize: 12, fontWeight: 'bold' },
        markLine: {
          symbol: 'none',
          lineStyle: { color: '#a78bfa', type: 'dashed' },
          label: { color: '#a78bfa', fontSize: 10, formatter: 'Sticky 只迁移必须迁移的分区' },
          data: [{ yAxis: 2 }]
        }
      },
      {
        name: '分配均衡度', type: 'line', data: [75, 100, 100], smooth: true, symbol: 'diamond', symbolSize: 11,
        lineStyle: { color: '#22d3ee', width: 2.5, type: 'dashed' },
        itemStyle: { color: '#22d3ee' },
        label: { show: true, position: 'bottom', color: '#22d3ee', fontSize: 10.5, formatter: function (p) { return p.value + '%'; } }
      }
    ]
  });
};
