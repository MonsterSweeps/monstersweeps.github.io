(function(){'use strict';var d=document,rm=matchMedia('(prefers-reduced-motion: reduce)').matches,fine=matchMedia('(hover:hover)').matches;d.documentElement.classList.add('js');
var $=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return[].slice.call((c||d).querySelectorAll(s))};
var bar=$('.bar'),pg=$('#pg'),tt=$('#totop'),tk=false;
function onS(){tk=false;var y=scrollY,h=d.documentElement.scrollHeight-innerHeight;if(bar)bar.classList.toggle('sc',y>30);if(pg)pg.style.width=(h>0?y/h*100:0)+'%';if(tt)tt.classList.toggle('show',y>900)}
addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(onS)}},{passive:true});onS();
if(tt)tt.addEventListener('click',function(){scrollTo({top:0,behavior:rm?'auto':'smooth'})});
var m=$('#menu'),n=$('#nav');if(m&&n){m.addEventListener('click',function(){var o=n.classList.toggle('open');m.setAttribute('aria-expanded',o)});n.addEventListener('click',function(e){if(e.target.tagName==='A'){n.classList.remove('open');m.setAttribute('aria-expanded','false')}})}
/* smooth in-page links */
$$('a[href^="#"]').forEach(function(a){var h=a.getAttribute('href');if(h.length<2)return;a.addEventListener('click',function(e){var t=d.getElementById(h.slice(1));if(!t)return;e.preventDefault();t.scrollIntoView({behavior:rm?'auto':'smooth',block:'start'});try{history.pushState(null,'',h)}catch(x){}})});
/* reveal */
var rv=$$('.prose section,.reveal-i');
if('IntersectionObserver' in window&&!rm){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.04,rootMargin:'0px 0px -6% 0px'});rv.forEach(function(e){io.observe(e)})}else rv.forEach(function(e){e.classList.add('in')});
/* ring */
$$('.bigpct').forEach(function(b){if('IntersectionObserver' in window&&!rm){var o=new IntersectionObserver(function(es){if(es[0].isIntersecting){b.classList.add('in');o.disconnect()}});o.observe(b)}else b.classList.add('in')});
/* TOC: scrollspy + read ticks */
var tl=$$('.toc a'),secs=tl.map(function(a){return $(a.getAttribute('href'))});
function spy(){var cur=-1,line=innerHeight*.3;secs.forEach(function(s,i){if(!s)return;var r=s.getBoundingClientRect();if(r.top<line)cur=i;if(r.bottom<line)tl[i].classList.add('done')});tl.forEach(function(a,i){a.classList.toggle('on',i===cur)});var on=tl[cur];if(on&&on.parentNode&&getComputedStyle(on.parentNode).overflowX==='auto'){on.parentNode.scrollTo({left:on.offsetLeft-20,behavior:rm?'auto':'smooth'})}}
if(tl.length){addEventListener('scroll',function(){requestAnimationFrame(spy)},{passive:true});spy()}
/* reading time */
var pr=$('.prose'),rt=$('#rt');if(pr&&rt){var w=(pr.textContent.match(/\S+/g)||[]).length;rt.textContent=Math.max(1,Math.round(w/220))+' min read'}
/* tilt on cards */
if(!rm&&fine)$$('.kcard,.rcard,.scard,.rstep,.glance a').forEach(function(c){});
/* self-check (responsible gaming) */
var cks=$$('.chk'),res=$('#chkres');
if(cks.length&&res){var msg=$('#chkmsg');function upd(){var k=cks.filter(function(c){return c.getAttribute('aria-pressed')==='true'}).length;if(!k){res.classList.remove('show');return}
msg.innerHTML=k>=3?'<strong>Thank you for being honest with yourself.</strong> You ticked '+k+' of '+cks.length+'. That is a good moment to set a limit, take a break or talk to someone. Free, confidential support is available 24/7 at <a href="tel:18006973738">1-800-MY-RESET (1-800-697-3738)</a>.':'<strong>Thank you for checking in.</strong> You ticked '+k+' of '+cks.length+'. Even one is worth noticing. The tools below take effect right away, and you can change them any time.';res.classList.add('show')}
cks.forEach(function(c){c.addEventListener('click',function(){c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')==='true'?'false':'true');upd()})})}
/* breathing label */
var bl=$('#breathl');if(bl&&!rm){var ph=['Breathe in','Hold','Breathe out','Hold'],i=0;setInterval(function(){i=(i+1)%4;bl.textContent=ph[i]},2000)}
/* referral estimator */
var cd=$('#cd');
if(cd){var T=[['Bronze',0],['Silver',200],['Gold',700],['Platinum',1200],['Diamond',2000]],rate=.5,cx=$('#cx'),M=function(v){return'$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})};
function calc(){var D=Math.max(0,Math.min(10000,parseFloat(cd.value)||0)),xp=+cx.value,gain=Math.round(D*rate),after=xp+gain;$('#cxv').textContent=xp.toLocaleString('en-US');$('#rc').textContent=M(D*rate);$('#rx').textContent='+'+gain.toLocaleString('en-US')+' XP';
function tier(x){var k=0;T.forEach(function(t,j){if(x>=t[1])k=j});return k}var k=tier(after),nx=T[k+1],lo=T[k][1],p=nx?(after-lo)/(nx[1]-lo):1;$('#rm').style.width=Math.round(p*100)+'%';
$('#rn').innerHTML=nx?'Your XP: <b>'+xp.toLocaleString('en-US')+'</b> &rarr; <b>'+after.toLocaleString('en-US')+'</b>. You would be '+T[k][0]+', with <b>'+(nx[1]-after).toLocaleString('en-US')+' XP</b> to go to '+nx[0]+'.':'Your XP: <b>'+after.toLocaleString('en-US')+'</b>. That is the top tier, Diamond.'}
cd.addEventListener('input',calc);cx.addEventListener('input',calc);$$('.seg button').forEach(function(b){b.addEventListener('click',function(){$$('.seg button').forEach(function(o){o.setAttribute('aria-pressed',o===b)});rate=parseFloat(b.dataset.r);calc()})});calc()}

/* toast */
var toast=$('#toast'),tto;function say(m){if(!toast)return;toast.textContent=m;toast.classList.add('show');clearTimeout(tto);tto=setTimeout(function(){toast.classList.remove('show')},2200)}
/* share */
var cl=$('#copyLink'),ns=$('#nativeShare'),ms=$('#mailShare');
if(cl){cl.addEventListener('click',function(){var u=location.href.split('#')[0];if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(function(){say('Link copied')},function(){say(u)})}else say(u)});
if(navigator.share&&ns){ns.hidden=false;ns.addEventListener('click',function(){navigator.share({title:d.title,url:location.href.split('#')[0]}).catch(function(){})})}
if(ms)ms.href='mailto:?subject='+encodeURIComponent(d.title)+'&body='+encodeURIComponent(location.href.split('#')[0])}
/* blog filter */
var bg=$('#bgrid');
if(bg){var q=$('#bq'),cats=$$('#cats button'),cs=$$('.bcard',bg),em=$('#bempty'),cat='';function flt(){var t=(q.value||'').toLowerCase().trim(),n=0,first=true;cs.forEach(function(c){var ok=(!cat||c.dataset.cat===cat)&&(!t||c.dataset.q.indexOf(t)>-1);c.classList.toggle('hide',!ok);c.classList.remove('feat');if(ok){n++;if(first&&!cat&&!t){c.classList.add('feat')}first=false}});em.classList.toggle('show',!n)}
q.addEventListener('input',flt);cats.forEach(function(b){b.addEventListener('click',function(){cat=b.dataset.c;cats.forEach(function(o){o.setAttribute('aria-pressed',o===b)});flt()})});flt()}
/* XP tier explorer */
var xr=$('#xpRange');
if(xr){var tb=$$('#mt5 button'),T2=tb.map(function(b){return+b.dataset.xp}),names=tb.map(function(b){return $('b',b).textContent}),mx=+xr.max,cur2=-1;
function px(){var xp=+xr.value,k=0;T2.forEach(function(t,i){if(xp>=t)k=i});$('#xpValue').textContent=xp.toLocaleString('en-US');var nx=T2[k+1],p=nx?(xp-T2[k])/(nx-T2[k]):1;$('#xpBar').style.width=Math.round(p*100)+'%';$('#xpNext').textContent=nx?(nx-xp).toLocaleString('en-US')+' XP to '+names[k+1]:'Top tier reached. Welcome to the summit.';var f=xp/mx*100;xr.style.background='linear-gradient(90deg,#f5b301 '+f+'%,#2b2b4d '+f+'%)';
tb.forEach(function(b,i){b.setAttribute('aria-pressed',i===k);b.classList.toggle('reached',i<k)});if(k!==cur2){if(cur2>-1&&k>cur2){tb[k].animate&&!rm&&tb[k].animate([{transform:'translateY(-4px) scale(1)'},{transform:'translateY(-12px) scale(1.12)'},{transform:'translateY(-4px) scale(1)'}],{duration:520,easing:'cubic-bezier(.3,1.6,.5,1)'})}cur2=k;$('#perk').textContent=tb[k].dataset.perk}}
xr.addEventListener('input',px);tb.forEach(function(b,i){b.addEventListener('click',function(){xr.value=T2[i];px()})});xr.value=0;px()}
/* redeem checklist */
var rc=$$('.rchk');
if(rc.length){function ur(){var k=rc.filter(function(c){return c.getAttribute('aria-pressed')==='true'}).length;$('#rbar').style.width=(k/rc.length*100)+'%';$('#rmsg').textContent=k===rc.length?'You are ready to request your redemption.':k?(rc.length-k)+' more to check before you request.':'Tick what you have done so far.'}
rc.forEach(function(c){c.addEventListener('click',function(){c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')==='true'?'false':'true');ur()})})}
/* contact form */
var cf=$('#cform');
if(cf){cf.addEventListener('submit',function(e){e.preventDefault();var v=$('#ct').value.split('|'),to=v[0]==='privacy'?'privacy@monstersweeps.net':'support@monstersweeps.net',u=$('#cu').value.trim(),b=$('#cm').value.trim()+(u?'\n\nUsername: '+u:'');location.href='mailto:'+to+'?subject='+encodeURIComponent(v[1])+'&body='+encodeURIComponent(b)})}
/* leaderboard */
var pod=$('#podium');
if(pod){var D=null,per='weekly',tabs=$$('.lbtabs button'),lst=$('#lblist'),note=$('#lbnote');
var TT=[['Bronze',0,'#d58a45'],['Silver',200,'#cfd5e2'],['Gold',700,'#f5b301'],['Platinum',1200,'#8fd0ff'],['Diamond',2000,'#c4a8ff']];
function cnt(el,t){if(rm){el.textContent=t.toLocaleString('en-US');return}var t0=null;(function f(t1){if(!t0)t0=t1;var p=Math.min((t1-t0)/1300,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(t*e).toLocaleString('en-US');if(p<1)requestAnimationFrame(f)})(performance.now())}
function esc2(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function render(){if(!D)return;var rows=(D[per]||[]).slice(0,10);note.classList.toggle('show',!!D.sample);
if(!rows.length){pod.innerHTML='';lst.innerHTML='<li style="opacity:1;transform:none;display:block;text-align:center">No rankings yet for this period. Be the first!</li>';return}
var order=[1,0,2],ph='';order.forEach(function(i){var r=rows[i];if(!r)return;ph+='<div class="pod p'+(i+1)+'">'+(i===0?'<div class="crown" aria-hidden="true">&#128081;</div>':'')+'<div class="who">'+esc2(r.name)+'</div><div class="xpv" data-n="'+r.xp+'">0</div><div class="tr">'+(r.tier?esc2(r.tier)+' &middot; ':'')+'XP this period</div><div class="blk">'+(i+1)+'</div></div>'});pod.innerHTML=ph;
$$('.xpv',pod).forEach(function(e){setTimeout(function(){cnt(e,+e.dataset.n)},rm?0:700)});
lst.innerHTML=rows.slice(3).map(function(r,i){var t=TT.filter(function(x){return x[0]===r.tier})[0];return'<li style="--k:'+i+';--c:'+(t?t[2]:'#2b2b4d')+'"><span class="rk">'+(i+4)+'</span><span class="nm">'+esc2(r.name)+'</span>'+(t?'<span class="tchip">'+t[0]+'</span>':'')+'<span class="xp">'+r.xp.toLocaleString('en-US')+' XP</span></li>'}).join('')}
tabs.forEach(function(b){b.addEventListener('click',function(){per=b.dataset.p;tabs.forEach(function(o){o.setAttribute('aria-selected',o===b)});render()})});
try{D=JSON.parse($('#lbdata').textContent)}catch(e){}render();
if(window.fetch)fetch('/data/leaderboard.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).then(function(j){if(j&&j.weekly){D=j;render()}}).catch(function(){})}
var y=$('#yr');if(y)y.textContent=new Date().getFullYear();
})();
(function(){var h=document.querySelector('.hart'),s=document.querySelector('.dhero');if(!h||!s||matchMedia('(prefers-reduced-motion: reduce)').matches||!matchMedia('(hover:hover)').matches)return;s.addEventListener('pointermove',function(e){var r=s.getBoundingClientRect();h.style.setProperty('--px',((e.clientX-r.left)/r.width-.5)*-18+'px');h.style.setProperty('--py',((e.clientY-r.top)/r.height-.5)*-14+'px')});s.addEventListener('pointerleave',function(){h.style.setProperty('--px','0px');h.style.setProperty('--py','0px')})})();
