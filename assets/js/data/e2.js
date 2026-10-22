/* ============ 第14章：Kafka 源码 + 第15章：课程结束（课时 83-96） ============ */
window.CHAPTERS.push({
  id: 'ch14', icon: '🔬', title: 'Kafka 源码', image: 'assets/img/img-source.png',
  lessons: [
    { id: '83', title: 'Kafka 源码 - 环境准备', duration: '05:36',
      summary: '准备源码阅读环境：选择与课程一致的版本，Gradle 构建，IDEA 导入 clients/core/scala 模块。',
      points: [
        '版本对齐：选用 kafka-2.4.1-src.tgz 与课程讲解一致',
        '构建：gradle build -x test（跳过测试加速）',
        '模块结构：clients（Java 客户端）、core（Scala 服务端）、streams、connect',
        '阅读入口：clients 侧 KafkaProducer/KafkaConsumer，core 侧 KafkaServer',
        '调试技巧：本地起 MiniKafkaCluster / 打端点断点'
      ] },
    { id: '84', title: 'Kafka 源码 - 生产者原理回顾', duration: '02:54',
      summary: '回顾双线程架构与累加器模型，带着地图进源码森林。',
      points: [
        '双线程：main 线程负责拦截/序列化/分区/入缓冲，Sender 负责批量发送',
        'RecordAccumulator 是内存中的核心缓冲区',
        '元数据 Metadata 维护 Topic-Partition-Leader 映射',
        '源码坐标：org.apache.kafka.clients.producer.KafkaProducer'
      ] },
    { id: '85', title: 'Kafka 源码 - 生产者初始化', duration: '24:33',
      summary: 'KafkaProducer 构造器串联全部组件：配置解析、序列化器、分区器、拦截器、累加器、元数据与 Sender 线程。',
      points: [
        '配置解析：ProducerConfig 处理原始配置与默认值',
        '组件装配：partitioner / serializer / interceptor / recordAccumulator',
        'Metadata 初始化并立即触发首次元数据请求',
        'Sender 线程创建：ioMode、accumulator、metadata、client',
        'metric 注册：JMX 指标暴露（发送速率、错误率、批次大小）',
        '拦截器链：ProducerInterceptor 列表按配置顺序串联'
      ] },
    { id: '86', title: 'Kafka 源码 - 生产者发送数据到缓存', duration: '20:14',
      summary: 'doSend 主线程全流程：拦截 → 序列化 → 分区计算 → append 入累加器 → 等待或返回。',
      points: [
        'doSend：拦截器链 onSend → 序列化 key/value',
        '分区计算：partition() 结合元数据分区数与 key',
        'RecordAccumulator.append：按 TopicPartition 找到 deque 追加',
        '批次已满：新建 batch（batch.size）或阻塞等待（max.block.ms）',
        'clusterAndWaitForMetadata：元数据不可用时阻塞等待',
        '返回 RecordAppendResult，Future 由 Sender 完成'
      ] },
    { id: '87', title: 'Kafka 源码 - 生产者 Sender 线程', duration: '14:43',
      summary: 'Sender.run 是生产者的发动机：批量拉取 → 按 Leader 分组 → 发送 → 处理响应。',
      points: [
        'run 循环：drain 批量 → 按 Leader 节点分组 → 构造 ProduceRequest',
        'RequestFuture 机制：异步请求与响应解耦',
        '响应处理：成功唤醒等待 Future，失败按重试策略处理',
        '元数据请求：metadata.max.age.ms 到期主动刷新',
        '背压：inFlight 请求数超限时停止 drain，等待响应',
        '失败重试：retryable 错误进入重试队列重新分组发送'
      ] },
    { id: '88', title: 'Kafka 源码 - 消费者原理回顾', duration: '04:54',
      summary: '回顾消费者双线程与 Coordinator 交互模型，定位核心类。',
      points: [
        '双线程：用户 poll 线程 + ConsumerNetworkClient 心跳线程',
        '核心类：KafkaConsumer / ConsumerCoordinator / Fetcher / SubscriptionState',
        'position：分区下次拉取位置；committed：已提交位置',
        '源码坐标：org.apache.kafka.clients.consumer.KafkaConsumer'
      ] },
    { id: '89', title: 'Kafka 源码 - 消费者初始化', duration: '19:32',
      summary: 'KafkaConsumer 构造装配协调器、拉取器与订阅状态，建立与 Coordinator 的连接准备。',
      points: [
        '组件装配：ConsumerCoordinator（位移管理+组协调）、Fetcher（拉取）、SubscriptionState（订阅状态）',
        'coordinator 查找：sendAllMetadataHeartbeatRequest → 返回 Coordinator 节点',
        'metrics 注册：records-lag-max 等关键指标',
        'interceptors 与 assignors 初始化',
        '此时尚未加入组，首次 poll 时触发加入'
      ] },
    { id: '90', title: 'Kafka 源码 - 消费者订阅主题', duration: '05:15',
      summary: 'subscribe 写入订阅状态，poll 时通过 updateAssignmentMetadata 完成自动分区分配。',
      points: [
        'subscribe(topics)：写入 SubscriptionState，标记需要组协调',
        'poll 内 updateAssignmentMetadata：触发 JoinGroup/SyncGroup',
        'assignor：执行 Range/RoundRobin/Sticky 分配策略',
        'UserConsumer 回调：ConsumerRebalanceListener',
        'assign() 直接指定分区，跳过组协调路径'
      ] },
    { id: '91', title: 'Kafka 源码 - 消费总体流程', duration: '02:58',
      summary: 'pollOnce 是消费的总装线：元数据 → 拉取 → 处理 → position → 提交。',
      points: [
        'pollOnce：先更新元数据与 Coordinator 状态',
        'fetcher.sendFetches：按分配分区发起拉取',
        'CompletedFetch 入队 → parseRecord 反序列化',
        'UserConsumer 执行业务回调，更新 position',
        'maybeAutoCommitOffsets：自动提交判断',
        'poll 返回 ConsumerRecords 批'
      ] },
    { id: '92', title: 'Kafka 源码 - 消费者组初始化流程', duration: '05:59',
      summary: 'JoinGroup → 选组 Leader → SyncGroup 领取分配，generation 代际机制保证安全切换。',
      points: [
        'JoinGroup：所有成员上报订阅信息，等待成员到齐或超时',
        '组 Leader 选举：Broker 选第一个加入者为 Group Leader',
        'Leader 执行 assign 计算分配方案并上报 SyncGroup',
        '普通成员 SyncGroup 领取自己的分区列表',
        'generation +1：旧代请求全部失效，防止脑裂',
        'rebalance 场景：新成员加入、主动离组、会话超时'
      ] },
    { id: '93', title: 'Kafka 源码 - 消费者组拉取和处理数据', duration: '10:08',
      summary: 'Fetcher 与 CompletedFetch 队列协同，完成从网络字节到业务对象的转换。',
      points: [
        'Fetcher.sendFetches：构造 FetchRequest 按 Leader 分组发送',
        'CompletedFetch：缓存拉取结果，累积到 fetch.min.bytes 才返回',
        'parseRecord：按 RecordBatch 格式解析，反序列化 key/value',
        'position 更新与订阅状态机联动',
        '消费速率控制：max.poll.records 限制单批返回数量',
        'unauthorized / offsetOutOfRange 等异常的处理分支'
      ] },
    { id: '94', title: 'Kafka 源码 - 消费者 Offset 提交', duration: '02:52',
      summary: 'commitSync 同步提交与 maybeAutoCommitOffsets 自动提交的源码路径。',
      points: [
        'commitSync：构造 OffsetCommitRequest → Coordinator → 等待响应',
        '失败重试：retryable 错误自动重试，保证提交成功',
        'commitAsync：fire-and-forget，回调中感知结果',
        'maybeAutoCommitOffsets：poll 循环按间隔触发自动提交',
        '位移存储：写入 __consumer_offsets（50 分区）',
        'rebalance 前：onPartitionsRevoked 中同步提交当前位移'
      ] },
    { id: '95', title: 'Kafka 源码 - 服务器端源码', duration: '06:57',
      summary: '服务端从 SocketServer 请求分发到 ReplicaManager 落盘的全链路总览。',
      points: [
        'KafkaServer 启动：broker 注册、创建 SocketServer、启动 Controller',
        'SocketServer：Acceptor 接收连接 → Processor 读写 → RequestChannel 队列',
        'KafkaApis：handleProduceRequest / handleFetchRequest 分发',
        'ReplicaManager：追加日志、更新 ISR 与 HW、延迟 Produce 响应',
        'LogManager：管理分区目录与 segment，日志刷盘策略',
        'Purgatory：延时请求 Watcher，acks=all 的同步等待在此管理'
      ] }
  ]
});
window.CHAPTERS.push({
  id: 'ch15', icon: '🎓', title: '课程结束',
  lessons: [
    { id: '96', title: 'Kafka 课程结束', duration: '01:55',
      summary: '96 课时收官：回顾知识体系，明确进阶路线——Kafka 学习终点恰是实时数仓的起点。',
      points: [
        '知识体系闭环：概述 → 入门 → 生产者 → Broker → 消费者 → 监控 → KRaft → 集成 → 调优 → 源码',
        '进阶方向一：Kafka Streams 轻量流处理',
        '进阶方向二：Flink + Kafka 构建实时数仓（本课程集成章节的延伸）',
        '进阶方向三：KRaft 新特性与云原生 Kafka（AutoMQ 等）',
        '面试高频：为什么快、为什么不丢、为什么不重、积压怎么办',
        '行动建议：搭建 3  Broker 集群完整走一遍服役/退役/压测全流程'
      ] }
  ]
});
