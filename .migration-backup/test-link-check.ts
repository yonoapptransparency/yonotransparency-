import fetch from 'node-fetch';
async function test() {
  const res = await fetch("http://localhost:3000/api/v1/link-check?id=tahynyt00");
  const text = await res.text();
  console.log(res.status, text);
}
test();
