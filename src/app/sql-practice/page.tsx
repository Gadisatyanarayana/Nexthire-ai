"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import MonacoEditor from "@monaco-editor/react";
import {
  Database, Play, CheckCircle2, XCircle, Award, Terminal,
  RefreshCw, Clock, ArrowRight, Table, Layers, FileCode, Check, AlertCircle
} from "lucide-react";

import { getSQLQuestions, type SQLQuestion, type SchemaTable } from "@/lib/sqlGenerator";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).initSqlJs) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

// Query safety checking to block destructive database commands
const isQuerySafe = (query: string): { safe: boolean; reason?: string } => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return { safe: true };

  // Strip standard SQL comments to avoid false matches or bypassing checks
  const cleanQuery = trimmed
    .replace(/--.*$/gm, "") // strip single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ""); // strip multi-line comments

  const dangerous = [
    { regex: /\bdrop\b/i, name: "DROP" },
    { regex: /\balter\b/i, name: "ALTER" },
    { regex: /\bdelete\b/i, name: "DELETE" },
    { regex: /\bupdate\b/i, name: "UPDATE" },
    { regex: /\binsert\b/i, name: "INSERT" },
    { regex: /\btruncate\b/i, name: "TRUNCATE" },
    { regex: /\breplace\b/i, name: "REPLACE" },
    { regex: /\bcreate\b/i, name: "CREATE" },
    { regex: /\bgrant\b/i, name: "GRANT" },
    { regex: /\brevoke\b/i, name: "REVOKE" },
    { regex: /\bcopy\b/i, name: "COPY" },
    { regex: /\bload_file\b/i, name: "LOAD_FILE" },
    { regex: /\boutfile\b/i, name: "OUTFILE" },
    { regex: /\bxp_cmdshell\b/i, name: "xp_cmdshell" }
  ];

  for (const item of dangerous) {
    if (item.regex.test(cleanQuery)) {
      return {
        safe: false,
        reason: `Security Exception: Write/Modifying operations are disabled for training stability. Unauthorized keyword detected: "${item.name}".`
      };
    }
  }
  return { safe: true };
};

// Compare two cell values with tolerance for float differences
const compareValues = (exp: any, act: any, tolerance = 1e-5): boolean => {
  if (exp === null && act === null) return true;
  if (exp === null || act === null) return false;
  if (exp === undefined && act === undefined) return true;
  if (exp === undefined || act === undefined) return false;

  const isExpNumeric = typeof exp === 'number' || (typeof exp === 'string' && exp.trim() !== '' && !isNaN(Number(exp)));
  const isActNumeric = typeof act === 'number' || (typeof act === 'string' && act.trim() !== '' && !isNaN(Number(act)));

  if (isExpNumeric && isActNumeric) {
    const numExp = Number(exp);
    const numAct = Number(act);
    if (Number.isInteger(numExp) && Number.isInteger(numAct)) {
      return numExp === numAct;
    }
    return Math.abs(numExp - numAct) <= tolerance;
  }

  // Exact string comparison (respecting spacing, case, collation)
  return String(exp) === String(act);
};

// Compare two full rows cell-by-cell
const compareRowsExact = (rowA: any[], rowB: any[]): { match: boolean; reason?: string } => {
  for (let i = 0; i < rowA.length; i++) {
    if (!compareValues(rowA[i], rowB[i])) {
      return {
        match: false,
        reason: `Mismatched value in column index ${i}. Expected: "${rowA[i]}", Got: "${rowB[i]}"`
      };
    }
  }
  return { match: true };
};

// Deterministic row comparison for sorting
const deterministicRowCompare = (a: any[], b: any[]): number => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const valA = a[i];
    const valB = b[i];

    if (valA === null && valB === null) continue;
    if (valA === null) return -1;
    if (valB === null) return 1;

    if (typeof valA !== typeof valB) {
      return typeof valA < typeof valB ? -1 : 1;
    }

    if (typeof valA === 'number') {
      if (valA !== valB) return valA - valB;
    } else if (typeof valA === 'boolean') {
      if (valA !== valB) return valA ? 1 : -1;
    } else {
      const strA = String(valA);
      const strB = String(valB);
      if (strA !== strB) {
        return strA.localeCompare(strB);
      }
    }
  }
  return a.length - b.length;
};

// Robust SQL result set comparator
const compareResultSets = (
  expected: { headers: string[]; rows: any[][] },
  actual: { headers: string[]; rows: any[][] },
  expectedQuery: string
): { status: "success" | "error"; message: string } => {
  // 1. Column count
  if (expected.headers.length !== actual.headers.length) {
    return {
      status: "error",
      message: `Wrong Answer: Column count mismatch. Expected: ${expected.headers.length} columns, Got: ${actual.headers.length} columns.`
    };
  }

  // 2. Column Names & Order
  for (let i = 0; i < expected.headers.length; i++) {
    if (expected.headers[i] !== actual.headers[i]) {
      return {
        status: "error",
        message: `Wrong Answer: Column layout mismatch. Expected column "${expected.headers[i]}" at index ${i}, Got: "${actual.headers[i]}". (Verify column aliases, casing, and column order)`
      };
    }
  }

  // 3. Row count
  if (expected.rows.length !== actual.rows.length) {
    return {
      status: "error",
      message: `Wrong Answer: Row count mismatch. Expected: ${expected.rows.length} rows, Got: ${actual.rows.length} rows.`
    };
  }

  // 4. ORDER BY Validation
  const hasOrderBy = /\border\s+by\b/i.test(expectedQuery);
  if (hasOrderBy) {
    // Sequential comparison
    for (let i = 0; i < expected.rows.length; i++) {
      const cmp = compareRowsExact(expected.rows[i], actual.rows[i]);
      if (!cmp.match) {
        return {
          status: "error",
          message: `Wrong Answer: Row order or value mismatch at row ${i + 1}. Expected row [${expected.rows[i].map(x => x === null ? 'NULL' : String(x)).join(', ')}], Got row [${actual.rows[i].map(x => x === null ? 'NULL' : String(x)).join(', ')}].`
        };
      }
    }
  } else {
    // Unordered comparison: Sort both deterministically then verify match
    const sortedExpected = [...expected.rows].sort(deterministicRowCompare);
    const sortedActual = [...actual.rows].sort(deterministicRowCompare);
    for (let i = 0; i < sortedExpected.length; i++) {
      const cmp = compareRowsExact(sortedExpected[i], sortedActual[i]);
      if (!cmp.match) {
        return {
          status: "error",
          message: `Wrong Answer: Row data mismatch (unordered query). Expected values not found: ${cmp.reason}`
        };
      }
    }
  }

  return { status: "success", message: "Accepted!" };
};

