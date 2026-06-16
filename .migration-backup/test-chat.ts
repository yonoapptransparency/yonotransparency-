import http from 'http';

const data = JSON.stringify({ message: "hello" });

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/public/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  },
  res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => console.log('Response:', `${res.statusCode}`, body));
  }
);
req.on('error', e => console.error(e));
req.write(data);
req.end();
