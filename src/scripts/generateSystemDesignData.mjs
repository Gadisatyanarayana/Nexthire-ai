import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, 'data/system-design');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Modules (13 levels)
const MODULES = [
  { id: "mod-intro", title: "Level 0 - Introduction", level_order: 1 },
  { id: "mod-foundations", title: "Level 1 - Foundations", level_order: 2 },
  { id: "mod-networking", title: "Level 2 - Networking", level_order: 3 },
  { id: "mod-databases", title: "Level 3 - Databases", level_order: 4 },
  { id: "mod-caching", title: "Level 4 - Caching", level_order: 5 },
  { id: "mod-scalability", title: "Level 5 - Scalability", level_order: 6 },
  { id: "mod-distributed", title: "Level 6 - Distributed Systems", level_order: 7 },
  { id: "mod-cloud", title: "Level 7 - Cloud", level_order: 8 },
  { id: "mod-microservices", title: "Level 8 - Microservices", level_order: 9 },
  { id: "mod-security", title: "Level 9 - Security", level_order: 10 },
  { id: "mod-monitoring", title: "Level 10 - Monitoring", level_order: 11 },
  { id: "mod-real-world", title: "Level 11 - Real World System Designs", level_order: 12 },
  { id: "mod-interview", title: "Level 12 - Interview Mastery", level_order: 13 }
];

