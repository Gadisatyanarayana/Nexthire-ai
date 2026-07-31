import Link from "next/link";
import { BookOpen, CheckCircle, ChevronRight, Lock, BrainCircuit } from "lucide-react";
import { getV2Lesson } from "@/lib/api/systemDesignV2";
import { MODULES } from "@/lib/systemDesignContent";
import AIMentor from "@/components/system-design/ai/AIMentor";
import DesignReviewPanel from "@/components/system-design/ai/DesignReviewPanel";
import LessonVisualsSwitcher from "@/components/system-design/LessonVisualsSwitcher";
import ConceptTooltip from "@/components/system-design/ConceptTooltip";

function getLessonVisuals(lessonId: string, title: string) {
  const t = (title + " " + lessonId).toLowerCase();

  if (t.includes("load") || t.includes("l4") || t.includes("l7") || t.includes("balancer")) {
    return {
      diagrams: [
        {
          id: "diag-lb",
          type: "mermaid" as const,
          title: "Layer 7 Intelligent Load Balancing Architecture",
          isInteractive: true,
          content: `
            graph TD
              A[Client Device] -->|HTTPS / SSL| B(API Gateway)
              B --> C{L7 Load Balancer}
              C -->|Round-Robin| D[Web Service Instance 1]
              C -->|Least Connections| E[Web Service Instance 2]
              C -->|Weighted Routing| F[Web Service Instance 3]
              D --> G[(Read Replica 1)]
              E --> G
              F --> H[(Primary DB)]
          `
        }
      ],
      animationSteps: [
        { id: '1', label: 'Client', description: 'Client sends HTTPS GET request with auth cookies', componentType: 'client' },
        { id: '2', label: 'API Gateway', description: 'Gateway terminates TLS and verifies JWT token', componentType: 'gateway' },
        { id: '3', label: 'L7 Load Balancer', description: 'Inspects URL path /api/v1/checkout and checks node health', componentType: 'loadbalancer' },
        { id: '4', label: 'Microservice Node', description: 'Routes to least-busy Web Service Instance 2', componentType: 'server' },
        { id: '5', label: 'Database Replica', description: 'Reads order profile from PostgreSQL read replica', componentType: 'database' }
      ]
    };
  }

  if (t.includes("cache") || t.includes("caching") || t.includes("redis") || t.includes("memcached")) {
    return {
      diagrams: [
        {
          id: "diag-cache",
          type: "mermaid" as const,
          title: "Distributed Cache-Aside (LRU Eviction) Pattern",
          isInteractive: true,
          content: `
            graph LR
              App[Application Server] -->|1. Check Cache| Redis[(Redis Cluster LRU)]
              Redis -->|2a. Cache Hit| App
              Redis -->|2b. Cache Miss| DB[(PostgreSQL Database)]
              App -->|3. Query Backing DB| DB
              DB -->|4. Return Data| App
              App -->|5. SETEX Key TTL| Redis
          `
        }
      ],
      animationSteps: [
        { id: '1', label: 'App Server', description: 'Request received for user profile key user:9042', componentType: 'server' },
        { id: '2', label: 'Redis Cluster', description: 'LRU lookup in Redis cache memory (CACHE MISS)', componentType: 'cache' },
        { id: '3', label: 'Database Query', description: 'SELECT * FROM users WHERE id=9042 executed on DB (14ms)', componentType: 'database' },
        { id: '4', label: 'Cache Write-Back', description: 'App server writes payload to Redis with TTL=3600s', componentType: 'cache' },
        { id: '5', label: 'Instant Return', description: 'Response sent to client (subsequent hits take <2ms)', componentType: 'client' }
      ]
    };
  }

  if (t.includes("hash") || t.includes("partition") || t.includes("ring")) {
    return {
      diagrams: [
        {
          id: "diag-hash",
          type: "mermaid" as const,
          title: "Consistent Hashing with Virtual Ring Nodes",
          isInteractive: true,
          content: `
            graph TD
              Ring((360 Degree Virtual Ring 0 to 2^32)) --> N1[Physical Node A - Hash 0 to 100]
              Ring --> N2[Physical Node B - Hash 101 to 200]
              Ring --> N3[Physical Node C - Hash 201 to 300]
              Key1[Key: user_id=405] -->|Hash=142| N2
              Key2[Key: user_id=910] -->|Hash=270| N3
              Key3[Key: user_id=102] -->|Hash=45| N1
          `
        }
      ],
      animationSteps: [
        { id: '1', label: 'Key Hashing', description: 'MurmurHash3 generates 32-bit integer for partition key', componentType: 'server' },
        { id: '2', label: 'Ring Mapping', description: 'Key position mapped onto 360-degree virtual token ring', componentType: 'gateway' },
        { id: '3', label: 'Virtual Nodes', description: '150 virtual nodes per physical host distribute load evenly', componentType: 'loadbalancer' },
        { id: '4', label: 'Clockwise Walk', description: 'First physical node clockwise on ring selected as replica', componentType: 'server' },
        { id: '5', label: 'Auto-Rebalance', description: 'Adding Node D remaps only 1/4th of keys without thundering herd', componentType: 'database' }
      ]
    };
  }

  if (t.includes("data") || t.includes("scal") || t.includes("shard") || t.includes("sql") || t.includes("storage")) {
    return {
      diagrams: [
        {
          id: "diag-shard",
          type: "mermaid" as const,
          title: "Horizontal Database Sharding & Shard Router Architecture",
          isInteractive: true,
          content: `
            graph TD
              App[Service Layer] --> Router{Shard Router}
              Router -->|Shard Key: US| S1[(US-East Shard DB)]
              Router -->|Shard Key: EU| S2[(EU-West Shard DB)]
              Router -->|Shard Key: APAC| S3[(APAC-South Shard DB)]
              S1 --> R1[(US Read Replica)]
              S2 --> R2[(EU Read Replica)]
          `
        }
      ],
      animationSteps: [
        { id: '1', label: 'SQL Request', description: 'INSERT INTO orders WHERE region=EU AND customer=8831', componentType: 'server' },
        { id: '2', label: 'Shard Router', description: 'Router inspects Shard Key (region=EU) in query header', componentType: 'gateway' },
        { id: '3', label: 'Shard Target', description: 'Query directed to dedicated EU-West Shard DB instance', componentType: 'database' },
        { id: '4', label: 'B-Tree Index', description: 'Local B-tree index scan locates target disk block in 1.2ms', componentType: 'database' },
        { id: '5', label: 'Replication', description: 'Async WAL replication updates EU Read Replica with zero lag', componentType: 'server' }
      ]
    };
  }

  // Default Distributed Systems Visuals
  return {
    diagrams: [
      {
        id: "diag-default",
        type: "mermaid" as const,
        title: "High-Availability Distributed Consensus & Replication",
        isInteractive: true,
        content: `
          graph TD
            Client[Client App] --> Gateway(API Gateway)
            Gateway --> LB{High Availability LB}
            LB --> S1[Service Node 1]
            LB --> S2[Service Node 2]
            S1 --> Leader[(Primary Leader DB)]
            S2 --> Leader
            Leader -->|WAL Async| Follower1[(Follower Replica 1)]
            Leader -->|WAL Async| Follower2[(Follower Replica 2)]
        `
      }
    ],
    animationSteps: [
      { id: '1', label: 'Client', description: 'User sends HTTP request with request tracing ID', componentType: 'client' },
      { id: '2', label: 'Gateway', description: 'API Gateway validates token and initiates rate limiting check', componentType: 'gateway' },
      { id: '3', label: 'Load Balancer', description: 'Routes request across active-active microservice cluster', componentType: 'loadbalancer' },
      { id: '4', label: 'Service Node', description: 'Executes domain business logic and validates schema', componentType: 'server' },
      { id: '5', label: 'Leader DB', description: 'Writes to Primary Leader DB and replicates asynchronously', componentType: 'database' }
    ]
  };
}
export default async function LessonTheoryPage(props: { params: Promise<{ moduleId: string, lessonId: string }> }) {
  const params = await props.params;
  const { moduleId, lessonId } = params;
  
  let lessonData = await getV2Lesson(lessonId);

  // Fallback to legacy content if not found in DB
  if (!lessonData) {
    const legacyModule = MODULES.find(m => m.id === moduleId);
    const legacyLesson = legacyModule?.lessons.find(l => l.id === lessonId);
    if (legacyLesson) {
      lessonData = {
        id: legacyLesson.id,
        title: legacyLesson.title,
        difficulty: legacyLesson.difficulty,
        reading_time: legacyLesson.readingTime,
        sd_modules: { title: legacyModule?.title },
        content: {
          theory: legacyLesson.theory,
          advantages: legacyLesson.advantages,
          disadvantages: legacyLesson.disadvantages,
          tradeoffs: legacyLesson.tradeoffs,
          mistakes: legacyLesson.mistakes,
          summary: legacyLesson.takeaways.join(" ")
        }
      };
    }
  }

  if (!lessonData) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-foreground/20 bg-foreground/5 max-w-4xl">
        <Lock className="h-8 w-8 mx-auto opacity-50 mb-3" />
        <h3 className="font-bold">Lesson Not Found</h3>
        <p className="text-sm opacity-70 mt-1">This lesson is either locked or migrating to the V2 architecture.</p>
        <Link href={`/system-design/${moduleId}`} className="text-cyan-500 mt-4 block text-sm">Return to Module</Link>
      </div>
    );
  }

  // Parse the 23-step structured JSON content
  const content = typeof lessonData.content === 'string' ? JSON.parse(lessonData.content) : lessonData.content;
  const moduleTitle = lessonData.sd_modules?.title || "Module";
  const { diagrams, animationSteps } = getLessonVisuals(lessonId, lessonData.title || "");

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl pb-32">
      <div className="flex items-center gap-2 text-sm opacity-60 mb-2">
        <Link href="/system-design" className="hover:underline">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/system-design/${moduleId}`} className="hover:underline">{moduleTitle}</Link>
        <ChevronRight className="h-4 w-4" />
        <span>{lessonData.title}</span>
      </div>

      <header className="border-b border-foreground/10 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">{lessonData.title}</h1>
        <div className="flex items-center gap-4 text-sm opacity-70 font-semibold">
          <span className="flex items-center gap-1.5 bg-foreground/5 px-2.5 py-1 rounded-md"><BookOpen className="h-4 w-4"/> {lessonData.reading_time}</span>
          <span className="flex items-center gap-1.5 bg-foreground/5 px-2.5 py-1 rounded-md"><CheckCircle className="h-4 w-4"/> {lessonData.difficulty}</span>
        </div>
      </header>



      {/* 23-Step Standardized Template Scaffold with Visual Engine */}
      
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-indigo-400" />
          1. Overview & Theory
        </h2>
        
        <LessonVisualsSwitcher diagrams={diagrams} animationSteps={animationSteps}>
          <div className="p-5 rounded-xl bg-foreground/[0.03] border border-foreground/5 leading-relaxed text-sm opacity-90">
            {/* We mock injecting ConceptTooltips here. In production, this would be an MDX mapping. */}
            {content.theory ? (
              <div dangerouslySetInnerHTML={{ __html: content.theory }} />
            ) : (
              <p>
                In a <ConceptTooltip term="Distributed System" definition="A system whose components are located on different networked computers." difficulty="Beginner" interviewImportance="High">Distributed System</ConceptTooltip>, a <ConceptTooltip term="Load Balancer" definition="Distributes network traffic across multiple servers." difficulty="Beginner" interviewImportance="High" lessonLink="/system-design/mod-foundations/load-balancing">Load Balancer</ConceptTooltip> is used to ensure no single server bears too much demand.
              </p>
            )}
          </div>
        </LessonVisualsSwitcher>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">2. Tradeoffs & Advantages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <h3 className="font-bold text-emerald-600 mb-3 text-sm uppercase tracking-wider">Advantages</h3>
            <ul className="list-disc list-inside space-y-2 text-sm opacity-80">
              {content.advantages?.map((adv: string, i: number) => (
                <li key={i}>{adv}</li>
              ))}
            </ul>
          </div>
          <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
            <h3 className="font-bold text-red-600 mb-3 text-sm uppercase tracking-wider">Disadvantages</h3>
            <ul className="list-disc list-inside space-y-2 text-sm opacity-80">
              {content.disadvantages?.map((dis: string, i: number) => (
                <li key={i}>{dis}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm">
          <strong className="text-amber-600">The Tradeoff:</strong> {content.tradeoffs || "No tradeoffs specified."}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">3. Interview Tips & Mistakes</h2>
        <div className="p-5 rounded-xl bg-foreground/[0.03] border border-foreground/5 text-sm">
          <ul className="list-disc list-inside space-y-2 opacity-80">
            {content.mistakes?.map((mistake: string, i: number) => (
              <li key={i}>{mistake}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">14. Conclusion & Summary</h2>
        <div className="p-5 rounded-xl bg-foreground/[0.03] border border-foreground/5 leading-relaxed text-sm opacity-90">
          {content.summary || "Summary content goes here."}
        </div>
      </section>

      <div className="flex justify-end pt-8 border-t border-foreground/10">
        <Link 
          href={`/system-design/${moduleId}/${lessonId}/quiz`}
          className="bg-cyan-500 hover:bg-cyan-600 text-black px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
        >
          Take Lesson Quiz
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Floating AI Mentor Widget */}
      <AIMentor />
      
      {/* Design Review Panel (Mock placement for Phase 4) */}
      <div className="mt-12">
        <DesignReviewPanel />
      </div>
    </div>
  );
}
