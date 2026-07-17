import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Milestone 5: PRR-7 Performance Certification Benchmarks
 * 
 * Execution constraints for PRR certification:
 * - Judge Evaluation: <2000ms (p95)
 */
export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    // PRR Gate Constraints
    'http_req_duration{endpoint:judge}': ['p(95)<2000'],
    'http_req_failed': ['rate<0.01'], 
  },
};

const API_BASE = 'http://localhost:3000/api/v1/coding';

export default function () {
  const payload = JSON.stringify({
    problemId: 'p-123',
    language: 'python',
    sourceCode: 'print(sum(range(100)))'
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'judge' }
  };

  const res = http.post(`${API_BASE}/submit`, payload, params);
  
  check(res, {
    'submission enqueued 202': (r) => r.status === 202,
  });

  sleep(1);
}
