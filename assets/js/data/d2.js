/* ============ 第12章：Kafka 生态集成（课时 66-74） ============ */
window.CHAPTERS.push({
  id: 'ch12', icon: '🔗', title: 'Kafka 生态集成', image: 'assets/img/img-integration.png',
  lessons: [
    { id: '66', title: 'Kafka 集成 - Flume 环境准备', duration: '07:44',
      summary: 'Flume 是高可用日志采集系统，先掌握 source-channel-sink 组件模型再谈与 Kafka 对接。',
      points: [
        'Flume 三大组件：Source（采集）、Channel（缓冲）、Sink（输出）',
        '事件（Event）载体：Header + Body',
        'agent 配置：a1.sources / a1.sinks / a1.channels 段式结构',
        'Channel 选型：MemoryChannel 快不稳，FileChannel 稳但慢，KafkaChannel 兼顾',
        '安装解压即用，JDK 8 环境'
      ] },
    { id: '67', title: 'Kafka 集成 - Flume 生产者', duration: '09:01',
      summary: 'Flume 作为 Kafka 的生产者，把采集的日志实时写入 Topic，是日志入湖的标准链路。',
      points: [
        'KafkaSink 配置：bootstrap.servers、topic、batchSize',
        'topic 可静态指定，也可用 %{topic} 从 Event Header 动态取',
        'kafka-flume-ng-sink 依赖 jar 需放入 plugins 目录',
        '配合 MemoryChannel 高吞吐，FileChannel 保证不丢',
        '典型链路：exec/log4j source → channel → Kafka sink → 实时计算'
      ],
      code: { lang: 'bash', title: 'Flume → Kafka',
        src: `# flume-kafka.conf
a1.sources = r1
a1.sinks = k1
a1.channels = c1

a1.sources.r1.type = netcat
a1.sources.r1.bind = hadoop102
a1.sources.r1.port = 44444

a1.channels.c1.type = memory

a1.sinks.k1.type = org.apache.flume.sink.kafka.KafkaSink
a1.sinks.k1.bootstrap.servers = hadoop102:9092,hadoop103:9092
a1.sinks.k1.topic = flume-log
a1.sinks.k1.batchSize = 100

# 启动：bin/flume-ng agent -n a1 -c conf -f conf/flume-kafka.conf` }
    },
    { id: '68', title: 'Kafka 集成 - Flume 消费者', duration: '06:58',
      summary: 'Kafka 作为 Flume 的 Source，把 Topic 数据转发到 HDFS 等存储，完成数仓落盘。',
      points: [
        'KafkaSource：topics、groupId、batchSize、batchDurationMillis',
        '下游接 HDFS Sink：按时间滚动文件（%Y-%m-%d/%H）',
        '配合 FileChannel 保证故障不丢',
        '典型链路：Kafka → Flume → HDFS → Hive 离线数仓',
        '与 Flink 直读 Kafka 的分工：Flume 偏采集路由，Flink 偏计算'
      ],
      code: { lang: 'bash', title: 'Kafka → Flume → HDFS',
        src: `a1.sources.r1.type = org.apache.flume.source.kafka.KafkaSource
a1.sources.r1.topics = flume-log
a1.sources.r1.groupId = flume-hdfs
a1.sources.r1.batchSize = 500

a1.sinks.k1.type = hdfs
a1.sinks.k1.hdfs.path = /logs/%Y-%m-%d/%H
a1.sinks.k1.hdfs.fileType = DataStream
a1.sinks.k1.hdfs.writeFormat = Text
a1.sinks.k1.hdfs.rollInterval = 60
a1.sinks.k1.hdfs.rollSize = 134217728` }
    },
    { id: '69', title: 'Kafka 集成 - Flink 生产者', duration: '10:16',
      summary: 'FlinkKafkaProducer 支持 at-least-once 与 exactly-once 两种语义，事务写入依赖 Flink Checkpoint。',
      points: [
        'Flink Kafka Connector：flink-connector-kafka',
        '语义三档：AT_LEAST_ONCE / EXACTLY_ONCE / NONE',
        'EXACTLY_ONCE：Checkpoint 时统一提交 Kafka 事务',
        '关键配置：transactional.id.prefix、transaction.timeout.ms',
        'producer.setWriteTimestampToKafka 控制是否透传事件时间',
        '调优：批量与压缩参数，注意背压时的超时设置'
      ],
      code: { lang: 'java', title: 'Flink 写入 Kafka（精确一次）',
        src: `Properties props = new Properties();
props.setProperty("bootstrap.servers", "hadoop102:9092");
props.setProperty("transaction.timeout.ms", "900000");

FlinkKafkaProducer<String> producer = new FlinkKafkaProducer<>(
    "flink-out",
    new SimpleStringSchema(),
    props,
    FlinkKafkaProducer.Semantic.EXACTLY_ONCE);

stream.addSink(producer);` }
    },
    { id: '70', title: 'Kafka 集成 - Flink 消费者', duration: '05:07',
      summary: 'FlinkKafkaConsumer 把 Topic 作为流的数据源，offset 由 Flink Checkpoint 统一管理。',
      points: [
        '起始位置：setStartFromLatest / setStartFromEarliest / setStartFromGroupOffsets',
        'offset 不提交到 Broker，而是快照进 Checkpoint，故障精准恢复',
        '动态分区发现：Kafka Topic 扩容后自动感知新分区',
        '水位线（Watermark）与乱序处理配合事件时间窗口',
        '反压敏感：Kafka 消费速率受下游算子处理能力影响'
      ],
      code: { lang: 'java', title: 'Flink 读取 Kafka',
        src: `KafkaSource<String> source = KafkaSource.<String>builder()
    .setBootstrapServers("hadoop102:9092")
    .setTopics("flink-in")
    .setGroupId("flink-group")
    .setStartingOffsets(OffsetsInitializer.latest())
    .setValueOnlyDeserializer(new SimpleStringSchema())
    .build();

DataStream<String> stream = env.fromSource(source, WatermarkStrategy.noWatermarks(), "kafka-source");` }
    },
    { id: '71', title: 'Kafka 集成 - SpringBoot 生产者', duration: '09:35',
      summary: 'spring-kafka 提供 KafkaTemplate 开箱即用，几行配置即可在 SpringBoot 中生产消息。',
      points: [
        '依赖：spring-kafka-starter，application.yml 配置 spring.kafka',
        'KafkaTemplate.send(record) 默认异步，返回 CompletableFuture',
        'addCallback 处理成功/失败，可接入告警',
        'ProducerFactory 自定义：序列化器、拦截器、分区器',
        '发送结果可结合 ListenableFutureCallback 做补偿'
      ],
      code: { lang: 'yaml', title: 'SpringBoot 配置与发送',
        src: `# application.yml
spring:
  kafka:
    bootstrap-servers: hadoop102:9092,hadoop103:9092,hadoop104:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
      acks: all
      retries: 3
      batch-size: 16384
      properties:
        linger.ms: 20

// 发送
@Autowired
private KafkaTemplate<String, String> kafkaTemplate;

public void send(String msg) {
    kafkaTemplate.send("spring-topic", msg)
        .addCallback(ok -> log.info("发送成功 offset={}", ok.getRecordMetadata().offset()),
                     fail -> log.error("发送失败", fail));
}` }
    },
    { id: '72', title: 'Kafka 集成 - SpringBoot 消费者', duration: '04:12',
      summary: '@KafkaListener 注解声明式消费，配合容器工厂可配置并发、ack 模式与错误处理。',
      points: [
        '@KafkaListener(topics = "xxx") 方法级订阅，自动 rebalance',
        '@KafkaHandler 实现同 Topic 多类型消息分发',
        'ack-mode：MANUAL 手动 ack，适合精确控制位移',
        '并发：ConcurrentKafkaListenerContainerFactory setConcurrency',
        '错误处理：DefaultErrorHandler + 死信队列（DLT）兜底',
        '@Payload / @Header 注解获取消息体与头'
      ],
      code: { lang: 'java', title: 'SpringBoot 消费',
        src: `@KafkaListener(topics = "spring-topic", groupId = "spring-group")
public void listen(ConsumerRecord<String, String> record,
                   @Header(KafkaHeaders.RECEIVED_PARTITION) int partition) {
    log.info("分区={} offset={} value={}", partition, record.offset(), record.value());
    // 业务处理...
}

// 手动 ack 模式（yaml: spring.kafka.listener.ack-mode: MANUAL）
@KafkaListener(topics = "spring-topic")
public void listenWithAck(ConsumerRecord<String, String> record, Acknowledgment ack) {
    try {
        process(record);
        ack.acknowledge();  // 处理成功再提交
    } catch (Exception e) {
        // 进入重试/DLT
    }
}` }
    },
    { id: '73', title: 'Kafka 集成 - Spark 生产者', duration: '08:47',
      summary: 'Structured Streaming 以 format("kafka") 写回 Kafka，checkpoint 保障 exactly-once。',
      points: [
        'writeStream.format("kafka").option("kafka.bootstrap.servers", ...)',
        '必填：topic、checkpointLocation',
        'outputMode：append / update / complete，写 Kafka 仅支持 append/update',
        'exactly-once：依赖 WAL + 幂等 Kafka 生产者',
        'value 列必须为字符串，其他列需先 to_json 序列化'
      ],
      code: { lang: 'scala', title: 'Spark 写 Kafka',
        src: `df.selectExpr("to_json(struct(*)) AS value")
  .writeStream
  .format("kafka")
  .option("kafka.bootstrap.servers", "hadoop102:9092")
  .option("topic", "spark-out")
  .option("checkpointLocation", "/ckpt/spark-out")
  .outputMode("append")
  .start()` }
    },
    { id: '74', title: 'Kafka 集成 - Spark 消费者', duration: '12:39',
      summary: 'Structured Streaming 读取 Kafka 是实时数仓的经典入口，offset 由 checkpoint 精确管理。',
      points: [
        'readStream.format("kafka")，value 为二进制需 cast string',
        'startingOffsets：earliest / latest / JSON 指定分区 offset',
        'kafka.group.id 由 Spark 内部管理，无需手动提交 offset',
        'trigger 控制批次：once / ProcessingTime / Continuous',
        '与 Flink 的取舍：Spark 生态统一，Flink 低延迟与状态更强',
        '典型架构：Kafka → Spark/Flink → Kafka/ClickHouse/Hive 分层'
      ],
      code: { lang: 'scala', title: 'Spark 读 Kafka',
        src: `val df = spark.readStream
  .format("kafka")
  .option("kafka.bootstrap.servers", "hadoop102:9092")
  .option("subscribe", "spark-in")
  .option("startingOffsets", "earliest")
  .option("maxOffsetsPerTrigger", 10000)  // 限流，防止单批过大
  .load()

val lines = df.selectExpr("CAST(value AS STRING)")
  .as[(String, String)]  // (key, value)` }
    }
  ]
});
