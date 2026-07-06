import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { MODULES, CASE_STUDIES } from '@/lib/systemDesignContent';
import { readJsonCache, writeJsonCache } from '@/lib/appCache';

const CACHE_KEY = 'taxonomy-categories';
const CACHE_TTL_SECONDS = 300; // 5 minutes

export async function GET() {
  try {
    // Try to retrieve cached categories taxonomy
    const cached = await readJsonCache(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const supabase = getAdminClient();

    // Query questions to find active company tags and topic tags in the database
    const { data: questionsData, error } = await supabase
      .from('questions')
      .select('company_tags, pattern_tags, difficulty, topic')
      .limit(2000); // Sample 2000 questions to extract active tags quickly

    const dbCompanyTags = new Set<string>();
    const dbTopicTags = new Set<string>();
    const dbDifficulties = new Set<string>();

    if (!error && Array.isArray(questionsData)) {
      for (const row of questionsData) {
        if (row.difficulty) dbDifficulties.add(row.difficulty);
        if (Array.isArray(row.company_tags)) {
          row.company_tags.forEach((tag) => {
            if (tag) dbCompanyTags.add(String(tag).trim());
          });
        }
        if (Array.isArray(row.pattern_tags)) {
          row.pattern_tags.forEach((tag) => {
            if (tag) dbTopicTags.add(String(tag).trim());
          });
        }
        if (Array.isArray(row.topic)) {
          row.topic.forEach((t) => {
            if (t) dbTopicTags.add(String(t).trim());
          });
        }
      }
    }

    // Default company list to fall back on if DB is empty
    const defaultCompanies = [
      'Google', 'Amazon', 'Microsoft', 'Meta', 'Netflix', 'Uber', 'LinkedIn', 'Airbnb', 
      'Atlassian', 'Adobe', 'Salesforce', 'Oracle', 'Stripe', 'TCS', 'Infosys', 'Accenture', 
      'Capgemini', 'Deloitte', 'Cognizant', 'Tech Mahindra', 'Wipro', 'Zoho', 'Goldman Sachs', 
      'JP Morgan', 'Flipkart', 'Nvidia'
    ];
    const finalCompanies = Array.from(new Set([...defaultCompanies, ...Array.from(dbCompanyTags)]));

    // Dynamic hierarchy tree construction
    const taxonomy = {
      categories: [
        {
          id: 'coding',
          label: 'Coding & Algorithmic Rounds',
          subsections: [
            { id: 'Arrays', label: 'Arrays' },
            { id: 'Strings', label: 'Strings' },
            { id: 'Linked List', label: 'Linked List' },
            { id: 'Stack', label: 'Stack' },
            { id: 'Queue', label: 'Queue' },
            { id: 'Trees', label: 'Trees' },
            { id: 'Graphs', label: 'Graphs' },
            { id: 'Dynamic Programming', label: 'Dynamic Programming' },
            { id: 'Greedy', label: 'Greedy' },
            { id: 'Backtracking', label: 'Backtracking' },
            { id: 'Bit Manipulation', label: 'Bit Manipulation' },
            { id: 'Sliding Window', label: 'Sliding Window' },
            { id: 'Two Pointers', label: 'Two Pointers' },
            { id: 'Binary Search', label: 'Binary Search' },
            { id: 'Heap', label: 'Heap' },
            { id: 'Trie', label: 'Trie' },
            { id: 'Segment Tree', label: 'Segment Tree' },
            { id: 'SQL', label: 'SQL Practice' },
            { id: 'MongoDB', label: 'MongoDB Practice' },
            { id: 'Java', label: 'Java Programming' },
            { id: 'C++', label: 'C++ Programming' },
            { id: 'Python', label: 'Python Programming' },
            { id: 'JavaScript', label: 'JavaScript Programming' }
          ]
        },
        {
          id: 'aptitude',
          label: 'Quantitative Aptitude',
          subsections: [
            { id: 'Quantitative Aptitude', label: 'Quantitative Aptitude' },
            { id: 'Arithmetic', label: 'Arithmetic' },
            { id: 'Profit & Loss', label: 'Profit & Loss' },
            { id: 'Time & Work', label: 'Time & Work' },
            { id: 'Speed Time Distance', label: 'Speed Time Distance' },
            { id: 'Probability', label: 'Probability' },
            { id: 'Permutation Combination', label: 'Permutation & Combination' },
            { id: 'Percentage', label: 'Percentage' },
            { id: 'Number System', label: 'Number System' },
            { id: 'Algebra', label: 'Algebra' },
            { id: 'Geometry', label: 'Geometry' },
            { id: 'Data Interpretation', label: 'Data Interpretation' },
            { id: 'Logical Aptitude', label: 'Logical Aptitude' }
          ]
        },
        {
          id: 'reasoning',
          label: 'Logical & Reasoning Ability',
          subsections: [
            { id: 'Logical Reasoning', label: 'Logical Reasoning' },
            { id: 'Analytical Reasoning', label: 'Analytical Reasoning' },
            { id: 'Verbal Reasoning', label: 'Verbal Reasoning' },
            { id: 'Non-Verbal Reasoning', label: 'Non-Verbal Reasoning' },
            { id: 'Seating Arrangement', label: 'Seating Arrangement' },
            { id: 'Blood Relations', label: 'Blood Relations' },
            { id: 'Coding Decoding', label: 'Coding Decoding' },
            { id: 'Puzzles', label: 'Puzzles' }
          ]
        },
        {
          id: 'cs-core',
          label: 'Computer Science Core',
          subsections: [
            { id: 'Operating Systems', label: 'Operating Systems (OS)' },
            { id: 'DBMS', label: 'Database Management Systems (DBMS)' },
            { id: 'CN', label: 'Computer Networks (CN)' },
            { id: 'OOP', label: 'Object-Oriented Programming (OOP)' }
          ]
        },
        {
          id: 'system-design',
          label: 'System Design Architecture',
          subsections: [
            ...MODULES.map((m) => ({ id: m.id, label: m.title.replace(/^\d+\.\s*/, '') })),
            ...CASE_STUDIES.map((c) => ({ id: c.id, label: c.title.replace(/^Design\s*/i, 'Design ') }))
          ]
        }
      ],
      difficulties: ['Easy', 'Medium', 'Hard'],
      companyTags: finalCompanies.sort((a, b) => a.localeCompare(b)),
      topicTags: Array.from(new Set(['Arrays', 'Strings', 'Dynamic Programming', 'SQL', 'MongoDB', ...Array.from(dbTopicTags)])).sort((a, b) => a.localeCompare(b))
    };

    await writeJsonCache(CACHE_KEY, taxonomy, CACHE_TTL_SECONDS);
    return NextResponse.json(taxonomy);
  } catch (err: unknown) {
    console.error('Failed to load dynamic categories', err);
    return NextResponse.json({ error: 'Failed to compile categories database hierarchy' }, { status: 500 });
  }
}
