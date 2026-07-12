const companies = [
  'Accenture', 'Amazon', 'Apple', 'Cisco', 'Cognizant', 'Deloitte',
  'Goldman Sachs', 'Google', 'IBM', 'Infosys', 'Intel', 'Meta',
  'Microsoft', 'Netflix', 'Oracle', 'Samsung', 'SAP', 'TCS',
  'Uber', 'Wipro'
];

const existing = ['TCS', 'Infosys', 'Amazon', 'Google'];

const toAdd = companies.filter(c => !existing.includes(c));

let code = '';
for (const c of toAdd) {
  code += `  {
    id: "${c.toLowerCase().replace(/ /g, '-')}",
    name: "${c}",
    sections: [
      { name: "Quantitative Aptitude", duration_minutes: 30, num_questions: 20 },
      { name: "Logical Reasoning", duration_minutes: 30, num_questions: 20 },
      { name: "Verbal Ability", duration_minutes: 30, num_questions: 20 }
    ],
    topic_weightage: {
      "Number System": 15,
      "Time and Work": 15,
      "Data Interpretation": 20,
      "Coding-Decoding": 20
    },
    difficulty_distribution: { easy: 0.2, medium: 0.5, hard: 0.3 },
    estimated_cutoff_percentage: 70,
    hiring_process: ["Online Assessment", "Technical Interview", "HR Interview"]
  },\n`;
}
console.log(code);
