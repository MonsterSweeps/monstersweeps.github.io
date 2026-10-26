(function(){'use strict';var d=document,$=function(s){return d.querySelector(s)},$$=function(s){return[].slice.call(d.querySelectorAll(s))},RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
var top=$('#top'),mc=$('#mcta'),fin=$('#join');
function onS(){top.classList.toggle('sc',scrollY>20);if(mc&&fin){var r=fin.getBoundingClientRect();mc.classList.toggle('hide',scrollY<innerHeight*.6||r.top<innerHeight*.9)}}
addEventListener('scroll',onS,{passive:true});onS();
var m=$('#menu'),n=$('#nav');m.addEventListener('click',function(){var o=n.classList.toggle('open');m.setAttribute('aria-expanded',o)});n.addEventListener('click',function(e){if(e.target.tagName==='A'){n.classList.remove('open');m.setAttribute('aria-expanded','false')}});
/* hero: three endless rows of games from /data/games.json (edited in the CMS at /admin).
   Game i goes to row i%3; short rows repeat until they fill the width; each row is two identical
   tracks so the CSS slide loops without a jump. */
var rows=$('#rows'),PLAY='https://monstersweeps.net/',NROWS=3,MIN=8;
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function safeUrl(u,fb){u=String(u||'').trim();return /^https?:\/\//i.test(u)||/^\/[^\/]/.test(u)?u:fb}
function tile(x,hid){
  var img=safeUrl(x.image,''),b=String(x.badge||'').toLowerCase();
  var art=img?'<span class="art"><img src="'+esc(img)+'" alt="" loading="lazy" width="600" height="600">':'<span class="art ph"><img src="/mark.svg" alt="" width="48" height="48"><em>Game art &middot; 1:1</em>';
  if(b==='new'||b==='hot'||b==='live')art+='<span class="bdg '+b+'">'+b+'</span>';
  return '<li><a class="tile" href="'+esc(safeUrl(x.url,PLAY))+'"'+(hid?' tabindex="-1"':'')+'>'+art+'</span><span class="meta"><b>'+esc(x.name||'Game')+'</b><small>'+esc(x.provider||'')+'</small></span></a></li>'
}
if(rows&&window.fetch)fetch('/data/games.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).then(function(d){
  var g=(d&&d.games||[]).filter(function(x){return x&&x.name});if(!g.length)return;
  var html='';
  for(var r=0;r<NROWS;r++){
    var mine=g.filter(function(x,i){return i%NROWS===r});if(!mine.length)mine=g;
    var base=mine.slice();while(base.length<MIN)base=base.concat(mine);
    html+='<div class="row"><ul class="track">'+base.map(function(x){return tile(x,0)}).join('')+'</ul><ul class="track" aria-hidden="true">'+base.map(function(x){return tile(x,1)}).join('')+'</ul></div>'
  }
  rows.innerHTML=html
}).catch(function(){});
/* tiers */
var st=$$('.stair'),pt=$('#pt'),pp=$('#pp');st.forEach(function(b){b.addEventListener('click',function(){st.forEach(function(o){o.setAttribute('aria-pressed',o===b)});pt.textContent=b.dataset.t+', '+b.dataset.xp+' XP';pp.textContent=b.dataset.perk})});
/* faq: one open at a time */
var f=$$('#faqList details');f.forEach(function(x){x.addEventListener('toggle',function(){if(x.open)f.forEach(function(o){if(o!==x)o.open=false})})});
var y=$('#yr');if(y)y.textContent=new Date().getFullYear();
})();
