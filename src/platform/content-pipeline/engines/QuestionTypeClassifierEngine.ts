export type QuestionModuleType =
  | "coding"
  | "sql"
  | "mongodb"
  | "postgresql"
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "cpp"
  | "system_design"
  | "aptitude"
  | "reasoning"
  | "computer_networks"
  | "operating_systems"
  | "dbms"
  | "oop"
  | "low_level_design"
  | "high_level_design"
  | "machine_learning"
  | "artificial_intelligence"
  | "shell"
  | "concurrency";

export type ClassificationResult = {
  questionType: QuestionModuleType;
  subModule: string;
  confidence: number;
  reasons: string[];
};

export type QuestionClassifierInput = {
  id?: string;
  title: string;
  description?: string;
  topics?: string[];
  starterCode?: unknown;
};

export class QuestionTypeClassifierEngine {
  /**
   * Classifies a question into one of the 20+ canonical platform sections.
   * Ensures zero cross-section contamination (no SQL, MongoDB, PostgreSQL, or JS Promise/Async problems in Coding (DSA)).
   */
  public classify(input: QuestionClassifierInput): ClassificationResult {
    const title = (input.title || "").trim();
    const desc = (input.description || "").trim();
    const topics = (input.topics || []).map((t) => t.toLowerCase().trim());
    const reasons: string[] = [];

    const lowerTitle = title.toLowerCase();
    const lowerDesc = desc.toLowerCase();

    // 1. Check for Shell
    if (
      topics.includes("shell") ||
      topics.includes("bash") ||
      lowerTitle.includes("bash") ||
      lowerDesc.includes("#!/bin/bash") ||
      lowerDesc.includes("write a bash script")
    ) {
      reasons.push("Topic/content matches Linux Bash / Shell scripting");
      return {
        questionType: "shell",
        subModule: "Bash Scripting",
        confidence: 0.99,
        reasons,
      };
    }

    // 2. Check for Concurrency
    if (
      topics.includes("concurrency") ||
      topics.includes("multithreading") ||
      lowerTitle.includes("print in order") ||
      lowerTitle.includes("foobar") ||
      lowerTitle.includes("dining philosophers") ||
      lowerDesc.includes("pthread") ||
      lowerDesc.includes("semaphore") ||
      lowerDesc.includes("mutex")
    ) {
      reasons.push("Topic/content matches Multithreaded Concurrency primitives");
      return {
        questionType: "concurrency",
        subModule: "Multithreading & Concurrency",
        confidence: 0.99,
        reasons,
      };
    }

    // 3. Check for JavaScript Promise / Async / LeetCode 30 Days of JS (NOT DSA!)
    const isJsProblemTitle =
      lowerTitle === "sleep" ||
      lowerTitle === "add two promises" ||
      lowerTitle === "promise time limit" ||
      lowerTitle === "cache with time limit" ||
      lowerTitle === "allow one function call" ||
      lowerTitle === "memoize" ||
      lowerTitle === "apply transform" ||
      lowerTitle === "group by" ||
      lowerTitle === "chunk array" ||
      lowerTitle === "flatten deeply nested array" ||
      lowerTitle === "async generator" ||
      lowerTitle === "event emitter" ||
      lowerTitle === "debounce" ||
      lowerTitle === "throttle" ||
      lowerTitle === "array wrapper" ||
      lowerTitle === "calculator with method chaining" ||
      lowerTitle === "currying" ||
      lowerTitle === "join two arrays by id" ||
      lowerTitle === "compact object" ||
      lowerTitle === "call function with custom context";

    const isJsTopicOrContent =
      topics.includes("javascript") ||
      topics.includes("30-days-of-js") ||
      topics.includes("promises") ||
      topics.includes("async-programming") ||
      lowerDesc.includes("return a promise") ||
      lowerDesc.includes("resolve(res)") ||
      (lowerDesc.includes("settimeout") && !lowerDesc.includes("binary tree"));

    if (isJsProblemTitle || isJsTopicOrContent) {
      reasons.push("Matches JavaScript Async / Promise / 30 Days of JS problems (NOT DSA)");
      return {
        questionType: "javascript",
        subModule: "Async & Promises",
        confidence: 0.99,
        reasons,
      };
    }

    // 4. Check for Database (SQL, MongoDB, PostgreSQL)
    const hasDatabaseTopic =
      topics.includes("database") ||
      topics.includes("sql") ||
      topics.includes("mysql") ||
      topics.includes("postgresql") ||
      topics.includes("mongodb");

    const hasSqlKeywords =
      desc.includes("Table: ") ||
      desc.includes("SELECT ") ||
      desc.includes("GROUP BY") ||
      desc.includes("HAVING") ||
      desc.includes("JOIN ") ||
      desc.includes("WHERE ") ||
      desc.includes("CREATE TABLE ");

    if (hasDatabaseTopic || hasSqlKeywords) {
      // 4a. Check MongoDB
      if (
        topics.includes("mongodb") ||
        desc.includes("$group") ||
        desc.includes("$match") ||
        desc.includes("$lookup") ||
        desc.includes("db.collection.aggregate") ||
        desc.includes("find()")
      ) {
        reasons.push("Matches MongoDB aggregation operators ($group, $match, $lookup, find)");
        return {
          questionType: "mongodb",
          subModule: this.inferMongoSubModule(lowerDesc),
          confidence: 0.99,
          reasons,
        };
      }

      // 4b. Check PostgreSQL
      if (
        topics.includes("postgresql") ||
        topics.includes("postgres") ||
        desc.includes("::jsonb") ||
        desc.includes("ARRAY_AGG") ||
        desc.includes("RECURSIVE") ||
        desc.includes("PARTITION BY") ||
        desc.includes("JSON_BUILD_OBJECT")
      ) {
        reasons.push("Matches PostgreSQL advanced database syntax (Window Functions, JSON, Recursive CTE)");
        return {
          questionType: "postgresql",
          subModule: this.inferPostgresSubModule(lowerDesc),
          confidence: 0.98,
          reasons,
        };
      }

      // 4c. Standard SQL
      reasons.push("Matches SQL table schema markers and SQL query keywords (SELECT, FROM, GROUP BY, HAVING, JOIN)");
      return {
        questionType: "sql",
        subModule: this.inferSqlSubModule(lowerDesc),
        confidence: 0.99,
        reasons,
      };
    }

    // 5. Check System Design / LLD / HLD / OOP
    if (topics.includes("low-level-design") || topics.includes("lld")) {
      reasons.push("Topic matches Low Level Design (LLD)");
      return {
        questionType: "low_level_design",
        subModule: "LLD & OOP",
        confidence: 0.95,
        reasons,
      };
    }
    if (topics.includes("high-level-design") || topics.includes("hld")) {
      reasons.push("Topic matches High Level Design (HLD)");
      return {
        questionType: "high_level_design",
        subModule: "Distributed Architecture",
        confidence: 0.95,
        reasons,
      };
    }
    if (topics.includes("oop") || topics.includes("object-oriented-programming")) {
      reasons.push("Topic matches Object-Oriented Programming");
      return {
        questionType: "oop",
        subModule: "OOP Principles",
        confidence: 0.95,
        reasons,
      };
    }
    if (topics.includes("system-design") || lowerTitle.includes("design in-memory") || lowerTitle.includes("design a rate limiter")) {
      reasons.push("Topic matches System Design");
      return {
        questionType: "system_design",
        subModule: "System Design",
        confidence: 0.95,
        reasons,
      };
    }

    // 6. Check CS Subjects (CN, OS, DBMS)
    if (topics.includes("computer-networks") || topics.includes("networking") || topics.includes("tcp")) {
      reasons.push("Topic matches Computer Networks");
      return {
        questionType: "computer_networks",
        subModule: "Networking Fundamentals",
        confidence: 0.95,
        reasons,
      };
    }
    if (topics.includes("operating-systems") || topics.includes("os")) {
      reasons.push("Topic matches Operating Systems");
      return {
        questionType: "operating_systems",
        subModule: "OS Concepts",
        confidence: 0.95,
        reasons,
      };
    }
    if (topics.includes("dbms") || topics.includes("database-management")) {
      reasons.push("Topic matches DBMS");
      return {
        questionType: "dbms",
        subModule: "DBMS Concepts",
        confidence: 0.95,
        reasons,
      };
    }

    // 7. Check Machine Learning / AI
    if (topics.includes("machine-learning") || topics.includes("ml")) {
      reasons.push("Topic matches Machine Learning");
      return {
        questionType: "machine_learning",
        subModule: "Machine Learning Algorithms",
        confidence: 0.95,
        reasons,
      };
    }
    if (topics.includes("artificial-intelligence") || topics.includes("ai")) {
      reasons.push("Topic matches Artificial Intelligence");
      return {
        questionType: "artificial_intelligence",
        subModule: "AI & Deep Learning",
        confidence: 0.95,
        reasons,
      };
    }

    // 8. Check Aptitude & Reasoning
    if (topics.includes("aptitude") || topics.includes("quantitative")) {
      reasons.push("Topic matches Quantitative Aptitude");
      return {
        questionType: "aptitude",
        subModule: "Quantitative Aptitude",
        confidence: 0.95,
        reasons,
      };
    }
    if (topics.includes("reasoning") || topics.includes("logical-reasoning")) {
      reasons.push("Topic matches Logical Reasoning");
      return {
        questionType: "reasoning",
        subModule: "Logical Reasoning",
        confidence: 0.95,
        reasons,
      };
    }

    // 9. Language-specific sections
    if (topics.includes("typescript")) {
      return { questionType: "typescript", subModule: "TypeScript Basics", confidence: 0.9, reasons: ["TypeScript topic"] };
    }
    if (topics.includes("python")) {
      return { questionType: "python", subModule: "Python Basics", confidence: 0.9, reasons: ["Python topic"] };
    }
    if (topics.includes("java")) {
      return { questionType: "java", subModule: "Java Basics", confidence: 0.9, reasons: ["Java topic"] };
    }
    if (topics.includes("cpp") || topics.includes("c++")) {
      return { questionType: "cpp", subModule: "C++ Basics", confidence: 0.9, reasons: ["C++ topic"] };
    }

    // 10. Default to Coding (DSA) - Algorithmic problems ONLY
    reasons.push("Algorithmic programming problem statement with DSA topic tags");
    return {
      questionType: "coding",
      subModule: "Arrays & Strings",
      confidence: 0.99,
      reasons,
    };
  }

