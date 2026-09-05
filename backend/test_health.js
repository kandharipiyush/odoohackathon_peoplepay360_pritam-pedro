const http = require('http');

const endpoints = [
  { method: 'GET', path: '/api/employees' },
  { method: 'GET', path: '/api/contracts' },
  { method: 'GET', path: '/api/payruns' },
  { method: 'GET', path: '/api/payslips' },
  { method: 'GET', path: '/api/attendance' },
  { method: 'GET', path: '/api/attendance/exceptions' },
  { method: 'GET', path: '/api/time-off/types' },
  { method: 'GET', path: '/api/time-off/allocations' },
  { method: 'GET', path: '/api/time-off/requests' },
  { method: 'GET', path: '/api/intelligence/anomalies' },
  { method: 'GET', path: '/api/intelligence/budget/forecast' },
  { method: 'GET', path: '/api/intelligence/attendance-hooks/company' },
  { method: 'GET', path: '/api/intelligence/attendance-hooks/employee/1' },
  { method: 'GET', path: '/api/intelligence/audit/payslip/2' },
  { method: 'GET', path: '/api/intelligence/audit/payrun/2' }
];

let completed = 0;
endpoints.forEach(({ method, path }) => {
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path,
    method
  }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      console.log((isSuccess ? 'PASS' : 'FAIL') + ' [' + res.statusCode + '] ' + method + ' ' + path + ' -> ' + body.slice(0, 60));
      completed++;
      if (completed === endpoints.length) {
        console.log('--- Health check complete ---');
        process.exit(0);
      }
    });
  });
  req.on('error', err => {
    console.error('ERROR [' + method + ' ' + path + ']: ' + err.message);
    completed++;
    if (completed === endpoints.length) process.exit(1);
  });
  req.end();
});
