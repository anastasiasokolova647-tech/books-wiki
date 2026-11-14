import {readdir,readFile,writeFile,mkdir} from "node:fs/promises";
import {join,relative,basename,dirname} from "node:path";
const root="content",files=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await walk(p);else if(e.isFile()&&e.name.endsWith(".md"))files.push(p)}}await walk(root);
const paths=files.map(p=>relative(root,p).replaceAll("\\","/").slice(0,-3));
const incoming=new Map(paths.map(p=>[p,0]));
const byName=new Map();
for(const p of paths){const k=basename(p).normalize("NFC").toLocaleLowerCase("uk");if(!byName.has(k))byName.set(k,[]);byName.get(k).push(p)}
for(const file of files){const body=await readFile(file,"utf8");for(const m of body.matchAll(/\[\[([^\]]+)\]\]/g)){const t=m[1].split("|")[0].split("#")[0].replace(/\.md$/i,"").normalize("NFC").trim();if(!t)continue;let found=paths.filter(p=>p.normalize("NFC")===t||p.normalize("NFC").endsWith("/"+t));if(!found.length)found=byName.get(t.toLocaleLowerCase("uk"))||[];if(found.length===1)incoming.set(found[0],(incoming.get(found[0])||0)+1)}}
const orphans=paths.filter(p=>p.includes("/Запит/")&&incoming.get(p)===0);
const grouped=new Map();
for(const p of orphans){const parts=p.split("/"),category=parts[2]||"Інше";if(!grouped.has(category))grouped.set(category,[]);grouped.get(category).push(p)}
let output="# Покажчик запитів\n\nЦі запити можна відкрити безпосередньо з тематичного покажчика.\n\n";
for(const [category,items] of [...grouped].sort(([a],[b])=>a.localeCompare(b,"uk"))){output+="## "+category+"\n\n";for(const p of items.sort((a,b)=>a.localeCompare(b,"uk")))output+="- [["+p+"|"+basename(p)+"]]\n";output+="\n"}
const dest=join(root,"Покажчик запитів.md");await writeFile(dest,output);
console.log(JSON.stringify({orphanRequestsLinked:orphans.length,generatedPage:dest}));