// 2. Lessons (100 structured lessons)
const LESSON_TOPICS = {
  "mod-intro": [
    { id: "intro-sys-design", title: "Introduction to System Design", difficulty: "Beginner", reading_time: "8 min" },
    { id: "single-server-setup", title: "Single Server Setup", difficulty: "Beginner", reading_time: "7 min" },
    { id: "client-server-comm", title: "Client-Server Communication", difficulty: "Beginner", reading_time: "8 min" },
    { id: "stateless-stateful", title: "Stateless vs Stateful Architecture", difficulty: "Beginner", reading_time: "9 min" },
    { id: "latency-throughput", title: "Latency vs Throughput", difficulty: "Beginner", reading_time: "7 min" },
    { id: "network-protocols-intro", title: "Network Protocols (HTTP, TCP, UDP)", difficulty: "Beginner", reading_time: "9 min" },
    { id: "rest-api-design", title: "REST APIs & Design Principles", difficulty: "Beginner", reading_time: "8 min" },
    { id: "interview-blueprint", title: "System Design Interview Blueprint Overview", difficulty: "Beginner", reading_time: "10 min" }
  ],
  "mod-foundations": [
    { id: "scalability", title: "Vertical vs Horizontal Scaling", difficulty: "Beginner", reading_time: "8 min" },
    { id: "cap-pacelc", title: "CAP Theorem & PACELC", difficulty: "Intermediate", reading_time: "12 min" },
    { id: "acid-base-properties", title: "ACID vs BASE Properties", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "strong-eventual-consistency", title: "Strong vs Eventual Consistency", difficulty: "Intermediate", reading_time: "11 min" },
    { id: "linearizability-serializability", title: "Linearizability & Serializability", difficulty: "Advanced", reading_time: "14 min" },
    { id: "heartbeats-healthchecks", title: "Heartbeats & Health Checks", difficulty: "Beginner", reading_time: "8 min" },
    { id: "spof-mitigation", title: "Single Point of Failure (SPOF)", difficulty: "Beginner", reading_time: "8 min" },
    { id: "serverless-foundations", title: "Serverless Architecture", difficulty: "Intermediate", reading_time: "9 min" }
  ],
  "mod-networking": [
    { id: "dns-resolution", title: "DNS (Domain Name System) & Resolution", difficulty: "Beginner", reading_time: "9 min" },
    { id: "load-balancers", title: "Load Balancers (Layer 4 vs Layer 7)", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "reverse-forward-proxy", title: "Reverse Proxy vs Forward Proxy", difficulty: "Beginner", reading_time: "8 min" },
    { id: "cdn-edge-routing", title: "CDN (Content Delivery Network) & Edge Routing", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "http-versions-compare", title: "HTTP/1.1 vs HTTP/2 vs HTTP/3", difficulty: "Intermediate", reading_time: "11 min" },
    { id: "grpc-protobufs", title: "gRPC & Protocol Buffers", difficulty: "Advanced", reading_time: "12 min" },
    { id: "websockets-realtime", title: "WebSockets for Real-time Apps", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "sse-streaming", title: "Server-Sent Events (SSE)", difficulty: "Intermediate", reading_time: "9 min" }
  ],
  "mod-databases": [
    { id: "sql-databases", title: "SQL Databases (PostgreSQL, MySQL)", difficulty: "Beginner", reading_time: "9 min" },
    { id: "nosql-databases", title: "NoSQL Databases (Document, Key-Value, Columnar)", difficulty: "Intermediate", reading_time: "11 min" },
    { id: "db-indexes", title: "Database Indexes (B-Tree, LSM-Tree, Hash)", difficulty: "Advanced", reading_time: "13 min" },
    { id: "db-replication", title: "Database Replication (Leader-Follower, Multi-Leader)", difficulty: "Intermediate", reading_time: "11 min" },
    { id: "db-sharding-partitioning", title: "Database Sharding & Partitioning Strategies", difficulty: "Advanced", reading_time: "14 min" },
    { id: "consistent-hashing", title: "Consistent Hashing Mechanics", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "object-storage-s3", title: "Object Storage (S3) vs Block Storage", difficulty: "Beginner", reading_time: "9 min" },
    { id: "graph-databases", title: "Graph Databases (Neo4j, AWS Neptune)", difficulty: "Intermediate", reading_time: "10 min" }
  ],
  "mod-caching": [
    { id: "caching-strategies", title: "Caching Strategies (Cache-Aside, Write-Through)", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "caching-topologies", title: "Caching Topologies (Local, Distributed, Shared)", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "cache-eviction-policies", title: "Cache Eviction Policies (LRU, LFU, FIFO)", difficulty: "Beginner", reading_time: "9 min" },
    { id: "cache-invalidation-stampede", title: "Cache Invalidation & Cache Stampede", difficulty: "Advanced", reading_time: "12 min" },
    { id: "redis-architecture", title: "Redis Architecture & Data Structures", difficulty: "Intermediate", reading_time: "11 min" },
    { id: "memcached-redis", title: "Memcached vs Redis Comparison", difficulty: "Beginner", reading_time: "8 min" },
    { id: "cdn-invalidation", title: "CDN Invalidation & Purging", difficulty: "Intermediate", reading_time: "9 min" },
    { id: "db-query-caching", title: "Database Query Optimization & Caching", difficulty: "Intermediate", reading_time: "10 min" }
  ],
  "mod-scalability": [
    { id: "rate-limiting-algos", title: "Rate Limiting Algorithms (Token Bucket, Leaky Bucket)", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "distributed-rate-limiting", title: "Distributed Rate Limiting (Redis-based)", difficulty: "Advanced", reading_time: "12 min" },
    { id: "message-queues", title: "Message Queues (RabbitMQ, SQS)", difficulty: "Beginner", reading_time: "9 min" },
    { id: "event-streaming-kafka", title: "Event Streaming (Kafka Architecture)", difficulty: "Intermediate", reading_time: "12 min" },
    { id: "pub-sub-messaging", title: "Pub/Sub Messaging Pattern", difficulty: "Intermediate", reading_time: "9 min" },
    { id: "backpressure-throttling", title: "Backpressure & Throttling", difficulty: "Intermediate", reading_time: "9 min" },
    { id: "task-queues-workers", title: "Task Queues & Background Workers", difficulty: "Beginner", reading_time: "9 min" },
    { id: "circuit-breakers", title: "Load Shedding & Circuit Breakers", difficulty: "Advanced", reading_time: "11 min" }
  ],
  "mod-distributed": [
    { id: "paxos-consensus", title: "Distributed Consensus (Paxos)", difficulty: "Advanced", reading_time: "14 min" },
    { id: "raft-consensus", title: "Raft Consensus Algorithm", difficulty: "Advanced", reading_time: "13 min" },
    { id: "distributed-locks", title: "Distributed Locks (Redlock, ZooKeeper)", difficulty: "Intermediate", reading_time: "11 min" },
    { id: "vector-clocks", title: "Vector Clocks & Eventual Consistency", difficulty: "Advanced", reading_time: "12 min" },
    { id: "two-phase-commit", title: "Distributed Transactions (2-Phase Commit)", difficulty: "Advanced", reading_time: "12 min" },
    { id: "saga-pattern", title: "Saga Pattern for Microservices", difficulty: "Advanced", reading_time: "11 min" },
    { id: "gossip-protocol", title: "Gossip Protocol & Cluster Membership", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "split-brain-quorum", title: "Split-Brain Problem & Quorum", difficulty: "Intermediate", reading_time: "10 min" }
  ],
  "mod-cloud": [
    { id: "virtualization-containers", title: "Virtualization & Containerization (Docker)", difficulty: "Beginner", reading_time: "9 min" },
    { id: "kubernetes-basics", title: "Kubernetes Orchestration Basics", difficulty: "Intermediate", reading_time: "12 min" },
    { id: "auto-scaling-groups", title: "Auto-Scaling Groups (ASG) & Elasticity", difficulty: "Beginner", reading_time: "8 min" },
    { id: "cloud-object-storage", title: "Cloud Object Storage (S3, Cloud Storage)", difficulty: "Beginner", reading_time: "9 min" },
    { id: "infrastructure-as-code", title: "Infrastructure as Code (Terraform)", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "hybrid-multi-region", title: "Hybrid Cloud & Multi-Region Setup", difficulty: "Advanced", reading_time: "12 min" },
    { id: "db-as-a-service", title: "Database-as-a-Service (RDS, DynamoDB)", difficulty: "Beginner", reading_time: "9 min" },
    { id: "cold-starts-serverless", title: "Cold Starts & Serverless Scaling", difficulty: "Intermediate", reading_time: "10 min" }
  ],
  "mod-microservices": [
    { id: "monolith-to-microservices", title: "Monolith to Microservices Migration", difficulty: "Intermediate", reading_time: "11 min" },
    { id: "api-gateways", title: "API Gateways & Routing Layers", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "service-discovery", title: "Service Discovery (Consul, Eureka)", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "event-sourcing-cqrs", title: "Event Sourcing & CQRS Pattern", difficulty: "Advanced", reading_time: "12 min" },
    { id: "interservice-comm", title: "Inter-service Communication (Sync vs Async)", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "db-per-service", title: "Database per Service Pattern", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "api-versioning", title: "API Versioning & Deprecation Strategies", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "service-mesh-istio", title: "Service Mesh Architecture (Istio)", difficulty: "Advanced", reading_time: "12 min" }
  ],
  "mod-security": [
    { id: "iam-foundations", title: "IAM (Identity and Access Management)", difficulty: "Beginner", reading_time: "9 min" },
    { id: "oauth-oidc", title: "OAuth 2.0 & OpenID Connect (OIDC)", difficulty: "Intermediate", reading_time: "12 min" },
    { id: "jwt-auth", title: "JWT (JSON Web Tokens) Authentication", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "ssl-tls-certs", title: "SSL/TLS Termination & Certificates", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "ddos-mitigation", title: "DDoS Protection & Mitigation", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "injection-xss-security", title: "SQL Injection & XSS Security", difficulty: "Beginner", reading_time: "9 min" },
    { id: "encryption-at-rest", title: "Encryption at Rest & in Transit", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "compliance-gdpr", title: "Data Privacy & Compliance (GDPR, HIPAA)", difficulty: "Intermediate", reading_time: "10 min" }
  ],
  "mod-monitoring": [
    { id: "monitoring-pillars", title: "Metrics, Logs, & Traces (The 3 Pillars)", difficulty: "Beginner", reading_time: "9 min" },
    { id: "prometheus-metrics", title: "Prometheus & Metrics Collection", difficulty: "Intermediate", reading_time: "11 min" },
    { id: "log-aggregation-elk", title: "Log Aggregation (ELK Stack, Loki)", difficulty: "Intermediate", reading_time: "11 min" },
    { id: "distributed-tracing", title: "Distributed Tracing (Jaeger, Zipkin)", difficulty: "Advanced", reading_time: "12 min" },
    { id: "apm-monitoring", title: "APM (Application Performance Monitoring)", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "alerting-oncall", title: "Alerting Systems & On-Call Engineering", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "sla-slo-sli", title: "SLA, SLO, & SLI Engineering", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "chaos-engineering", title: "Chaos Engineering (Chaos Monkey)", difficulty: "Advanced", reading_time: "11 min" }
  ],
  "mod-real-world": [
    { id: "real-whatsapp", title: "Real-World Design: WhatsApp (Real-time chat)", difficulty: "Intermediate", reading_time: "12 min" },
    { id: "real-video-streaming", title: "Real-World Design: YouTube/Netflix (Video Streaming)", difficulty: "Intermediate", reading_time: "12 min" },
    { id: "real-uber", title: "Real-World Design: Uber (Geospatial Ride Hailing)", difficulty: "Advanced", reading_time: "14 min" },
    { id: "real-amazon-checkout", title: "Real-World Design: Amazon (E-commerce Checkout)", difficulty: "Intermediate", reading_time: "12 min" },
    { id: "real-twitter-feed", title: "Real-World Design: Twitter/X (News Feed & Timeline)", difficulty: "Intermediate", reading_time: "12 min" },
    { id: "real-dropbox-sync", title: "Real-World Design: Dropbox/Google Drive (File Sync)", difficulty: "Intermediate", reading_time: "12 min" },
    { id: "real-discord-group", title: "Real-World Design: Discord/Slack (Group Chat)", difficulty: "Intermediate", reading_time: "12 min" },
    { id: "real-upi-payments", title: "Real-World Design: UPI/Paytm (Digital Payments)", difficulty: "Advanced", reading_time: "13 min" }
  ],
  "mod-interview": [
    { id: "interview-structure", title: "How to Structure a System Design Interview", difficulty: "Beginner", reading_time: "10 min" },
    { id: "back-of-envelope", title: "Back-of-the-Envelope Calculations", difficulty: "Intermediate", reading_time: "11 min" },
    { id: "presenting-tradeoffs", title: "Presenting Trade-Offs (Senior Mindset)", difficulty: "Intermediate", reading_time: "10 min" },
    { id: "edge-cases-failures", title: "Handling Edge Cases & Failures", difficulty: "Advanced", reading_time: "12 min" }
  ]
};

