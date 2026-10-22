/* ============ 第9章：每日回顾·消费者篇 + 第10章：监控 + 第11章：KRaft（课时 59-65） ============ */
window.CHAPTERS.push({
  id: 'ch9', icon: '🔁', title: '每日回顾 · 消费者篇',
  lessons: [
    { id: '59', title: '每日回顾（上）', duration: '17:16',
      summary: '第二阶段复盘：副本机制、文件存储、消费者核心，串起 Broker 存储与消费全链路。',
      points: [
        '副本体系全景：AR/ISR/OSR + LEO/HW + Leader/Follower 故障处理',
        '文件存储：segment 三件套、稀疏索引、清除策略对比',
        '消费者：pull 模式、消费者组、组初始化六步流程',
        '分配器三兄弟：Range / RoundRobin / Sticky 的公式与适用场景',
        '面试题：__consumer_offsets 的结构与 Coordinator 定位算法'
      ] },
    { id: '60', title: '每日回顾（下）', duration: '17:42',
      summary: '承接上文深挖 offset 管理、事务与积压治理，补齐消费端最后一块拼图。',
      points: [
        'offset 提交三种方式的取舍与生产最佳实践',
        'seek / offsetsForTimes 重放补数实操复盘',
        '消费者事务与 read_committed 对端到端 exactly-once 的意义',
        '数据积压排查树：并行度 → 热点 → 下游 → 消费逻辑',
        '面试题：Kafka 如何保证不丢不重？分生产端与消费端分别回答'
      ] }
  ]
});
window.CHAPTERS.push({
  id: 'ch10', icon: '📊', title: 'Kafka 监控',
  lessons: [
    { id: '61', title: 'Kafka 监控 - MySQL 环境准备', duration: '04:32',
      summary: 'Kafka-Eagle 将监控数据落库 MySQL，先准备数据库与授权账号。',
      points: [
        '安装 MySQL/MariaDB 并启动',
        '创建数据库 kafka_eagle（UTF-8）',
        '创建账号并授权远程访问',
        'Kafka-Eagle 首次启动会自动建表'
      ],
      code: { lang: 'sql', title: '建库授权',
        src: `CREATE DATABASE kafka_eagle DEFAULT CHARACTER SET utf8;
CREATE USER 'ke'@'%' IDENTIFIED BY 'Ke123456';
GRANT ALL PRIVILEGES ON kafka_eagle.* TO 'ke'@'%';
FLUSH PRIVILEGES;` }
    },
    { id: '62', title: 'Kafka 监控 - Kafka 环境准备', duration: '02:22',
      summary: '确保 Kafka 集群正常启动、JMX 端口可达，并创建监控用 Topic。',
      points: [
        '确认三节点 Kafka 全部启动，9092 端口互通',
        'JMX 端口 9999 供 Kafka-Eagle 采集',
        '创建 test topic 用于观察消费组与 lag',
        'Kafka-Eagle 通过 ZK 连接（2.x），确认 2181 端口可达'
      ] },
    { id: '63', title: 'Kafka 监控 - Kafka-Eagle 安装', duration: '06:38',
      summary: '下载解压 Kafka-Eagle，配置集群别名与数据库连接，执行启动脚本。',
      points: [
        '解压 kafka-eagle-bin 到 /opt/module，设置 KE_HOME',
        '配置 system-config.properties：kafka.eagle.zk.cluster.alias 与数据库连接',
        '修改 bin/ke.sh 中 JAVA_HOME 与日志路径',
        'bin/ke.sh start 启动，访问 8048 端口',
        '默认账号密码 keadmin/keadmin123，登录后先改密'
      ],
      code: { lang: 'bash', title: 'Kafka-Eagle 配置',
        src: `# KE_HOME 环境变量
export KE_HOME=/opt/module/kafka-eagle

# conf/system-config.properties 关键项
kafka.eagle.zk.cluster.alias=cluster1
kafka.eagle.zk.cluster.zookeeper=hadoop102:2181,hadoop103:2181,hadoop104:2181
kafka.eagle.driver=com.mysql.cj.jdbc.Driver
kafka.eagle.url=jdbc:mysql://hadoop102:3306/kafka_eagle?useUnicode=true&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull&useSSL=false
kafka.eagle.username=ke
kafka.eagle.password=Ke123456

bin/ke.sh start   # 启动，访问 http://hadoop102:8048/ke` }
    },
    { id: '64', title: 'Kafka 监控 - Kafka-Eagle 监控页面', duration: '05:07',
      summary: 'Kafka-Eagle 提供 Topic 管理、消费者组 lag、Broker 概览与告警，是中小集群的可视化利器。',
      points: [
        'Topic 模块：列表、创建、详情（分区/Leader/ISR）、消息预览',
        'Consumers 模块：消费者组、分区 lag、堆积告警',
        'Brokers 模块：节点状态、吞吐、请求统计',
        'Alert：lag 阈值告警，支持邮件/钉钉/微信',
        '生产替代：大规模集群推荐 Prometheus + Grafana + JMX Exporter'
      ] }
  ]
});
window.CHAPTERS.push({
  id: 'ch11', icon: '⚡', title: 'Kafka Kraft 模式',
  lessons: [
    { id: '65', title: 'Kafka - Kraft 模式', duration: '14:57', diagram: 'kraft',
      summary: 'KRaft 用 Raft 协议的 Controller 集群替代 ZooKeeper，解决元数据扩展性瓶颈，是 Kafka 的未来。',
      points: [
        '动机：ZK 元数据写入瓶颈（分区/ Topic 规模受限）、运维双系统复杂、控制器切换慢',
        '架构：Controller 节点组成 Raft Quorum，通过 __cluster_metadata 日志同步元数据',
        '角色：combined 模式（broker+controller 一体）与分离模式',
        '优势：元数据吞吐提升、秒级故障切换、部署仅需 Kafka 一套系统',
        'Kafka 3.3+ KRaft 生产可用，3.5 后新功能仅 KRaft 提供',
        '迁移路径：ZK 集群 → KRaft 需滚动升级，社区提供迁移工具'
      ],
      table: { head: ['维度', 'ZK 模式', 'KRaft 模式'], rows: [
        ['元数据存储', 'ZooKeeper', '__cluster_metadata（Raft 日志）'],
        ['控制器切换', '秒级~十秒级', '秒级（Raft 选举）'],
        ['元数据规模', '受 ZK 限制', '可扩展至百万分区'],
        ['运维组件', 'ZK + Kafka 双系统', '仅 Kafka']
      ] }
    }
  ]
});