  private inferSqlSubModule(lowerDesc: string): string {
    if (lowerDesc.includes("cte") || lowerDesc.includes("with ")) return "CTE";
    if (lowerDesc.includes("window") || lowerDesc.includes("partition by") || lowerDesc.includes("rank()"))
      return "Window Functions";
    if (lowerDesc.includes("having")) return "HAVING";
    if (lowerDesc.includes("group by")) return "GROUP BY";
    if (lowerDesc.includes("left join") || lowerDesc.includes("right join") || lowerDesc.includes("outer join"))
      return "LEFT JOIN / RIGHT JOIN";
    if (lowerDesc.includes("join")) return "JOIN";
    if (lowerDesc.includes("order by")) return "ORDER BY";
    if (lowerDesc.includes("where")) return "WHERE";
    return "Basic SELECT";
  }

  private inferMongoSubModule(lowerDesc: string): string {
    if (lowerDesc.includes("$lookup")) return "$lookup";
    if (lowerDesc.includes("$group")) return "$group";
    if (lowerDesc.includes("$project")) return "$project";
    if (lowerDesc.includes("aggregate")) return "aggregate()";
    return "find()";
  }

  private inferPostgresSubModule(lowerDesc: string): string {
    if (lowerDesc.includes("recursive")) return "Recursive CTE";
    if (lowerDesc.includes("json") || lowerDesc.includes("jsonb")) return "JSON";
    if (lowerDesc.includes("array")) return "Arrays";
    return "Window Functions";
  }
}