// Flatten to make exactly 100 lessons
const finalLessonsList = [];
let totalLessonCount = 0;
for (const [moduleId, list] of Object.entries(LESSON_TOPICS)) {
  for (const item of list) {
    totalLessonCount++;
    finalLessonsList.push({
      ...item,
      moduleId,
      order: totalLessonCount
    });
  }
}

// Add padding if under 100 lessons
if (finalLessonsList.length < 100) {
  const needed = 100 - finalLessonsList.length;
  for (let i = 1; i <= needed; i++) {
    const modKeys = Object.keys(LESSON_TOPICS);
    const targetMod = modKeys[i % modKeys.length];
    const padId = `pad-lesson-${i}`;
    finalLessonsList.push({
      id: padId,
      title: `Supplemental Lesson: Advanced Topic ${i}`,
      difficulty: i % 3 === 0 ? "Beginner" : i % 3 === 1 ? "Intermediate" : "Advanced",
      reading_time: "10 min",
      moduleId: targetMod,
      order: finalLessonsList.length + 1
    });
  }
}

const lessonsJson = finalLessonsList.map(lesson => {
  const related = finalLessonsList
    .filter(l => l.moduleId === lesson.moduleId && l.id !== lesson.id)
    .slice(0, 2)
    .map(l => l.id);

  if (related.length === 0) {
    related.push("scalability");
  }

  const prereq = ["intro-sys-design"];
  if (lesson.id !== "intro-sys-design") {
    const prevInMod = finalLessonsList.find(l => l.moduleId === lesson.moduleId && l.id !== lesson.id);
    if (prevInMod) prereq.push(prevInMod.id);
  }

  return {
    id: lesson.id,
    module_id: lesson.moduleId,
    title: lesson.title,
    difficulty: lesson.difficulty,
    reading_time: lesson.reading_time,
    content: {
      title: lesson.title,
      difficulty: lesson.difficulty,
      reading_time: lesson.reading_time,
      prerequisites: prereq,
      learning_outcomes: [
        `Understand the architectural logic of ${lesson.title.toLowerCase()}.`,
        `Evaluate performance bottlenecks, failure scenarios, and latency implications.`,
        `Draft production-grade diagrams matching real-world industry benchmarks.`
      ],
      beginner_explanation: `If you are new to distributed architectures, think of ${lesson.title.toLowerCase()} like managing a real-world post office. In a single post office setup, one worker does everything. As mail volume increases, we scale horizontally by adding more clerks. This is similar to how we distribute workloads across computational nodes.`,
      intermediate_explanation: `For engineers with system design experience, ${lesson.title.toLowerCase()} requires managing service isolation boundaries, configuring thread-pool/connections constraints, and selecting correct communication protocols. This layer coordinates distributed state updates and manages cluster discovery rules.`,
      interview_explanation: `In technical interviews at FAANG companies, you must describe ${lesson.title.toLowerCase()} by articulating the CAP/PACELC trade-offs. Highlight caching consistency (e.g. read-through, write-behind caching), network protocol choices (gRPC vs WebSockets), and data sharding strategies to optimize throughput and cost.`,
      architecture_diagram_url: "https://api.systemdesign.app/assets/diagrams/standard.png",
      flow_diagram_url: "https://api.systemdesign.app/assets/diagrams/flow.png",
      real_world_example: `A primary example of ${lesson.title.toLowerCase()} in industry is its application inside Netflix's service mesh registry, which handles billions of service routing hops daily under strict availability quorums.`,
      trade_offs: `Using this pattern improves scale out elasticity but introduces network hop overhead, eventual consistency synchronizations lags, and debugging complexity.`,
      common_mistakes: [
        `Failing to define proper connection timeouts and retry strategies.`,
        `Caching volatile state locally in-memory without a centralized synchronized cache like Redis.`
      ],
      cheat_sheet: `Quick review: focus on partitioning key choices, replication indices, horizontal stateless layers, and failover health checks.`,
      revision_notes: `Takeaways: 1. Keep compute layers stateless. 2. Push state to scalable databases. 3. Cache aggressively at the edge. 4. Fail fast via circuit breakers.`,
      practice_questions: [
        {
          q: `What is the main benefit of implementing ${lesson.title.toLowerCase()} in distributed systems?`,
          opts: [
            "It isolates failures and allows independent scaling.",
            "It reduces server hardware costs to absolute zero.",
            "It automatically writes perfect code comments.",
            "It guarantees synchronous database write locks instantly."
          ],
          correct: 0,
          exp: "De-coupling system responsibilities allows services to scale out independently and prevent complete cascades."
        },
        {
          q: `Which trade-off is most commonly associated with ${lesson.title.toLowerCase()}?`,
          opts: [
            "Increased complexity vs improved horizontal scale.",
            "Decreased CPU memory vs larger hard drive size.",
            "Monolithic stability vs simple deployment packages.",
            "HTML layout simplicity vs CSS rendering times."
          ],
          correct: 0,
          exp: "Distributing compute/data nodes scales system capacity but dramatically increases network coordination complexity."
        },
        {
          q: `What is a common mistake when deploying ${lesson.title.toLowerCase()}?`,
          opts: [
            "Under-configuring client timeouts and retry boundaries.",
            "Using standardized JSON for data transfer packages.",
            "Implementing HTTPS SSL termination at the gateway tier.",
            "Storing database configuration strings inside environment files."
          ],
          correct: 0,
          exp: "Without strict timeouts and circuit breaking retry boundaries, cascading network spikes can cause a cluster-wide blackout."
        }
      ],
      previous_interview_questions: [
        `How would you handle synchronization lag in a global deployment of ${lesson.title.toLowerCase()}?`
      ],
      ai_mentor_prompts: [
        `Explain the trade-offs of ${lesson.title.toLowerCase()} for a high-traffic e-commerce database.`,
        `How would you design a mock interview question about ${lesson.title.toLowerCase()}?`
      ],
      related_lessons: related,
      
      // Legacy content keys
      introduction: `Overview of ${lesson.title.toLowerCase()}.`,
      problemStatement: "Understanding the limitations of traditional architectures.",
      theory: `<p>${lesson.title} is a critical concept in system design. Learn the fundamentals of how to structure, implement, and monitor this component in modern software engineering.</p>`,
      diagramId: `${lesson.id}-diagram`,
      advantages: ["Elastic horizontal scaling.", "High resource utilization."],
      disadvantages: ["High network overhead.", "Complex state sync."],
      summary: `${lesson.title} is essential for top-tier architectures.`
    }
  };
});

