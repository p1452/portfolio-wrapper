'use strict';
// Static UI; authenticated data stays in this browser and the existing Apps Script.
const EXERCISE_URL='https://script.google.com/macros/s/AKfycbx36_Qm9IJMQRbrUeaS6hg7xVpknexoUZKqC7z_XPx31lDMXHcBW_VD9ZJaw_qHdRrBng/exec';
const channel=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
let bridgeWindow=null,bridgeOrigin=null,nextId=0;
const requests=new Map();
let authFailed=false;
function snapshotIsStale(){
  if(typeof DASH_SNAPSHOT==='undefined' || !DASH_SNAPSHOT)return false;
  const generated=Date.parse(DASH_SNAPSHOT.data.generatedAtIso);
  return Date.now()-(Number.isFinite(generated)?generated:DASH_SNAPSHOT.savedAt)>=15*60*1000;
}
window.exerciseStatus=message=>{
  const status=document.getElementById('dataStatus');if(!status || authFailed)return;
  const routine=!message || message.includes('refreshing') || message.startsWith('Live refresh succeeded');
  const warning=routine?(snapshotIsStale()?'Saved data is out of date.':''):
    (typeof DASH_SNAPSHOT!=='undefined' && DASH_SNAPSHOT?'Refresh unavailable. Saved data may be out of date.':'Dashboard unavailable. Please retry.');
  status.textContent=warning;status.hidden=!warning;
};
function reportFailure(failure,error){
  authFailed=/\b(?:authorization is required|authentication (?:is )?required|not authenticated|sign[ -]?in required|login required|unauthenticated)\b/i.test(String(error.message||error));
  failure(error);
  document.getElementById('exerciseSignIn')?.remove();
  // A timeout or network failure is not evidence of failed authentication.
  if(!authFailed)return;
  const status=document.getElementById('dataStatus');status.textContent='Google sign-in required. ';status.hidden=false;
  const link=document.createElement('a');link.id='exerciseSignIn';link.href=EXERCISE_URL;link.target='_blank';link.rel='noopener';link.textContent='Sign in to Google';status.appendChild(link);
}
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
  if(m.error)reportFailure(request.failure,new Error(m.error));else {const wasAuth=authFailed;authFailed=false;request.success(m.data);if(wasAuth)window.exerciseStatus('')}
});
function runner(success=()=>{},failure=()=>{}){
  return {withSuccessHandler(fn){return runner(fn,failure)},withFailureHandler(fn){return runner(success,fn)},getTabData(tab){
    const request={id:++nextId,tab,success,failure};
    request.timer=setTimeout(()=>{requests.delete(request.id);reportFailure(failure,new Error('Live connection unavailable. Please retry.'))},45000);
    requests.set(request.id,request);dispatch(request);
  }};
}
window.google={script:{get run(){return runner()}}};
document.addEventListener('DOMContentLoaded',()=>{
  const frame=document.createElement('iframe');frame.title='Authenticated Exercise connection';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.style.cssText='position:absolute;left:-10000px;width:1px;height:1px;border:0';
  frame.src=EXERCISE_URL+'?mode=bridge&channel='+channel;document.body.appendChild(frame);
  setInterval(()=>{if(snapshotIsStale())window.exerciseStatus('')},60000);
  if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
});
