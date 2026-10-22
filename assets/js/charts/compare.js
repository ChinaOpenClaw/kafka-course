/* ECharts：MQ 选型雷达图（课时 02 / 75） */
window.CHARTS['compare'] = function (chart) {
  chart.setOption({
    color: ['#22d3ee', '#fbbf24', '#a78bfa'],
    tooltip: {
      backgroundColor: '#1a2540', borderColor: '#24304f', textStyle: { color: '#e2e8f0', fontSize: 12 }
    },
    legend: {
      bottom: 0, textStyle: { color: '#94a3b8', fontSize: 12 },
      itemWidth: 14, itemHeight: 8
    },
    radar: {
      indicator: [
        { name: '吞吐量', max: 100 }, { name: '可靠性', max: 100 }, { name: '低延迟', max: 100 },
        { name: '功能丰富度', max: 100 }, { name: '生态集成', max: 100 }, { name: '运维简易度', max: 100 }
      ],
      center: ['50%', '48%'], radius: '62%',
      splitArea: { areaStyle: { color: ['rgba(19,28,49,0.4)', 'rgba(19,28,49,0.7)'] } },
      axisName: { color: '#94a3b8', fontSize: 12 },
      splitLine: { lineStyle: { color: '#24304f' } },
      axisLine: { lineStyle: { color: '#24304f' } }
    },
    series: [{
      type: 'radar',
      data: [
        { name: 'Kafka', value: [100, 85, 75, 80, 95, 70], areaStyle: { opacity: 0.25 }, lineStyle: { width: 2.5 } },
        { name: 'RabbitMQ', value: [50, 90, 60, 85, 70, 80], areaStyle: { opacity: 0.15 }, lineStyle: { width: 2 } },
        { name: 'RocketMQ', value: [70, 95, 65, 80, 75, 65], areaStyle: { opacity: 0.15 }, lineStyle: { width: 2 } }
      ]
    }]
  });
};
