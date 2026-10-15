/* Game Hub shared streak + daily challenge helper (classic script, window.GHDaily). Keys: gh_streak, gh_daily */
(function(){
const G={paddock:{name:'PaddockScan',url:'turbo-run/'},hh:{name:'HealthAndHIT',url:'healthandhit/'},cake:{name:'Sprinkles and Layers',url:'cake/'}};
// check(ev, prog) -> true when complete. prog is a per-day scratch object persisted for cumulative goals.
const POOL=[
 {id:'ps_score',game:'paddock',text:'Score 1,500 in one PaddockScan run',check:e=>e.type==='run'&&e.score>=1500},
 {id:'ps_dist',game:'paddock',text:'Drive 2,000 m in one PaddockScan run',check:e=>e.type==='run'&&e.dist>=2000},
 {id:'ps_coins',game:'paddock',text:'Collect 25 coins in one PaddockScan run',check:e=>e.type==='run'&&e.coins>=25},
 {id:'ps_near',game:'paddock',text:'Get 8 near misses in one PaddockScan run',check:e=>e.type==='run'&&e.nears>=8},
 {id:'ps_knock',game:'paddock',text:'Survive 2 knocks in one PaddockScan run without wrecking',check:e=>e.type==='knock'&&e.knocks>=2&&e.hp>0},
 {id:'ps_repair',game:'paddock',text:'Drive over a repair box in PaddockScan',check:e=>e.type==='repair'},
 {id:'hh_bench',game:'hh',text:'Complete a Bench Press set in HealthAndHIT',check:e=>e.type==='set'&&e.ok&&e.k==='bench'},
 {id:'hh_curl',game:'hh',text:'Complete a set of Bicep Curls in HealthAndHIT',check:e=>e.type==='set'&&e.ok&&e.k==='curl'},
 {id:'hh_3sets',game:'hh',text:'Complete 3 successful sets in HealthAndHIT',check:(e,p)=>e.type==='set'&&e.ok&&(p.n=(p.n||0)+1)>=3},
 {id:'hh_5any',game:'hh',text:'Attempt 5 sets of any exercise in HealthAndHIT',check:(e,p)=>e.type==='set'&&(p.n=(p.n||0)+1)>=5},
 {id:'hh_reps',game:'hh',text:'Do 20 total reps in HealthAndHIT',check:(e,p)=>e.type==='set'&&(p.n=(p.n||0)+(e.reps||0))>=20},
 {id:'hh_heavy',game:'hh',text:'Lift 30 kg or more in a successful HealthAndHIT set',check:e=>e.type==='set'&&e.ok&&e.k!=='hiit'&&e.w>=30},
 {id:'ck_3layer',game:'cake',text:'Bake a 3-layer cake in Sprinkles and Layers',check:e=>e.type==='serve'&&e.layers>=3},
 {id:'ck_4star',game:'cake',text:'Earn 4 stars or more on a customer order in Sprinkles and Layers',check:e=>e.type==='serve'&&e.order&&e.stars>=4},
 {id:'ck_serve3',game:'cake',text:'Serve 3 cakes in Sprinkles and Layers',check:(e,p)=>e.type==='serve'&&(p.n=(p.n||0)+1)>=3},
 {id:'ck_70',game:'cake',text:'Score 70 points or more on a cake in Sprinkles and Layers',check:e=>e.type==='serve'&&e.total>=70},
 {id:'ck_5star',game:'cake',text:'Make a 5-star cake in Sprinkles and Layers',check:e=>e.type==='serve'&&e.stars>=5}];
const D={now:()=>new Date()};
const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>key(D.now());
const yesterday=()=>{const n=D.now();return key(new Date(n.getFullYear(),n.getMonth(),n.getDate()-1))};
const ld=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}h^=h>>>13;h=Math.imul(h,0x5bd1e995);h^=h>>>15;return h>>>0}
function pickFor(ds){return POOL[hash('gamehub|'+ds)%POOL.length]}
function challengeFor(ds){let c=pickFor(ds);const [y,m,d]=ds.split('-').map(Number),pv=key(new Date(y,m-1,d-1));if(pickFor(pv).id===c.id)c=POOL[(POOL.indexOf(c)+1)%POOL.length];return c}
function daily(){const ds=today(),c=challengeFor(ds);let st=ld('gh_daily',null);if(!st||st.date!==ds||st.id!==c.id){st={date:ds,id:c.id,done:false,prog:{}};sv('gh_daily',st)}
  return {date:ds,id:c.id,game:c.game,gameName:G[c.game].name,url:G[c.game].url,text:c.text,done:!!st.done,prog:st.prog}}
function streak(){const s=ld('gh_streak',{last:null,count:0}),t=today(),y=yesterday();
  return {count:s.last===t||s.last===y?s.count:0,playedToday:s.last===t,last:s.last,best:s.best||s.count||0}}
function played(){const s=ld('gh_streak',{last:null,count:0}),t=today();if(s.last===t)return streak();
  s.count=s.last===yesterday()?s.count+1:1;s.last=t;s.best=Math.max(s.best||0,s.count);sv('gh_streak',s);return streak()}
function toast(msg){try{const d=document.createElement('div');d.textContent=msg;d.style.cssText='position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:99999;background:#0b0b0b;color:#fff;border:2px solid #e10600;box-shadow:0 0 24px #e1060099;border-radius:14px;padding:12px 20px;font:800 18px system-ui,Arial;pointer-events:none;text-align:center;transition:opacity .4s';document.body.appendChild(d);setTimeout(()=>d.style.opacity='0',2600);setTimeout(()=>d.remove(),3100)}catch(e){}}
function report(game,ev){played();const c=challengeFor(today()),dd=daily();if(c.game!==game||dd.done)return false;
  const st=ld('gh_daily');let ok=false;try{ok=!!c.check(ev||{},st.prog)}catch(e){}if(ok)st.done=true;sv('gh_daily',st);if(ok)toast('🔥 Daily challenge complete!');return ok}
window.GHDaily={POOL,GAMES:G,daily,streak,played,report,challengeFor,today,_clock:D,toast};
})();
