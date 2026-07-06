export type Lesson = {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  readingTime: string;
  objectives: string[];
  takeaways: string[];
  theory: string;
  diagramId: string;
  advantages: string[];
  disadvantages: string[];
  tradeoffs: string;
  mistakes: string[];
  bestPractices: string[];
  interviewQuestions: Array<{ q: string; a: string; expectations: string }>;
  quiz: Array<{ q: string; opts: string[]; correct: number; exp: string }>;
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type CaseStudy = {
  id: string;
  title: string;
  targetScale: string;
  functionalSpecs: string[];
  nonFunctionalSpecs: string[];
  capacityEstimation: string;
  diagramId: string;
  highLevelDesign: string;
  lowLevelDesign: string;
  databaseSchema: string;
  apiEndpoints: Array<{ method: string; path: string; desc: string }>;
  tradeoffs: string;
};

export type GlossaryTerm = {
  term: string;
  definition: string;
  explanation: string;
  example: string;
};

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: "Scalability",
    definition: "The capability of a system to handle a growing amount of work by adding resources.",
    explanation: "It represents a system's ability to maintain high throughput and low latencies as request volume increases. It is typically achieved through vertical scaling (adding hardware resources to a single node) or horizontal scaling (adding nodes to a pool).",
    example: "Spinning up 10 extra AWS EC2 instances behind a load balancer during Black Friday sales."
  },
  {
    term: "CAP Theorem",
    definition: "A theorem stating that a distributed data store can simultaneously provide at most two out of three guarantees: Consistency, Availability, and Partition Tolerance.",
    explanation: "Because physical networks are prone to partitions (network failures or latency spikes), Partition Tolerance (P) is mandatory. Hence, distributed systems must trade off either Consistency (returning errors or waiting for sync) or Availability (allowing reads/writes on partitioned nodes, which leads to stale data).",
    example: "Cassandra operates as an AP system (eventual consistency), whereas HBase acts as a CP system (strong consistency)."
  },
  {
    term: "Consistent Hashing",
    definition: "A special hashing scheme where the addition or removal of hash table slots does not significantly alter the mapping of keys to slots.",
    explanation: "In standard hashing (e.g. hash(key) % N), changing the server count N requires remapping almost all keys. Consistent hashing maps both keys and servers to a circular ring (0 to 2^32-1). Keys are routed to the first server encountered clockwise, reducing cache invalidation upon server auto-scaling.",
    example: "Used in Amazon's DynamoDB database router and Memcached client sharding layers."
  },
  {
    term: "CQRS",
    definition: "Command Query Responsibility Segregation separates read and write operations into distinct models.",
    explanation: "Writes (Commands) mutate state and are processed through transaction-heavy databases. Reads (Queries) query highly optimized read-replicas or caches. This decouples read/write scaling properties and simplifies complex domain models.",
    example: "An e-commerce site where orders are written to MySQL, but catalog search queries are run against Elasticsearch."
  },
  {
    term: "Distributed Lock",
    definition: "A mechanism used to coordinate access to shared resources among multiple processes in a distributed system.",
    explanation: "Unlike in-memory local mutexes, a distributed lock must be accessible across multiple microservice nodes. It is typically implemented using strong-consistency distributed stores with lease expirations to prevent deadlocks on node crashes.",
    example: "Implementing Redlock in Redis or utilizing locks in Apache ZooKeeper."
  }
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "case-whatsapp",
    title: "Design WhatsApp / Messenger (Real-time Messaging)",
    targetScale: "1 Billion Active Users, 50 Billion Messages/Day",
    functionalSpecs: [
      "One-on-one text messages and status indicators (online, offline, typing).",
      "Message delivery receipts (Sent, Delivered, Read).",
      "Group chat functionality (up to 500 members)."
    ],
    nonFunctionalSpecs: [
      "Ultra-low latency message delivery (under 500ms).",
      "High reliability (no message loss).",
      "Message synchronization across multiple user devices."
    ],
    capacityEstimation: "Assuming 1B active users. Active connections: 50M concurrent. Message size: ~1KB. Total storage: 50B messages * 1KB = 50TB/day. Bandwidth: 50B messages * 1KB / 86400 seconds ≈ 578MB/s upload.",
    diagramId: "whatsapp-architecture",
    highLevelDesign: "Clients maintain long-lived WebSocket connections to a Gateway/Chat Server pool. A Message Service handles packet routing. If the recipient is offline, messages are stored in a database queues. A Presence Service tracks users' status via heartbeat keepalives.",
    lowLevelDesign: "WebSocket gateway servers route incoming message frames to Kafka topics. A cluster of message-routing microservices handles decryption, delivery notifications, and database logging. User routing information (mapping user_id to WS gateway IP) is cached in Redis.",
    databaseSchema: "Users (id, phone, status, last_seen)\nMessages (id, sender_id, recipient_id, content, status, created_at)\nGroup_Members (group_id, user_id, joined_at)",
    apiEndpoints: [
      { method: "POST", path: "/api/v1/auth/login", desc: "User phone registration and OTP verification" },
      { method: "POST", path: "/api/v1/groups", desc: "Create a chat group with selected user IDs" },
      { method: "GET", path: "/api/v1/messages/sync", desc: "Fetch offline messages since timestamp" }
    ],
    tradeoffs: "Trade off strong message sequencing across devices for write availability. Using DynamoDB/Cassandra wide-column schema allows instant appends, but can result in out-of-order message packets on poor networks."
  },
  {
    id: "case-tinyurl",
    title: "Design a URL Shortener (TinyURL)",
    targetScale: "100 Million URLs generated / day, 10 Billion Reads / month",
    functionalSpecs: [
      "Convert a long URL to a unique 6-character short key.",
      "Redirect user from short URL to original URL (302 Redirect).",
      "Custom alias creation and expiration settings."
    ],
    nonFunctionalSpecs: [
      "High availability (no redirect downtime).",
      "Sub-10ms redirect latency.",
      "Prevent lookup collisions."
    ],
    capacityEstimation: "Writes: 100M/day ≈ 1,160 QPS. Reads: 10B/month ≈ 3,850 QPS. Short URL size: ~500B. Storage for 5 years: 100M * 365 * 5 * 500B = 91TB.",
    diagramId: "tinyurl-architecture",
    highLevelDesign: "Client triggers write query -> Load Balancer routes to API server -> API server pulls pre-generated short key from Key Generation Service (KGS) -> Stores long-to-short mapping in NoSQL DB -> Client gets redirect URL. Client triggers read -> API server checks Redis cache -> Redirects if hit, otherwise queries DB.",
    lowLevelDesign: "The Key Generation Service (KGS) pre-generates unique 6-character keys (using Base62: [a-zA-Z0-9]). It loads keys in memory chunks to prevent database collisions. Write databases use DynamoDB partitioned by the short key.",
    databaseSchema: "URL_Mapping (short_key varchar PRIMARY KEY, original_url text, user_id uuid, expires_at timestamp)",
    apiEndpoints: [
      { method: "POST", path: "/api/v1/shorten", desc: "Shorten a long URL, returns short key" },
      { method: "GET", path: "/:shortKey", desc: "Redirect to original URL" }
    ],
    tradeoffs: "Choosing 302 Redirect over 301 Redirect. 302 (Found/Temporary) forces clients to ping our API server every time, enabling analytics tracking. 301 (Moved Permanently) is cached by browsers, reducing server load but blocking telemetry."
  }
];

