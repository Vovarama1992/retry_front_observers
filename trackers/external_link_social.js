import { norm, post, onReady } from "../utils.js";

const SOCIAL_DOMAINS = {
  telegram: ["t.me","telegram.me","telegram.org"],
  youtube: ["youtube.com","youtu.be"],
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  // artstation убираем отсюда! 
  vk: ["vk.com"],
  facebook: ["facebook.com"],
  twitter: ["twitter.com","x.com"],
  discord: ["discord.gg","discord.com"],
  linkedin: ["linkedin.com"],
  github: ["github.com"],
};

const TELEGRAM_SPECIAL_PATHS = [/^\/links\/?$/i];
const onLinksPage = () => TELEGRAM_SPECIAL_PATHS.some(rx => rx.test(location.pathname || "/"));

function detect(href){
  try{
    const u = new URL(href, location.href);
    const host = u.host.toLowerCase();
    for (const [platform, domains] of Object.entries(SOCIAL_DOMAINS)){
      if (domains.some(d => host.includes(d))) return { platform, host };
    }
    return { platform: null, host };
  }catch{ return { platform:null, host:null }; }
}

function shouldMarkAsSocial(a){
  const href = a.getAttribute("href") || "";
  const { platform, host } = detect(href);
  if (!host) return false;
  // телеграм на /links уходит в спец-событие — здесь не помечаем
  if (platform === "telegram" && onLinksPage()) return false;
  return true;
}

function mark(root=document){
  root.querySelectorAll('a[href]').forEach(a=>{
    if (a.dataset.track) return;
    if (shouldMarkAsSocial(a)) a.setAttribute("data-track","external_link_social");
  });
}

function buildMeta(a){
  const href = a?.getAttribute?.('href') || "";
  const { platform, host } = detect(href);
  const text = norm(a) || null;
  return { href: href || null, host: host || null, platform: platform || host || null, text };
}

export function initExternalLinkSocial(){
  onReady(()=>{
    document.addEventListener("click",(e)=>{
      const a = (e.target instanceof Element) ? e.target.closest('a[data-track="external_link_social"]') : null;
      if (a) post("external_link_social", buildMeta(a));
    }, { capture:true, passive:true });

    mark(document);
    new MutationObserver(muts=>{
      for (const m of muts){
        for (const node of m.addedNodes){
          if (node.nodeType !== 1) continue;
          mark(node);
        }
      }
    }).observe(document.documentElement, { childList:true, subtree:true });
  });
}