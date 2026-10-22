/* ============ 第4章：Kafka 生产者（课时 10-21） ============ */
window.CHAPTERS.push({
  id: 'ch4', icon: '📤', title: 'Kafka 生产者', image: 'assets/img/img-producer.png',
  lessons: [
    { id: '10', title: 'Kafka 生产者 - 原理', duration: '13:49', diagram: 'producer-flow',
      summary: '生产者采用「主线程 + Sender 线程」双线程架构，RecordAccumulator 作为核心消息缓冲区，是理解生产者一切行为的根基。',
      points: [
        'main 线程：ProducerInterceptor 拦截器 → Serializer 序列化 → Partitioner 分区 → RecordAccumulator 累加器',
        'Sender 线程：从 Accumulator 按分区拉取批量消息，封装为 ProduceRequest 发送给对应 Broker',
        'RecordAccumulator：按 Topic-Partition 分桶的双端队列，batch.size 控制每批大小',
        '元数据管理：Sender 定期从任意 Broker 拉取集群元数据（Topic 分区、Leader 位置）',
        '整体时序：拦截 → 序列化 → 分区 → 入缓冲 → 批量发送 → 等待 ack 确认'
      ] },
    { id: '11', title: 'Kafka 生产者 - 异步发送', duration: '12:16',
      summary: 'send() 方法默认为异步发送，不阻塞主线程，是高吞吐生产的基础；需要结果时可通过 Future.get() 等待。',
      points: [
        'producer.send(record) 立即返回 Future<RecordMetadata>，消息进入累加器后台发送',
        '异步发送吞吐量高，适合日志、埋点等海量场景',
        '常见异常：缓冲区已满（BufferExhaustedException）、序列化失败、获取元数据超时',
        'send().get() 可同步等待结果，但会退化为串行，仅适合测试',
        '生产环境务必使用带回调的异步发送，避免阻塞业务线程'
      ],
      code: { lang: 'java', title: '异步发送',
        src: `Properties properties = new Properties();
properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "hadoop102:9092");
properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());

KafkaProducer<String, String> producer = new KafkaProducer<>(properties);
for (int i = 0; i < 1000; i++) {
    // 异步发送：不阻塞，消息进入 RecordAccumulator
    producer.send(new ProducerRecord<>("first", "message-" + i));
}
producer.close();` }
    },
    { id: '12', title: 'Kafka 生产者 - 回调异步发送', duration: '03:22',
      summary: '通过 Callback 回调在发送完成时获得元数据或异常，兼顾吞吐与结果处理，是生产环境标准写法。',
      points: [
        'producer.send(record, callback)：消息发送完成时回调 onCompletion',
        '成功：RecordMetadata 携带 topic、partition、offset、timestamp',
        '失败：exception 非空，可记录日志、告警或转入重试队列',
        '回调在 Sender 线程执行，回调逻辑务必轻量，避免阻塞发送',
        '批量场景可聚合统计成功/失败数量，定期上报'
      ],
      code: { lang: 'java', title: '带回调的异步发送',
        src: `producer.send(new ProducerRecord<>("first", "hello"), new Callback() {
    @Override
    public void onCompletion(RecordMetadata metadata, Exception exception) {
        if (exception == null) {
            System.out.println("topic=" + metadata.topic()
                + " partition=" + metadata.partition()
                + " offset=" + metadata.offset());
        } else {
            System.err.println("发送失败: " + exception.getMessage());
        }
    }
});` }
    },
    { id: '13', title: 'Kafka 生产者 - 同步发送', duration: '02:22',
      summary: 'send().get() 阻塞等待 Broker 确认，语义最简单但吞吐最低，仅用于测试或强确认场景。',
      points: [
        '同步发送 = 异步 + Future.get() 阻塞等待结果',
        '每条消息都等待确认，吞吐量约为异步的几十分之一',
        '异常会直接抛出（ExecutionException / TimeoutException / InterruptedException）',
        '适用场景：功能测试、数据量小且要求强确认',
        '生产环境应使用回调异步 + 合理的 acks 配置替代'
      ],
      code: { lang: 'java', title: '同步发送',
        src: `for (int i = 0; i < 10; i++) {
    try {
        RecordMetadata metadata = producer
            .send(new ProducerRecord<>("first", "sync-" + i))
            .get();  // 阻塞等待 Broker 确认
        System.out.println("offset = " + metadata.offset());
    } catch (Exception e) {
        e.printStackTrace();
    }
}` }
    },
    { id: '14', title: 'Kafka 生产者 - 分区', duration: '04:39',
      summary: '分区是 Kafka 并行存储与消费的基本单位，理解分区才能理解吞吐、顺序与负载均衡。',
      points: [
        '分区意义一：负载均衡——分区分散到不同 Broker，读写压力分散',
        '分区意义二：提高吞吐——分区可并行读写，是水平扩展的基础',
        '分区意义三：顺序保证——单分区内消息严格有序',
        'Topic 是逻辑概念，Partition 是物理概念，一个分区同一时刻只能被组内一个消费者消费',
        '分区数与消费者数的关系直接影响消费并行度：消费者多于分区数时部分空闲'
      ] },
    { id: '15', title: 'Kafka 生产者 - 分区策略', duration: '11:18', diagram: 'partition-strategy',
      summary: '默认分区策略优先级：显式指定分区 > key 哈希 > 粘性分区（2.4.1+），理解策略才能设计好数据分布。',
      points: [
        '指定分区：ProducerRecord 构造时直接传入 partition 号，优先级最高',
        '有 key：murmur2(key.toByteArray()) % numPartitions，同 key 永远落在同一分区，保证局部顺序',
        '无 key：2.4.1 起为 Sticky 粘性分区——先随机选一个分区尽量灌满一个 batch，减少小请求',
        '2.4.1 之前无 key 采用 Round-Robin 轮询',
        '自定义分区：实现 Partitioner 接口，按业务字段（如地区、用户 ID 段）灵活路由'
      ],
      code: { lang: 'java', title: '指定分区与 key',
        src: `// 1. 直接指定分区（优先级最高）
new ProducerRecord<>("first", 2, "key", "value");

// 2. 只有 key：按 key 哈希取模，同 key 同分区
new ProducerRecord<>("first", "order-1001", "payload");

// 3. 无 key 无分区：sticky 粘性分区
new ProducerRecord<>("first", "payload");` }
    },
    { id: '16', title: 'Kafka 生产者 - 自定义分区', duration: '04:57',
      summary: '实现 Partitioner 接口并按业务规则路由消息，例如按省份写入固定分区便于下游分区级处理。',
      points: [
        '实现 org.apache.kafka.clients.producer.Partitioner 接口',
        'partition(topic, key, serializedKey, value, headers, cluster) 返回目标分区号',
        '配置 partitioner.class 指向实现类',
        'close() 中释放资源；自定义逻辑需处理 key 为 null 的兜底',
        '实战案例：按手机号前两位路由到不同分区，实现热点分散'
      ],
      code: { lang: 'java', title: '自定义分区器',
        src: `public class MyPartitioner implements Partitioner {
    @Override
    public int partition(String topic, Object key, byte[] keyBytes,
                         Object value, byte[] valueBytes, Cluster cluster) {
        // 按 value 内容哈希到分区（需与分区数匹配）
        String data = value.toString();
        return Math.abs(data.hashCode()) % cluster.partitionCountForTopic(topic);
    }
    @Override
    public void close() {}
}
// 配置：properties.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, MyPartitioner.class.getName());` }
    },
    { id: '17', title: 'Kafka 生产者 - 提高生产者吞吐量', duration: '11:01', chart: 'tuning',
      summary: '吞吐量优化的核心是「攒批 + 压缩 + 大缓冲」：batch.size、linger.ms、compression 三剑客配合使用。',
      points: [
        'batch.size：单批次大小默认 16KB，可提高到 512KB～1MB，减少请求数',
        'linger.ms：发送前等待时间默认 0，提高到 5～100ms 攒更大批次，微增延迟',
        'compression.type：lz4/snappy/zstd 压缩减少网络与磁盘 IO，CPU 换带宽',
        'buffer.memory：累加器总缓冲默认 32MB，生产建议 64MB+，避免 Block 阻塞',
        'max.in.flight.requests.per.connection：默认 5，配合幂等保证顺序',
        '调优本质：用延迟换吞吐，需结合压测数据找到业务平衡点'
      ],
      code: { lang: 'java', title: '吞吐量优化参数',
        src: `// 攒批三件套
properties.put(ProducerConfig.BATCH_SIZE_CONFIG, 1024 * 512);   // 512KB
properties.put(ProducerConfig.LINGER_MS_CONFIG, 20);            // 等 20ms
properties.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4");  // 压缩
properties.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 64L * 1024 * 1024); // 64MB` }
    },
    { id: '18', title: 'Kafka 生产者 - 数据可靠', duration: '14:01', diagram: 'isr', chart: 'ack',
      summary: 'ack 应答级别与 ISR 同步副本集合共同决定数据可靠性；Kafka 提供从「最快」到「最可靠」的完整权衡空间。',
      points: [
        'ack=0：不等任何确认，最高吞吐、最低可靠，可能丢数据',
        'ack=1：Leader 写入本地日志即确认，折中方案，Leader 瞬时故障可能丢数据',
        'ack=-1(all)：ISR 全部同步后才确认，最可靠，配合 min.insync.replicas≥2 防脑裂丢数据',
        'ISR：与 Leader 保持同步的 Follower 集合，由 replica.lag.time.max.ms 判定进出',
        'HW（高水位）与 LEO（日志末端偏移）：HW 以下的消息才对消费者可见',
        'unclean.leader.election.enable=false：阻止 OSR 副本当选 Leader，杜绝脏数据'
      ],
      table: { head: ['acks', '可靠性', '吞吐量', '风险'], rows: [
        ['0', '最低', '最高', 'Broker 未收到即返回，可能丢'],
        ['1', '中等', '中等', 'Leader 宕机未同步则丢'],
        ['all (-1)', '最高', '较低', 'ISR 不足时阻塞生产']
      ] }
    },
    { id: '19', title: 'Kafka 生产者 - 数据重复', duration: '15:07',
      summary: 'at-least-once 语义天然带来重复，幂等性（PID + Sequence Number）与事务是 Kafka 的官方解法。',
      points: [
        '重复根因：ack 后网络抖动导致重发，或消费后未及时提交 offset',
        '幂等性：enable.idempotence=true，Broker 按 PID + 分区内递增序列号去重',
        '幂等作用范围：单生产者会话 + 单分区，重启后 PID 失效',
        'Kafka 0.11 起幂等默认开启；彻底去重需业务幂等（唯一键/去重表）',
        '事务 API：initTransactions/beginTransaction/commitTransaction，实现多分区原子写入',
        '端到端 exactly-once = 生产者事务 + 消费者 read_committed + offset 事务提交'
      ],
      code: { lang: 'java', title: '事务生产者',
        src: `properties.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
properties.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "tx-001");

producer.initTransactions();
try {
    producer.beginTransaction();
    producer.send(new ProducerRecord<>("topic-a", "a1"));
    producer.send(new ProducerRecord<>("topic-b", "b1"));
    producer.commitTransaction();  // 原子提交多分区
} catch (Exception e) {
    producer.abortTransaction();   // 全部回滚
}` }
    },
    { id: '20', title: 'Kafka 生产者 - 数据有序', duration: '02:12',
      summary: 'Kafka 只保证单分区有序，跨分区不保证；开启幂等后即可在单分区实现严格 FIFO。',
      points: [
        '顺序语义：单分区内消息严格有序，多分区间无全局顺序',
        '设计要点：有顺序要求的业务实体固定 key，确保路由到同一分区',
        'max.in.flight.requests.per.connection 默认 5：未开启幂等时乱序风险来源于重试',
        '开启幂等后，Broker 按序列号拒绝乱序与重复请求，即使并发 5 也有序',
        '分区扩容（增加分区数）会打破 key 与分区的映射，有序业务慎扩容'
      ] },
    { id: '21', title: 'Kafka 生产者 - 数据乱序', duration: '04:48',
      summary: '乱序根因是「请求超时后的重试导致后发先至」，幂等性是 Kafka 官方的一站式解法。',
      points: [
        '乱序场景：第一批超时重试，第二批先到达 Broker，先写后到',
        '解法一（推荐）：开启幂等，Broker 按 Sequence Number 保证分区内顺序',
        '解法二：max.in.flight.requests.per.connection ≤ 5 且开启幂等',
        '解法三：retries=0 关闭重试可保序，但牺牲可靠性，不推荐',
        '结论：开幂等 = 同时获得去重 + 保序，一行配置双重收益'
      ] }
  ]
});
