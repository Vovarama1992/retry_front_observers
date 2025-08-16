export const norm = el => (el.innerText || el.textContent || "").trim().toLowerCase();

export function onReady(cb){
  if (document.readyState === "complete" || document.readyState === "interactive") cb();
  else document.addEventListener("DOMContentLoaded", cb, { once:true });
}

export function waitIds(timeoutMs=2000){
  return new Promise((resolve)=>{
    if (window.visitId && window.sessionId) return resolve(true);
    const t0 = Date.now();
    const t = setInterval(()=>{
      if (window.visitId && window.sessionId){ clearInterval(t); resolve(true); }
      else if (Date.now()-t0 > timeoutMs){ clearInterval(t); resolve(false); }
    },50);
  });
}

export async function post(type, meta){
  await waitIds();
  const payload = {
    visit_id:   window.visitId   || null,
    session_id: window.sessionId || null,
    type,
    source:     window.visitSource || null,
    timestamp:  new Date().toISOString(),
    ...(meta ? { meta } : {})
  };
  fetch("https://crm.retry.school/track/action",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(payload),
    keepalive:true
  }).catch(()=>{});
}