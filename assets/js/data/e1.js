/* ============ 第13章：Kafka 调优（课时 75-82） ============ */
window.CHAPTERS.push({
  id: 'ch13', icon: '⚙️', title: 'Kafka 调优',
  lessons: [
    { id: '75', title: 'Kafka 调优 - 内容简介', duration: '02:40', chart: 'compare',
      summary: '调优四维度：硬件选择、Broker、生产者、消费者；方法论是「压测定位 → 参数迭代 → 监控验证」。',
      points: [
        '调优四板斧：硬件、Broker、生产者、消费者',
        '方法论：基准压测 → 瓶颈定位（IO/网络/CPU）→ 参数迭代 → 效果验证',
        '黄金法则：所有调优必须有监控数据支撑，不拍脑袋',
        '权衡意识：吞吐、延迟、可靠性三者不可兼得，按业务取舍',
        '参考基准：单机百万 TPS 是 Kafka 的设计目标区间'
      ] },
    { id: '76', title: 'Kafka 调优 - 硬件选择', duration: '18:08',
      summary: 'Kafka 的性能天花板由硬件决定：磁盘吞吐、内存页缓存与网络带宽是三大瓶颈。',
      points: [
        '磁盘：多块磁盘或 RAID10；顺序写场景机械盘可用，SSD 更适合低延迟场景',
        '磁盘吞吐公式：所需带宽 = 生产吞吐 × 副本因子（含同步流量）',
        '内存：越大越好——读走页缓存，生产建议 64GB 起步',
        '网络：万兆网卡起步，跨机房注意带宽与延迟',
        'CPU：压缩/解压与序列化是 CPU 大户，多核有利批量',
        '避免：JBOD 单盘故障风险、虚拟机共享 IO 抖动'
      ],
      table: { head: ['资源', '建议', '原因'], rows: [
        ['磁盘', '多块 / RAID10 / SSD', '顺序写 + 副本同步 IO'],
        ['内存', '64GB+', '页缓存承载读流量'],
        ['网络', '万兆', '副本流量 = 写入 × (副本-1)'],
        ['CPU', '8 核+', '压缩与序列化并行']
      ] }
    },
    { id: '77', title: 'Kafka 调优 - 生产者调优', duration: '09:35', chart: 'tuning',
      summary: '生产者调优核心是攒批与压缩：batch.size、linger.ms、compression 三参数联动效果最明显。',
      points: [
        'batch.size：16KB（默认）→ 512KB~1MB，请求数下降一个量级',
        'linger.ms：0 → 5~20ms，用极小延迟换更大批次',
        'compression.type：none → lz4/zstd，CPU 换带宽与磁盘',
        'buffer.memory：32MB → 64MB+，避免 max.block 阻塞',
        'max.in.flight.requests.per.connection：5（幂等下安全）',
        '调优顺序：先开压缩 → 再调 batch/linger → 最后扩 buffer'
      ],
      code: { lang: 'java', title: '生产调优组合拳',
        src: `// 吞吐优先型生产配置
props.put(BATCH_SIZE_CONFIG, 1048576);        // 1MB
props.put(LINGER_MS_CONFIG, 20);              // 20ms
props.put(COMPRESSION_TYPE_CONFIG, "zstd");   // 高压缩比
props.put(BUFFER_MEMORY_CONFIG, 134217728L);  // 128MB
props.put(ACKS_CONFIG, "all");                // 可靠优先按需调整` }
    },
    { id: '78', title: 'Kafka 调优 - Broker 调优', duration: '10:50',
      summary: 'Broker 调优的关键是「把内存留给页缓存、把 IO 留给顺序写」，JVM 只做辅助。',
      points: [
        'JVM 堆：默认 1GB 足够——Kafka 重度依赖页缓存而非堆内存',
        'GC：G1，避免堆过大导致停顿；关注 GC 日志',
        'log.flush：不推荐改小，依赖 OS 刷盘与副本同步更可靠',
        'num.replica.fetchers： follower 拉取线程数，提高副本同步速度',
        '网络线程 num.network.threads / IO 线程 num.io.threads 按请求量调整',
        'os vm.swappiness=1，尽量不交换，保住页缓存'
      ] },
    { id: '79', title: 'Kafka 调优 - 消费者调优', duration: '09:15',
      summary: '消费者调优围绕「单次拉取量」与「并行度」展开，同时严防 poll 超时被踢出组。',
      points: [
        'max.poll.records：500（默认）→ 1000+，减少 poll 次数',
        'fetch.min.bytes + fetch.max.wait.ms：攒批拉取，减少空往返',
        'max.partition.fetch.bytes：单分区单次最大拉取字节',
        '并行度：消费者数 = 分区数，每个消费者开多线程处理',
        'max.poll.interval.ms：处理慢的业务务必调大，防被踢出',
        '反序列化优化：避免在 poll 线程做重 IO'
      ] },
    { id: '80', title: 'Kafka 调优 - 总体调优', duration: '11:23',
      summary: '端到端视角看瓶颈链路，参考业界大规模 Kafka 架构演进案例做体系化调优。',
      points: [
        '瓶颈定位法：从 Producer 到 Consumer 逐段压测，看哪段先饱和',
        'IO 瓶颈 → 加磁盘/SSD；网络瓶颈 → 万兆/压缩；CPU 瓶颈 → 降压缩级别',
        '容量规划：写入峰值 × 副本因子 × 保留周期 = 存储需求',
        '存算分离趋势：AutoMQ 等云原生架构把存储卸载到对象存储，弹性按秒计'
      ],
      cases: [
        { title: '从 Kafka 到 AutoMQ：爱奇艺实时流数据架构演进', source: 'IMA知识库 · AutoMQ',
          desc: '爱奇艺面对集群扩缩容难、资源利用率低的问题，经 Stream 平台与 SDK 解耦，最终切换存算分离的 AutoMQ，实现单副本存储与秒级弹性，显著降低运营成本。' },
        { title: 'Kafka 最佳实践：构建可靠、高性能的分布式消息系统', source: 'IMA知识库 · 阿里云开发者社区',
          desc: '高负载下稳定运行与数据可靠传递的最佳实践合集，涵盖配置与示例代码，可对照本调优章节验证。' },
        { title: '经典大数据架构案例：酷狗音乐大数据平台重构', source: 'IMA知识库 · InfoQ',
          desc: '酷狗音乐以 Kafka 为核心的行为流水数据平台重构，缓存重用与架构演进经验。' }
      ]
    },
    { id: '81', title: 'Kafka 调优 - 生产者压力测试', duration: '15:36', chart: 'stress',
      summary: 'kafka-producer-perf-test.sh 一键压测，用对照组实验量化每个参数的收益。',
      points: [
        '命令：--topic --num-records --record-size --throughput --producer-props',
        '观测指标：吞吐 MB/s、记录数/s、平均延迟、最大延迟',
        '实验设计：固定其他变量，单独验证 batch.size / linger / compression',
        '压缩收益：文本场景 zstd 可降 60%+ 网络流量',
        '结果要落到自己的机器与数据形态上，不迷信公开数字'
      ],
      code: { lang: 'bash', title: '生产者压测命令',
        src: `bin/kafka-producer-perf-test.sh \\
  --topic first \\
  --num-records 1000000 \\
  --record-size 1024 \\
  --throughput 100000 \\
  --producer-props bootstrap.servers=hadoop102:9092 \\
  batch.size=1048576 linger.ms=20 compression.type=zstd

# 关注输出：平均 9.5 MB/s、最高 100000 条/s 等汇总指标` }
    },
    { id: '82', title: 'Kafka 调优 - 消费者压力测试', duration: '05:46',
      summary: 'kafka-consumer-perf-test.sh 测量消费吞吐与延迟，验证消费端并行度配置。',
      points: [
        '命令：--bootstrap-server --topic --messages --group',
        '多线程压测：启动多实例验证组内并行扩展性',
        '观测：消费 MB/s、条/s、端到端延迟',
        '对比实验：max.poll.records 500 vs 5000 的吞吐差异',
        '消费端并行度上限 = 分区数，超过无收益'
      ],
      code: { lang: 'bash', title: '消费者压测命令',
        src: `bin/kafka-consumer-perf-test.sh \\
  --bootstrap-server hadoop102:9092 \\
  --topic first \\
  --messages 1000000 \\
  --group perf-test \\
  --threads 4

# 输出：start.time / end.time / 消费总量 / 吞吐 MB per second` }
    }
  ]
});
