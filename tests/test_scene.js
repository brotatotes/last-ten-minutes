// Node tests: clock text mapping and deterministic noise.
const assert=require('assert');const L=require('../src/scene.js');
assert.strictEqual(L.clockText(0),'9:50:00');assert.strictEqual(L.clockText(59.9),'9:50:59');
assert.strictEqual(L.clockText(300),'9:55:00');assert.strictEqual(L.clockText(600),'10:00:00');assert.strictEqual(L.clockText(-5),'9:50:00');
assert.strictEqual(L.API.h(3,4),L.API.h(3,4));assert.notStrictEqual(L.API.h(3,4),L.API.h(4,3));
for(let i=0;i<1000;i++){const v=L.API.h(i,7);assert(v>=0&&v<1);}
console.log('scene node tests passed');
