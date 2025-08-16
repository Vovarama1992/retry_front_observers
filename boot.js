(function () {
  // cookies/ids
  function getCookie(name){const m=document.cookie.match(new RegExp('(^| )'+name+'=([^;]+)'));return m?decodeURIComponent(m[2]):null;}
  function setCookie(name,value,days=365){const expires=new Date(Date.now()+days*864e5).toUTCString();document.cookie=`${name}=${encodeURIComponent(value)}; path=/; expires=${expires}`;}
  function gen(prefix){return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;}
  function nowIso(){return new Date().toISOString();}

  // source
  function getSource(){
    const p=new URLSearchParams(location.search);
    if(p.has('utm_source')) return 'utm:'+p.get('utm_source');
    if(document.referrer){try{return 'ref:'+new URL(document.referrer).hostname;}catch{}}
    return 'direct';
  }

  // visit
  let visitId=getCookie('visit_id');
  let source=getCookie('visit_source');
  let isNewVisit=false;
  if(!visitId){visitId=gen('visit');source=getSource();setCookie('visit_id',visitId);setCookie('visit_source',source);isNewVisit=true;}

  // session
  let sessionId=getCookie('session_id');
  if(!sessionId){sessionId=gen('session');setCookie('session_id',sessionId);}

  // activity throttle + session TTL
  const LA_KEY='last_action_ts';
  function bump(){localStorage.setItem(LA_KEY,String(Date.now()));}
  let last=0, MIN=1500;
  function throttled(){const n=Date.now(); if(n-last>=MIN){bump(); last=n;}}
  throttled();
  const TTL=10*60*1000;
  setInterval(()=>{const t=parseInt(localStorage.getItem(LA_KEY)||'0',10); if(Date.now()-t>TTL){sessionId=gen('session');setCookie('session_id',sessionId);throttled();}},60000);
  ['click','keydown','scroll','touchstart','visibilitychange'].forEach(evt=>addEventListener(evt,throttled,{passive:true}));

  // send visit once
  if(isNewVisit){
    fetch('https://crm.retry.school/track/visit',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({visit_id:visitId, session_id:sessionId, source:source||getSource(), timestamp:nowIso()}),
      keepalive:true
    }).catch(()=>{});
  }

  // export for other scripts
  window.visitId=visitId;
  window.sessionId=sessionId;
  window.visitSource=source||getSource();
})();