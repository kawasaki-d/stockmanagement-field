/* ストマネ現場チェックリスト：オフライン起動と自動更新。
   起動はいつも iPad の中の保存分からすぐ行う（電波の弱い場所でも待たない）。
   新しい版はアプリ側が見つけて、この sw.js を入れ替える → 入れ替わったら画面が自動で切り替わる。 */
const VERSION='2026-10-01_2158';
const CACHE='stmn-'+VERSION;
const ASSETS=['./index.html','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    for(const u of ASSETS){
      const r=await fetch(u+'?v='+encodeURIComponent(VERSION),{cache:'no-store'});      // サーバの一時保存を避けて最新を取る
      if(!r.ok) throw new Error(u+' '+r.status);
      if(u==='./index.html'){ const t=await r.clone().text(); if(t.indexOf(VERSION)<0) throw new Error('index.html is not '+VERSION); }
      await c.put(u, r);
    }
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
  if(u.searchParams.has('t')) return;                            // 更新の確認はそのままネットへ
  const name=u.pathname.split('/').pop();
  const key=(r.mode==='navigate' || name==='' || name==='index.html') ? './index.html' : './'+name;
  e.respondWith((async()=>{
    const hit=await caches.match(key,{cacheName:CACHE}) || await caches.match(key);
    if(hit) return hit;
    try{ return await fetch(r); }
    catch(err){ const idx=await caches.match('./index.html'); if(idx && r.mode==='navigate') return idx; throw err; }
  })());
});