// Canonical JSON document serializer for MongoDB
const getCanonicalString = (val: any): string => {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return '[' + val.map(getCanonicalString).join(',') + ']';
  }
  const keys = Object.keys(val).sort();
  const parts = keys.map(k => `${JSON.stringify(k)}:${getCanonicalString(val[k])}`);
  return '{' + parts.join(',') + '}';
};

// MongoDB documents comparator
const compareMongoDocs = (
  expected: any[],
  actual: any[],
  queryStr: string
): { status: "success" | "error"; message: string } => {
  if (expected.length !== actual.length) {
    return {
      status: "error",
      message: `Wrong Answer: Document count mismatch. Expected: ${expected.length} documents, Got: ${actual.length} documents.`
    };
  }

  // Floating point numeric tolerance comparator (e.g. stdDev, avg)
  const isDeepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a === null || a === undefined || b === null || b === undefined) return a == b;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === "number") {
      // Float tolerance of 0.01 for money or math rounding
      return Math.abs(a - b) < 0.01;
    }
    if (typeof a === "string") {
      return a.trim() === b.trim();
    }
    
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      return a.every((item, idx) => isDeepEqual(item, b[idx]));
    }
    
    if (typeof a === "object") {
      const keysA = Object.keys(a).filter(k => a[k] !== undefined);
      const keysB = Object.keys(b).filter(k => b[k] !== undefined);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(k => isDeepEqual(a[k], b[k]));
    }
    
    return false;
  };

  const hasSort = queryStr.includes('$sort');
  if (hasSort) {
    // Strict order checking
    for (let i = 0; i < expected.length; i++) {
      if (!isDeepEqual(expected[i], actual[i])) {
        return {
          status: "error",
          message: `Wrong Answer: Document content or ordering mismatch at index ${i}. Expected: ${JSON.stringify(expected[i])}, Got: ${JSON.stringify(actual[i])}`
        };
      }
    }
  } else {
    // Unordered matching: each actual doc must match exactly one expected doc
    const matched = new Set<number>();
    for (let i = 0; i < actual.length; i++) {
      let foundIdx = -1;
      for (let j = 0; j < expected.length; j++) {
        if (matched.has(j)) continue;
        if (isDeepEqual(actual[i], expected[j])) {
          foundIdx = j;
          break;
        }
      }
      if (foundIdx === -1) {
        return {
          status: "error",
          message: `Wrong Answer: Mismatched document value. Could not find corresponding expected document for actual: ${JSON.stringify(actual[i])}`
        };
      }
      matched.add(foundIdx);
    }
  }

  return { status: "success", message: "Accepted!" };
};

