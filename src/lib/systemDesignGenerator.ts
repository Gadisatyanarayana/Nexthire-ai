export type QuizQuestion = {
  id: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export const SYSTEM_DESIGN_TOPICS = [
  "Load Balancing",
  "Caching",
  "Sharding & Partitioning",
  "CAP Theorem",
  "CDN & Edge Computing",
  "Message Queues & Event Streaming",
  "Microservices Architecture",
  "API Gateways",
  "NoSQL vs SQL Databases",
  "Database Consistency",
  "Disaster Recovery & Replication",
  "Distributed Lock Managers",
  "Rate Limiting",
  "Real-time Communication",
  "Distributed Consensus",
  "Bloom Filters & Cardinality",
  "Consistent Hashing",
  "Gossip Protocols",
  "Search Indexes",
  "Video & Audio Streaming"
];

const STATIC_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "sd-static-1",
    topic: "NoSQL vs SQL Databases",
    difficulty: "Medium",
    question: "When designing a highly available, read-heavy video metadata database (like YouTube video profiles), which database type would scale best?",
    options: [
      "Relational Database (e.g., single-node MySQL)",
      "Wide-Column NoSQL Database (e.g., Apache Cassandra)",
      "Graph Database (e.g., Neo4j)",
      "In-memory storage (e.g., Memcached without backing store)"
    ],
    correctAnswer: 1,
    explanation: "Wide-column stores like Cassandra or DynamoDB are masterless, peer-to-peer, and scale horizontally by partitioning keys. They offer extreme availability and write/read scale, making them perfect for petabyte-scale video metadata index queries."
  },
  {
    id: "sd-static-2",
    topic: "Caching",
    difficulty: "Medium",
    question: "Which caching strategy writes data directly to the backing database and cache simultaneously before returning success to the client?",
    options: [
      "Cache-Aside (Lazy loading)",
      "Write-Through",
      "Write-Behind (Write-Back)",
      "Write-Around"
    ],
    correctAnswer: 1,
    explanation: "Write-Through updates the cache and backing store at the same time, preventing data inconsistency at the expense of higher write latency."
  }
];

