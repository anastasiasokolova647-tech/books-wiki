const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const code=fs.readFileSync('quartz/static/walk/rotation.js','utf8');
function setup(data=new Map(),broken=false){const window={};vm.runInNewContext(code,{window,localStorage:{getItem:k=>{if(broken)throw Error();return data.get(k)||null},setItem:(k,v)=>{if(broken)throw Error();data.set(k,v)}},Math});return window.TeaRotation;}
const pool=[{id:'a'},{id:'b'},{id:'c'}];
test('new visits exhaust theme before repeat, including across reloads',()=>{const data=new Map();const ids=[];for(let i=0;i<9;i++)ids.push(setup(data).pick(pool,'fun').id);for(let i=0;i<9;i+=3)assert.equal(new Set(ids.slice(i,i+3)).size,3);for(let i=1;i<ids.length;i++)assert.notEqual(ids[i],ids[i-1]);});
test('theme pools never mix, even with mood weighting',()=>{const r=setup();for(let i=0;i<10;i++){const picked=r.pick(pool,'fun',()=>100);assert.ok(pool.some(s=>s.id===picked.id));}assert.equal(r.pick([{id:'warm'}],'warmth').id,'warm');});
test('unavailable storage still rotates in current visit',()=>{const r=setup(new Map(),true);assert.equal(new Set(pool.map(()=>r.pick(pool,'fun').id)).size,3);});
test('corrupt storage, one item and empty pool are safe',()=>{const r=setup(new Map([['tea-walk-seen-v1:fun','broken']]));assert.ok(r.pick(pool,'fun'));assert.equal(r.pick([],'empty'),null);assert.equal(r.pick([{id:'only'}],'one').id,'only');assert.equal(r.pick([{id:'only'}],'one').id,'only');});