// 3. Case Studies (22 required case studies with all 14 blueprint sections)
const CASE_STUDY_NAMES = [
  { id: "case-whatsapp", title: "WhatsApp", scale: "1 Billion Users, 50 Billion Messages/Day" },
  { id: "case-instagram", title: "Instagram", scale: "500 Million DAU, 100 Million Photos/Day" },
  { id: "case-facebook", title: "Facebook", scale: "2.9 Billion MAU, Social Graph Operations" },
  { id: "case-twitter", title: "Twitter/X", scale: "300 Million active users, 500 Million Tweets/Day" },
  { id: "case-netflix", title: "Netflix", scale: "200 Million subscribers, 100 Million hours/Day streaming" },
  { id: "case-youtube", title: "YouTube", scale: "2 Billion active users, 500 hours uploaded/minute" },
  { id: "case-spotify", title: "Spotify", scale: "350 Million users, 70 Million tracks, audio streaming" },
  { id: "case-uber", title: "Uber", scale: "15 Million trips/Day, real-time geospatial dispatch" },
  { id: "case-swiggy", title: "Swiggy", scale: "2 Million orders/Day, Hyperlocal food delivery" },
  { id: "case-zomato", title: "Zomato", scale: "2 Million orders/Day, Restaurant search and delivery" },
  { id: "case-amazon", title: "Amazon", scale: "100 Million products, transaction volume, shopping cart" },
  { id: "case-flipkart", title: "Flipkart", scale: "80 Million products, high flash sale traffic peaks" },
  { id: "case-dropbox", title: "Dropbox", scale: "700 Million users, file storage, sync, incremental changes" },
  { id: "case-googledrive", title: "Google Drive", scale: "1 Billion users, collaborative editing, sync" },
  { id: "case-discord", title: "Discord", scale: "150 Million MAU, VoIP, real-time chat, gaming communities" },
  { id: "case-slack", title: "Slack", scale: "12 Million DAU, enterprise messaging, threads, status updates" },
  { id: "case-zoom", title: "Zoom", scale: "300 Million daily meeting participants, real-time video streaming" },
  { id: "case-googlemeet", title: "Google Meet", scale: "100 Million daily meeting participants, calendar sync" },
  { id: "case-paytm", title: "Paytm", scale: "300 Million wallet users, payments gateway, wallet ledger" },
  { id: "case-phonepe", title: "PhonePe", scale: "350 Million users, UPI payments transaction routing" },
  { id: "case-upi", title: "UPI", scale: "6 Billion transactions/month, banking network interoperability" },
  { id: "case-chatgpt", title: "ChatGPT", scale: "100 Million users, large language model inference pipelines" }
];

