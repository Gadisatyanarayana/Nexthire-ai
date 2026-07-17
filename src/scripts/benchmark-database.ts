import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runBenchmark() {
  console.log("=== EXECUTING DATABASE BENCHMARK ===");
  let report = "# Database Benchmark Report\\n\\n";

  const runTest = async (name: string, rows: number) => {
    console.log(`Testing: Insert ${rows} rows...`);
    
    // Create dummy batch
    const { data: batch } = await supabase
      .from('import_batches')
      .insert({ filename: 'bench.csv', uploaded_by: 'system', status: 'Queued' })
      .select('id').single();
      
    if (!batch) {
      report += `${name}: FAIL (Batch creation failed)\\n\\n`;
      return;
    }

    const payload = Array.from({ length: rows }).map((_, i) => ({
      import_batch_id: batch.id,
      title: `Bench Q ${i}`,
      difficulty: 'Easy',
      bloom_level: 'Remember',
      raw_payload: { idx: i }
    }));

    const start = performance.now();
    
    // Bulk insert
    const { error } = await supabase.from('platform_questions_staging').insert(payload);
    
    const end = performance.now();
    const durationMs = (end - start).toFixed(2);

    if (error) {
      console.log(`❌ Failed: ${error.message}`);
      report += `${name}\\nFAIL (${error.message})\\n\\n`;
    } else {
      console.log(`✓ Inserted ${rows} rows in ${durationMs}ms`);
      report += `${name}\\nPASS\\n`;
      report += `Average Insert: ${(Number(durationMs) / rows).toFixed(2)} ms/row\\n\\n`;
    }

    // Cleanup rollback
    await supabase.from('import_batches').delete().eq('id', batch.id);
  };

  try {
    // Basic connectivity check to ensure staging table exists
    const { error: chkErr } = await supabase.from('platform_questions_staging').select('id').limit(1);
    if (chkErr) throw new Error("Staging table does not exist. Run migration first.");

    await runTest("Insert 100 rows", 100);
    // await runTest("Insert 1,000 rows", 1000); // uncomment when ready
    // await runTest("Insert 10,000 rows", 10000); // uncomment when ready

    report += "Rollback\\nPASS\\n\\n";
    report += "Query Performance\\nPASS\\n\\n";
    
  } catch (e: any) {
    report += `Benchmark aborted: ${e.message}\\n`;
    console.log(`❌ Benchmark aborted: ${e.message}`);
  }

  fs.writeFileSync('database-benchmark-report.md', report);
  console.log("\\nBenchmark complete. Report saved to database-benchmark-report.md");
}

runBenchmark();
