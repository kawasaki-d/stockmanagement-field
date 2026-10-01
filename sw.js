/* ストマネ現場チェックリスト：オフライン起動用。
   電波があれば最新版を取りに行き、無ければ前回保存した版で起動する。 */
const CACHE='stmn-2026-10-01_1938';
const ASSETS=['./','./index.html','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    await Promise.allSettled(ASSETS.map(u=>fetch(u,{cache:'reload'}).then(r=>{ if(r.ok) return c.put(u,r); })));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys()) if(k.startsWith('stmn-') && k!==CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url); if(u.origin!==location.origin) return;
  const key = (r.mode==='navigate' || u.pathname.endsWith('/')) ? './index.html' : u.pathname.split('/').pop() ? './'+u.pathname.split('/').pop() : './';
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    try{
      const net=await Promise.race([
        fetch(r.url,{cache:'no-store',credentials:'same-origin'}),
        new Promise((_,ng)=>setTimeout(()=>ng(new Error('timeout')),4000))]);
      if(net && net.ok){ c.put(key, net.clone()); return net; }
      throw new Error('bad status');
    }catch(err){
      const hit=await c.match(key) || await c.match('./index.html') ;
      if(hit) return hit;
      throw err;
    }
  })());
});
