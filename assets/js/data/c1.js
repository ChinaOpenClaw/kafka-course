/* ============ 第6章：副本机制 + 第7章：文件存储与高效读写（课时 30-40） ============ */
window.CHAPTERS.push({
  id: 'ch6', icon: '🧬', title: 'Kafka 副本机制',
  lessons: [
    { id: '30', title: 'Kafka Broker - 副本基本信息', duration: '04:19',
      summary: '副本是 Kafka 高可用的基石；AR、ISR、OSR 与 LEO、HW 构成副本同步的核心概念体系。',
      points: [
        '副本作用：冗余容灾（故障转移）+ 读扩展（Follower 可服务读请求）',
        'AR（Assigned Replicas）：分区全部分配副本',
        'ISR（In-Sync Replicas）：与 Leader 保持同步的 Follower 集合，Leader 也在其中',
        'OSR（Out-of-Sync Replicas）：滞后过多的 Follower，AR = ISR + OSR',
        'LEO（Log End Offset）：日志末端偏移，下一条待写入位置',
        'HW（High Watermark）：高水位，消费者最多只能读到 HW 之前的消息'
      ] },
    { id: '31', title: 'Kafka Broker - Leader 选举', duration: '10:02',
      summary: 'Leader 故障时由 Controller 从 ISR 中选举新 Leader；Kafka 的选举由 Controller 完成，不依赖 ZK 直接投票。',
      points: [
        'Leader 职责：分区唯一读写入口，Follower 只从 Leader 拉取同步',
        'Leader 故障：Controller 从 ISR 中按优先副本（AR 第一个）选举新 Leader',
        'Kafka 与 ZAB/Raft 的区别：Kafka 选举由 Controller 集中决策，非分布式投票',
        'unclean.leader.election.enable=false：不允许 OSR 当选，防止数据丢失',
        'Controller 自身故障：ZK 临时节点删除，其他 Broker 抢注成为新 Controller'
      ] },
    { id: '32', title: 'Kafka Broker - Follower 故障', duration: '05:55',
      summary: 'Follower 拉取超时被踢出 ISR，恢复后追上 Leader 再回归，ISR 动态伸缩是常态。',
      points: [
        'Follower 故障判定：replica.lag.time.max.ms（默认 10s）内未发起拉取请求',
        '被踢出 ISR 后，该副本不再参与 ack=all 的同步确认',
        'Follower 恢复：重新从 Leader 拉取数据，追上 HW 后重新加入 ISR',
        '频繁进出 ISR 通常意味着副本所在 Broker 磁盘或网络有瓶颈',
        '监控要点：under-replicated partitions 指标应为 0'
      ] },
    { id: '33', title: 'Kafka Broker - Leader 故障', duration: '01:57',
      summary: 'Leader 宕机后 Controller 秒级感知，从 ISR 选举新 Leader，旧 Leader 恢复后降级为 Follower 并截断不一致数据。',
      points: [
        '检测：Controller 监听 Broker 会话失效',
        '选举：从 ISR 选新 Leader，epoch（controller_epoch）递增防止脑裂',
        '旧 Leader 恢复：以 Follower 身份加入，先截断与 Leader 不一致的消息再同步',
        '生产端表现为短暂发送失败，客户端重试后恢复',
        '降低影响：多 Broker + 副本因子 3 + 合理 ISR 配置'
      ] },
    { id: '34', title: 'Kafka Broker - 分区副本分配', duration: '06:27',
      summary: '副本分配遵循「分散原则」：副本分散到不同 Broker，第一个副本即首选 Leader。',
      points: [
        '分配目标：同分区的不同副本落在不同 Broker，避免单点丢失整分区',
        '规则：AR 中第一个副本为该分区首选 Leader（preferred leader）',
        '创建 Topic 时按 Broker ID 轮转分散；扩容后需手动 rebalance',
        '机架感知：broker.rack 配置后优先跨机架分配，防机架级故障',
        '查看：kafka-topics.sh --describe 观察 Leader/Replicas/Isr 三列'
      ] },
    { id: '35', title: 'Kafka Broker - 手动调整分区副本分配', duration: '04:41',
      summary: 'kafka-reassign-partitions.sh 是副本迁移的总入口，generate → execute → verify 三步曲。',
      points: [
        '场景：扩容、退役、副本分布不均、热点 Broker 治理',
        '计划 JSON 三要素：partitions（分区列表）、replicas（目标分配）、version',
        '执行是渐进式的：先建新副本同步，再删旧副本，业务无感',
        '务必加 --throttle 限流，防止复制流量打满带宽',
        '迁移后取消限流并确认 --verify 全部成功'
      ],
      code: { lang: 'bash', title: 'reassignment JSON 结构',
        src: `{
  "version": 1,
  "partitions": [
    {
      "topic": "first",
      "partition": 0,
      "replicas": [102, 104, 105],
      "log_dirs": ["any", "any", "any"]
    }
  ]
}` }
    },
    { id: '36', title: 'Kafka Broker - LeaderPartition 负载平衡', duration: '05:58',
      summary: 'Leader 过度集中会造成单 Broker 读写热点，需要把 Leader 均匀分布到所有节点。',
      points: [
        '问题：节点频繁上下线后 Leader 集中在少数 Broker',
        '自动：controller.rebalance.enable（默认 true）+ leader.imbalance 阈值自动触发',
        '手动：kafka-leader-election.sh --election-type preferred 触发优先副本回迁',
        '效果：每个 Broker 的 Leader 分区数趋近均分，读写压力均衡',
        '监控：kafka-topics.sh --describe 统计各 Broker 的 Leader 数量'
      ] },
    { id: '37', title: 'Kafka Broker - 增加副本因子', duration: '02:58',
      summary: '通过副本重分配把副本因子从 2 提高到 3，提升容错能力，代价是磁盘与网络开销。',
      points: [
        '动机：提高容错级别、为读扩展做准备',
        '本质：仍是 reassignment，只是新方案中每分区多一个副本',
        '磁盘成本线性增长：副本因子 3 = 3 倍存储',
        '网络成本：每次写入同步到 ISR 全部副本',
        '验证：--describe 确认 Replication Factor 与 Isr 数量'
      ] }
  ]
});
window.CHAPTERS.push({
  id: 'ch7', icon: '💾', title: 'Kafka 文件存储与高效读写',
  lessons: [
    { id: '38', title: 'Kafka Broker - 文件存储机制', duration: '12:50', diagram: 'storage',
      summary: 'Partition 物理上由多个 Segment 文件构成，通过「稀疏索引 + 二分查找」在海量日志中快速定位消息。',
      points: [
        '层级：Topic → Partition（目录）→ Segment（文件组）',
        'Segment 三件套：.log（消息数据）、.index（偏移量索引）、.timeindex（时间戳索引）',
        '命名规则：以基准偏移量命名，如 00000000000000000000.log',
        '滚动条件：单个 segment 达到 log.segment.bytes（默认 1GB）或 log.roll.ms/hours',
        '稀疏索引：每隔 sparse.interval（默认 4KB）建一条索引，不是每条消息都有',
        '查找流程：二分定位 segment → 二分定位索引 → 顺序扫描定位消息'
      ] },
    { id: '39', title: 'Kafka Broker - 文件清除策略', duration: '08:34',
      summary: 'Kafka 提供 delete（按时间/大小删除）与 compact（按 key 压缩保留最新值）两种保留策略。',
      points: [
        'delete 策略：log.retention.hours（默认 168 小时）/ log.retention.bytes',
        '删除粒度：整个过期 segment 文件删除，active segment 永不删',
        'compact 策略：Log Compaction，同 key 只保留最新值，适用 changelog / 状态表',
        'compaction 由 Log Cleaner 线程异步执行，不阻塞读写',
        '选择依据：事件流用 delete，状态/配置类用 compact'
      ],
      table: { head: ['维度', 'delete 策略', 'compact 策略'], rows: [
        ['保留逻辑', '按时间/大小整体删', '按 key 保留最新值'],
        ['适用数据', '事件流、日志', 'changelog、状态快照'],
        ['执行线程', '日志删除调度', 'Log Cleaner'],
        ['关键参数', 'log.retention.hours', 'min.cleanable.dirty.ratio']
      ] }
    },
    { id: '40', title: 'Kafka Broker - 高效读写', duration: '07:59',
      summary: 'Kafka 高吞吐的四大支柱：顺序写、零拷贝、页缓存、批量读写，是架构面试必考题。',
      points: [
        '顺序写：消息追加写，机械硬盘也能获得接近内存的顺序 IO 性能',
        '零拷贝（sendfile）：页缓存数据直接经 DMA 送到网卡，避免 4 次拷贝与 4 次上下文切换',
        '页缓存（page cache）：读请求优先命中 OS 页缓存，不占用 JVM 堆内存',
        '批量读写：生产攒批 + 消费批量拉取，摊薄单条开销',
        '压缩传输：端到端 lz4/zstd，网络与磁盘双受益'
      ],
      cases: [{ title: '【性能】零拷贝', source: 'IMA知识库 · soft张三丰',
        desc: '详解零拷贝如何消除存储器间不必要的中间拷贝，减少 CPU 拷贝与共享总线操作，Kafka sendfile 是其经典应用。' }]
    }
  ]
});