// Helper to generate a random number within range based on a seed/index
function getValFromIndex<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function generateDynamicSDQuestion(topic: string, index: number): QuizQuestion {
  const companies = ["Netflix", "Uber", "Twitter/X", "Airbnb", "Stripe", "Amazon", "Slack", "Zoom", "Spotify", "Meta", "Instagram", "Reddit"];
  const scales = ["10 Million", "50 Million", "100 Million", "500 Million", "1 Billion"];
  const throughputs = ["10k QPS", "50k QPS", "100k QPS", "500k QPS", "1M QPS"];
  const dataSizes = ["50 TB", "200 TB", "1 PB", "10 PB", "100 PB"];
  const latencies = ["5ms", "10ms", "50ms", "100ms", "250ms"];

  const company = getValFromIndex(companies, index);
  const scale = getValFromIndex(scales, index + 1);
  const throughput = getValFromIndex(throughputs, index + 2);
  const size = getValFromIndex(dataSizes, index + 3);
  const latency = getValFromIndex(latencies, index + 4);

  const difficulties: Array<"Easy" | "Medium" | "Hard"> = ["Easy", "Medium", "Hard"];
  const diff = difficulties[index % 3];
  const id = `sd-dyn-${topic.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}-${index}`;

  switch (topic) {
    case "Load Balancing": {
      const algos = ["Round Robin", "Least Connections", "IP Hash", "Weighted Response Time"];
      const correctAlgo = getValFromIndex(algos, index);
      const question = `Your team is scaling ${company} to support a user volume of ${scale} active connections. To balance the HTTP request workload across the application servers while keeping user sessions sticky to the same server, which Load Balancing algorithm is best?`;
      const options = [
        "Consistent Hashing",
        `IP Hashing (Session Affinity)`,
        "Random Allocation",
        "Least Bandwidth Routing"
      ];
      return {
        id,
        topic,
        difficulty: diff,
        question,
        options,
        correctAnswer: 1,
        explanation: `IP Hashing (Session Affinity) maps client IP addresses to backend servers. This maintains persistent state / session stickiness to the same server without maintaining central session synchronization overhead on each HTTP routing cycle.`
      };
    }
    case "Caching": {
      const evictionPolicies = ["LRU (Least Recently Used)", "LFU (Least Frequently Used)", "FIFO", "TTL-only"];
      const question = `Under a heavy read workload of ${throughput} at ${company}, you need to cache highly dynamic hot data in Redis. The cache database is bounded at ${size}. To optimize memory and evict keys that haven't been read for the longest time, which eviction policy should be active?`;
      const options = [
        "First-In, First-Out (FIFO)",
        "Least Recently Used (LRU)",
        "Least Frequently Used (LFU)",
        "Random Eviction"
      ];
      return {
        id,
        topic,
        difficulty: diff,
        question,
        options,
        correctAnswer: 1,
        explanation: "LRU evicts the items that have not been accessed for the longest duration, which perfectly optimizes memory for temporary hot item reads."
      };
    }
    case "Sharding & Partitioning": {
      const question = `You are database architect for ${company}'s transactional data store containing ${size} of logs. To scale writes horizontally without creating key hotspots or needing centralized range directories, which sharding strategy will scale best?`;
      const options = [
        "Range-based Sharding",
        "Hash-based (Key-based) Sharding",
        "Directory-based Sharding",
        "Vertical table splitting"
      ];
      return {
        id,
        topic,
        difficulty: diff,
        question,
        options,
        correctAnswer: 1,
        explanation: "Hash-based sharding applies a cryptographic hash function to the partition key (e.g. userId) and modulo calculates the shard node index. This evenly distributes data across shards, resolving node hotspotting."
      };
    }
    case "CAP Theorem": {
      const question = `During a network partition between two regions of ${company}'s user DB, a write request arrives in Region A. Under the CAP Theorem, how should a Consistent & Partition-Tolerant (CP) system respond?`;
      const options = [
        "Accept the write in Region A and lazily sync Region B later.",
        "Reject the write or return an error to ensure Region B remains strictly consistent.",
        "Disable network interfaces and reboot all servers.",
        "Redirect the client traffic to a local cache store."
      ];
      return {
        id,
        topic,
        difficulty: diff,
        question,
        options,
        correctAnswer: 1,
        explanation: "To preserve Consistency (C) when a network partition (P) occurs, the database must refuse write/read transactions in the partitioned nodes to prevent returning conflicting data states across the systems."
      };
    }
    case "Rate Limiting": {
      const question = `To prevent API scraping and denial-of-service attempts at ${company} (supporting ${throughput}), you need an algorithm that handles traffic bursts but enforces a strict average rate over time. Which algorithm is best suited?`;
      const options = [
        "Fixed Window Counter",
        "Token Bucket Algorithm",
        "Sliding Window Log",
        "Exponential Backoff Queue"
      ];
      return {
        id,
        topic,
        difficulty: diff,
        question,
        options,
        correctAnswer: 1,
        explanation: "The Token Bucket algorithm accumulates tokens in a bucket at a set rate. When request bursts occur, tokens are consumed instantly. Once empty, requests are rejected, enforcing a strict average limit while permitting dynamic bursts."
      };
    }
    case "Consistent Hashing": {
      const question = `When scaling ${company}'s caching layer to support ${scale} users, you add and remove cache nodes dynamically. To minimize keys moved during server membership changes, which routing approach should you implement?`;
      const options = [
        "Modulo Hashing (hash(key) % N)",
        "Consistent Hashing Ring with Virtual Nodes",
        "Round-Robin Load Routing",
        "Directory-based lookup routing"
      ];
      return {
        id,
        topic,
        difficulty: diff,
        question,
        options,
        correctAnswer: 1,
        explanation: "Consistent Hashing maps both keys and server nodes to a circular hash ring. When a server is added or removed, only a fraction of keys (K/N) are remapped. Virtual nodes prevent partition size imbalances."
      };
    }
    default: {
      // General system design template
      const question = `Your engineering team is designing the system architecture for ${company}'s new microservices hub. To ensure latencies below ${latency} and accommodate ${scale} daily active users, which protocol should be deployed for internal RPC communications?`;
      const options = [
        "SOAP XML API protocol",
        "gRPC (HTTP/2 Protocol Buffers)",
        "HTTP/1.1 REST with JSON payloads",
        "Websocket streaming connections"
      ];
      return {
        id,
        topic,
        difficulty: diff,
        question,
        options,
        correctAnswer: 1,
        explanation: "gRPC uses HTTP/2 for transport (enabling request multiplexing, header compression, and bi-directional streaming) and Protocol Buffers for ultra-fast, compact binary serialization, outperforming REST."
      };
    }
  }
}

export function getSystemDesignQuestions(topic: string = "All Topics"): QuizQuestion[] {
  let questions = [...STATIC_QUIZ_QUESTIONS];

  // For each of the 20 topics, dynamically generate 1000 questions to achieve 20,000+ questions
  for (const t of SYSTEM_DESIGN_TOPICS) {
    const isTopicFilter = topic !== "All Topics" && t !== topic;
    if (isTopicFilter) continue;
    
    // Generate 1000 questions for this topic
    for (let i = 1; i <= 1000; i++) {
      questions.push(generateDynamicSDQuestion(t, i));
    }
  }

  return questions;
}
