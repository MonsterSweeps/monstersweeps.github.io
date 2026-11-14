(function(){'use strict';var d=document,$=function(s){return d.querySelector(s)},$$=function(s){return[].slice.call(d.querySelectorAll(s))},RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
var top=$('#top'),mc=$('#mcta'),fin=$('#join');
function onS(){top.classList.toggle('sc',scrollY>20);if(mc&&fin){var r=fin.getBoundingClientRect();mc.classList.toggle('hide',scrollY<innerHeight*.6||r.top<innerHeight*.9)}}
addEventListener('scroll',onS,{passive:true});onS();
var m=$('#menu'),n=$('#nav');m.addEventListener('click',function(){var o=n.classList.toggle('open');m.setAttribute('aria-expanded',o)});n.addEventListener('click',function(e){if(e.target.tagName==='A'){n.classList.remove('open');m.setAttribute('aria-expanded','false')}});
var PLAY='https://monstersweeps.net/',NROWS=3,MIN=8,MS=window.MS||{ready:Promise.resolve({}),has:function(){return false},get:function(){},apply:function(){}};
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function safeUrl(u,fb){u=String(u||'').trim();return /^https?:\/\//i.test(u)||/^\/[^\/]/.test(u)?u:fb}
function getJSON(u){return window.fetch?fetch(u,{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null}):Promise.resolve(null)}
/* Monster: breathes and blinks on his own, cheers on CTA hover and on a wheel result */
var mon=$('#mon');
function cheer(){if(!mon||RM)return;mon.classList.remove('cheer');void mon.offsetWidth;mon.classList.add('cheer')}
if(mon){mon.addEventListener('animationend',function(e){if(e.animationName==='moncheer')mon.classList.remove('cheer')});
  var hc=$('#heroCta');if(hc){hc.addEventListener('pointerenter',cheer);hc.addEventListener('focus',cheer)}
  addEventListener('monster:react',cheer);
  if(!RM)(function bl(){setTimeout(function(){mon.classList.add('blink');setTimeout(function(){mon.classList.remove('blink');bl()},160)},2400+Math.random()*3600)})()}

/* trust section: payout table, state checker and reviews link appear only when the config has real values */
MS.ready.then(function(){
  var rows=(MS.get('payouts')||[]).filter(function(r){return r&&r.method&&(r.min||r.time||r.limit)}),pt=$('#paytable');
  if(pt&&rows.length){pt.innerHTML='<table><caption class="sr">Redemptions by wallet</caption><thead><tr><th scope="col">Wallet</th><th scope="col">Minimum</th><th scope="col">Typical time</th><th scope="col">Limit</th></tr></thead><tbody>'+rows.map(function(r){return'<tr><td>'+esc(r.method)+'</td><td>'+esc(r.min||'')+'</td><td>'+esc(r.time||'')+'</td><td>'+esc(r.limit||'')+'</td></tr>'}).join('')+'</tbody></table>';pt.hidden=false}
  var rv=$('#revLink'),ru=MS.get('reviewsUrl');if(rv&&/^https:\/\//i.test(ru||''))rv.href=ru;else if(rv)rv.closest('.reviews').hidden=true;
  var dm=MS.get('officialDomains'),dl=$('#doms');
  if(dl&&Array.isArray(dm)&&dm.length){var role={'monsters.win':'Main site','sweeps.monster':'Game platforms','monsterspay.net':'Payments','monstersweeps.net':'Casino and predictions'};
    dl.innerHTML=dm.map(function(x){return'<li><b>'+esc(x)+'</b><span>'+esc(role[x]||'')+'</span></li>'}).join('')}
  /* state checker: needs at least one product with a state list */
  var av={},names={sweepsmonster:'Sweeps.Monster',casino:'Casino and predictions',monsterpay:'MonsterPay'},all={},box=$('#statecheck');
  Object.keys(names).forEach(function(k){var a=MS.get('availability.'+k);if(Array.isArray(a)&&a.length){av[k]=a;a.forEach(function(st){all[st]=1})}});
  var list=Object.keys(all).sort();
  if(box&&list.length){var sel=$('#stSel'),res=$('#stRes');
    var US=['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
    sel.insertAdjacentHTML('beforeend',US.map(function(x){return'<option>'+x+'</option>'}).join(''));
    sel.addEventListener('change',function(){var st=sel.value;if(!st){res.innerHTML='';return}
      res.innerHTML=Object.keys(av).map(function(k){var ok=av[k].indexOf(st)>-1;return'<li class="'+(ok?'y':'n')+'">'+names[k]+': '+(ok?'available':'not available')+' in '+esc(st)+'</li>'}).join('')});
    box.hidden=false}
});

/* sections fade up without moving the layout */
(function(){var io='IntersectionObserver' in window;
  if(io&&!RM){var els=$$('main>section:not(.hero)').filter(function(e){return e.getBoundingClientRect().top>innerHeight});
    var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('rv-in');ro.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(e){e.classList.add('rv');ro.observe(e)})}})();
/* faq: one open at a time */
var f=$$('#faqList details');f.forEach(function(x){x.addEventListener('toggle',function(){if(x.open)f.forEach(function(o){if(o!==x)o.open=false})})});
var y=$('#yr');if(y)y.textContent=new Date().getFullYear();
})();
