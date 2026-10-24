'use strict';
// Static UI; authenticated data stays in this browser and the existing Apps Script.
const EXERCISE_URL='https://script.google.com/macros/s/AKfycbx36_Qm9IJMQRbrUeaS6hg7xVpknexoUZKqC7z_XPx31lDMXHcBW_VD9ZJaw_qHdRrBng/exec';
const channel=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
let bridgeWindow=null,bridgeOrigin=null,nextId=0;
const requests=new Map();
function dispatch(request){if(bridgeWindow)bridgeWindow.postMessage({type:'exercise:request',channel,id:request.id,tab:request.tab},bridgeOrigin)}
window.addEventListener('message',event=>{
  const m=event.data;
  if(!m || m.channel!==channel || !/^https:\/\/(?:[a-z0-9-]+-)?script\.googleusercontent\.com$/.test(event.origin)) return;
  if(m.type==='exercise:ready'){
    if(bridgeWindow && event.source!==bridgeWindow) return;
    bridgeWindow=event.source;bridgeOrigin=event.origin;requests.forEach(dispatch);return;
  }
  if(m.type!=='exercise:response' || event.source!==bridgeWindow || event.origin!==bridgeOrigin) return;
  const request=requests.get(m.id);if(!request)return;
  clearTimeout(request.timer);requests.delete(m.id);
  if(m.error)request.failure(new Error(m.error));else request.success(m.data);
});
function runner(success=()=>{},failure=()=>{}){
  return {withSuccessHandler(fn){return runner(fn,failure)},withFailureHandler(fn){return runner(success,fn)},getTabData(tab){
    const request={id:++nextId,tab,success,failure};
    request.timer=setTimeout(()=>{requests.delete(request.id);failure(new Error('Live connection unavailable. Open the Google sign-in link, then retry.'))},45000);
    requests.set(request.id,request);dispatch(request);
  }};
}
window.google={script:{get run(){return runner()}}};
document.addEventListener('DOMContentLoaded',()=>{
  const frame=document.createElement('iframe');frame.title='Authenticated Exercise connection';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.style.cssText='position:absolute;left:-10000px;width:1px;height:1px;border:0';
  frame.src=EXERCISE_URL+'?mode=bridge&channel='+channel;document.body.appendChild(frame);
  const help=document.createElement('div');help.style.cssText='padding:2px 12px;font:12px system-ui';
  const link=document.createElement('a');link.href=EXERCISE_URL;link.target='_blank';link.rel='noopener';link.textContent='Google sign-in / original app';help.appendChild(link);document.getElementById('dataStatus').after(help);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
});