export const MODULES: Module[] = [
  {
    id: "mod-foundations",
    title: "1. Distributed System Foundations",
    lessons: [
      {
        id: "scalability",
        title: "Vertical vs Horizontal Scaling",
        difficulty: "Beginner",
        readingTime: "8 min",
        objectives: [
          "Understand the physical bounds of vertical scaling.",
          "Analyze the structural requirements of horizontal scaling.",
          "Identify when to scale out versus scaling up."
        ],
        takeaways: [
          "Vertical scaling increases hardware capacity; horizontal scaling adds physical machines.",
          "Stateless application servers are crucial for horizontal scaling.",
          "Load balancers distribute user traffic across stateless node arrays."
        ],
        theory: "Vertical scaling (scaling up) means upgrading server hardware (e.g., adding more RAM, higher CPU cores to a single machine). While simple because it requires no architectural shifts, it hits physical hardware limits and introduces a Single Point of Failure (SPOF). Horizontal scaling (scaling out) adds more machines to a resource pool. This permits massive scale but requires distributed state, consensus protocols, and load distribution layers.",
        diagramId: "scaling-diagram",
        advantages: [
          "Vertical scaling is extremely easy to implement without code rewrites.",
          "Horizontal scaling allows practically infinite scaling potential.",
          "Horizontal scaling eliminates SPOF (Single Point of Failure)."
        ],
        disadvantages: [
          "Vertical scaling is bounded by motherboard and chip boundaries.",
          "Horizontal scaling introduces network latency and synchronization overhead.",
          "Debugging distributed bugs is highly complex."
        ],
        tradeoffs: "Trading off simplicity for elasticity. Vertical scaling is simpler and has no cluster latency but hits a hard wall. Horizontal scaling is complex but offers limitless auto-scaling bounds.",
        mistakes: [
          "Keeping user session states locally in server memory while horizontally scaling.",
          "Over-provisioning hardware capacity during low-traffic periods."
        ],
        bestPractices: [
          "Move session states to a centralized Redis cache.",
          "Establish auto-scaling policies based on CPU and Request Queue sizes."
        ],
        interviewQuestions: [
          {
            q: "How would you migrate a legacy monolithic app that stores local user uploads on its drive to scale horizontally?",
            a: "Decouple the storage layer. Instead of keeping files on local drives, push uploads to an S3-compatible cloud object store, and query metadata from a shared database cluster.",
            expectations: "Demonstrate understanding of stateless app servers and decoupling storage layers."
          }
        ],
        quiz: [
          {
            q: "Which scaling method naturally resolves single points of failure without redundant nodes?",
            opts: ["Vertical Scaling", "Horizontal Scaling", "Memory Partitioning", "CPU Core Threading"],
            correct: 1,
            exp: "Horizontal scaling operates across a pool of nodes, meaning if one fails, others handle the requests."
          }
        ]
      },
      {
        id: "cap-pacelc",
        title: "CAP Theorem & PACELC",
        difficulty: "Intermediate",
        readingTime: "12 min",
        objectives: [
          "Evaluate Consistency vs Availability tradeoffs.",
          "Explain PACELC extension for normal latency trade-offs.",
          "Map popular databases to their CAP theorem categories."
        ],
        takeaways: [
          "In a network partition, you must choose either Consistency (C) or Availability (A).",
          "PACELC describes how systems behave during normal operations: Latency (L) vs Consistency (C).",
          "There is no system that is 100% Consistent, Available, and Partition-Tolerant."
        ],
        theory: "CAP Theorem asserts that a distributed system can guarantee at most two out of three characteristics: Consistency (all nodes see the same data at the same time), Availability (every non-failing node returns a response), and Partition Tolerance (the system continues to operate despite packet loss or node failures). PACELC extends this: if there is a Partition (P), trade-off Availability (A) vs Consistency (C); Else (E), trade-off Latency (L) vs Consistency (C).",
        diagramId: "cap-diagram",
        advantages: [
          "Allows architects to select storage layers tailored for domain requirements.",
          "Enforces deliberate SLA setting."
        ],
        disadvantages: [
          "No AP database can guarantee real-time absolute consistency.",
          "CP databases can drop connections on partition events."
        ],
        tradeoffs: "Consistency vs Latency. If you want strong consistency, you must wait for data replication, which increases user response latency.",
        mistakes: [
          "Assuming that a database labeled as 'CP' can never experience inconsistency on misconfigured quorums."
        ],
        bestPractices: [
          "Define database configuration values (Read/Write quorums) explicitly.",
          "Use eventual consistency for high-throughput social/chat apps."
        ],
        interviewQuestions: [
          {
            q: "Why is Cassandra considered an AP database, and how can we make it temporarily CP?",
            a: "Cassandra allows any node to take writes/reads (highly available). By using quorum settings (R + W > N, e.g. reading/writing to a majority of replicas), we can enforce strong consistency, making it operate like CP.",
            expectations: "Knowledge of database quorums (R, W, N) and tunable consistency."
          }
        ],
        quiz: [
          {
            q: "What does the 'L' stand for in the PACELC theorem?",
            opts: ["Latency", "Load Balancing", "Layering", "Logging"],
            correct: 0,
            exp: "PACELC stands for: Partition (P) -> Availability (A) vs Consistency (C); Else (E) -> Latency (L) vs Consistency (C)."
          }
        ]
      }
    ]
  },
  {
    id: "mod-networking",
    title: "2. Networking & Load Balancing",
    lessons: [
      {
        id: "load-balancers",
        title: "Load Balancers (Layer 4 vs Layer 7)",
        difficulty: "Intermediate",
        readingTime: "10 min",
        objectives: [
          "Distinguish Layer 4 (Transport) from Layer 7 (Application) routing.",
          "Understand SSL termination mechanics.",
          "Compare common load balancing algorithms."
        ],
        takeaways: [
          "Layer 4 load balancers route packets using TCP/UDP port info without payload decryption.",
          "Layer 7 load balancers decrypt HTTP headers, enabling URL path and cookie routing.",
          "SSL termination offloads CPU-intensive encryption tasks from app servers."
        ],
        theory: "Load balancers distribute traffic across servers. Layer 4 balancers operate at the transport layer (TCP/UDP). They route packets based on IP addresses and port numbers without inspecting application payloads, making them extremely fast and lightweight. Layer 7 balancers operate at the application layer (HTTP/HTTPS/gRPC). They inspect the payload, allowing smart content-based routing (e.g., routing by URL path, headers, cookies, or HTTP method) at the cost of cryptographic termination overhead.",
        diagramId: "lb-diagram",
        advantages: [
          "L4 has lower resource usage and high network throughput.",
          "L7 enables smart URL-path routing, header filtering, and rate limiting."
        ],
        disadvantages: [
          "L4 cannot perform cookie-based session stickiness.",
          "L7 requires certificate maintenance and consumes high CPU for decrypting packages."
        ],
        tradeoffs: "Speed vs Control. Choose Layer 4 for maximum raw package transit speed. Choose Layer 7 for complex business routing rules.",
        mistakes: [
          "Failing to handle load balancer IP address changes in client DNS caches."
        ],
        bestPractices: [
          "Offload SSL termination at the load balancer or reverse proxy tier.",
          "Set up active health checks to drop dead nodes automatically."
        ],
        interviewQuestions: [
          {
            q: "How does a Layer 7 load balancer support sticky sessions?",
            a: "It injects a custom HTTP cookie or reads a session cookie from incoming request headers. It maps this session key to a specific backend server IP in its routing table.",
            expectations: "Explain cookie inspection and backend routing maps."
          }
        ],
        quiz: [
          {
            q: "Which protocol layer does NGINX typically run in when doing URL path-based routing?",
            opts: ["Layer 3 (Network)", "Layer 4 (Transport)", "Layer 7 (Application)", "Layer 2 (Data Link)"],
            correct: 2,
            exp: "URL path-based routing requires inspecting the HTTP payload, which is Layer 7."
          }
        ]
      }
    ]
  }
];
