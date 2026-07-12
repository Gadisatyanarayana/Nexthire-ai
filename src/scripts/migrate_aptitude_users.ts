// Run this with ts-node or within a Next.js API route if preferred.
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("Starting Aptitude User Migration to Knowledge Graph...");

  // 1. Fetch all distinct users with aptitude progress
  const { data: users, error: userErr } = await supabase
    .from('apt_question_attempts')
    .select('user_id')
    .limit(10000); // adjust for batching if needed

  if (userErr) {
    console.error("Error fetching users:", userErr);
    return;
  }

  const uniqueUsers = Array.from(new Set(users.map(u => u.user_id)));
  console.log(`Found ${uniqueUsers.length} users with aptitude activity.`);

  // 2. Fetch all modules and topics
  const { data: topics, error: topicsErr } = await supabase
    .from('apt_topics')
    .select('id, module_id');
    
  if (topicsErr) {
    console.error("Error fetching topics:", topicsErr);
    return;
  }

  // 3. Migrate each user
  for (const userId of uniqueUsers) {
    console.log(`Migrating user ${userId}...`);

    // Calculate score based on past attempts (Mocking logic for script)
    const { data: attempts } = await supabase
      .from('apt_question_attempts')
      .select('topic_id, is_correct, time_taken_ms')
      .eq('user_id', userId);

    if (!attempts || attempts.length === 0) continue;

    const topicStats: Record<string, { t: number, c: number }> = {};
    attempts.forEach(a => {
      if (!topicStats[a.topic_id]) topicStats[a.topic_id] = { t: 0, c: 0 };
      topicStats[a.topic_id].t += 1;
      if (a.is_correct) topicStats[a.topic_id].c += 1;
    });

    const masteryUpdates = Object.keys(topicStats).map(topicId => {
      const stats = topicStats[topicId];
      const accuracy = (stats.c / stats.t) * 100;
      
      let level = "practicing";
      if (accuracy >= 80) level = "mastered";
      else if (accuracy >= 60) level = "competent";
      
      return {
        user_id: userId,
        topic_id: topicId,
        mastery_score: Math.round(accuracy),
        mastery_level: level,
        questions_attempted: stats.t,
        last_reviewed_at: new Date().toISOString()
      };
    });

    if (masteryUpdates.length > 0) {
      await supabase.from('apt_topic_mastery').upsert(masteryUpdates, { onConflict: 'user_id,topic_id' });
      console.log(`Migrated ${masteryUpdates.length} topics for user ${userId}.`);
    }
  }

  console.log("Migration completed.");
}

runMigration().catch(console.error);
