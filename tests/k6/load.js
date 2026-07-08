import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Hold at 20 users for 1 min
    { duration: '30s', target: 0 },  // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be < 500ms
  },
};

export default function () {
  const BASE_URL = 'http://localhost:3000/api/v1/system-design';
  
  // Dashboard Load Test
  let res = http.get(`${BASE_URL}/modules`);
  check(res, { 'status was 200': (r) => r.status == 200 });
  
  sleep(1);
}
