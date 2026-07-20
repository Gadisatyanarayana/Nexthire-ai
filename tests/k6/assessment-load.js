import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Milestone 4B: PRR-8 Performance Certification Benchmarks
 * 
 * Execution constraints for PRR certification:
 * - Assessment Generation: <300ms (p95)
 * - Answer Submission: <150ms (p95)
 */
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 concurrent users
    { duration: '1m', target: 50 },   // Sustain 50 VUs
    { duration: '10s', target: 0 },   // Scale down
  ],
  thresholds: {
    // PRR Gate Constraints
    'http_req_duration{endpoint:generation}': ['p(95)<300'],
    'http_req_duration{endpoint:submission}': ['p(95)<150'],
    'http_req_failed': ['rate<0.01'], // Less than 1% errors
  },
};

const API_BASE = 'http://localhost:3000/api/v1/assessment';

export default function loadTest() {
  // 1. Simulate Assessment Generation
  const genPayload = JSON.stringify({
    blueprintId: 'bp-123',
    tenantId: 'tenant-1'
  });

  const genParams = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'generation' }
  };

  const genRes = http.post(`${API_BASE}/generate`, genPayload, genParams);
  
  check(genRes, {
    'generation status is 200/201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);

  // 2. Simulate Submissions (Outbox Pattern)
  // Assuming snapshotId is returned, but we mock it for the test
  const subPayload = JSON.stringify({
    snapshotId: 'snap-123',
    questionId: 'q-1',
    selectedOption: 'A',
    elapsedSeconds: 12
  });

  const subParams = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'submission' }
  };

  const subRes = http.post(`${API_BASE}/submit`, subPayload, subParams);

  check(subRes, {
    'submission status is 200/201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}
