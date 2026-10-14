(function(){'use strict';var d=document,$=function(s){return d.querySelector(s)},$$=function(s){return[].slice.call(d.querySelectorAll(s))},RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
var top=$('#top'),mc=$('#mcta'),fin=$('#join');
function onS(){top.classList.toggle('sc',scrollY>20);if(mc&&fin){var r=fin.getBoundingClientRect();mc.classList.toggle('hide',scrollY<innerHeight*.6||r.top<innerHeight*.9)}}
addEventListener('scroll',onS,{passive:true});onS();
var m=$('#menu'),n=$('#nav');m.addEventListener('click',function(){var o=n.classList.toggle('open');m.setAttribute('aria-expanded',o)});n.addEventListener('click',function(e){if(e.target.tagName==='A'){n.classList.remove('open');m.setAttribute('aria-expanded','false')}});
/* the O in Monster is an eye that follows you */
var eo=$('.eyeo'),pi=eo&&eo.querySelector('i');
if(eo&&!RM){addEventListener('pointermove',function(e){var r=eo.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),l=Math.hypot(dx,dy)||1,k=Math.min(1,l/300)*.17;pi.style.setProperty('--ex',(dx/l*k)+'em');pi.style.setProperty('--ey',(dy/l*k)+'em')},{passive:true});
(function bl(){setTimeout(function(){eo.classList.add('blink');setTimeout(function(){eo.classList.remove('blink');bl()},240)},2600+Math.random()*3400)})()}
/* tiers */
var st=$$('.stair'),pt=$('#pt'),pp=$('#pp');st.forEach(function(b){b.addEventListener('click',function(){st.forEach(function(o){o.setAttribute('aria-pressed',o===b)});pt.textContent=b.dataset.t+', '+b.dataset.xp+' XP';pp.textContent=b.dataset.perk})});
/* faq: one open at a time */
var f=$$('#faqList details');f.forEach(function(x){x.addEventListener('toggle',function(){if(x.open)f.forEach(function(o){if(o!==x)o.open=false})})});
var y=$('#yr');if(y)y.textContent=new Date().getFullYear();
})();
