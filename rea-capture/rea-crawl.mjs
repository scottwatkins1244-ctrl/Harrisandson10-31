import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs';
const urls = fs.readFileSync('../urls.txt','utf8').trim().split('\n').filter(u=>u.endsWith('/'));
const browser = await chromium.connectOverCDP('http://127.0.0.1:9333');
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] || await ctx.newPage();
const all = new Set(); const out = fs.createWriteStream('../rea-evidence/resources.jsonl',{flags:'a'});
for (const [i,u] of urls.entries()) {
  try {
    await page.goto(u,{waitUntil:'load',timeout:45000});
    await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}window.scrollTo(0,0);});
    await page.waitForTimeout(800);
    const tl = JSON.parse(execFileSync('node',['../rea/scripts/rea.mjs','list-browser-targets','http://127.0.0.1:9333','--format','json'],{maxBuffer:1e8}));
    const t = tl.normalized_result.targets.find(t=>t.url===page.url()) || tl.normalized_result.targets[0];
    const ev = JSON.parse(execFileSync('node',['../rea/scripts/rea.mjs','inspect-web-page','http://127.0.0.1:9333',t.target_id,'--observation-ms','800','--format','json'],{maxBuffer:5e8}));
    const res = (ev.normalized_result.resources||[]).map(r=>r.url);
    out.write(JSON.stringify({url:u,evidence_id:ev.evidence_id,title:ev.normalized_result.target.title,dom_nodes:ev.normalized_result.dom.total_nodes,resources:res})+'\n');
    console.log(i,u,res.length);
  } catch(e){ console.log(i,u,'ERR',String(e).slice(0,200)); }
}
process.exit(0);
