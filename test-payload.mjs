const sid = 'test-sid';
fetch('http://localhost:3000/api/v1/process-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        url: 'https://example.com/some_app_url',
        appId: '1',
        isLegacy: true // or false
    })
}).then(r => r.json()).then(async data => {
console.log("Process res: ", data);

if (data.clearanceUrl) {
    const fetchRes = await fetch('http://localhost:3000' + data.clearanceUrl, { redirect: 'manual' });
    console.log("Fetch Res status:", fetchRes.status);
    console.log("Body: ", await fetchRes.text());
}
}).catch(console.error);
