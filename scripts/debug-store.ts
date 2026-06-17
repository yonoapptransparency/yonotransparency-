import { fetchStoreData } from '../src/seoHelper';
async function test() {
   const data = await fetchStoreData();
   console.log(data);
}
test();
