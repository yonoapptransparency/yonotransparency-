import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
const window = new JSDOM('').window;
// dompurify requires window
const purify = typeof DOMPurify === 'function' ? DOMPurify(window) : DOMPurify;
console.log('sanitize exists?', !!purify.sanitize);
console.log('return string?', typeof purify.sanitize('test'));
