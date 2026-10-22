/* ============ 第5章：Kafka Broker 基础（课时 22-29） ============ */
window.CHAPTERS.push({
  id: 'ch5', icon: '🖥️', title: 'Kafka Broker 基础', image: 'assets/img/img-broker.png',
  lessons: [
    { id: '22', title: 'Kafka Broker - ZK 存储', duration: '06:01',
      summary: 'Kafka 2.x 依赖 ZooKeeper 管理元数据与集群协调，理解 ZK 节点结构是理解 Controller 与副本机制的前提。',
      points: [
        '/brokers/ids：Broker 注册节点，临时节点，存 broker 主机信息',
        '/brokers/topics：Topic 元数据（分区、副本、配置）',
        '/controller：当前 Controller 的 Broker ID，Controller 故障触发重选',
        '/admin：管理操作（删除 Topic、分区重分配）',
        '/controller_epoch 与 /isr_change_notification：代际与 ISR 变更通知',
        '3.x 起 KRaft 模式移除 ZK，元数据改由 Raft 管理的 __cluster_metadata 承载'
      ],
      table: { head: ['ZK 节点', '存储内容', '节点类型'], rows: [
        ['/brokers/ids', 'Broker 注册信息（host/port）', '临时节点'],
        ['/brokers/topics', 'Topic 分区与副本分配', '持久节点'],
        ['/controller', 'Controller Broker ID + epoch', '持久节点'],
        ['admin/reassign_partitions', '分区重分配计划', '持久节点']
      ] }
    },
    { id: '23', title: 'Kafka Broker - 工作原理', duration: '05:22',
      summary: 'Broker 从启动注册到对外提供读写服务，Controller 是集群的大脑，统一管理分区状态。',
      points: [
        '启动流程：加载配置 → 创建 SocketServer 与日志管理器 → 向 ZK 注册（抢注 /controller）',
        'Controller 职责：Broker 上下线感知、Topic 创建删除、分区 Leader 选举、副本重分配',
        '生产者通过元数据（分区 Leader 位置）直接向对应 Broker 发送数据',
        '消费者通过 Coordinator（GroupCoordinator Broker）完成组管理与位移提交',
        '请求处理：Acceptor 接收 → Processor 解析 → KafkaApis 分发到具体处理器',
        'Purgatory：延时请求管理（如 acks=all 等待 ISR 同步）'
      ] },
    { id: '24', title: 'Kafka Broker - 上下线', duration: '01:26',
      summary: 'Broker 上下线由 ZK 临时节点会话驱动，Controller 监听变更并触发副本调整。',
      points: [
        '上线：Broker 注册临时节点成功，Controller 感知后分配/保持分区角色',
        '下线：会话过期或主动注销 → 临时节点删除 → Controller 将该 Broker 上 Leader 分区重新选举',
        'Follower 所在 Broker 下线：对应副本被移出 ISR，待恢复后追回',
        '优雅停机：先执行分区迁移再停止进程，避免频繁 Leader 切换'
      ] },
    { id: '25', title: 'Kafka Broker - 服役新节点（上）', duration: '07:27',
      summary: '扩容第一步：生成副本迁移计划，把现有分区副本分布到新节点，先规划后执行。',
      points: [
        '扩容动机：磁盘不足、读写压力过大、提升并行度',
        '工具：kafka-reassign-partitions.sh，核心是 topics-to-move.json 迁移计划',
        '--generate 根据现有分配 + 目标 Broker 列表生成新方案',
        '计划含三部分：分区列表、当前副本分配、建议新分配',
        '审查要点：确认新分配确实包含新 Broker、副本因子不变'
      ],
      code: { lang: 'bash', title: '生成迁移计划',
        src: `# topics-to-move.json：要迁移的 Topic 列表
cat > topics-to-move.json << EOF
{
  "topics": [
    {"topic": "first"},
    {"topic": "second"}
  ],
  "version": 1
}
EOF

# 生成迁移计划（hadoop105/106/107 为新集群全部节点）
bin/kafka-reassign-partitions.sh --bootstrap-server hadoop102:9092 \\
  --topics-to-move-json-file topics-to-move.json \\
  --broker-list "102,103,104,105,106,107" \\
  --generate` }
    },
    { id: '26', title: 'Kafka Broker - 服役新节点（下）', duration: '07:25',
      summary: '执行迁移计划并验证结果，迁移期间建议限流以降低对线上业务的影响。',
      points: [
        '--execute 执行：Controller 逐步把副本迁移到新节点',
        '--verify 验证：直到所有分区都完成迁移',
        '限流：--throttle 限制复制带宽（如 50MB/s），避免打满网卡',
        '迁移过程：先增副本 → 同步 → 再摘除旧副本，业务无感',
        '完成后做 Leader 负载平衡，把 Leader 分布到新节点'
      ],
      code: { lang: 'bash', title: '执行与验证',
        src: `# 把上一步生成的方案保存为 plan.json 后执行
bin/kafka-reassign-partitions.sh --bootstrap-server hadoop102:9092 \\
  --reassignment-json-file plan.json --execute

# 验证迁移进度（返回 successfully 即完成）
bin/kafka-reassign-partitions.sh --bootstrap-server hadoop102:9092 \\
  --reassignment-json-file plan.json --verify` }
    },
    { id: '27', title: 'Kafka Broker - 退役旧节点', duration: '05:19',
      summary: '退役与服役相反：生成不含旧节点的分配方案，先迁出副本，确认无残留后再停机。',
      points: [
        '核心：reassignment 方案的 broker-list 不包含待退役节点',
        '同样走 generate → execute → verify 三步',
        '验证退役节点上已无任何副本后再停止进程',
        '注意 Leader 若在退役节点，迁移后需触发 Leader 重平衡',
        '建议在低峰期执行，并提前评估迁移数据量与时长'
      ],
      code: { lang: 'bash', title: '退役计划（排除 107）',
        src: `bin/kafka-reassign-partitions.sh --bootstrap-server hadoop102:9092 \\
  --topics-to-move-json-file topics-to-move.json \\
  --broker-list "102,103,104,105,106" \\   # 不含 107
  --generate` }
    },
    { id: '28', title: '每日回顾（上）', duration: '16:05',
      summary: '第一阶段复盘：课程定位、Kafka 概述、快速入门、生产者与 Broker 基础，串联高频面试问题。',
      points: [
        'Kafka 是什么：分布式流处理平台，高吞吐三大件（顺序写/零拷贝/页缓存）',
        '两种消息模式与消费者组语义的关系',
        '命令行三板斧：topics / console-producer / console-consumer',
        '生产者双线程架构 + 累加器 + 分区策略全景图',
        '可靠性四层：acks、ISR、幂等、事务的递进关系',
        'Broker 启动注册流程与 Controller 职责'
      ] },
    { id: '29', title: '每日回顾（下）', duration: '24:25',
      summary: '承接上文，对第一阶段细节深挖：参数取值依据、命令易错点、场景题推演。',
      points: [
        '面试题：Kafka 为什么快？（磁盘顺序写 + 零拷贝 + 批量 + 压缩 + 页缓存）',
        '面试题：如何保证消息不丢？（acks=all + ISR + 重试 + 业务幂等）',
        '面试题：如何保证消息有序？（单分区 + 固定 key + 幂等）',
        '面试题：副本迁移与节点服役退役的完整流程复盘',
        '参数深挖：batch.size 与 linger.ms 的取舍，max.in.flight 与乱序',
        '实操易错点：--bootstrap-server 写错主机、副本因子超过 Broker 数'
      ] }
  ]
});
