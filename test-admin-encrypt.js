fetch('http://localhost:3000/api/v1/admin/encrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com' })
}).then(r => r.text()).then(console.log);
