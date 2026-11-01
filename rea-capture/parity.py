import re,os,json,urllib.request,hashlib,concurrent.futures as cf
urls=[u.strip() for u in open('urls.txt') if u.strip()]
IDS=['AW-18251306949','GT-5TQV7M92','GTM-WWB5G3RB','number_pool','clarity']
def ext(h):
  g=lambda p:re.findall(p,h,re.S|re.I)
  return {'title':g(r'<title[^>]*>(.*?)</title>'),
   'desc':g(r'<meta[^>]+name="description"[^>]*>'),
   'canon':g(r'<link[^>]+rel="canonical"[^>]*>'),
   'robots':g(r'<meta[^>]+name="robots"[^>]*>'),
   'og':sorted(g(r'<meta[^>]+property="og:[^>]*>')),
   'h1':g(r'<h1[^>]*>(.*?)</h1>'),
   'ldjson':[hashlib.sha1(x.strip().encode()).hexdigest() for x in g(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>')],
   'ids':{i:h.count(i) for i in IDS}}
def one(u):
  path=u.replace('https://harrisandsons.co','')
  if not path.endswith('/'):
    f='site/dist'+path; return u, os.path.exists(f), None
  f='site/dist'+path+'index.html'
  if not os.path.exists(f): return u,False,'MISSING'
  new=open(f,encoding='utf-8',errors='replace',newline='').read()
  live=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0 Chrome/130'}),timeout=40).read().decode('utf-8','replace')
  a,b=ext(live),ext(new)
  diff=[k for k in a if a[k]!=b[k]]
  return u,True,{'diff':diff,'identical_bytes':live==new,'ids':b['ids']}
with cf.ThreadPoolExecutor(6) as ex: res=list(ex.map(one,urls))
bad=[r for r in res if r[1] is False or (isinstance(r[2],dict) and r[2]['diff'])]
ident=sum(1 for r in res if isinstance(r[2],dict) and r[2]['identical_bytes'])
noids={i:sum(1 for r in res if isinstance(r[2],dict) and r[2]['ids'][i]==0) for i in IDS}
json.dump(res,open('compare/parity.json','w'),indent=1)
print('urls',len(res),'built',sum(1 for r in res if r[1]),'seo-diff/missing',len(bad),'byte-identical',ident,'pages lacking id',noids)
for r in bad[:20]: print(r)
