require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const assert = require('assert');

// Simulate the logic in ProgressFacade directly since we can't easily import TS Server Actions in a plain JS script without transpilation
async function runRuntimeTest() {
  console.log("Running Backend End-to-End Workflow Completion Test...");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const userId = "00000000-0000-0000-0000-000000000000";
  const tenantId = "00000000-0000-0000-0000-000000000000";
  const lessonId = "test-lesson-123";

  try {
    // 1. Simulate Auto-save (IN_PROGRESS)
    console.log("Testing Auto-Save...");
    const resumeState = { scroll: 0.75, videoTime: 120 };
    let { error: autoSaveError } = await supabase.from('learning_progress').upsert({
      user_id: userId,
      tenant_id: tenantId,
      content_type: 'LESSON',
      content_id: lessonId,
      status: 'IN_PROGRESS',
      resume_state: resumeState,
      active_time_seconds: 30
    }, { onConflict: "user_id, content_type, content_id" });
    assert(!autoSaveError, `Auto-save failed: ${autoSaveError?.message}`);
    console.log("✅ Auto-save successful");

    // 2. Simulate Mark Complete
    console.log("Testing Mark Complete Workflow...");
    // 2a. Update Progress
    let { error: completeError } = await supabase.from('learning_progress').upsert({
      user_id: userId,
      tenant_id: tenantId,
      content_type: 'LESSON',
      content_id: lessonId,
      status: 'COMPLETED',
      active_time_seconds: 60
    }, { onConflict: "user_id, content_type, content_id" });
    assert(!completeError, `Mark complete failed: ${completeError?.message}`);
    
    // 2b. Log Analytics Event
    let { error: eventError } = await supabase.from('learning_events').insert({
      user_id: userId,
      tenant_id: tenantId,
      content_type: 'LESSON',
      content_id: lessonId,
      event_type: 'lesson_completed'
    });
    assert(!eventError, `Event log failed: ${eventError?.message}`);

    // 2c. Award XP
    let { error: xpError } = await supabase.from('xp_transactions').insert({
      user_id: userId,
      tenant_id: tenantId,
      amount: 25,
      source_type: 'LESSON_COMPLETE',
      source_id: lessonId
    });
    assert(!xpError, `XP transaction failed: ${xpError?.message}`);

    // 2d. Update Stats
    let { error: statsError } = await supabase.from('user_stats').upsert({
      user_id: userId,
      tenant_id: tenantId,
      total_xp: 25,
      current_level: 1
    }, { onConflict: "user_id" });
    assert(!statsError, `Stats update failed: ${statsError?.message}`);

    console.log("✅ Mark Complete workflow successful (Progress, Events, XP, Stats)");

    // Verify data in DB
    const { data: progress } = await supabase.from('learning_progress').select('*').eq('content_id', lessonId).single();
    assert(progress.status === 'COMPLETED', "Progress status is not COMPLETED");
    console.log("✅ Data verified in DB");

  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  }
}

runRuntimeTest();