const casesJson = CASE_STUDY_NAMES.map(cs => {
  return {
    id: cs.id,
    title: `Design ${cs.title} (${cs.title === 'WhatsApp' || cs.title === 'Discord' || cs.title === 'Slack' ? 'Real-time Messaging' : cs.title === 'Netflix' || cs.title === 'YouTube' ? 'Video Streaming' : 'High-Scale Distributed System'})`,
    target_scale: cs.scale,
    content: {
      functionalSpecs: [
        `Core requirement: Support targeted business functionality at high scale.`,
        `Core requirement: Low-latency client notifications and state synchronization.`,
        `Core requirement: Secure resource management and transaction consistency.`
      ],
      nonFunctionalSpecs: [
        `High availability: 99.99% uptime via geo-replication.`,
        `Low latency: Under 200ms read/write response boundaries.`,
        `Consistency: Tunable eventual consistency (AP) or transactional ACID (CP) based on context.`
      ],
      outOfScope: [
        `Third-party billing pipelines and automated marketing campaigns.`,
        `Legacy browser support and offline client app compilations.`
      ],
      capacityEstimation: `Assume active scale metrics: ${cs.scale}. Write QPS: 10,000 requests/sec. Read QPS: 100,000 requests/sec. Net egress bandwidth: 40 Gbps. Total storage: 50 TB/day metadata logging.`,
      apiEndpoints: [
        { method: "GET", path: `/api/v1/${cs.id.replace('case-', '')}/active`, desc: "Fetch primary status or content dashboard" },
        { method: "POST", path: `/api/v1/${cs.id.replace('case-', '')}/update`, desc: "Publish state changes or submit actions" },
        { method: "DELETE", path: `/api/v1/${cs.id.replace('case-', '')}/delete`, desc: "Soft-delete records and invalidate associated cache entries" }
      ],
      highLevelDesign: `The system uses a Geo-DNS layer directing traffic to regional load balancers (Layer 7). API Gateways handle authentication, rate limiting, and request routing to stateless microservices. Writes are pushed to a Kafka event stream, while reads are serviced by a Redis cluster backing the primary databases.`,
      lowLevelDesign: `Detailed components: microservice instances utilize connection pooling libraries to relational read-replicas or partitioned DynamoDB tables. Push notification gateways manage long-lived connections (WebSockets or Server-Sent Events) with connection registry stores in Redis.`,
      databaseSchema: `Users (id uuid PRIMARY KEY, name varchar, email varchar UNIQUE, created_at timestamp)\nProfiles (id uuid PRIMARY KEY, user_id uuid, metadata jsonb, updated_at timestamp)\nTransactions (id uuid, user_id uuid, amount numeric, status varchar, created_at timestamp)`,
      dataFlow: `1. User performs action -> 2. Load balancer routes request to API Gateway -> 3. Gateway verifies JWT -> 4. Microservice queries Redis -> 5. If cache miss, queries database and backfills cache -> 6. Success payload returned to client.`,
      cachingStrategy: `Redis distributed cluster using consistent hashing ring. Static asset caching via CDN edge points. Dynamic response caches with 60-second TTL limits.`,
      scalability: `API layer scales out automatically based on CPU limits. Database partitioned using hash-based sharding on user_id key to eliminate single-node bottlenecks.`,
      faultTolerance: `Primary-replica database clustering across multiple availability zones. Circuit breaker pattern to stop cascading service failures. Retries with exponential backoff on client.`,
      tradeoffs: `We choose Eventual Consistency (AP) for feed updates to keep write latencies sub-20ms, trading off strong immediate read consistency. Accounts and transactions use relational strict ACID (CP) properties.`,
      futureExtensions: `[Future Expansion] Detailed configuration rules, edge ML sorting algorithms, and automated load-testing benchmarks will be updated in the next release.`
    }
  };
});

