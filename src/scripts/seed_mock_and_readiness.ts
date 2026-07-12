import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding mock tests...");
  
  // Seed apt_mock_tests (Mock test templates)
  const mockTests = [
    {
      id: 'mock-tcs-nqt-1',
      title: 'TCS NQT Full Mock Test 1',
      description: 'A comprehensive mock test following the TCS NQT pattern.',
      duration_minutes: 90,
      total_questions: 65,
      type: 'company',
      difficulty: 'medium',
      configuration: {
        sections: [
          { name: 'Numerical Ability', questions: 20 },
          { name: 'Verbal Ability', questions: 25 },
          { name: 'Reasoning Ability', questions: 20 }
        ]
      }
    },
    {
      title: 'Accenture Cognitive Assessment 1',
      duration_minutes: 50,
      total_questions: 50,
      status: 'published',
      type: 'company',
      difficulty: 'medium',
      configuration: {
        sections: [
          { name: 'English Ability', questions: 17 },
          { name: 'Critical Reasoning', questions: 18 },
          { name: 'Abstract Reasoning', questions: 15 }
        ]
      }
    },
    {
      title: 'General Placement Aptitude 1',
      duration_minutes: 60,
      total_questions: 50,
      status: 'published',
      type: 'general',
      difficulty: 'hard',
      configuration: {
        sections: [
          { name: 'Quantitative', questions: 20 },
          { name: 'Logical', questions: 20 },
          { name: 'Verbal', questions: 10 }
        ]
      }
    }
  ];

  const { data: users } = await supabase.from('apt_mock_sessions').select('user_id').limit(5);

  if (!users || users.length === 0) {
    console.error("No users found in apt_mock_sessions to seed mock tests and readiness for. Mock tests require a user_id.");
    return;
  }

  // extract unique user ids
  const userIds = [...new Set(users.map(u => u.user_id))];

  for (const userId of userIds) {
    for (const test of mockTests) {
      // apt_mock_tests columns: user_id, title, total_questions, duration_minutes, status, configuration
      const { error } = await supabase.from('apt_mock_tests').insert({
        user_id: userId,
        title: test.title,
        total_questions: test.total_questions,
        duration_minutes: test.duration_minutes,
        status: test.status,
        configuration: test.configuration
      });
      if (error) console.error("Error seeding mock test:", error.message);
    }
  }
  console.log("Seeded apt_mock_tests for users.");

  console.log("Seeding company readiness for users...");
  const companies = ['Accenture', 'TCS', 'Infosys', 'Wipro'];
  
  for (const userId of userIds) {
    for (const company of companies) {
      // apt_company_readiness columns: user_id, company_id, readiness_score, updated_at
      const { error } = await supabase.from('apt_company_readiness').upsert({
        user_id: userId,
        company_id: company.toLowerCase(),
        readiness_score: Math.floor(Math.random() * 60) + 30, // 30-90
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,company_id' });

      if (error) console.error("Error seeding readiness:", error.message);
    }
  }
  console.log("Seeded apt_company_readiness.");
}

seed().catch(console.error);
