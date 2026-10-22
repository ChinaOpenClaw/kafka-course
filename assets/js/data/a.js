/* ============ 第1-3章：课程简介 / 概述 / 快速入门（课时 01-09） ============ */
window.CHAPTERS = window.CHAPTERS || [];
window.CHAPTERS.push({
  id: 'ch1', icon: '🎬', title: '课程简介',
  lessons: [
    { id: '01', title: '尚硅谷Kafka课程简介', duration: '05:00',
      summary: '本课程系统讲解 Apache Kafka 全链路知识：从基础概念与架构原理，到生产者、Broker、消费者三大核心，再到监控、KRaft、生态集成、调优与源码剖析，配套完整实操环境。',
      points: [
        '课程定位：Kafka 是由 Scala/Java 编写的高吞吐分布式消息队列与流式处理平台，是实时数仓、日志采集、流式计算的核心组件',
        '前置基础：Java SE、Linux 常用命令、Maven 基础，无需大数据经验',
        '学习路线：概述 → 入门 → 生产者 → Broker → 消费者 → 监控 → KRaft → 集成 → 调优 → 源码',
        '配套环境：CentOS 7 + JDK 8 + Zookeeper + Kafka 2.4.1 + MySQL + Flume + Kafka-Eagle',
        '课程特点：原理 + 实操 + 每日复盘 + 面试点拨，96 课时循序渐进'
      ] }
  ]
});
window.CHAPTERS.push({
  id: 'ch2', icon: '📚', title: 'Kafka 概述',
  lessons: [
    { id: '02', title: 'Kafka 概述 - 定义', duration: '06:22', chart: 'compare',
      summary: 'Kafka 最初由 LinkedIn 开发，2011 年开源并贡献给 Apache 基金会，如今是分布式消息队列与流式处理平台的事实标准之一。',
      points: [
        '定义：Apache Kafka 是一个分布式流处理平台（Distributed Streaming Platform），被广泛用于高吞吐数据管道、流式分析、数据集成与关键任务应用',
        '三大核心能力：① 消息系统（发布-订阅）② 存储系统（持久化到磁盘、支持回溯）③ 流处理（Kafka Streams）',
        '高吞吐来源：顺序写磁盘 + 零拷贝 + 页缓存 + 批量压缩，单机可达百万级 TPS',
        '常与 Flink、Spark 等计算引擎集成构建实时数仓',
        '核心术语：Producer / Consumer / Broker / Topic / Partition / Replica / Offset / ConsumerGroup'
      ],
      table: { head: ['特性', 'Kafka', 'RabbitMQ', 'RocketMQ'], rows: [
        ['定位', '高吞吐流处理平台', '传统消息代理', '金融级业务消息'],
        ['吞吐量', '百万级 TPS', '万级 TPS', '十万级 TPS'],
        ['消息保留', '按保留策略持久化', '消费即删', '按策略保留'],
        ['消费模式', 'Pull', 'Push', 'Push/Pull'],
        ['典型场景', '日志/流计算/数仓', '业务解耦/RPC', '交易/订单']
      ] },
      cases: [{ title: 'MQ 消息中间件梳理', source: 'IMA知识库 · JAVA高级架构',
        desc: '系统性梳理为什么使用消息队列、Kafka/ActiveMQ/RabbitMQ/RocketMQ 优缺点与选型面试要点。' }]
    },
    { id: '03', title: 'Kafka 概述 - 消息队列应用场景', duration: '07:36',
      summary: '消息队列两大核心场景为异步处理与流量削峰，并延伸出解耦、广播、数据中转等七种经典用法。以下案例来自 IMA 知识库真实技术文章。',
      points: [
        '异步处理：注册送券、积分、短信等非核心流程异步化，显著降低接口响应时间',
        '流量削峰：秒杀/大促瞬时流量先写入 MQ，下游按自身能力消费，保护数据库',
        '应用解耦：订单、库存、物流系统通过 Topic 解耦，独立演进',
        '数据中转：Kafka 作为日志、CDC/binlog、IoT 设备数据的枢纽，对接 Flink/Spark 做实时计算'
      ],
      cases: [
        { title: '消息队列的七种经典应用场景', source: 'IMA知识库 · Java3y',
          desc: '异步&解耦、消峰、消息总线、延时任务、广播消费、分布式事务、数据中转枢纽，结合电商用户服务等真实经历展开。' },
        { title: '疫情数据统计推送机器人', source: 'IMA知识库 · 阿里云开发者社区',
          desc: 'Python 爬取疫情数据 → 阿里云 Kafka → Serverless 函数计算定时推送到企业微信，典型的 Serverless + Kafka 数据管道。' },
        { title: '我的运维日志系统构建之路', source: 'IMA知识库 · 51CTO专栏',
          desc: '从 Rsyslog、Kafka 到 ELK 组件构建实时运维日志系统：Kafka 承担日志流缓冲与解耦的关键角色。' },
        { title: '智联开源 IoT 物联网平台', source: 'IMA知识库 · 物联网小黑',
          desc: '云边端架构中设备数据经 MQTT/Kafka 接入，实现高并发设备通信与规则引擎。' }
      ]
    },
    { id: '04', title: 'Kafka 概述 - 消息队列两种模式', duration: '03:48',
      summary: '消息队列的两种经典模式为点对点与发布订阅；Kafka 通过「Topic + 消费者组」机制同时兼容两种语义。',
      points: [
        '点对点模式（Queue）：消息只被一个消费者消费，消费后确认删除，一对一语义',
        '发布订阅模式（Topic）：消息被多个订阅者各自消费，一对多语义，消息按保留策略清理',
        'Kafka 的消费者组机制：同一组内一条消息只被一个实例消费（点对点语义）；不同消费者组互不影响各自全量消费（发布订阅语义）',
        '与 RabbitMQ 的差异：RabbitMQ 通过 Exchange 类型（direct/fanout/topic）区分模式，Kafka 用消费者组统一抽象'
      ],
      table: { head: ['维度', '点对点模式', '发布订阅模式'], rows: [
        ['消费方式', '一对一', '一对多'],
        ['消息删除', '消费确认后删除', '按保留策略清理'],
        ['消费者关系', '竞争消费', '各自独立'],
        ['Kafka 对应', '组内单消费者', '多消费者组'],
        ['典型场景', '任务分发', '事件广播']
      ] }
    },
    { id: '05', title: 'Kafka 概述 - 基础架构', duration: '09:40', diagram: 'arch-basic', image: 'assets/img/img-overview.png',
      summary: 'Kafka 基础架构由 Producer、Broker 集群、Consumer 及 ZooKeeper（2.x）组成，Topic 与 Partition 是理解并行度的关键。',
      points: [
        'Producer：消息生产者，将消息发送到指定 Topic',
        'Broker：已部署的 Kafka 服务器节点，一个 Broker 可容纳多个 Topic 的多个分区',
        'Topic：消息的逻辑分类，可跨 Broker 分布',
        'Partition：Topic 的物理分片，有序不可变的消息序列，是并行存储与消费的单位',
        'Replication：分区副本，分为 Leader（读写入口）与 Follower（同步备份）',
        'ZooKeeper（2.x）：管理 Broker 注册、Topic 元数据、Controller 选举；3.x 起由 KRaft 替代'
      ] }
  ]
});
window.CHAPTERS.push({
  id: 'ch3', icon: '🚀', title: 'Kafka 快速入门',
  lessons: [
    { id: '06', title: 'Kafka 入门 - 安装 Kafka', duration: '15:37',
      summary: '在 Linux 环境安装 JDK、Zookeeper 与 Kafka，理解目录结构，完成单机部署。',
      points: [
        '前置依赖：JDK 8+、Zookeeper 3.4.x+（Kafka 2.4.1 双模式，2.8+ 可纯 KRaft）',
        '下载 kafka_2.13-2.4.1.tgz 并解压到 /opt/module 目录',
        '目录结构：bin（脚本）、config（配置）、libs（依赖 jar）、site-docs（文档）',
        '版本选择：学习选 2.4.1（ZK 模式）；生产环境建议评估 3.x（KRaft 模式）',
        '关闭防火墙或放行 9092 端口，配置 hostname 映射便于集群实验'
      ],
      code: { lang: 'bash', title: '解压与目录概览',
        src: `# 上传安装包并解压
tar -zxvf kafka_2.13-2.4.1.tgz -C /opt/module/
cd /opt/module/kafka_2.13-2.4.1
ls
# bin  config  libs  licenses  site-docs  LICENSE  NOTICE  README.md` }
    },
    { id: '07', title: 'Kafka 入门 - 启动停止脚本', duration: '04:34',
      summary: '掌握 Zookeeper 与 Kafka 的后台启动、日志查看与停止脚本，理解 server.properties 关键配置。',
      points: [
        '启动 Zookeeper：bin/zookeeper-server-start.sh -daemon config/zookeeper.properties',
        '启动 Kafka：bin/kafka-server-start.sh -daemon config/server.properties',
        '停止：kafka-server-stop.sh / zookeeper-server-stop.sh',
        '日志位置：logs/server.log，启动失败首先看日志',
        '关键配置：broker.id（全局唯一）、log.dirs、zookeeper.connect、listeners=PLAINTEXT://:9092'
      ],
      code: { lang: 'bash', title: '启动与停止',
        src: `# 1. 后台启动 Zookeeper
bin/zookeeper-server-start.sh -daemon config/zookeeper.properties

# 2. 后台启动 Kafka
bin/kafka-server-start.sh -daemon config/server.properties

# 3. 查看启动日志
tail -f logs/server.log

# 4. 停止
bin/kafka-server-stop.sh
bin/zookeeper-server-stop.sh` }
    },
    { id: '08', title: 'Kafka 入门 - Topic 命令', duration: '10:59',
      summary: '使用 kafka-topics.sh 完成 Topic 的创建、查看、修改与删除，理解分区与副本因子参数。',
      points: [
        '创建：--create --topic 名称 --partitions 分区数 --replication-factor 副本因子',
        '查看：--list 列表；--describe 详情（含分区、Leader、ISR、AR）',
        '修改：--alter 只能增加分区数，不能减少',
        '删除：--delete（需确认 delete.topic.enable=true）',
        '分区数规划：分区是并行度单位，分区数 ≥ 消费者组内消费者数量才能充分并行',
        '副本因子 ≤ Broker 数量；常见为 3 保证容错'
      ],
      code: { lang: 'bash', title: 'Topic 常用命令',
        src: `# 创建 Topic（3 分区 2 副本）
bin/kafka-topics.sh --bootstrap-server hadoop102:9092 \\
  --create --topic first --partitions 3 --replication-factor 2

# 查看 Topic 列表与详情
bin/kafka-topics.sh --bootstrap-server hadoop102:9092 --list
bin/kafka-topics.sh --bootstrap-server hadoop102:9092 \\
  --describe --topic first

# 修改分区数为 6
bin/kafka-topics.sh --bootstrap-server hadoop102:9092 \\
  --alter --topic first --partitions 6

# 删除 Topic
bin/kafka-topics.sh --bootstrap-server hadoop102:9092 --delete --topic first` }
    },
    { id: '09', title: 'Kafka 入门 - 命令行操作', duration: '05:10',
      summary: '使用控制台生产者与消费者快速验证消息收发，是调试 Kafka 最顺手的工具。',
      points: [
        'kafka-console-producer.sh：交互式或文件输入发送消息',
        'kafka-console-consumer.sh：消费消息，--from-beginning 从最早开始',
        '--group 指定消费者组，用于验证组内竞争消费',
        '--max-messages 限制消费条数，--offset 指定起始位移，--partition 指定分区',
        '可配合 --property print.offset=true 打印消息 offset 便于观察'
      ],
      code: { lang: 'bash', title: '控制台收发',
        src: `# 生产消息
bin/kafka-console-producer.sh --bootstrap-server hadoop102:9092 --topic first

# 消费消息（从头）
bin/kafka-console-consumer.sh --bootstrap-server hadoop102:9092 \\
  --topic first --from-beginning

# 指定消费者组 + 打印 offset
bin/kafka-console-consumer.sh --bootstrap-server hadoop102:9092 \\
  --topic first --group test-group --property print.offset=true` }
    }
  ]
});
