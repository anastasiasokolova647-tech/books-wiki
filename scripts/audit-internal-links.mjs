import { readdir, readFile } from "node:fs/promises";
import { join, relative, basename } from "node:path";

const root="content";
const files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await walk(p);else if(e.isFile()&&e.name.endsWith(".md"))files.push(p)}}
await walk(root);
const paths=files.map(p=>relative(root,p).replaceAll("\\","/").slice(0,-3));
const byBase=new Map();
for(let i=0;i<paths.length;i++){const b=basename(paths[i]);if(!byBase.has(b))byBase.set(b,[]);byBase.get(b).push(i)}
const incoming=new Uint32Array(paths.length);
const outgoing=new Uint32Array(paths.length);
const unresolved=[];
const ambiguous=[];
const wiki=/\[\[([^\]]+)\]\]/g;
for(let i=0;i<files.length;i++){
 const content=await readFile(files[i],"utf8");
 for(const match of content.matchAll(wiki)){
  let target=match[1].split("|")[0].split("#")[0].trim().replace(/\.md$/i,"");
  if(!target)continue;
  let hits=[];
  if(target.includes("/")){hits=paths.flatMap((p,j)=>p===target||p.endsWith("/"+target)?[j]:[])}
  else hits=byBase.get(target)||[];
  if(hits.length===1){incoming[hits[0]]++;outgoing[i]++}
  else if(hits.length===0)unresolved.push({from:paths[i],target});
  else ambiguous.push({from:paths[i],target,matches:hits.length});
 }
}
const empty=[];const isolated=[];const orphanRequests=[];
for(let i=0;i<files.length;i++){
 const content=await readFile(files[i],"utf8");
 if(!content.trim())empty.push(paths[i]);
 if(incoming[i]===0){isolated.push(paths[i]);if(paths[i].includes("/Запит/"))orphanRequests.push(paths[i])}
}
const report={method:"Static exact/unique-basename wikilink graph. Ambiguous targets are NOT counted as confirmed broken.",files:files.length,empty:empty.length,emptyWithNoIncoming:empty.filter(p=>incoming[paths.indexOf(p)]===0).length,noIncoming:isolated.length,requestNoIncoming:orphanRequests.length,unresolvedWikiLinks:unresolved.length,ambiguousWikiLinks:ambiguous.length,samples:{requestNoIncoming:orphanRequests.slice(0,60),unresolved:unresolved.slice(0,60),ambiguous:ambiguous.slice(0,10)}};
console.log("AUDIT_REPORT_START");
console.log(JSON.stringify(report,null,2));
console.log("AUDIT_REPORT_END");
