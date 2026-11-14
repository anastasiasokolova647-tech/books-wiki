import {readdir,readFile,writeFile} from "node:fs/promises";
import {join,relative,basename} from "node:path";
const root="content",files=[],folders=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory()){folders.push(relative(root,p).replaceAll("\\","/"));await walk(p);}else if(e.isFile()&&e.name.endsWith(".md"))files.push(p)}}await walk(root);
const clean=s=>s.normalize("NFC").toLocaleLowerCase("uk").trim();
const strip=s=>s.replace(/^\d{1,3}\.\s*/,"").trim();
const paths=files.map(p=>relative(root,p).replaceAll("\\","/").slice(0,-3));
const exact=new Map(paths.map(p=>[clean(p),p])),byName=new Map();
for(const p of paths){const k=clean(basename(p));if(!byName.has(k))byName.set(k,[]);byName.get(k).push(p)}
let fixed=0,unresolved=0,ambiguous=0,filesChanged=0;
for(let i=0;i<files.length;i++){
 const original=await readFile(files[i],"utf8");
 let changed=false;
 const updated=original.replace(/\[\[([^\]]+)\]\]/g,(whole,inner)=>{
  const [raw,...alias]=inner.split("|");const target=raw.split("#")[0].replace(/\.md$/i,"").trim();
  if(!target)return whole;
  if(exact.has(clean(target)))return whole;
  let matches=paths.filter(p=>clean(p).endsWith("/"+clean(target)));
  if(matches.length===0){
   const name=strip(basename(target));
   matches=byName.get(clean(name))||[];
   if(matches.length>1 && target.includes("Уривки")){
    const excerpts=matches.filter(p=>p.includes("/0 Уривки/")||p.includes("/Уривки/"));
    if(excerpts.length===1)matches=excerpts;
   }
  }
  if(matches.length===0){
   const folderMatches=folders.filter(p=>clean(p)===clean(target)||clean(p).endsWith("/"+clean(target)));
   if(folderMatches.length===1)matches=folderMatches;
  }
  if(matches.length===1){fixed++;changed=true;return "[["+matches[0]+(alias.length?"|"+alias.join("|"):"|"+basename(target))+"]]"}
  if(matches.length===0)unresolved++;else ambiguous++;
  return whole;
 });
 if(changed){await writeFile(files[i],updated);filesChanged++}
}
console.log(JSON.stringify({fixedLinks:fixed,filesChanged,unresolved,ambiguous}));
