import http from 'http';
http.get('http://localhost:3000/src/pages/BlogDetailPage.tsx', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('HTTP', res.statusCode, data.substring(0, 500)));
});
