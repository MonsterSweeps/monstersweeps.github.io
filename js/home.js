(function(){'use strict';var d=document,$=function(s){return d.querySelector(s)},$$=function(s){return[].slice.call(d.querySelectorAll(s))},RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
var top=$('#top'),mc=$('#mcta'),fin=$('#join');
function onS(){top.classList.toggle('sc',scrollY>20);if(mc&&fin){var r=fin.getBoundingClientRect();mc.classList.toggle('hide',scrollY<innerHeight*.6||r.top<innerHeight*.9)}}
addEventListener('scroll',onS,{passive:true});onS();
var m=$('#menu'),n=$('#nav');m.addEventListener('click',function(){var o=n.classList.toggle('open');m.setAttribute('aria-expanded',o)});n.addEventListener('click',function(e){if(e.target.tagName==='A'){n.classList.remove('open');m.setAttribute('aria-expanded','false')}});
var PLAY='https://monstersweeps.net/',NROWS=3,MIN=8,MS=window.MS||{ready:Promise.resolve({}),has:function(){return false},get:function(){},apply:function(){}};
function esc(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function safeUrl(u,fb){u=String(u||'').trim();return /^https?:\/\//i.test(u)||/^\/[^\/]/.test(u)?u:fb}
function getJSON(u){return window.fetch?fetch(u,{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null}):Promise.resolve(null)}
/* honesty guards: only real, recent, masked entries are ever shown */
var WEEK=7*864e5;
function masked(n){return typeof n==='string'&&n.indexOf('*')>-1&&n.length<=24}
function recent(at){var t=Date.parse(at);return!isNaN(t)&&t<=Date.now()+6e4&&Date.now()-t<WEEK}
function ago(at){var m=Math.max(1,Math.round((Date.now()-Date.parse(at))/6e4));return m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'}
/* countdowns: every [data-until] ticks once a second; an ended one hides its [data-ends] card */
function left(ms){var s=Math.max(0,Math.floor(ms/1e3)),dd=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;function p(n){return(n<10?'0':'')+n}return(dd?dd+'d ':'')+p(h)+'h '+p(m)+'m '+p(x)+'s'}
function tick(){$$('[data-until]').forEach(function(el){var ms=+el.dataset.until-Date.now();if(ms<=0){var c=el.closest('[data-ends]');if(c)c.hidden=true;else el.parentNode.hidden=true;el.removeAttribute('data-until');return}el.textContent=left(ms)});
  var w=$('#week');if(w&&!w.hidden&&!$$('#evs .ev:not([hidden])').length)w.hidden=true}
setInterval(tick,1000);

/* hero: lead with the welcome offer when the config has one */
MS.ready.then(function(){
  if(MS.has('welcomeOffer')){var o=MS.get('welcomeOffer');$('#h1a').textContent=o;$('#h1b').textContent='No purchase necessary.';$('#h1').classList.add('offer');
    $$('[data-offer-cta]').forEach(function(a){a.textContent=a.dataset.short?'Claim offer':'Claim '+o})}
  /* 7-day streak: amounts only when the config has all seven */
  var st=MS.get('streak'),li=$$('#streak li');
  if(Array.isArray(st)&&st.length===7){li.forEach(function(l,i){l.querySelector('span').textContent=st[i]});$('#streak').classList.add('vals')}
});

/* Monster: breathes and blinks on his own, cheers on CTA hover and on a wheel result */
var mon=$('#mon');
function cheer(){if(!mon||RM)return;mon.classList.remove('cheer');void mon.offsetWidth;mon.classList.add('cheer')}
if(mon){mon.addEventListener('animationend',function(e){if(e.animationName==='moncheer')mon.classList.remove('cheer')});
  var hc=$('#heroCta');if(hc){hc.addEventListener('pointerenter',cheer);hc.addEventListener('focus',cheer)}
  addEventListener('monster:react',cheer);
  if(!RM)(function bl(){setTimeout(function(){mon.classList.add('blink');setTimeout(function(){mon.classList.remove('blink');bl()},160)},2400+Math.random()*3600)})()}

/* live block: recent wins ticker, recent redemptions, weekly top 5. Nothing renders without real data. */
(function(){var sec=$('#live');if(!sec)return;
  function clean(a){return(Array.isArray(a)?a:[]).filter(function(x){return x&&masked(x.name)&&recent(x.at)&&x.amount}).sort(function(p,q){return Date.parse(q.at)-Date.parse(p.at)})}
  Promise.all([getJSON('/data/feed.json'),getJSON('/data/leaderboard.json')]).then(function(r){
    var f=r[0]||{},lb=r[1]||{},any=false;
    var wins=f.sample?[]:clean(f.wins).slice(0,12);
    if(wins.length){var it=wins.map(function(x){return'<li><b>'+esc(x.name)+'</b> won <strong>'+esc(x.amount)+'</strong>'+(x.game?' on '+esc(x.game):'')+' <time datetime="'+esc(x.at)+'">'+ago(x.at)+'</time></li>'}).join('');
      $('#tkTrack').innerHTML=it+(wins.length>3&&!RM?it.replace(/<li>/g,'<li aria-hidden="true">'):'');$('#tkTrack').classList.toggle('run',wins.length>3&&!RM);$('#ticker').hidden=false;any=true}
    var red=f.sample?[]:clean(f.redemptions).slice(0,5);
    if(red.length){$('#feedList').innerHTML=red.map(function(x){return'<li><span><b>'+esc(x.name)+'</b> redeemed <strong>'+esc(x.amount)+'</strong>'+(x.method?' to '+esc(x.method):'')+'</span><time datetime="'+esc(x.at)+'">'+ago(x.at)+'</time></li>'}).join('');$('#redeemFeed').hidden=false;any=true}
    var top=lb.sample?[]:(Array.isArray(lb.weekly)?lb.weekly:[]).filter(function(x){return x&&masked(x.name)&&isFinite(x.xp)}).slice(0,5);
    if(top.length){$('#lbList').innerHTML=top.map(function(x){return'<li><span class="nm">'+esc(x.name)+'</span>'+(x.tier?'<span class="tchip">'+esc(x.tier)+'</span>':'')+'<span class="xp">'+Number(x.xp).toLocaleString('en-US')+' XP</span></li>'}).join('');
      var t=Date.parse(lb.resetsAt);if(!isNaN(t)&&t>Date.now()){$('#lbCount').dataset.until=t;$('#lbResets').hidden=false}
      $('#lbTop').hidden=false;any=true}
    sec.hidden=!any;if(any)tick()})})();

/* this week at Monster: one card each for race, mission and prize drop, with a countdown */
(function(){var sec=$('#week');if(!sec)return;var LABEL={race:'Race',mission:'Mission',drop:'Prize drop'};
  getJSON('/data/events.json').then(function(j){
    var seen={},ev=((j&&!j.sample&&j.events)||[]).filter(function(e){var t=e&&Date.parse(e.endsAt);if(!e||!LABEL[e.type]||!e.title||isNaN(t)||t<=Date.now()||seen[e.type])return false;seen[e.type]=1;return true}).slice(0,3);
    if(!ev.length)return;
    $('#evs').innerHTML=ev.map(function(e){return'<article class="ev '+e.type+'" data-ends><p class="evt">'+LABEL[e.type]+'</p><h3>'+esc(e.title)+'</h3>'+(e.text?'<p>'+esc(e.text)+'</p>':'')+'<p class="evc">Ends in <b data-until="'+Date.parse(e.endsAt)+'"></b></p><a class="btn gold sm" href="'+PLAY+'" data-cta="week_'+e.type+'"'+(safeUrl(e.url,'')?' data-href="'+esc(e.url)+'"':'')+'>Join in</a></article>'}).join('');
    sec.hidden=false;tick();MS.ready.then(function(){MS.apply(sec)})})})();

/* games: category tiles slide in three endless rows until real games exist; real games (entries with a "row")
   are shown in four labelled shelves: Hot, New, Live, Jackpots. */
var rows=$('#rows');
function tile(x,hid){
  var img=safeUrl(x.image,''),b=String(x.badge||'').toLowerCase();
  var art=img?'<span class="art"><img src="'+esc(img)+'" alt="" loading="lazy" decoding="async" width="600" height="600">':'<span class="art ph"><img src="/mark.svg" alt="" width="48" height="48">';
  if(b==='new'||b==='hot'||b==='live')art+='<span class="bdg '+b+'">'+b+'</span>';
  return '<li><a class="tile" href="'+PLAY+'" data-cta="games"'+(safeUrl(x.url,'')?' data-href="'+esc(x.url)+'"':'')+(hid?' tabindex="-1"':'')+'>'+art+'<span class="meta"><b>'+esc(x.name||'Game')+'</b><small>'+esc(x.provider||'')+'</small></span></span></a></li>'
}
if(rows)getJSON('/data/games.json').then(function(j){
  var g=(j&&j.games||[]).filter(function(x){return x&&x.name}),SH=[['hot','Hot'],['new','New'],['live','Live'],['jackpots','Jackpots']];
  var real=g.filter(function(x){return x.row&&x.image&&SH.some(function(s){return s[0]===String(x.row).toLowerCase()})});
  if(real.length){
    var html=SH.map(function(s){var m=real.filter(function(x){return String(x.row).toLowerCase()===s[0]});return m.length?'<div class="shelf"><h3>'+s[1]+'</h3><ul>'+m.map(function(x){return tile(x,0)}).join('')+'</ul></div>':''}).join('');
    $('#shelves').innerHTML=html;$('#shelves').hidden=false;rows.hidden=true;$('#games-h').textContent='Game lobby';
  }else if(g.length){
    var h='';for(var r=0;r<NROWS;r++){var mine=g.filter(function(x,i){return i%NROWS===r});if(!mine.length)mine=g;var base=mine.slice();while(base.length<MIN)base=base.concat(mine);
      h+='<div class="row"><ul class="track">'+base.map(function(x){return tile(x,0)}).join('')+'</ul><ul class="track" aria-hidden="true">'+base.map(function(x){return tile(x,1)}).join('')+'</ul></div>'}
    rows.innerHTML=h;
  }else $('#games').hidden=true;
  MS.ready.then(function(){MS.apply($('#games'));
    var pv=(MS.get('providers')||[]).filter(function(x){return x&&(typeof x==='string'||x.name)});
    if(pv.length&&real.length){$('#provs').innerHTML=pv.map(function(x){var n=typeof x==='string'?x:x.name,l=typeof x==='object'&&safeUrl(x.logo,'');return'<li>'+(l?'<img src="'+esc(l)+'" alt="'+esc(n)+'" loading="lazy" decoding="async" height="28">':esc(n))+'</li>'}).join('');$('#provs').hidden=false}
    if(!real.length){var gc=$('.gcount');if(gc)gc.hidden=true}   // a game count next to category tiles would mislead
  })});

/* tier bar fills once when it scrolls into view; sections fade up without moving the layout */
(function(){var io='IntersectionObserver' in window;
  var xb=$('#xpbar');if(xb){if(io&&!RM){var o=new IntersectionObserver(function(e){if(e[0].isIntersecting){xb.classList.add('in');o.disconnect()}},{threshold:.6});o.observe(xb)}else xb.classList.add('in')}
  if(io&&!RM){var els=$$('main>section:not(.hero)').filter(function(e){return e.getBoundingClientRect().top>innerHeight});
    var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('rv-in');ro.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(e){e.classList.add('rv');ro.observe(e)})}})();
/* faq: one open at a time */
var f=$$('#faqList details');f.forEach(function(x){x.addEventListener('toggle',function(){if(x.open)f.forEach(function(o){if(o!==x)o.open=false})})});
var y=$('#yr');if(y)y.textContent=new Date().getFullYear();
/* the 3D demo wheel (js/wheel.js, on the shared js/engine.js) loads only when its section is about to scroll into view */
(function(){var w=$('#spin');if(!w)return;var done=false,me=d.querySelector('script[src*="/js/home.js"]'),v=me&&me.src.split('?v=')[1],q=v?'?v='+v:'';
function add(src,cb){var sc=d.createElement('script');sc.src=src+q;sc.onload=cb;d.body.appendChild(sc)}
function load(){if(done)return;done=true;if(window.MSE)add('/js/wheel.js');else add('/js/engine.js',function(){add('/js/wheel.js')})}
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();load()}},{rootMargin:'600px 0px'});io.observe(w)}else load()})();
})();
