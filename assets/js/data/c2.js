/* ============ 第8章：Kafka 消费者（课时 41-58） ============ */
window.CHAPTERS.push({
  id: 'ch8', icon: '📥', title: 'Kafka 消费者', image: 'assets/img/img-consumer.png',
  lessons: [
    { id: '41', title: 'Kafka 消费者 - 消费方式', duration: '02:53',
      summary: 'Kafka 采用 Pull 拉取模式：消费者按自身能力主动拉取，是速率控制与批量处理的基础。',
      points: [
        'Pull 模式：消费者主动向 Broker 拉取消息，速率完全自主',
        'Push vs Pull：Push 难以适配消费者处理能力差异，易压垮慢消费者',
        'Pull 缺点：空轮询浪费——通过 long polling（fetch.max.wait.ms）优化',
        '批量拉取：一次拉取多条，摊薄网络往返开销',
        '配合 offset 提交实现精确的位置管理'
      ],
      table: { head: ['维度', 'Push 模式', 'Pull 模式（Kafka）'], rows: [
        ['速率控制', 'Broker 决定', '消费者决定'],
        ['批量', '难控制', '天然支持'],
        ['空转风险', '消费者被压垮', '空轮询（长轮询缓解）']
      ] }
    },
    { id: '42', title: 'Kafka 消费者 - 消费者总体工作流程', duration: '04:55',
      summary: '消费者总体流程：初始化 → 订阅 → 加入组 → poll 循环（拉取/处理/提交），心跳线程并行保活。',
      points: [
        '初始化：配置 → 创建 KafkaConsumer → 订阅 Topic',
        '组协调：通过 GroupCoordinator 完成 JoinGroup/SyncGroup',
        'poll 循环：拉取消息 → 反序列化 → 业务处理 → 记录/提交 offset',
        '心跳线程：独立线程发送心跳，维持组成员关系',
        'rebalance：成员增减或 Topic 变更时触发分区重新分配'
      ] },
    { id: '43', title: 'Kafka 消费者 - 消费者组工作原理', duration: '05:28', diagram: 'consumer-group',
      summary: '消费者组实现横向扩展与高可用：组内分区独占分配，组间广播互不影响。',
      points: [
        '消费者组：多个消费者实例组成的逻辑整体，共同消费一个 Topic',
        '分配规则：一个分区同一时刻只能被组内一个消费者消费',
        '并行度上限：有效消费者数 ≤ 分区数，超出部分空闲',
        'rebalance 触发：新成员加入、成员退出、Topic 分区数变更',
        '三种分配器：Range（默认前）/ RoundRobin / Sticky（2.4 默认）',
        '组间隔离：不同 group 各自独立消费全部消息'
      ] },
    { id: '44', title: 'Kafka 消费者 - 消费者组初始化', duration: '06:49',
      summary: '初始化围绕 GroupCoordinator 展开：定位 Coordinator → JoinGroup → 选举组 Leader → SyncGroup 领取分配。',
      points: [
        '定位 Coordinator：groupId 哈希取模 __consumer_offsets 分区，该分区 Leader 即 Coordinator',
        'JoinGroup：所有成员加入，Broker 选出第一个成员为 Group Leader',
        'Group Leader 执行分区分配策略，产出分配方案',
        'SyncGroup：Leader 上报方案，所有成员领取自己的分区列表',
        'Generation：每次 rebalance 代际 +1，旧代请求失效',
        '__consumer_offsets：内部 Topic，50 分区存储位移与组元数据'
      ] },
    { id: '45', title: 'Kafka 消费者 - 消费者组详细消费流程', duration: '04:02',
      summary: 'poll 循环内部的完整链路：元数据检查 → Coordinator 心跳 → 拉取 → 处理 → 位移管理。',
      points: [
        '每次 poll：先更新分配元数据，再检查 Coordinator 状态',
        'Fetcher 按分配的分区发起拉取，CompletedFetch 入队',
        '消息反序列化后交 UserConsumer 处理，更新 position',
        'max.poll.interval.ms 超时未 poll 会被踢出组并触发 rebalance',
        '自动提交时机：poll 循环内按 auto.commit.interval.ms 触发'
      ] },
    { id: '46', title: 'Kafka 消费者 - 消费一个主题', duration: '09:35',
      summary: 'subscribe 订阅模式由 Kafka 自动完成分区分配与 rebalance，是常规业务的标准用法。',
      points: [
        'subscribe(Collections.singletonList("topic"))：单主题订阅',
        'subscribe(Arrays.asList("a", "b"))：多主题，组内统一分配',
        'subscribe(Pattern)：正则订阅，新增匹配 Topic 自动生效',
        '与 assign 的区别：subscribe 有组管理与 rebalance，assign 没有',
        'poll(Duration) 返回一批记录，逐条处理'
      ],
      code: { lang: 'java', title: 'subscribe 订阅消费',
        src: `KafkaConsumer<String, String> consumer = new KafkaConsumer<>(properties);
// 订阅主题（可传多个或 Pattern）
consumer.subscribe(Collections.singletonList("first"));

while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(1));
    for (ConsumerRecord<String, String> record : records) {
        System.out.printf("partition=%d offset=%d value=%s%n",
            record.partition(), record.offset(), record.value());
    }
}` }
    },
    { id: '47', title: 'Kafka 消费者 - 消费一个分区', duration: '06:39',
      summary: 'assign 手动指定分区 + seek 定位 offset，绕过消费者组机制，实现精确控制。',
      points: [
        'assign(TopicPartition 集合)：直接指定分区，无组管理无 rebalance',
        'seek(partition, offset)：设置下次拉取起始位移',
        'seekToBeginning / seekToEnd：跳到最早/最新',
        '适用场景：独立监控程序、精确重放、定时任务',
        'assign 与 subscribe 互斥，同时使用会抛异常'
      ],
      code: { lang: 'java', title: 'assign + seek',
        src: `TopicPartition tp = new TopicPartition("first", 0);
consumer.assign(Collections.singletonList(tp));
consumer.seek(tp, 100);  // 从 offset 100 开始消费

ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(1));` }
    },
    { id: '48', title: 'Kafka 消费者 - 消费者组案例', duration: '03:26',
      summary: '编写可并行的消费者组案例，多个实例验证分区竞争消费与 rebalance 全过程。',
      points: [
        '同一 group.id 启动多个实例，观察分区被均分',
        '停掉一个实例，观察其分区被其他实例接管（rebalance）',
        '消费者数 > 分区数时，多余实例拿不到分区',
        '通过 kafka-consumer-groups.sh --describe 观察消费进度',
        '生产建议：消费者实例数 = 分区数，最大化并行'
      ] },
    { id: '49', title: 'Kafka 消费者 - Range 分配', duration: '12:59', chart: 'rebalance',
      summary: 'RangeAssignor 按 Topic 维度对分区连续切段分配，公式简单但多 Topic 场景容易不均。',
      points: [
        '范围分配：对每个 Topic 单独计算，分区按序号连续分给消费者',
        '公式：n = 分区数 / 消费者数，m = 分区数 % 消费者数，前 m 个消费者各多 1 个分区',
        '实例：6 分区 4 消费者 → 分配为 2,2,1,1',
        '多 Topic 陷阱：按 Topic 逐个分配，先处理完的 Topic 占优，总量可能倾斜',
        '适用：单 Topic 场景简单有效；2.4 之前默认'
      ] },
    { id: '50', title: 'Kafka 消费者 - Roundrobin', duration: '06:49',
      summary: 'RoundRobinAssignor 把所有订阅 Topic 的分区混在一起轮询分配，总量最均衡。',
      points: [
        '前提：组内所有消费者订阅的 Topic 集合必须相同',
        '算法：分区按字典序排序后轮询发给消费者',
        '优点：总量最均匀，无 Range 的多 Topic 倾斜问题',
        '缺点：不保证粘性，rebalance 后分区大搬家',
        '适用：多 Topic、订阅一致、追求均衡的场景'
      ] },
    { id: '51', title: 'Kafka 消费者 - Sticky', duration: '05:52',
      summary: 'StickyAssignor 在均衡的前提下尽量保持原有分配，把 rebalance 的分区移动降到最小。',
      points: [
        '两个目标：① 分配尽可能均衡 ② 尽可能保留原有分配',
        'rebalance 时只迁移必须迁移的分区，未失效分区不动',
        '收益：减少状态重建、重复消费与处理抖动',
        'Kafka 2.4 起默认分配器',
        '源码要点：先均衡分配，再做「最小移动」修正'
      ] },
    { id: '52', title: 'Kafka 消费者 - offset 保存位置', duration: '07:33',
      summary: '位移统一保存在 Broker 的内部 Topic __consumer_offsets，由 Coordinator 分区定位与管理。',
      points: [
        '旧版存 ZK，新版（0.9+）存 Broker 的 __consumer_offsets',
        '结构：key = groupId + topic + partition，value = offset',
        '默认 50 分区，replication.factor 默认 3',
        'Coordinator 定位：hash(groupId) % __consumer_offsets 分区数 → 该分区 Leader',
        '消费组频繁 rebalance 的常见根因：poll 超时、心跳超时',
        '过期位移：offsets.retention.minutes 默认 7 天，组长期无活动会被清理'
      ] },
    { id: '53', title: 'Kafka 消费者 - 自动 offset', duration: '04:42',
      summary: '自动提交开箱即用，但「提交时机与处理完成解耦」带来重复消费与丢失风险。',
      points: [
        'enable.auto.commit=true（默认）：poll 循环内按 auto.commit.interval.ms 提交',
        '风险一：提交后未处理完崩溃 → 消息丢失（at-most-once）',
        '风险二：处理完未到提交间隔崩溃 → 重复消费（at-least-once）',
        '适用：允许重复或允许丢失的非关键场景',
        '生产建议：改手动提交，把 offset 提交与业务处理绑定'
      ],
      code: { lang: 'java', title: '自动提交配置',
        src: `properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
properties.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "5000");` }
    },
    { id: '54', title: 'Kafka 消费者 - 手动 offset', duration: '04:34',
      summary: 'commitSync 同步提交与 commitAsync 异步提交配合使用，是生产环境的标准姿势。',
      points: [
        'commitSync：同步提交，失败自动重试，直到成功或异常，阻塞当前线程',
        'commitAsync：异步提交，失败不重试，不阻塞',
        '最佳实践：异步提交为主 + 回调里失败转同步重试',
        '批量提交：一次 poll 处理完后提交本批最大 offset',
        '精确一次：提交 offset 与业务写入放同一事务（如 offset 落库与业务同库）'
      ],
      code: { lang: 'java', title: '手动提交（异步+同步兜底）',
        src: `properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "false");

// 异步提交，失败在回调中同步重试
consumer.commitAsync(new OffsetCommitCallback() {
    @Override
    public void onComplete(Map<TopicPartition, OffsetAndMetadata> offsets, Exception ex) {
        if (ex != null) {
            consumer.commitSync();  // 兜底同步提交
        }
    }
});` }
    },
    { id: '55', title: 'Kafka 消费者 - 指定 offset', duration: '09:43',
      summary: 'seek 系列 API 支持任意位置开始消费，是故障重放与补数的核心手段。',
      points: [
        'seek(TopicPartition, offset)：绝对位移定位',
        'seekToBeginning / seekToEnd：相对定位',
        'offsetOutOfRange 异常处理：捕获后 seekToLatest 或按需回退',
        '配合 assign 使用（订阅模式下 seek 需在分配回调后执行）',
        '实战：线上事故后从故障前 offset 重放补数'
      ],
      code: { lang: 'java', title: 'seek 重放',
        src: `// 订阅模式下：rebalance 后自动 seek 到指定 offset
consumer.subscribe(topics, new ConsumerRebalanceListener() {
    @Override
    public void onPartitionsAssigned(Collection<TopicPartition> partitions) {
        for (TopicPartition p : partitions) {
            consumer.seek(p, 5000L);  // 统一从 5000 重放
        }
    }
    @Override
    public void onPartitionsRevoked(Collection<TopicPartition> partitions) {}
});` }
    },
    { id: '56', title: 'Kafka 消费者 - 按照时间消费', duration: '05:48',
      summary: 'offsetsForTimes 按时间戳反查 offset，实现「回溯到昨天 10 点」这类按时间消费需求。',
      points: [
        'API：consumer.offsetsForTimes(Map<TopicPartition, Long>)',
        '输入：分区 → 目标时间戳（毫秒）；输出：该时间对应的 offset',
        '找不到时间点：返回 null，表示该时间之后无消息',
        '典型场景：凌晨跑批发现数据错误，回溯到故障时刻重算',
        '配合 seek 完成「按时间消费」闭环'
      ],
      code: { lang: 'java', title: '按时间戳回溯',
        src: `// 查询 1 小时前对应的 offset
long ts = System.currentTimeMillis() - 3600 * 1000L;
Map<TopicPartition, Long> query = new HashMap<>();
query.put(new TopicPartition("first", 0), ts);
Map<TopicPartition, OffsetAndTimestamp> result = consumer.offsetsForTimes(query);
for (Map.Entry<TopicPartition, OffsetAndTimestamp> e : result.entrySet()) {
    if (e.getValue() != null) {
        consumer.seek(e.getKey(), e.getValue().offset());
    }
}` }
    },
    { id: '57', title: 'Kafka 消费者 - 消费者事务', duration: '04:05',
      summary: 'isolation.level 控制消费者是否读取未提交的事务消息，是端到端 exactly-once 的最后一环。',
      points: [
        '事务消息：生产者事务保证多分区写入的原子性',
        'read_committed：只读到已提交事务的消息，未提交的不返回',
        'read_uncommitted（默认）：事务未提交的消息也能读到',
        'end-to-end exactly-once：事务生产 + read_committed 消费 + 位移事务化提交',
        '代价：read_committed 会读到 LSO（上次稳定偏移），可能增加延迟'
      ],
      code: { lang: 'java', title: '只读已提交消息',
        src: `properties.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");` }
    },
    { id: '58', title: 'Kafka 消费者 - 数据积压', duration: '03:07',
      summary: '积压表现为消费 lag 持续增长，处理思路是「扩容并行 + 提升单消费者能力 + 治理热点」。',
      points: [
        '发现：kafka-consumer-groups.sh --describe 看 LAG 列',
        '根因一：消费能力不足 → 扩容消费者（≤ 分区数）、调大 max.poll.records',
        '根因二：单分区热点 → 按 key 重新设计分区，或临时提高单分区拉取量',
        '根因三：下游慢 → 异步化下游写入、批量落库',
        '根因四：消费逻辑重 → 优化反序列化、加本地缓存、并行处理',
        '应急：临时停业务写、先把积压消息转存冷存储再补数'
      ],
      code: { lang: 'bash', title: '查看消费滞后',
        src: `bin/kafka-consumer-groups.sh --bootstrap-server hadoop102:9092 \\
  --describe --group test-group
# 关注 LAG 列：持续增长即积压` }
    }
  ]
});