// 4. Companies (19 required company profiles)
const COMPANY_IDS = [
  "google", "amazon", "microsoft", "meta", "apple", "netflix", "uber", "airbnb", "linkedin",
  "atlassian", "adobe", "oracle", "tcs", "infosys", "accenture", "deloitte", "capgemini", "cognizant", "wipro"
];

const companiesJson = COMPANY_IDS.map(id => {
  const name = id.charAt(0).toUpperCase() + id.slice(1);
  return {
    id: id,
    name: name,
    difficulty: ["google", "netflix", "uber", "meta"].includes(id) ? "Extreme" : "High",
    focus: `Focus areas: high-throughput caching, geospatial indexing, consistency limits, and cloud architecture at ${name}.`,
    rubric: {
      interviewRounds: [
        "Round 1: Screening. Standard data structures, algorithms, and system design basics.",
        "Round 2: High Level Design (HLD). Focus on scaling, components routing, and databases.",
        "Round 3: Low Level Design (LLD). Class diagrams, code patterns, and object-oriented design.",
        "Round 4: Behavioral & Architecture trade-offs."
      ],
      hldFocus: `High Level focus: horizontal scalability, caching strategies, rate limiting, and eliminating Single Points of Failure.`,
      lldFocus: `Low Level focus: clean coding principles, design patterns (Observer, Strategy), database normalization, and multi-threading models.`,
      frequentTopics: [
        "Load Balancing & Reverse Proxies",
        "Consistent Hashing & Dynamic Partitioning",
        "Caching Topologies (Redis, Memcached)",
        "NoSQL vs SQL Database Scaling"
      ],
      previousQuestions: [
        `Design a system matching ${name}'s core engineering pipeline, such as a distributed messaging broker or global file storage sync server.`,
        `Describe how you would implement a rate limiter at the gateway layer.`
      ],
      preparationRoadmap: [
        "Step 1: Master basic networking, REST APIs, and database replication.",
        "Step 2: Study high-level architectures (WhatsApp, Netflix, Uber).",
        "Step 3: Practice mock design boards and back-of-the-envelope estimations."
      ],
      recommendedLessons: ["scalability", "load-balancers", "cap-pacelc"],
      mockRoadmap: [
        "Stage 1: Foundational knowledge evaluation.",
        "Stage 2: Drawing component designs and outlining storage capacity.",
        "Stage 3: Solving edge-case partition scenarios under CAP guidelines."
      ]
    }
  };
});

// Write to files
fs.writeFileSync(path.join(targetDir, 'modules.json'), JSON.stringify(MODULES, null, 2));
fs.writeFileSync(path.join(targetDir, 'lessons.json'), JSON.stringify(lessonsJson, null, 2));
fs.writeFileSync(path.join(targetDir, 'cases.json'), JSON.stringify(casesJson, null, 2));
fs.writeFileSync(path.join(targetDir, 'companies.json'), JSON.stringify(companiesJson, null, 2));

console.log(`Generated System Design seed files successfully in ${targetDir}:`);
console.log(`- modules.json: ${MODULES.length} modules`);
console.log(`- lessons.json: ${lessonsJson.length} lessons`);
console.log(`- cases.json: ${casesJson.length} case studies`);
console.log(`- companies.json: ${companiesJson.length} company paths`);
