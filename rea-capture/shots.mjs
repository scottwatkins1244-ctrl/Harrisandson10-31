import { chromium } from 'playwright';
import fs from 'fs'; import { PNG } from 'pngjs'; import pixelmatch from 'pixelmatch';
const pages=['/','/about-us/','/kitchen-remodeling/','/contact-us/','/portfolio/','/how-to-build-an-adu-on-my-existing-home/'];
const vps={desktop:{width:1440,height:900},mobile:{width:390,height:844,isMobile:true,deviceScaleFactor:1}};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const out=[];const missing=new Set();
async function shot(side,p,vp,file){
  const ctx=await b.newContext({viewport:{width:vp.width,height:vp.height},isMobile:!!vp.isMobile,deviceScaleFactor:1,reducedMotion:'reduce'});
  const pg=await ctx.newPage();
  if(side==='new') await pg.route(/^https:\/\/harrisandsons\.co\//, async r=>{const u=new URL(r.request().url());const res=await fetch('http://localhost:4321'+u.pathname);if(res.status!==200)missing.add(u.pathname+' '+res.status);await r.fulfill({status:res.status,headers:{'content-type':res.headers.get('content-type')||'application/octet-stream'},body:Buffer.from(await res.arrayBuffer())});});
  await pg.goto('https://harrisandsons.co'+p,{waitUntil:'load',timeout:60000});
  await pg.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,80));}scrollTo(0,0);});
  await pg.addStyleTag({content:'*,*:before,*:after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
  await pg.waitForTimeout(2500);
  await pg.screenshot({path:file,fullPage:true}); await ctx.close();
}
for(const p of pages) for(const [vn,vp] of Object.entries(vps)){
  const n=(p==='/'?'home':p.replace(/\//g,''))+'-'+vn;
  const A=`../compare/${n}-old.png`,B=`../compare/${n}-new.png`;
  await shot('old',p,vp,A); await shot('new',p,vp,B);
  const a=PNG.sync.read(fs.readFileSync(A)), c=PNG.sync.read(fs.readFileSync(B));
  const w=Math.min(a.width,c.width),h=Math.min(a.height,c.height);
  const crop=(img)=>{const o=new PNG({width:w,height:h});PNG.bitblt(img,o,0,0,w,h,0,0);return o;};
  const d=new PNG({width:w,height:h});
  const px=pixelmatch(crop(a).data,crop(c).data,d.data,w,h,{threshold:0.1});
  fs.writeFileSync(`../compare/${n}-diff.png`,PNG.sync.write(d));
  const r={page:p,viewport:vn,old:[a.width,a.height],new:[c.width,c.height],diff_pct:+(100*px/(w*h)).toFixed(3)};
  console.log(JSON.stringify(r)); out.push(r);
}
fs.writeFileSync('../compare/visual-diff.json',JSON.stringify(out,null,1)); fs.writeFileSync('../compare/new-missing-assets.txt',[...missing].join('\n'));console.log('missing',missing.size);await b.close();