export default function SQLPracticePage() {
  const [isDark, setIsDark] = useState(true);
  const [selectedDialect, setSelectedDialect] = useState<"MySQL" | "PostgreSQL" | "MongoDB">("PostgreSQL");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [code, setCode] = useState("");

  const [questionPage, setQuestionPage] = useState(1);
  const questionsPerPageLimit = 10;

  const questions = useMemo(() => {
    return getSQLQuestions(selectedDialect);
  }, [selectedDialect]);

  const totalQuestionsList = questions.length;
  const totalQuestionPages = Math.ceil(totalQuestionsList / questionsPerPageLimit);

  const currentQuestionsBatch = useMemo(() => {
    const start = (questionPage - 1) * questionsPerPageLimit;
    return questions.slice(start, start + questionsPerPageLimit);
  }, [questions, questionPage]);

  const currentQuestion = useMemo(() => {
    const batchOffset = (questionPage - 1) * questionsPerPageLimit;
    return questions[batchOffset + currentIdx] || questions[0];
  }, [questions, questionPage, currentIdx]);

  useEffect(() => {
    setCurrentIdx(0);
    setQuestionPage(1);
  }, [selectedDialect]);

  // SQL.js status
  const [db, setDb] = useState<any>(null);
  const [sqlFactory, setSqlFactory] = useState<any>(null);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    status: "success" | "error";
    message: string;
    dataset?: { headers: string[]; rows: Array<Array<string | number | boolean | null>> };
  } | null>(null);

  // Sync Theme
  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // Initialize SQLite WebAssembly dynamically
  useEffect(() => {
    let active = true;
    async function initSql() {
      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js");
        if (!active) return;
        const initSqlJs = (window as any).initSqlJs;
        if (!initSqlJs) {
          throw new Error("WASM Database initialization script could not load.");
        }
        const SQL = await initSqlJs({
          locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        if (!active) return;
        setSqlFactory(SQL);
        const newDb = new SQL.Database();
        setDb(newDb);
        setDbLoaded(true);
      } catch (err: any) {
        console.error("SQL.js load failure:", err);
        if (active) {
          setDbError("Local SQLite compiler failed to initialize. Reverting to basic runner.");
        }
      }
    }
    initSql();
    return () => {
      active = false;
    };
  }, []);

  // Set starter code when switching questions
  useEffect(() => {
    if (currentQuestion) {
      setCode(currentQuestion.starterCode);
      setRunResult(null);
    }
  }, [currentQuestion]);

  // Helper to dynamically shift dataset values for hidden test cases
  const generateHiddenDataset = (schemaTable: SchemaTable, dataset: { headers: string[]; rows: any[][] }, seed: number = 1) => {
    if (!dataset || !dataset.rows) return { headers: [], rows: [] };
    const keyCols = new Set(
      schemaTable.columns
        .filter(c => c.key === "PK" || c.key === "FK" || c.name.toLowerCase().endsWith("id"))
        .map(c => c.name.toLowerCase())
    );

    const newRows = dataset.rows.map(row => {
      return row.map((cell, colIdx) => {
        const header = dataset.headers[colIdx].toLowerCase();
        if (keyCols.has(header)) {
          return cell; // preserve key relationships
        }
        if (typeof cell === "number") {
          // shift numeric values like salary, price, count based on seed
          return cell > 1000 ? Math.round(cell * (1.1 + seed * 0.04)) : cell + 5 + seed;
        }
        if (typeof cell === "string") {
          // shift date strings by seed days, or suffix others
          if (cell.includes("-") && !isNaN(Date.parse(cell))) {
            const d = new Date(cell);
            d.setDate(d.getDate() + seed);
            return d.toISOString().slice(0, 10);
          }
          return cell + "_" + seed;
        }
        return cell;
      });
    });
    return { headers: dataset.headers, rows: newRows };
  };

  // Database helper: Reset and load data for current question
  const populateDatabase = (activeDb: any, useHidden: boolean = false, seed: number = 1) => {
    if (!activeDb) return;

    // Drop all existing tables
    try {
      const existingTables = activeDb.exec("SELECT name FROM sqlite_master WHERE type='table';");
      if (existingTables && existingTables.length > 0) {
        const tableNames = existingTables[0].values.map((v: any) => v[0]);
        for (const name of tableNames) {
          activeDb.run(`DROP TABLE IF EXISTS ${name};`);
        }
      }
    } catch (e) {
      console.error("Clear database failed:", e);
    }

    // Create and seed tables
    for (const table of currentQuestion.schema) {
      const colDefs = table.columns.map(col => {
        let def = `${col.name} ${col.type}`;
        if (col.key === "PK") def += " PRIMARY KEY";
        return def;
      }).join(", ");

      activeDb.run(`CREATE TABLE ${table.name} (${colDefs});`);

      // Seed data if present
      let dataset = currentQuestion.sampleDatasets[table.name];
      if (dataset && useHidden) {
        dataset = generateHiddenDataset(table, dataset, seed);
      }
      if (dataset) {
        const placeholders = dataset.headers.map(() => "?").join(", ");
        const insertQuery = `INSERT INTO ${table.name} (${dataset.headers.join(", ")}) VALUES (${placeholders});`;
        const stmt = activeDb.prepare(insertQuery);
        for (const row of dataset.rows) {
          stmt.run(row);
        }
        stmt.free();
      }
    }
  };

  // Sub-expressions evaluator helper
  const resolveMongoValue = (doc: any, expr: string): any => {
    if (expr.startsWith("$")) {
      const fieldPath = expr.substring(1);
      if (!fieldPath.includes(".")) return doc[fieldPath];
      // Replicates dot-path resolution (e.g. "address.city")
      return fieldPath.split(".").reduce((curr, step) => curr?.[step], doc);
    }
    return expr;
  };

  const evaluateMongoExpression = (doc: any, expr: any): any => {
    if (expr === null) return null;
    if (typeof expr !== "object") return resolveMongoValue(doc, expr);

    const keys = Object.keys(expr);
    if (keys.length === 0) return expr;
    const op = keys[0];
    const args = expr[op];

    const getArgs = (): any[] => {
      return Array.isArray(args) ? args.map(arg => evaluateMongoExpression(doc, arg)) : [evaluateMongoExpression(doc, args)];
    };

    if (op === "$concat") {
      return getArgs().map(a => String(a ?? "")).join("");
    }
    if (op === "$substr" || op === "$substrCP") {
      const [str, start, len] = getArgs();
      return String(str || "").substring(Number(start), Number(start) + Number(len));
    }
    if (op === "$toUpper") {
      const [str] = getArgs();
      return String(str || "").toUpperCase();
    }
    if (op === "$toLower") {
      const [str] = getArgs();
      return String(str || "").toLowerCase();
    }
    if (op === "$multiply") {
      return getArgs().reduce((prod, val) => prod * Number(val || 0), 1);
    }
    if (op === "$divide") {
      const [n, d] = getArgs();
      return Number(d) === 0 ? 0 : Number(n) / Number(d);
    }
    if (op === "$add") {
      return getArgs().reduce((sum, val) => sum + Number(val || 0), 0);
    }
    if (op === "$subtract") {
      const [a, b] = getArgs();
      return Number(a) - Number(b);
    }
    if (op === "$cond") {
      if (Array.isArray(args)) {
        const [cond, t, f] = args.map(a => evaluateMongoExpression(doc, a));
        return cond ? t : f;
      } else {
        const cond = evaluateMongoExpression(doc, args.if);
        return cond ? evaluateMongoExpression(doc, args.then) : evaluateMongoExpression(doc, args.else);
      }
    }
    if (op === "$ifNull") {
      const [a, b] = getArgs();
      return (a === null || a === undefined) ? b : a;
    }
    
    return expr;
  };

  const matchesMongoQuery = (doc: any, query: any): boolean => {
    if (!query || typeof query !== "object") return true;

    for (const k of Object.keys(query)) {
      const val = query[k];

      if (k === "$and") {
        if (!Array.isArray(val)) return false;
        if (!val.every(sub => matchesMongoQuery(doc, sub))) return false;
        continue;
      }
      if (k === "$or") {
        if (!Array.isArray(val)) return false;
        if (!val.some(sub => matchesMongoQuery(doc, sub))) return false;
        continue;
      }
      if (k === "$nor") {
        if (!Array.isArray(val)) return false;
        if (val.some(sub => matchesMongoQuery(doc, sub))) return false;
        continue;
      }

      const docVal = doc[k];
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        for (const op of Object.keys(val)) {
          const opVal = val[op];
          if (op === "$gt") {
            if (!(docVal > opVal)) return false;
          } else if (op === "$gte") {
            if (!(docVal >= opVal)) return false;
          } else if (op === "$lt") {
            if (!(docVal < opVal)) return false;
          } else if (op === "$lte") {
            if (!(docVal <= opVal)) return false;
          } else if (op === "$ne") {
            if (docVal === opVal) return false;
          } else if (op === "$eq") {
            if (docVal !== opVal) return false;
          } else if (op === "$in") {
            if (!Array.isArray(opVal) || !opVal.includes(docVal)) return false;
          } else if (op === "$nin") {
            if (!Array.isArray(opVal) || opVal.includes(docVal)) return false;
          } else if (op === "$exists") {
            const exists = docVal !== undefined;
            if (exists !== Boolean(opVal)) return false;
          } else if (op === "$regex") {
            const regex = new RegExp(opVal, val.$options || "");
            if (!regex.test(String(docVal || ""))) return false;
          }
        }
      } else {
        if (docVal !== val) {
          if (String(docVal) !== String(val)) return false;
        }
      }
    }
    return true;
  };

  const executeMongoQuery = (collectionData: any[], queryStr: string): any[] => {
    let pipeline: any[] = [];
    let isFind = false;
    let findQuery: any = {};
    let findProj: any = null;

    const trimmed = queryStr.trim();

    const destructiveRegex = /\b(drop|remove|delete|insert|update|createCollection|dropDatabase|eval)\b/i;
    if (destructiveRegex.test(trimmed)) {
      throw new Error("Security Exception: Destructive MongoDB operations are disabled.");
    }

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        pipeline = eval(`(${trimmed})`);
      } catch (e) {
        throw new Error("Syntax Error: Invalid aggregation pipeline array format.");
      }
    } else if (trimmed.startsWith("db.")) {
      const matchFind = trimmed.match(/^db\.\w+\.find\s*\(\s*(\{[\s\S]*?\})?(?:\s*,\s*(\{[\s\S]*?\}))?\s*\)/);
      const matchAgg = trimmed.match(/^db\.\w+\.aggregate\s*\(\s*(\[[\s\S]*?\])\s*\)/);
      if (matchFind) {
        isFind = true;
        try {
          findQuery = matchFind[1] ? eval(`(${matchFind[1]})`) : {};
          findProj = matchFind[2] ? eval(`(${matchFind[2]})`) : null;
        } catch (e) {
          throw new Error("Syntax Error: Invalid find() query or projection arguments.");
        }
      } else if (matchAgg) {
        try {
          pipeline = eval(`(${matchAgg[1]})`);
        } catch (e) {
          throw new Error("Syntax Error: Invalid aggregate() pipeline argument.");
        }
      } else {
        throw new Error("Syntax Error: Unsupported shell format. Use db.collection.find() or db.collection.aggregate().");
      }
    } else if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      isFind = true;
      try {
        findQuery = eval(`(${trimmed})`);
      } catch (e) {
        throw new Error("Syntax Error: Invalid find filter object format.");
      }
    } else {
      throw new Error("Syntax Error: Unknown query format. Use Aggregation Array [ ... ] or Shell db.collection.find( ... ).");
    }

    let results = JSON.parse(JSON.stringify(collectionData));

    if (isFind) {
      results = results.filter((doc: any) => matchesMongoQuery(doc, findQuery));
      if (findProj) {
        results = results.map((doc: any) => {
          const projected: any = {};
          const isExclusion = Object.values(findProj).some(v => v === 0);
          
          if (isExclusion) {
            for (const key of Object.keys(doc)) {
              if (findProj[key] !== 0) {
                projected[key] = doc[key];
              }
            }
          } else {
            const includeId = findProj._id !== 0;
            if (includeId && doc._id !== undefined) projected._id = doc._id;
            
            for (const key of Object.keys(findProj)) {
              if (key === "_id") continue;
              if (findProj[key] === 1 || findProj[key] === true) {
                projected[key] = doc[key];
              }
            }
          }
          return projected;
        });
      }
    } else {
      for (const stage of pipeline) {
        const stageKeys = Object.keys(stage);
        if (stageKeys.length === 0) continue;
        const operator = stageKeys[0];
        const param = stage[operator];

        if (operator === "$match") {
          results = results.filter((doc: any) => matchesMongoQuery(doc, param));
        } else if (operator === "$project") {
          results = results.map((doc: any) => {
            const projected: any = {};
            for (const k of Object.keys(param)) {
              const val = param[k];
              if (val === 1 || val === true) {
                projected[k] = doc[k];
              } else if (val === 0 || val === false) {
                // Ignore
              } else if (typeof val === "string" && val.startsWith("$")) {
                projected[k] = resolveMongoValue(doc, val);
              } else if (typeof val === "object" && val !== null) {
                projected[k] = evaluateMongoExpression(doc, val);
              } else {
                projected[k] = val;
              }
            }
            return projected;
          });
        } else if (operator === "$addFields") {
          results = results.map((doc: any) => {
            const updated = { ...doc };
            for (const k of Object.keys(param)) {
              const val = param[k];
              if (typeof val === "string" && val.startsWith("$")) {
                updated[k] = resolveMongoValue(doc, val);
              } else if (typeof val === "object" && val !== null) {
                updated[k] = evaluateMongoExpression(doc, val);
              } else {
                updated[k] = val;
              }
            }
            return updated;
          });
        } else if (operator === "$unwind") {
          const path = typeof param === "string" ? param : param.path;
          const field = path.startsWith("$") ? path.substring(1) : path;
          const temp: any[] = [];
          for (const doc of results) {
            const list = doc[field];
            if (Array.isArray(list)) {
              for (const item of list) {
                temp.push({ ...doc, [field]: item });
              }
            } else if (list !== undefined && list !== null) {
              temp.push({ ...doc, [field]: list });
            }
          }
          results = temp;
        } else if (operator === "$group") {
          results = groupAggregation(results, param);
        } else if (operator === "$sort") {
          results.sort((a: any, b: any) => {
            for (const k of Object.keys(param)) {
              const dir = param[k];
              const valA = resolveMongoValue(a, `$${k}`);
              const valB = resolveMongoValue(b, `$${k}`);
              if (valA < valB) return dir === 1 ? -1 : 1;
              if (valA > valB) return dir === 1 ? 1 : -1;
            }
            return 0;
          });
        } else if (operator === "$limit") {
          results = results.slice(0, Number(param));
        } else if (operator === "$skip") {
          results = results.slice(Number(param));
        } else if (operator === "$count") {
          results = [{ [param]: results.length }];
        } else if (operator === "$facet") {
          const facetRes: any = {};
          for (const subKey of Object.keys(param)) {
            facetRes[subKey] = executeMongoQuery(results, JSON.stringify(param[subKey]));
          }
          results = [facetRes];
        } else {
          throw new Error(`Unsupported Aggregation operator: "${operator}".`);
        }
      }
    }

    return results;
  };

  const groupAggregation = (records: any[], param: any): any[] => {
    const idExpr = param._id;
    const groups = new Map<any, any[]>();

    for (const doc of records) {
      const keyVal = evaluateMongoExpression(doc, idExpr);
      const keyStr = typeof keyVal === "object" && keyVal !== null ? JSON.stringify(keyVal) : keyVal;
      if (!groups.has(keyStr)) {
        groups.set(keyStr, []);
      }
      groups.get(keyStr)!.push(doc);
    }

    const groupedResults: any[] = [];
    for (const [keyStr, docs] of groups.entries()) {
      let resolvedKey;
      try {
        resolvedKey = JSON.parse(keyStr);
      } catch {
        resolvedKey = keyStr;
      }

      const groupDoc: any = { _id: resolvedKey };

      for (const aggKey of Object.keys(param)) {
        if (aggKey === "_id") continue;
        const aggOpSpec = param[aggKey];
        if (typeof aggOpSpec !== "object" || aggOpSpec === null) continue;
        const aggOp = Object.keys(aggOpSpec)[0];
        const aggField = aggOpSpec[aggOp];

        if (aggOp === "$sum") {
          if (aggField === 1) {
            groupDoc[aggKey] = docs.length;
          } else {
            groupDoc[aggKey] = docs.reduce((sum: number, d: any) => sum + Number(evaluateMongoExpression(d, aggField) || 0), 0);
          }
        } else if (aggOp === "$avg") {
          const sum = docs.reduce((sum: number, d: any) => sum + Number(evaluateMongoExpression(d, aggField) || 0), 0);
          groupDoc[aggKey] = docs.length > 0 ? sum / docs.length : 0;
        } else if (aggOp === "$max") {
          const values = docs.map(d => evaluateMongoExpression(d, aggField));
          groupDoc[aggKey] = Math.max(...values.map(v => Number(v || 0)));
        } else if (aggOp === "$min") {
          const values = docs.map(d => evaluateMongoExpression(d, aggField));
          groupDoc[aggKey] = Math.min(...values.map(v => Number(v || 0)));
        } else if (aggOp === "$push") {
          groupDoc[aggKey] = docs.map(d => evaluateMongoExpression(d, aggField));
        } else if (aggOp === "$addToSet") {
          const set = new Set(docs.map(d => {
            const v = evaluateMongoExpression(d, aggField);
            return typeof v === "object" ? JSON.stringify(v) : v;
          }));
          groupDoc[aggKey] = Array.from(set).map(s => {
            try {
              return typeof s === "string" ? JSON.parse(s) : s;
            } catch {
              return s;
            }
          });
        }
      }
      groupedResults.push(groupDoc);
    }

    return groupedResults;
  };

  const convertMongoDocsToDataset = (docs: any[]) => {
    if (docs.length === 0) return { headers: [], rows: [] };
    const headerSet = new Set<string>();
    for (const doc of docs) {
      for (const k of Object.keys(doc)) {
        headerSet.add(k);
      }
    }
    const headers = Array.from(headerSet);
    const rows = docs.map(doc => {
      return headers.map(h => {
        const v = doc[h];
        if (v === undefined) return null;
        if (typeof v === "object" && v !== null) return JSON.stringify(v);
        return v;
      });
    });
    return { headers, rows };
  };

  // Run Query
  const executeQuery = (isSubmit: boolean = false) => {
    setIsRunning(true);
    setRunResult(null);

    // 1. Query Safety and Injection check
    const safety = isQuerySafe(code);
    if (!safety.safe) {
      setRunResult({
        status: "error",
        message: safety.reason || "Security Exception: Disallowed database operation."
      });
      setIsRunning(true);
      setTimeout(() => setIsRunning(false), 500);
      return;
    }

    // Simulate database network lag
    setTimeout(() => {
      if (selectedDialect === "MongoDB") {
        try {
          const primaryTable = currentQuestion.schema[0].name;
          const dataset = currentQuestion.sampleDatasets[primaryTable];
          if (!dataset) throw new Error(`Sample dataset for collection ${primaryTable} not found.`);

          // Helper to clone database records
          const getClonedRecords = (rows: any[][], headers: string[]) => {
            return rows.map(row => {
              const obj: any = {};
              headers.forEach((h, idx) => {
                // Perform deep copy for nested objects/arrays if present
                const val = row[idx];
                obj[h] = (typeof val === 'object' && val !== null) ? JSON.parse(JSON.stringify(val)) : val;
              });
              return obj;
            });
          };

          // A. Sample Test Case (Test Case 1)
          const records = getClonedRecords(dataset.rows, dataset.headers);
          
          let userDocs;
          try {
            userDocs = executeMongoQuery(records, code);
          } catch (err: any) {
            setRunResult({
              status: "error",
              message: `MongoDB Runtime Exception: ${err.message || err}`
            });
            setIsRunning(false);
            return;
          }
          const userResult = convertMongoDocsToDataset(userDocs);

          const refDocs = executeMongoQuery(records, currentQuestion.solutionQuery);
          
          const sampleCmp = compareMongoDocs(refDocs, userDocs, currentQuestion.solutionQuery);
          if (sampleCmp.status === "error") {
            setRunResult({
              status: "error",
              message: `Sample Test Case failed. ${sampleCmp.message}`,
              dataset: userResult
            });
            setIsRunning(false);
            return;
          }

          if (!isSubmit) {
            setRunResult({
              status: "success",
              message: "Run Code Successful! Passed sample test case.",
              dataset: userResult
            });
            setIsRunning(false);
            return;
          }

          // B. Submit Mode: Test 22 hidden configurations
          for (let i = 1; i <= 22; i++) {
            const hiddenDataset = generateHiddenDataset(currentQuestion.schema[0], dataset, i);
            const hiddenRecords = getClonedRecords(hiddenDataset.rows, hiddenDataset.headers);

            let userHiddenDocs;
            try {
              userHiddenDocs = executeMongoQuery(hiddenRecords, code);
            } catch (hiddenErr: any) {
              setRunResult({
                status: "error",
                message: `Hidden Configuration ${i} failed to execute: ${hiddenErr.message || hiddenErr}`
              });
              setIsRunning(false);
              return;
            }

            const refHiddenDocs = executeMongoQuery(hiddenRecords, currentQuestion.solutionQuery);
            const hiddenCmp = compareMongoDocs(refHiddenDocs, userHiddenDocs, currentQuestion.solutionQuery);
            if (hiddenCmp.status === "error") {
              setRunResult({
                status: "error",
                message: `Wrong Answer on Hidden Configuration (Test Case ${i + 1}/23)! ${hiddenCmp.message}`,
                dataset: userResult
              });
              setIsRunning(false);
              return;
            }
          }

          setRunResult({
            status: "success",
            message: `Accepted! Passed all 23/23 MongoDB test cases (1 Sample + 22 Hidden Configurations).`,
            dataset: userResult
          });
        } catch (err: any) {
          setRunResult({
            status: "error",
            message: `MongoDB Runtime Exception: ${err.message || err}`
          });
        } finally {
          setIsRunning(false);
        }
        return;
      }

      // SQL Databases (MySQL/PostgreSQL) run in isolated SQL.js instances
      if (!dbLoaded || !sqlFactory) {
        setRunResult({
          status: "error",
          message: "SQL Database engine loading. Please wait a moment."
        });
        setIsRunning(false);
        return;
      }

      try {
        // A. Sample Test Case (Test Case 1) - Fresh Database Instance
        const sampleDb = new sqlFactory.Database();
        populateDatabase(sampleDb, false);

        let userRes;
        try {
          userRes = sampleDb.exec(code);
        } catch (err: any) {
          const msg = String(err.message || err);
          let category = "SQL Runtime Exception";
          if (msg.includes("no such table")) {
            category = "Unknown Table Error";
          } else if (msg.includes("no such column") || msg.includes("has no column")) {
            category = "Unknown Column Error";
          } else if (msg.includes("syntax error")) {
            category = "Syntax Error";
          } else if (msg.includes("constraint failed") || msg.includes("FOREIGN KEY")) {
            category = "Constraint Violation";
          }
          setRunResult({
            status: "error",
            message: `${category}: ${msg}`
          });
          setIsRunning(false);
          sampleDb.close();
          return;
        }

        const userHeaders = userRes && userRes.length > 0 ? userRes[0].columns : [];
        const userRows = userRes && userRes.length > 0 ? userRes[0].values : [];

        // Reference Query - Fresh Database Instance
        const sampleRefDb = new sqlFactory.Database();
        populateDatabase(sampleRefDb, false);
        const refRes = sampleRefDb.exec(currentQuestion.solutionQuery);
        const refHeaders = refRes && refRes.length > 0 ? refRes[0].columns : [];
        const refRows = refRes && refRes.length > 0 ? refRes[0].values : [];

        const sampleCmp = compareResultSets(
          { headers: refHeaders, rows: refRows },
          { headers: userHeaders, rows: userRows },
          currentQuestion.solutionQuery
        );

        sampleDb.close();
        sampleRefDb.close();

        if (sampleCmp.status === "error") {
          setRunResult({
            status: "error",
            message: `Wrong Answer on Sample Dataset: ${sampleCmp.message}`,
            dataset: {
              headers: userHeaders,
              rows: userRows
            }
          });
          setIsRunning(false);
          return;
        }

        if (!isSubmit) {
          setRunResult({
            status: "success",
            message: "Run Code Successful! Passed sample test case.",
            dataset: {
              headers: userHeaders,
              rows: userRows
            }
          });
          setIsRunning(false);
          return;
        }

        // B. Submit Mode: Run 22 Hidden configurations in isolated DB instances
        for (let i = 1; i <= 22; i++) {
          const hiddenDb = new sqlFactory.Database();
          populateDatabase(hiddenDb, true, i);

          let userHiddenRes;
          try {
            userHiddenRes = hiddenDb.exec(code);
          } catch (hiddenErr: any) {
            setRunResult({
              status: "error",
              message: `Hidden Configuration ${i} failed to execute: ${hiddenErr.message || hiddenErr}`
            });
            hiddenDb.close();
            setIsRunning(false);
            return;
          }
          const userHiddenHeaders = userHiddenRes && userHiddenRes.length > 0 ? userHiddenRes[0].columns : [];
          const userHiddenRows = userHiddenRes && userHiddenRes.length > 0 ? userHiddenRes[0].values : [];

          const hiddenRefDb = new sqlFactory.Database();
          populateDatabase(hiddenRefDb, true, i);
          const refHiddenRes = hiddenRefDb.exec(currentQuestion.solutionQuery);
          const refHiddenHeaders = refHiddenRes && refHiddenRes.length > 0 ? refHiddenRes[0].columns : [];
          const refHiddenRows = refHiddenRes && refHiddenRes.length > 0 ? refHiddenRes[0].values : [];

          const hiddenCmp = compareResultSets(
            { headers: refHiddenHeaders, rows: refHiddenRows },
            { headers: userHiddenHeaders, rows: userHiddenRows },
            currentQuestion.solutionQuery
          );

          hiddenDb.close();
          hiddenRefDb.close();

          if (hiddenCmp.status === "error") {
            setRunResult({
              status: "error",
              message: `Wrong Answer on Hidden Configuration (Test Case ${i + 1}/23)! ${hiddenCmp.message}`,
              dataset: {
                headers: userHeaders,
                rows: userRows
              }
            });
            setIsRunning(false);
            return;
          }
        }

        setRunResult({
          status: "success",
          message: "Accepted! Passed all 23/23 test cases (1 Sample + 22 Hidden Configurations).",
          dataset: {
            headers: userHeaders,
            rows: userRows
          }
        });
      } catch (err: any) {
        setRunResult({
          status: "error",
          message: `SQL Runtime Exception: ${err.message || err}`
        });
      } finally {
        setIsRunning(false);
      }
    }, 800);
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-slate-50 text-black"} transition-colors duration-300`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl flex items-center gap-2">
              <Database className="h-8 w-8 text-cyan-400" />
              Interactive SQL & NoSQL Practice
            </h1>
            <p className={`mt-1.5 text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
              Practice writing queries against live schema models and MongoDB aggregation pipelines.
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {/* Dialect Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground/80">Dialect:</span>
              <select
                value={selectedDialect}
                onChange={(e) => setSelectedDialect(e.target.value as any)}
                className={`text-xs font-bold rounded-xl border p-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? "border-white/10 bg-zinc-900 text-white" : "border-black/10 bg-white text-black"}`}
              >
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MySQL">MySQL</option>
                <option value="MongoDB">MongoDB</option>
              </select>
            </div>
            <Link
              href="/placement-hub"
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${isDark ? "border-white/20 bg-white/5 hover:bg-white/10" : "border-black/10 bg-white hover:bg-slate-100"}`}
            >
              Back to Hub
            </Link>
          </div>
        </header>

        {/* Question Selector tabs with Pagination */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/60 font-semibold">
              Dialect Problems: <strong>{totalQuestionsList}</strong> questions available (showing {Math.min(totalQuestionsList, (questionPage - 1) * questionsPerPageLimit + 1)}-{Math.min(totalQuestionsList, questionPage * questionsPerPageLimit)})
            </span>
            {totalQuestionPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={questionPage === 1}
                  onClick={() => setQuestionPage(prev => Math.max(1, prev - 1))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${questionPage === 1 ? "opacity-30 cursor-not-allowed" : isDark ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-slate-100"}`}
                >
                  &larr; Prev Batch
                </button>
                <span className="text-xs text-foreground/60 font-mono">{questionPage} / {totalQuestionPages}</span>
                <button
                  disabled={questionPage === totalQuestionPages}
                  onClick={() => setQuestionPage(prev => Math.min(totalQuestionPages, prev + 1))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${questionPage === totalQuestionPages ? "opacity-30 cursor-not-allowed" : isDark ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-slate-100"}`}
                >
                  Next Batch &rarr;
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {currentQuestionsBatch.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${currentIdx === idx ? "bg-cyan-500 border-cyan-500 text-black" : isDark ? "border-white/10 bg-zinc-950/40 text-white/70 hover:bg-white/5" : "border-black/10 bg-white text-black/70 hover:bg-slate-100"}`}
              >
                <FileCode className="h-4 w-4" />
                <span>{q.title}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-blue-500/10 text-blue-400">
                  {q.difficulty}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Playground Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[680px] min-h-0">
          
          {/* Left Panel: Description & Schema */}
          <div className={`rounded-3xl border flex flex-col min-h-0 overflow-hidden ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
            
            {/* Header info */}
            <div className="border-b border-foreground/10 px-6 py-4 flex items-center justify-between gap-3">
              <h3 className="font-bold text-sm">Problem Description</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${currentQuestion.difficulty === "Easy" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"}`}>
                {currentQuestion.difficulty}
              </span>
            </div>

            {/* Content panel */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar text-sm leading-relaxed">
              <div>
                <h4 className="text-base font-bold mb-2">{currentQuestion.title}</h4>
                <p className={`${isDark ? "text-white/80" : "text-black/80"}`}>
                  {currentQuestion.description}
                </p>
              </div>

              {/* Schema Viewer Section */}
              <div className={`rounded-2xl border p-4 space-y-3 ${isDark ? "border-white/5 bg-zinc-950/15" : "border-black/5 bg-slate-50"}`}>
                <h5 className="font-bold flex items-center gap-1.5 text-xs text-cyan-400 uppercase tracking-wider">
                  <Layers className="h-4 w-4" />
                  Database Schema Viewer
                </h5>
                
                {currentQuestion.schema.map((table) => (
                  <div key={table.name} className="space-y-1">
                    <p className="font-bold text-xs flex items-center gap-1">
                      <Table className="h-3.5 w-3.5 text-foreground/50" />
                      {table.name} Table
                    </p>
                    <div className="border-l border-foreground/10 pl-3 space-y-1">
                      {table.columns.map(col => (
                        <div key={col.name} className="text-xs flex justify-between text-foreground/60">
                          <span className="font-mono">{col.name}</span>
                          <span className="text-[10px] uppercase font-bold text-cyan-500">{col.type} {col.key ? `(${col.key})` : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample inputs table */}
              <div className="space-y-4">
                <h5 className="font-bold text-xs uppercase tracking-wider text-cyan-400">Sample Records:</h5>
                {Object.entries(currentQuestion.sampleDatasets).map(([tableName, dataset]) => (
                  <div key={tableName} className="space-y-1.5">
                    <span className="text-xs font-semibold text-foreground/60 font-mono">{tableName} Table:</span>
                    <div className="overflow-x-auto rounded-xl border border-foreground/10">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className={`${isDark ? "bg-white/5" : "bg-black/5"}`}>
                            {dataset.headers.map(h => (
                              <th key={h} className="p-2 border-b border-foreground/10 font-bold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataset.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-foreground/5 border-b border-foreground/5">
                              {row.map((val, vIdx) => (
                                <td key={vIdx} className="p-2 font-mono">{val === null ? "NULL" : String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Right Panel: Editor & Runner */}
          <div className="flex flex-col min-h-0 space-y-4">
            
            {/* Editor Area */}
            <div className={`flex-1 rounded-3xl border flex flex-col min-h-0 overflow-hidden ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
              <div className="border-b border-foreground/10 px-6 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4.5 w-4.5 text-cyan-400" />
                  <span className="font-bold text-xs">Query Editor ({selectedDialect})</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => executeQuery(false)}
                    disabled={isRunning}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition border ${isDark ? "border-white/10 bg-zinc-900 text-white hover:bg-zinc-800" : "border-black/10 bg-slate-100 text-black hover:bg-slate-200"}`}
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Run Code
                  </button>
                  <button
                    onClick={() => executeQuery(true)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-cyan-400 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                    Submit
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 relative">
                <MonacoEditor
                  height="100%"
                  language={selectedDialect === "MongoDB" ? "javascript" : "sql"}
                  value={code}
                  onChange={(val) => setCode(val || "")}
                  theme={isDark ? "vs-dark" : "vs"}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    formatOnPaste: true,
                    suggestOnTriggerCharacters: true
                  }}
                />
              </div>
            </div>

            {/* Results Console */}
            <div className={`h-[240px] rounded-3xl border flex flex-col min-h-0 overflow-hidden ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white shadow-xs"}`}>
              <div className="border-b border-foreground/10 px-6 py-2.5 flex items-center justify-between">
                <span className="font-bold text-xs text-foreground/70">Console Output</span>
                {dbLoaded ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" /> Live DB Ready
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Loading Engine
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 no-scrollbar text-xs">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-foreground/50 py-4 justify-center">
                    <span className="spinner animate-spin border-2 border-cyan-400 border-t-transparent rounded-full h-4 w-4" />
                    Executing SQL query...
                  </div>
                ) : runResult ? (
                  <div className="space-y-4">
                    <div className={`flex items-center gap-2 font-semibold ${runResult.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                      {runResult.status === "success" ? <CheckCircle2 className="h-4.5 w-4.5" /> : <XCircle className="h-4.5 w-4.5" />}
                      <span>{runResult.message}</span>
                    </div>

                    {/* Tabular Output */}
                    {runResult.dataset && (
                      <div className="space-y-1">
                        <p className="font-bold text-[10px] text-foreground/50 uppercase tracking-wider">Output Dataset:</p>
                        <div className="overflow-x-auto rounded-lg border border-foreground/10">
                          <table className="w-full text-[11px] text-left border-collapse">
                            <thead>
                              <tr className={`${isDark ? "bg-white/5" : "bg-black/5"}`}>
                                {runResult.dataset.headers.map(h => (
                                  <th key={h} className="p-1.5 border-b border-foreground/10 font-bold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {runResult.dataset.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-foreground/5">
                                  {row.map((val, vIdx) => (
                                    <td key={vIdx} className="p-1.5 font-mono">{val === null ? "NULL" : String(val)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-foreground/40">
                    Write your query and click "Run Query" to see output results.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
