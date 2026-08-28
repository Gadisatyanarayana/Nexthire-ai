export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const { data: lesson, error } = await supabase
      .from("sd_lessons")
      .select(`
        *,
        sd_modules ( title ),
        sd_questions (
          id,
          question,
          options,
          correct_index,
          explanation,
          difficulty,
          company_tags
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
    }

    // Guarantee 15 unique real-world FAANG System Design questions per lesson
    const existingQs = lesson.sd_questions || [];
    const pool = getRealWorldSDQuestions(lesson.id, lesson.title || "System Design");
    const existingIds = new Set(existingQs.map((q: any) => q.question));
    const merged = [...existingQs];

    for (const pq of pool) {
      if (merged.length >= 15) break;
      if (!existingIds.has(pq.question)) {
        merged.push(pq);
        existingIds.add(pq.question);
      }
    }

    // Shuffle questions so retakes and regenerations offer fresh ordering
    lesson.sd_questions = merged.sort(() => Math.random() - 0.5);

    return NextResponse.json({ lesson });
  } catch (err) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function getRealWorldSDQuestions(lessonId: string, title: string): any[] {
  const t = title.toLowerCase();
  const basePool = [
    {
      id: `${lessonId}-sd-1`,
      question: `In a high-throughput microservices architecture for ${title}, why is Layer 7 load balancing preferred over Layer 4 when routing API requests?`,
      options: [
        "Layer 7 can inspect HTTP headers, cookies, and URI paths for intelligent application-layer routing",
        "Layer 7 operates at the TCP handshake level with zero latency overhead",
        "Layer 7 prevents database deadlock occurrences automatically",
        "Layer 7 encrypts data at rest without TLS certificates"
      ],
      correct_index: 0,
      explanation: "Layer 7 (Application layer) load balancers can inspect HTTP requests, URL paths, headers, and cookies to route traffic dynamically to specific microservices.",
      difficulty: "medium",
      company_tags: ["Google", "Amazon", "Netflix"]
    },
    {
      id: `${lessonId}-sd-2`,
      question: `How does Consistent Hashing mitigate the 'thundering herd' problem when adding or removing cache nodes in a distributed ${title} cluster?`,
      options: [
        "Only K/N keys are remapped on node addition/removal, minimizing cache misses across the cluster",
        "It forces all nodes to replicate 100% of the entire database in memory",
        "It prevents network packets from dropping during high concurrency",
        "It eliminates the need for primary-replica database replication"
      ],
      correct_index: 0,
      explanation: "In traditional modulo hashing (hash(key) % N), changing N remaps almost all keys. Consistent hashing remaps only K/N keys (where K is total keys, N is nodes), avoiding massive cache misses.",
      difficulty: "hard",
      company_tags: ["Meta", "Uber", "Airbnb"]
    },
    {
      id: `${lessonId}-sd-3`,
      question: `When designing an enterprise cache layer for ${title}, which eviction policy is best suited for workloads where recently accessed data has the highest probability of reuse?`,
      options: [
        "LRU (Least Recently Used)",
        "LFU (Least Frequently Used)",
        "FIFO (First In First Out)",
        "Random Replacement"
      ],
      correct_index: 0,
      explanation: "LRU evicts the item that hasn't been accessed for the longest time, which matches workloads with strong temporal locality.",
      difficulty: "easy",
      company_tags: ["Amazon", "Google", "Microsoft"]
    },
    {
      id: `${lessonId}-sd-4`,
      question: `Under the CAP Theorem, when a network partition occurs in a distributed database powering ${title}, what trade-off must architects make?`,
      options: [
        "Choose between linearizable Consistency or high Availability",
        "Choose between low Latency or high Throughput",
        "Choose between SQL or NoSQL storage engines",
        "Choose between TLS 1.2 or TLS 1.3 encryption"
      ],
      correct_index: 0,
      explanation: "During a network partition (P), a distributed system must choose between cancelling the operation to maintain Consistency (C) or serving potentially stale data to preserve Availability (A).",
      difficulty: "medium",
      company_tags: ["Google", "Amazon", "Apple"]
    },
    {
      id: `${lessonId}-sd-5`,
      question: `Which rate-limiting algorithm allows brief traffic bursts up to a configured capacity while smoothing long-term average request rates in an API Gateway for ${title}?`,
      options: [
        "Token Bucket Algorithm",
        "Fixed Window Counter Algorithm",
        "Leaky Bucket Algorithm without queuing",
        "Round-Robin Counter"
      ],
      correct_index: 0,
      explanation: "The Token Bucket algorithm accumulates tokens at a steady rate up to bucket capacity, allowing instant bursts up to the available tokens while restricting the sustained rate.",
      difficulty: "medium",
      company_tags: ["Stripe", "Uber", "Meta"]
    },
    {
      id: `${lessonId}-sd-6`,
      question: `What is the primary advantage of a Write-Behind (Write-Back) caching strategy in a high-write ${title} system?`,
      options: [
        "Write latency is extremely low since writes are acknowledged immediately by the cache and flushed asynchronously to the database",
        "It guarantees zero data loss even if the cache node suffers a sudden power failure",
        "It eliminates the need for database indexes",
        "It prevents read-after-write inconsistencies without locks"
      ],
      correct_index: 0,
      explanation: "In Write-Behind caching, the application writes to cache and returns immediately. The cache asynchronously writes to the backing DB, providing very low write latency.",
      difficulty: "hard",
      company_tags: ["Netflix", "Meta", "Amazon"]
    },
    {
      id: `${lessonId}-sd-7`,
      question: `When sharding a multi-terabyte database for ${title}, why can choosing a monotonically increasing timestamp as the shard key cause performance degradation?`,
      options: [
        "It creates a 'hot shard' where all new concurrent writes hit only the most recent shard node",
        "It prevents SQL JOIN queries across different tables",
        "It causes integer overflow in 64-bit operating systems",
        "It disables B-tree index creation on secondary columns"
      ],
      correct_index: 0,
      explanation: "A monotonically increasing key directs all new inserts to the single shard responsible for the latest range, overloading that shard while older shards sit idle.",
      difficulty: "hard",
      company_tags: ["Uber", "Google", "LinkedIn"]
    },
    {
      id: `${lessonId}-sd-8`,
      question: `In an event-driven ${title} architecture using Apache Kafka, how is consumer-level ordering guaranteed for events belonging to the same user?`,
      options: [
        "By using the User ID as the Kafka message partition key so all events for that user land in the same partition",
        "By setting the Kafka replication factor to 3 across all brokers",
        "By enabling GZIP compression on producer batches",
        "By deploying a single consumer group across multiple data centers"
      ],
      correct_index: 0,
      explanation: "Kafka guarantees strict message ordering within a single partition. Routing messages with the same User ID key to the same partition preserves chronological order.",
      difficulty: "medium",
      company_tags: ["Uber", "LinkedIn", "Netflix"]
    },
    {
      id: `${lessonId}-sd-9`,
      question: `What is the main architectural benefit of using a Content Delivery Network (CDN) with Anycast DNS routing for ${title}?`,
      options: [
        "Requests are automatically routed to the topologically closest Edge Location, minimizing network hops and latency",
        "It converts dynamic database queries into static HTML pages automatically",
        "It replaces the need for backend application servers",
        "It prevents DDoS attacks by encrypting SSL certificates at the origin"
      ],
      correct_index: 0,
      explanation: "Anycast DNS allows multiple edge locations to share the same IP address. BGP routing automatically directs client requests to the nearest edge server.",
      difficulty: "medium",
      company_tags: ["Cloudflare", "Netflix", "Google"]
    },
    {
      id: `${lessonId}-sd-10`,
      question: `When implementing distributed transactions across microservices in ${title}, why is the Saga Pattern preferred over Two-Phase Commit (2PC)?`,
      options: [
        "Sagas avoid long-lived database locks by using asynchronous local transactions and compensating transactions for rollbacks",
        "Sagas execute all database queries synchronously in a single database connection",
        "Sagas require zero network communication between services",
        "Sagas prevent eventual consistency in NoSQL databases"
      ],
      correct_index: 0,
      explanation: "2PC holds locks across all participating databases until commit/abort, causing bottlenecks. Sagas execute a sequence of local transactions and run compensating actions if a step fails.",
      difficulty: "hard",
      company_tags: ["Amazon", "Uber", "Microsoft"]
    },
    {
      id: `${lessonId}-sd-11`,
      question: `Why is a Bloom Filter commonly used before querying an on-disk LSM-tree storage engine (like RocksDB or Cassandra) in ${title}?`,
      options: [
        "To quickly test if a key is definitely not present, avoiding expensive disk reads for non-existent keys",
        "To compress JSON payloads before storing them on SSDs",
        "To sort database rows alphabetically in memory",
        "To encrypt sensitive passwords using hashing"
      ],
      correct_index: 0,
      explanation: "A Bloom Filter is a space-efficient probabilistic data structure that can tell if a key is 'definitely not in set' or 'possibly in set', saving disk I/O.",
      difficulty: "hard",
      company_tags: ["Google", "Meta", "Cassandra"]
    },
    {
      id: `${lessonId}-sd-12`,
      question: `In a high-concurrency ticket booking service for ${title}, how does Optimistic Concurrency Control (OCC) prevent double-booking without database table locks?`,
      options: [
        "By checking a version number or timestamp column upon UPDATE and failing if another transaction modified the row",
        "By serializing all incoming requests through a single Node.js thread",
        "By disabling database indexes during checkout",
        "By storing all reservations in a static file"
      ],
      correct_index: 0,
      explanation: "OCC uses a version token. An UPDATE statement checks WHERE version = old_version. If another transaction updated the row first, affected rows = 0 and the app retries.",
      difficulty: "medium",
      company_tags: ["Airbnb", "Uber", "Amazon"]
    },
    {
      id: `${lessonId}-sd-13`,
      question: `How does a Circuit Breaker pattern protect downstream microservices in a resilient ${title} deployment?`,
      options: [
        "By tripping to an 'Open' state after an error threshold is breached, failing fast and giving the degraded service time to recover",
        "By automatically restarting crashed Docker containers",
        "By rerouting database queries to Amazon S3 bucket storage",
        "By increasing the CPU clock speed of overloaded servers"
      ],
      correct_index: 0,
      explanation: "When failures exceed a threshold, the Circuit Breaker trips open, returning instant fallback responses without hammering the failing downstream service.",
      difficulty: "medium",
      company_tags: ["Netflix", "Amazon", "Uber"]
    },
    {
      id: `${lessonId}-sd-14`,
      question: `What is the purpose of an 'Origin Shield' in a multi-tier Content Delivery Network for ${title}?`,
      options: [
        "An extra caching layer between edge servers and origin servers that prevents cache-miss thundering herds from overwhelming the origin",
        "A hardware firewall that blocks SQL injection queries",
        "A DNS registrar feature that prevents domain name spoofing",
        "A database backup script that runs nightly"
      ],
      correct_index: 0,
      explanation: "An Origin Shield consolidates requests from multiple CDN edge servers so that on a cache miss, only one request goes to the origin rather than dozens.",
      difficulty: "hard",
      company_tags: ["Cloudflare", "Netflix", "Amazon"]
    },
    {
      id: `${lessonId}-sd-15`,
      question: `In a multi-region active-active deployment for ${title}, how do Conflict-Free Replicated Data Types (CRDTs) achieve eventual consistency without central coordination?`,
      options: [
        "By using mathematically commutative and associative merge operators so concurrent updates converge to the exact same state independently",
        "By locking all global databases for 5 seconds on every write",
        "By discarding any write that occurs outside the primary US-East region",
        "By requiring manual administrator intervention for every conflict"
      ],
      correct_index: 0,
      explanation: "CRDTs guarantee that any two replicas that have received the same set of updates (in any order) will be in the identical state without locking.",
      difficulty: "hard",
      company_tags: ["Apple", "Meta", "Amazon"]
    }
  ];
  return basePool;
}
