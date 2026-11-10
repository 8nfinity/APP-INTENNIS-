/* IN Tennis Club — telas do protótipo oficial ligadas ao servidor real (API + Supabase). */
const SUPABASE_URL='https://qyfvnqktlxpwnbwpfbeo.supabase.co',SUPABASE_KEY='sb_publishable_3o3nGIoot4LrY_ELoXmWYg_bORMpjIK',TZ='America/Sao_Paulo';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])), money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const spNow=()=>{let d=new Date();return{date:d.toLocaleDateString('en-CA',{timeZone:TZ}),hour:Number(d.toLocaleTimeString('en-GB',{timeZone:TZ,hour:'2-digit',hour12:false}).slice(0,2))}};
let today=spNow().date;
/* iPhone em tela cheia: a janela da página às vezes fica mais baixa que a tela (faixa em branco embaixo). Usa a altura real da tela. */
function fitHeight(){
  let standalone=navigator.standalone||matchMedia('(display-mode: standalone)').matches,portrait=innerHeight>=innerWidth,h=innerHeight;
  if(standalone&&portrait){let sh=Math.max(screen.height,screen.width);if(sh-h>=1&&sh-h<=120)h=sh}
  document.documentElement.style.setProperty('--app-h',h+'px');
}
fitHeight();addEventListener('resize',fitHeight);addEventListener('orientationchange',()=>setTimeout(fitHeight,300));

const dateISO=d=>new Date(d+'T12:00:00'), dayLabel=d=>dateISO(d).toLocaleDateString('pt-BR',{day:'numeric',month:'long'}), shortDate=d=>dateISO(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}), addDays=(d,n)=>{let x=dateISO(d);x.setDate(x.getDate()+n);return x.toLocaleDateString('en-CA')}, maxDate=()=>addDays(today,365), hh=h=>String(h).padStart(2,'0')+':00';
const paths={calendar:'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z',trophy:'M8 3h8v7a4 4 0 0 1-8 0V3zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-5 1h10',events:'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z',social:'M21 11a8 8 0 0 1-8 8H7l-5 3 2-6a8 8 0 1 1 17-5z',user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 22v-3a8 8 0 0 1 16 0v3',arrow:'M5 12h14m-5-5 5 5-5 5',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-12 12h6',check:'M5 12l4 4L20 5',plus:'M12 4v16M4 12h16',heart:'M12 21S2 15 2 8a5 5 0 0 1 10-1A5 5 0 0 1 22 8c0 7-10 13-10 13z',share:'M15 3l6 6-6 6m6-6H9a5 5 0 0 0-5 5v6',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM9 3l-1 3-3 1-2 4 2 3 1 3 4 3 3-1 3-1 3-4-1-3-1-3-4-3-3 1z',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v6l4 2',grid:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',back:'M15 5l-7 7 7 7'};
const icon=n=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n]||paths.calendar}"/></svg>`;
const initials=name=>String(name||'?').split(' ').filter(Boolean).map(x=>x[0]).slice(0,2).join('');
const btn=(t,a,kind='primary',extra='')=>`<button class="${kind}" data-action="${a}" ${extra}>${t}</button>`, avatar=(name,cls='',url='')=>`<span class="avatar ${cls}">${url?`<img src="${esc(url)}" alt="">`:esc(initials(name))}</span>`, court=(clay=false)=>`<div class="court-mini ${clay?'clay':''}"><img src="assets/${clay?'clay-court':'hard-court'}.jpg" alt="${clay?'Quadra de saibro':'Quadra de piso rápido'} · imagem ilustrativa" loading="lazy"></div>`;

/* ---------- dados (sempre vindos do servidor) ---------- */
const emptyDb=()=>({me:null,email:'',courts:[],hours:[7,8,9,10,11,14,15,16,17,18,19,20,21],teachers:[],players:[],reservations:[],events:[],posts:[],myPosts:[],challenges:[],agenda:null});
let db=emptyDb(), sb=null;
let state={page:'welcome',court:'',date:today,time:'',type:'free',teacher:'',month:dateISO(today),rank:'geral',eventTab:'feed',profileTab:'posts',event:'',reservation:'',photo:'',zoom:1,hold:null,newProfile:false};
let activeSheet='',timerHandle,deferredInstall=null;
const avail={},summary={},fetching=new Set();

async function api(path,opts={}){
  let {data}=await sb.auth.getSession(),token=data.session?.access_token;
  let res=await fetch('/api'+path,{method:opts.method||'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:opts.body?JSON.stringify(opts.body):undefined});
  let json=await res.json().catch(()=>({}));
  if(res.status===401){setTimeout(()=>sb.auth.signOut(),0);throw new Error('Sua sessão expirou. Entre novamente.')}
  if(!res.ok)throw new Error(json.error||'Não foi possível concluir. Tente novamente.');
  return json;
}
const isVideo=p=>p.tag==='video'||/\.(mp4|mov|webm|m4v)(\?|$)/i.test(p.mediaUrl||'');
const mapPost=p=>({id:p.id,authorId:p.authorId,name:p.authorName,handle:p.authorUsername,avatar:p.authorAvatarUrl,text:p.text,media:p.mediaUrl,mediaType:isVideo(p)?'video':'image',kudos:p.kudos,liked:p.kudosByMe,commentCount:p.comments,mine:p.authorId===db.me?.id,date:new Date(p.createdAt).toLocaleDateString('en-CA',{timeZone:TZ})});
const mapBooking=b=>({id:b.id,date:b.date,time:hh(b.hour),hour:b.hour,court:b.courtId,type:b.kind==='aula'?'lesson':'free',teacherName:b.teacherName,status:b.status==='pendente'?'pending':'paid',price:b.price,checked:b.status==='concluido'});
const EV_TYPE={torneio:'Torneio',jogo:'Jogo',aula:'Aula',novidade:'Novidade'};
const mapEvent=e=>({id:e.id,title:e.title,date:e.date,type:EV_TYPE[e.category]||'Novidade',desc:e.description||'',place:e.place||'',joined:e.interestedByMe,count:e.interestCount});
function mapMatch(m){let mine=db.me?.id,status=m.status==='finalizado'?'done':m.status==='aguardando_confirmacao'?(m.reportedBy===mine?'confirm':'review'):'pending';return{id:m.id,name:m.otherName,avatar:m.otherAvatarUrl,status,sets:m.score||'',winner:m.winnerId?(m.winnerId===mine?'me':'other'):''}}
const mapPlayer=p=>({id:p.id,name:p.name,handle:p.username,avatar:p.avatarUrl,points:p.points,monthly:p.monthPoints,wins:p.wins,losses:p.losses});

const loaders={
  async me(){let r=await api('/me');db.email=r.email||'';db.me=r.player;return r.player},
  async courts(){let r=await api('/courts');db.courts=r.courts.map(c=>({id:c.id,name:c.name,floor:c.surface,price:c.pricePerHour,active:true}));if(r.hours?.length)db.hours=r.hours;if(!db.courts.some(c=>c.id===state.court))state.court=db.courts[0]?.id||''},
  async teachers(){let r=await api('/teachers');db.teachers=r.teachers.map(t=>({id:t.id,name:t.name,price:t.pricePerHour,avatar:t.avatarUrl}));if(!db.teachers.some(t=>t.id===state.teacher))state.teacher=db.teachers[0]?.id||''},
  async ranking(){db.players=(await api('/ranking')).players.map(mapPlayer)},
  async bookings(){db.reservations=(await api('/bookings')).bookings.map(mapBooking)},
  async events(){db.events=(await api('/events')).events.map(mapEvent)},
  async posts(){db.posts=(await api('/posts')).posts.map(mapPost)},
  async myPosts(){db.myPosts=(await api('/posts?author='+db.me.id)).posts.map(mapPost)},
  async matches(){db.challenges=(await api('/matches')).matches.map(mapMatch)},
  async agenda(){if(!db.me?.teacherId){db.agenda=null;return}let r=await api(`/teacher/agenda?from=${today.slice(0,8)}01&days=366`);db.agenda=r}
};
async function loadAll(){
  await loaders.me();if(!db.me)return;
  let names=['courts','teachers','ranking','bookings','events','posts','myPosts','matches','agenda'],res=await Promise.allSettled(names.map(n=>loaders[n]()));
  let fail=res.find(x=>x.status==='rejected');if(fail&&res.every(x=>x.status==='rejected'))throw fail.reason;
}
const pageLoads={ranking:['me','ranking'],social:['posts'],events:['events'],challenge:['matches','ranking'],profile:['me','myPosts','bookings','matches'],booking:['bookings'],classes:['agenda'],schedule:['bookings']};
async function refreshFor(p){
  let names=pageLoads[p];if(!names||!db.me)return;
  await Promise.allSettled(names.map(n=>loaders[n]()));
  if(state.page===p&&!activeSheet&&!document.activeElement?.closest?.('#phone form'))renderApp();
}

/* ---------- disponibilidade ---------- */
const availKey=()=>state.date+'|'+(state.type==='lesson'?state.teacher:'');
async function ensureAvail(force=false){
  let key=availKey(),a=avail[key];
  if(!force&&a&&Date.now()-a.at<20000)return;
  if(fetching.has(key))return;
  fetching.add(key);
  try{let q=`/availability?date=${state.date}`+(state.type==='lesson'&&state.teacher?`&teacherId=${state.teacher}`:'');let r=await api(q);avail[key]={at:Date.now(),taken:new Set(r.taken.map(x=>x.courtId+'|'+x.hour)),teacher:new Set(r.teacherTaken||[])}}catch(e){console.error(e)}
  fetching.delete(key);
  if(['schedule','lesson','calendar'].includes(state.page)&&availKey()===key){fixTime();if(!activeSheet)renderApp(true)}
}
async function ensureSummary(){
  let m=state.month,first=new Date(m.getFullYear(),m.getMonth(),1).toLocaleDateString('en-CA'),from=first<today?today:first,key=from;
  if(summary[key]&&Date.now()-summary[key].at<30000)return;
  if(fetching.has('s'+key))return;fetching.add('s'+key);
  try{let r=await api(`/availability/summary?from=${from}&days=31`);summary[key]={at:Date.now(),slots:r.slotsPerDay,days:Object.fromEntries(r.days.map(d=>[d.date,d.taken]))}}catch(e){console.error(e)}
  fetching.delete('s'+key);
  if(['schedule','lesson','calendar'].includes(state.page)&&!activeSheet)renderApp(true);
}
function summaryFor(d){let m=dateISO(d),first=new Date(m.getFullYear(),m.getMonth(),1).toLocaleDateString('en-CA'),s=summary[first<today?today:first];if(!s&&d>=today){for(let k in summary)if(summary[k].days&&d>=k&&d<=addDays(k,30)){s=summary[k];break}}return s?{n:s.days[d]||0,slots:s.slots||1}:null}
function isTaken(c,d,t){
  let h=Number(t.slice(0,2));if(d===today&&h<=spNow().hour)return true;
  let a=avail[d+'|'+(state.type==='lesson'?state.teacher:'')]||avail[d+'|'];if(!a)return false;
  return a.taken.has(c+'|'+h)||(state.type==='lesson'&&a.teacher.has(h));
}
function fixTime(){
  let c=selectedCourt();if(!c.id)return;
  let times=db.hours.map(hh);if(!state.time||isTaken(c.id,state.date,state.time)){state.time=times.find(t=>!isTaken(c.id,state.date,t))||''}
}

/* ---------- navegação ---------- */
function toast(t){$('#toast').innerHTML=`<div class="toast">${esc(t)}</div>`;clearTimeout(toast.h);toast.h=setTimeout(()=>$('#toast').innerHTML='',3500)}
function go(p){if(p==='checkout'&&!state.hold)p='schedule';state.page=p;activeSheet='';if(p==='lesson')state.type='lesson';renderApp();$('#phone .app-scroll')?.scrollTo(0,0);refreshFor(p)}
function renderApp(keepScroll){
  today=spNow().date;
  let sc=$('#phone .app-scroll'),top=sc&&keepScroll?sc.scrollTop:0,pageName=state.page;
  $('#phone').innerHTML=shell(state.page);
  if(top){let n=$('#phone .app-scroll');if(n)n.scrollTop=top}
  paintEdges(pageName);
  clearInterval(timerHandle);if(pageName==='checkout'){updateTimer();timerHandle=setInterval(updateTimer,1000)}
  if(['schedule','lesson','calendar','checkout'].includes(pageName)&&db.me){ensureAvail();ensureSummary()}
}
function paintEdges(p){
  /* cores das faixas fora do app (barra de status e base do iPhone) iguais ao topo e ao menu de cada tela */
  let dark=['schedule','lesson'].includes(p),entry=['welcome','register','login','verify','recover','boot'].includes(p),fresh=p==='edit'&&state.newProfile;
  let top=dark?'#0b1c17':entry||fresh?'#0b1c17':'#172d24',bottom=dark?'#101a13':entry||fresh?'#0b1c17':'#ffffff';
  let g=`linear-gradient(180deg,${top} 0,${top} 90px,${bottom} 90px,${bottom} 100%)`;
  document.documentElement.style.background=g;document.body.style.background='transparent';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content',top);
}
const navs=[['schedule','calendar','Agendar'],['ranking','trophy','Ranking'],['events','events','Eventos'],['social','social','Social'],['profile','user','Perfil']];
const selectedCourt=()=>db.courts.find(x=>x.id===state.court)||db.courts[0]||{id:'',name:'Quadra',floor:'',price:0};
const selectedTeacher=()=>db.teachers.find(x=>x.id===state.teacher)||db.teachers[0];
const price=()=>selectedCourt().price+(state.type==='lesson'?(selectedTeacher()?.price||0):0);
const me=()=>db.players.find(x=>x.id===db.me?.id)||{points:db.me?.points||0,monthly:db.me?.monthPoints||0,wins:db.me?.wins||0,losses:db.me?.losses||0};
function shell(p){
  let entry=['welcome','register','login','verify','recover','boot'].includes(p),fresh=p==='edit'&&state.newProfile,chrome=!entry&&!fresh,sched=['schedule','lesson'].includes(p);
  let bottom=chrome?`<nav class="nav">${navs.map(n=>`<button data-action="go:${n[0]}" class="${p===n[0]||(n[0]==='schedule'&&['calendar','lesson','checkout','booking'].includes(p))?'active':''}">${icon(n[1])}<span>${n[2]}</span></button>`).join('')}${db.me?.teacherId?`<button data-action="go:classes" class="${p==='classes'?'active':''}">${icon('grid')}<span>Aulas</span></button>`:''}</nav>`:'';
  let c=selectedCourt(),ci=db.courts.indexOf(c);
  return `${sched?`<div class="schedule-shell" style="--court-photo:url('assets/${/saibro/i.test(c.floor)?'clay-court':'hard-court'}.jpg');--court-position:${ci===2?'65%':'center'}">`:''}${chrome?`<div class="app-top"><button class="top-link" data-action="go:schedule"><span class="wordmark">IN<span>.</span></span></button><div class="row">${p!=='schedule'?btn('←','go:schedule','round','aria-label="Voltar ao início"'):''}<button class="round" aria-label="Notificações" data-action="notifications">${icon('bell')}</button></div></div>`:''}<div class="app-scroll page-${p} ${entry?'entry-screen':''}" ${p==='welcome'?'style="padding:0"':fresh?'style="padding-top:max(19px,env(safe-area-inset-top))"':''}>${page(p)}</div>${bottom}${sched?'</div>':''}`;
}
function sectionHeader(k,t,s=''){return `<div class="section-kicker">${k}</div><h1>${t}</h1>${s?`<p>${s}</p>`:''}`}

/* ---------- telas ---------- */
function calendarHTML(context='schedule'){
  let m=state.month,year=m.getFullYear(),month=m.getMonth(),first=new Date(year,month,1),end=new Date(year,month+1,0).getDate(),pad=(first.getDay()+6)%7;
  let dots=d=>{let n=0;if(context==='classes')n=(db.agenda?.classes||[]).filter(x=>x.date===d).length;else if(context==='events')n=db.events.filter(x=>x.date===d).length;else{let s=summaryFor(d);n=s&&s.n?Math.max(1,Math.min(3,Math.ceil(s.n/s.slots*3))):0}return n?'<i class="dot"></i>'.repeat(Math.min(n,3)):''};
  return `<div class="calendar"><div class="between">${btn('‹',`month:-1:${context}`,'round','aria-label="Mês anterior"')}<b style="font-size:13px;text-transform:capitalize">${m.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</b>${btn('›',`month:1:${context}`,'round','aria-label="Próximo mês"')}</div><div class="cal-grid">${['S','T','Q','Q','S','S','D'].map(x=>`<div class="cal-week">${x}</div>`).join('')}${'<span></span>'.repeat(pad)}${Array.from({length:end},(_,i)=>{let d=`${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;return `<button class="cal-cell ${state.date===d?'active':''}" data-action="date:${d}:${context}" ${(context!=='classes'&&d<today)||d>maxDate()?'disabled':''}>${i+1}<small>${dots(d)}</small></button>`}).join('')}</div><div class="tiny" style="margin-top:9px">● Até 3 pontos indicam mais reservas no dia</div></div>`;
}
function scheduleHTML(lesson=false){
  let d=state.date,type=lesson?'lesson':state.type,c=selectedCourt(),times=db.hours.map(hh);
  return `${sectionHeader('Bora pra quadra',`Seu próximo jogo<br>começa aqui.`,`Escolha seu horário e deixe o resto com a gente.`)}<div class="tabs"><button data-action="type:free" class="${type==='free'?'active':''}">Jogo livre</button><button data-action="type:lesson" class="${type==='lesson'?'active':''}">Aula com professor</button></div><div class="between"><h2>Sua quadra</h2><span class="tiny">60 minutos por reserva</span></div><div class="court-options" role="group" aria-label="Escolher quadra">${db.courts.map(x=>`<button class="court-option ${c.id===x.id?'active':''}" data-action="court:${x.id}" aria-pressed="${c.id===x.id}">${esc(x.name)}</button>`).join('')}</div><div class="court-selection-info"><span>${esc(c.floor)} · ${money(c.price)} por hora</span><span class="tiny">Imagem ilustrativa</span></div>${type==='lesson'?`<h2>Com quem você vai treinar?</h2><div class="stack">${db.teachers.map(x=>`<button class="card ${state.teacher===x.id?'selected':''}" style="text-align:left;color:var(--white)" data-action="teacher:${x.id}"><div class="row">${avatar(x.name,'',x.avatar)}<div style="flex:1"><b>${esc(x.name)}</b><div class="sub">Professor(a) · + ${money(x.price)}</div></div>${state.teacher===x.id?'◉':'○'}</div></button>`).join('')||'<div class="empty">Nenhum professor disponível no momento.</div>'}</div>`:''}<div class="between"><h2>Quando?</h2>${btn('Ver calendário','go:calendar','text-btn')}</div><div class="days">${Array.from({length:6},(_,i)=>{let dt=addDays(today,i),s=summaryFor(dt),n=s&&s.n?(s.n/s.slots>.25?2:1):0;return `<button class="day ${dt===d?'active':''}" data-action="date:${dt}:schedule">${dateISO(dt).toLocaleDateString('pt-BR',{weekday:'short'}).slice(0,3)}<b>${dateISO(dt).getDate()}</b>${'<i class="dot"></i>'.repeat(n)}</button>`}).join('')}</div><label class="tiny" for="bookingDate">Ou escolha outra data (até 1 ano)</label><div class="field"><input id="bookingDate" type="date" value="${d}" min="${today}" max="${maxDate()}" data-date="schedule"></div><div class="between"><h2>Horários</h2><span class="tiny">${shortDate(d)}</span></div><div class="times">${times.map(t=>`<button data-action="time:${t}" class="time ${state.time===t?'active':''}" ${isTaken(c.id,d,t)?'disabled':''}>${t}</button>`).join('')}</div><div class="notice">Horários apagados já estão reservados ou bloqueados.</div><div class="between mt"><div><div class="tiny">${type==='lesson'?'Quadra + professor':'Valor da quadra'}</div><b class="total">${money(c.price+(type==='lesson'?(selectedTeacher()?.price||0):0))}</b></div>${btn('Continuar '+icon('arrow'),'reserve','primary small-btn')}</div>`;
}
function dayMap(){
  let cs=db.courts;
  return `<div class="mini-map" style="grid-template-columns:45px repeat(${cs.length},1fr)"><span></span>${cs.map((c,i)=>`<span>Q${i+1}</span>`).join('')}${db.hours.map(hh).map(t=>`<span>${t}</span>${cs.map(c=>{let busy=isTaken(c.id,state.date,t);return `<button data-action="map:${c.id}:${t}" class="${busy?'busy':''}" ${busy?'disabled':''}>${busy?'Reservada':'Livre'}</button>`}).join('')}`).join('')}</div>`;
}
function checkinAllowed(r){let n=spNow();return r.date===n.date&&n.hour>=r.hour-1&&n.hour<=r.hour}
function bookingHTML(){
  let r=db.reservations.find(x=>x.id===state.reservation)||db.reservations.find(x=>x.status==='paid');
  if(!r)return sectionHeader('Sua reserva','Nenhuma reserva ainda.')+'<div class="empty">Você ainda não tem reservas.</div>'+btn('Agendar agora','go:schedule');
  let c=db.courts.find(x=>x.id===r.court),within=checkinAllowed(r);
  return `${sectionHeader('Sua reserva',r.status==='cancelled'?'Reserva cancelada':'Nos vemos em quadra.')}<div class="card"><div class="between"><span class="tag ${r.status==='paid'?'light':'gray'}">${r.status==='paid'?'Confirmada':'Cancelada'}</span><span class="tiny">#IN${esc(String(r.id).slice(0,6).toUpperCase())}</span></div><h2>${esc(c?.name||'Quadra')}</h2>${court(/saibro/i.test(c?.floor||''))}<div class="summary"><div class="between"><span>Data</span><b>${dayLabel(r.date)}</b></div><div class="between"><span>Horário</span><b>${r.time} · 60 minutos</b></div><div class="between"><span>Modalidade</span><b>${r.type==='lesson'?'Aula':'Jogo livre'}</b></div>${r.teacherName?`<div class="between"><span>Professor(a)</span><b>${esc(r.teacherName)}</b></div>`:''}<div class="between"><span>Valor pago</span><b>${money(r.price)}</b></div></div></div><h2>Presença que vale pontos</h2><p>Check-in de 1 hora antes do início até o fim do horário. ${r.type==='lesson'?'+20 pontos por aula':'+10 pontos por jogo'}.</p>${r.checked?`<div class="notice">✓ Presença confirmada · pontos adicionados uma única vez</div>`:btn('Confirmar minha presença','checkin','primary',!within||r.status!=='paid'?'disabled':'')}<div class="tiny mt">${r.checked?'':within?'Seu check-in está disponível agora.':'O check-in está fora da janela de horário.'}</div>${r.status==='paid'&&!r.checked&&!(r.date<today||(r.date===today&&r.hour<=spNow().hour))?btn('Cancelar reserva','cancelMine','text-btn mt'):''}`;
}
function rankingHTML(){
  let list=[...db.players].sort((a,b)=>state.rank==='mes'?b.monthly-a.monthly:b.points-a.points),points=x=>state.rank==='mes'?x.monthly:x.points,mid=db.me?.id;
  return `${sectionHeader('Cada jogo conta','O clube em movimento.','Jogue, evolua e encontre seu próximo desafio.')}<div class="tabs"><button class="${state.rank==='geral'?'active':''}" data-action="rank:geral">Geral</button><button class="${state.rank==='mes'?'active':''}" data-action="rank:mes">Este mês</button></div>${list.length>=3?`<div class="podium">${[1,0,2].map(idx=>{let x=list[idx];return `<div class="${idx===0?'champ':''}"><div class="tiny">${idx===0?'♛':''}</div>${avatar(x.name,'',x.avatar)}<strong>${esc(x.name.split(' ')[0])}</strong><span class="tiny">${points(x)} pts</span><div class="step">${idx+1}</div></div>`}).join('')}</div>`:''}<div class="between"><h2>Ranking completo</h2>${btn('Meus desafios','go:challenge','text-btn')}</div>${list.map((x,i)=>`${i===8?'<div class="cut">↑ Top 8 · convidados para o torneio do clube</div>':''}<div class="rank-row"><span class="number">${i+1}</span>${avatar(x.name,'',x.avatar)}<div class="person"><b>${esc(x.name)} ${x.id===mid?'· você':''}</b><div class="tiny">@${esc(x.handle)}</div></div><span class="points">${points(x)} pts</span>${x.id!==mid?btn('↗',`challengeNew:${x.id}`,'round',`aria-label="Desafiar ${esc(x.name)}"`):''}</div>`).join('')}<div class="notice">Vitória: +30 · Derrota: +10<br>Até 3 jogos com pontuação por jogador, por dia. Os pontos entram após ambos confirmarem o placar.</div>`;
}
function challengeHTML(){
  let label={pending:'Aguardando',confirm:'Aguardando',review:'Confirmar',done:'Finalizado'};
  return `${sectionHeader('Bora jogar?','Seus desafios.','Combine a partida e confirme o resultado com o adversário.')}<div class="stack">${db.challenges.length?db.challenges.map(x=>`<div class="card"><div class="between"><div class="row">${avatar(x.name,'',x.avatar)}<div><b>${esc(x.name)}</b><div class="sub">Desafio individual</div></div></div><span class="tag ${x.status==='done'?'light':'gray'}">${label[x.status]}</span></div>${x.sets?`<div class="center mt"><b style="font-size:25px;letter-spacing:2px">${esc(x.sets)}</b><div class="sub">${x.winner==='me'?'Você venceu':'Adversário venceu'}</div></div>`:x.status==='done'?`<div class="center mt"><div class="sub">${x.winner==='me'?'Você venceu':'Adversário venceu'}</div></div>`:''}${x.status==='pending'?btn('Informar placar',`score:${x.id}`,'secondary mt'):''}${x.status==='confirm'?`<div class="notice">Resultado informado. Aguardando a confirmação da outra pessoa.</div>`:''}${x.status==='review'?`<div class="notice">Seu adversário informou este resultado. Confira e confirme para os pontos entrarem.</div>${btn('Confirmar resultado',`scoreConfirm:${x.id}`,'primary')}${btn('Contestar resultado',`scoreDispute:${x.id}`,'text-btn mt')}`:''}${x.status==='done'?'<div class="notice">✓ Placar confirmado · pontuação processada</div>':''}</div>`).join(''):'<div class="empty">Nenhum desafio por aqui ainda.</div>'}</div>${btn('Encontrar adversário','go:ranking','secondary mt')}<div class="notice">Um placar contestado volta para revisão. Nenhum ponto é concedido enquanto não houver confirmação.</div>`;
}
function eventCard(e){return `<div class="event-card"><button style="width:100%;padding:0;background:none;color:inherit;text-align:left" data-action="event:${e.id}"><div class="event-art">${court(e.type!=='Aula')}<div class="event-date">${dateISO(e.date).toLocaleDateString('pt-BR',{month:'short'})}<b>${dateISO(e.date).getDate()}</b></div><div class="event-title">${esc(e.title)}</div></div><div class="event-copy"><div class="between"><span class="tag">${esc(e.type)}</span><span class="tiny">Saiba mais ↗</span></div><h3 class="mt">${esc(e.title)}</h3><p style="font-size:12px;margin-bottom:3px">${esc(e.desc)}</p></div></button></div>`}
function eventsHTML(){return `${sectionHeader('Nosso clube, sua agenda','Encontros que ficam.')}<div class="tabs"><button class="${state.eventTab==='feed'?'active':''}" data-action="eventTab:feed">Destaques</button><button class="${state.eventTab==='calendar'?'active':''}" data-action="eventTab:calendar">Calendário</button></div>${state.eventTab==='calendar'?calendarHTML('events')+`<h2>${dayLabel(state.date)}</h2>`:''}${db.events.filter(e=>state.eventTab!=='calendar'||e.date===state.date).map(e=>eventCard(e)).join('')||'<div class="empty">Nenhum evento nesta data. Explore os outros dias.</div>'}`}
function postHTML(x){
  let when=x.date===today?'hoje':shortDate(x.date);
  return `<article class="card" style="margin-bottom:12px"><div class="between"><div class="row">${avatar(x.name,'',x.avatar)}<div><b style="font-size:12px">${esc(x.name)}</b><div class="tiny">@${esc(x.handle)} · ${when}</div></div></div>${x.mine?btn('×',`deletePost:${x.id}`,'text-btn','aria-label="Apagar minha publicação"'):''}</div><p style="font-size:12px;color:#687a5d;margin-top:12px">${esc(x.text)}</p>${x.media?(x.mediaType==='video'?`<video class="feed-media" src="${esc(x.media)}" controls playsinline preload="metadata"></video>`:`<img src="${esc(x.media)}" class="feed-media" alt="Publicação de ${esc(x.name)}" loading="lazy">`):`<div class="feed-art">${court(true)}<div class="ball"></div><span style="position:absolute;bottom:12px;left:13px;font:italic 20px Georgia;color:#eee5d6">See you on court.</span></div>`}<div class="feed-actions"><button class="${x.liked?'liked':''}" data-action="kudos:${x.id}">${icon('heart')}${x.kudos}</button><button data-action="comments:${x.id}">${icon('social')}${x.commentCount}</button><button data-action="share:${x.id}">${icon('share')}</button></div></article>`;
}
function myBookings(){
  let rs=db.reservations.filter(r=>r.status!=='pending');
  return rs.length?rs.map(r=>`<button class="card" style="display:block;width:100%;text-align:left;color:var(--white);margin-bottom:9px" data-action="booking:${r.id}"><div class="between"><b>${esc(db.courts.find(c=>c.id===r.court)?.name||'Quadra')}</b><span class="tag">${r.checked?'Presença feita':r.status==='paid'?'Confirmada':'Cancelada'}</span></div><div class="sub mt">${shortDate(r.date)} · ${r.time} · ${r.type==='lesson'?'Aula':'Jogo livre'}</div></button>`).join(''):'<div class="empty">Sua primeira reserva está a um toque.</div>'+btn('Agendar','go:schedule','primary mt');
}
function profileHTML(){
  let p=db.me,m=me(),rank=[...db.players].sort((a,b)=>b.points-a.points).findIndex(x=>x.id===p.id)+1,games=(p.wins||0)+(p.losses||0),wins=p.wins||0,done=db.reservations.filter(r=>r.checked).length;
  let badges=[['◉','Primeiro saque',done>0||games>0],['♜','10 jogos',games>=10],['★','Em evolução',wins>=3],['☀','Bom de grupo',db.myPosts.length>=1],['✓','Presença em dia',done>=3],['♛','Top 8',rank>0&&rank<=8]];
  return `<div class="between"><span class="tiny">SEU ESPAÇO NO CLUBE</span>${btn(icon('settings'),'go:settings','round','aria-label="Configurações"')}</div><div class="profile-head">${avatar(p.name,'',p.avatarUrl)}<h1>${esc(p.name)}</h1><div class="sub">@${esc(p.username)}</div><p>${esc(p.bio||'')}</p><span class="tag light">${rank?`#${rank} no ranking · `:''}${m.points} pts</span></div><div class="metric-grid"><div class="metric"><b>${games}</b><span>Jogos</span></div><div class="metric"><b>${wins}</b><span>Vitórias</span></div><div class="metric"><b>${games?Math.round(wins/games*100):0}%</b><span>Aproveitamento</span></div></div>${btn('Editar perfil','go:edit','secondary')}<div class="tabs">${[['posts','Publicações'],['bookings','Reservas'],['badges','Conquistas']].map(x=>`<button class="${state.profileTab===x[0]?'active':''}" data-action="profileTab:${x[0]}">${x[1]}</button>`).join('')}</div>${state.profileTab==='posts'?(db.myPosts.map(postHTML).join('')||'<div class="empty">Você ainda não publicou nada.</div>'+btn('+ Publicar','go:compose','primary mt')):state.profileTab==='bookings'?myBookings():`<div class="badge-grid">${badges.map(x=>`<div class="badge-item" style="opacity:${x[2]?'1':'.35'}"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>`}${p.teacherId?btn('Minhas aulas','go:classes','primary mt'):''}`;
}
function classesHTML(){
  let a=db.agenda;if(!a)return sectionHeader('Área do professor','Sem acesso.')+'<div class="empty">Sua conta não está ligada a um professor.</div>';
  let rs=a.classes,month=state.month.toLocaleDateString('en-CA').slice(0,7),m=rs.filter(x=>x.date.slice(0,7)===month),day=rs.filter(x=>x.date===state.date);
  return `${sectionHeader('Área do professor','Olá, '+esc((a.teacher.name||'').split(' ')[0])+'.','Sua agenda, seus alunos e sua evolução.')}<div class="metric-grid" style="grid-template-columns:1fr 1fr"><div class="metric"><b>${m.length}</b><span>Aulas no mês selecionado</span></div><div class="metric"><b style="font-size:18px">${money(m.reduce((s,x)=>s+(x.teacherPrice||0),0))}</b><span>Valor das aulas</span></div></div>${calendarHTML('classes')}<div class="between"><h2>Aulas · ${shortDate(state.date)}</h2><span class="tiny">${day.length} alunos</span></div><div class="stack">${day.map(x=>`<div class="card"><div class="between"><b>${hh(x.hour)}</b><span class="tag">60 min</span></div><div class="row mt">${avatar(x.studentName,'',x.studentAvatarUrl)}<div><b>${esc(x.studentName)}</b><div class="sub">${esc(x.courtName)} · ${x.status==='concluido'?'Presença confirmada':'Aula agendada'}</div></div></div></div>`).join('')||'<div class="empty">Nenhuma aula neste dia.</div>'}</div><div class="notice">O total considera apenas o valor do professor. O aluguel da quadra não compõe esse repasse.</div>`;
}
function authHTML(p){
  let title=p==='register'?'Seu próximo capítulo<br>começa na quadra.':p==='recover'?'Vamos recuperar<br>seu acesso.':p==='verify'?'Confira seu e-mail.':'Bom te ver<br>de novo.';
  let top=`<div class="auth-visual">${btn('← Voltar','go:welcome','auth-back')}<span class="auth-brand">IN.<small>TENNIS CLUB</small></span><div class="auth-visual-caption"><span>JOGUE. CONECTE. PERTENÇA.</span><b>O tênis é só o começo.</b></div></div><div class="auth-panel"><div class="section-kicker">ENTRE PARA O CLUBE</div><h1>${title}</h1>`;
  if(p==='verify')return top+`<div class="success">✉</div><p>Enviamos um link de confirmação para <b>${esc(state.pendingEmail||'o seu e-mail')}</b>. Abra o e-mail, confirme e depois volte para entrar.</p>${btn('Já confirmei, entrar','go:login')}<div class="tiny center mt">Não chegou? Veja também a caixa de spam.</div></div>`;
  return top+`<form data-form="${p}">${p==='register'?'<div class="field"><label for="authName">Seu nome</label><input id="authName" name="name" placeholder="Como você gosta de ser chamado?" required maxlength="60"></div>':''}<div class="field"><label for="email">E-mail</label><input id="email" name="email" type="email" placeholder="voce@exemplo.com" autocomplete="email" required></div>${p!=='recover'?`<div class="field"><label for="password">Senha</label><input id="password" name="password" type="password" minlength="6" placeholder="Pelo menos 6 caracteres" autocomplete="${p==='register'?'new-password':'current-password'}" required></div>`:''}<button class="primary mt" type="submit">${p==='register'?'Criar minha conta':p==='recover'?'Recuperar acesso':'Entrar no clube'} ${icon('arrow')}</button></form>${p==='login'?btn('Esqueci minha senha','go:recover','text-btn mt'):''}</div>`;
}
function editHTML(){
  let p=db.me||{name:'',username:'',bio:''},fresh=state.newProfile,img=state.photo||p.avatarUrl;
  return sectionHeader(fresh?'Quase lá':'Seu perfil',fresh?'Crie seu perfil.':'Faça do seu jeito.')+`<form data-form="profile"><div class="crop-preview" id="cropPreview" style="--zoom:${state.zoom}">${img?`<img src="${esc(img)}" alt="Prévia de enquadramento">`:''}</div><div class="field"><label for="photo">Foto de perfil</label><input id="photo" type="file" accept="image/*" data-photo></div><div class="field"><label for="zoom">Ajustar enquadramento</label><input id="zoom" type="range" min="1" max="2.5" step="0.05" value="${state.zoom}" data-zoom></div><div class="field"><label for="name">Nome</label><input id="name" name="name" value="${esc(p.name)}" required minlength="2" maxlength="60"></div><div class="field"><label for="handle">@usuário</label><input id="handle" name="handle" value="${esc(p.username)}" pattern="[a-z0-9._]{3,20}" title="3 a 20 letras minúsculas, números, ponto ou underline" autocapitalize="none" required></div><div class="field"><label for="bio">Bio</label><textarea id="bio" name="bio" maxlength="160">${esc(p.bio||'')}</textarea></div><button class="primary" type="submit">${fresh?'Entrar no clube':'Salvar perfil'}</button></form>${fresh?btn('Sair','logout','text-btn mt'):''}`;
}
function page(p){switch(p){
case'boot':return `<div class="empty center" style="padding-top:38vh;font:italic 34px Georgia;color:#172d24">IN.</div>`;
case'welcome':return `<div class="welcome"><div class="welcome-logo">IN.<small>TENNIS CLUB</small></div><span class="welcome-label">TÊNIS. ENCONTROS. HISTÓRIAS.</span><div class="welcome-copy"><h1>Are you<br>IN<span>.</span>?</h1><p>Mais do que tênis, um lugar para pertencer.</p><p>Reserve quadras, jogue com a galera e suba no ranking.</p></div><div class="stack welcome-actions">${btn('Criar minha conta '+icon('arrow'),'go:register')}${btn('Já tenho conta','go:login','secondary')}</div></div>`;
case'login':case'register':case'recover':case'verify':return authHTML(p);
case'schedule':return scheduleHTML();case'lesson':return scheduleHTML(true);
case'calendar':return sectionHeader('Planeje sua próxima partida','Tem espaço pra você.','Pontos indicam dias mais cheios. Selecione uma data para ver todas as quadras.')+calendarHTML()+`<h2>Mapa do dia · ${shortDate(state.date)}</h2>`+dayMap()+btn('Voltar ao agendamento','go:schedule','primary mt');
case'checkout':{let c=selectedCourt();return sectionHeader('Só falta confirmar','Sua quadra está quase garantida.')+`<div class="timer">${icon('clock')} Horário reservado por <b id="holdTimer">15:00</b></div><div class="card"><span class="tag">${state.type==='lesson'?'Aula':'Jogo livre'}</span><h2>${esc(c.name)}</h2><p>${dayLabel(state.date)} · ${state.time}<br>60 minutos · ${esc(c.floor)}</p><div class="summary"><div class="between"><span>Quadra</span><b>${money(c.price)}</b></div>${state.type==='lesson'?`<div class="between"><span>${esc(selectedTeacher()?.name||'Professor')}</span><b>${money(selectedTeacher()?.price||0)}</b></div>`:''}<div class="divider"></div><div class="between"><span>Total</span><b class="total">${money(price())}</b></div></div></div><h2>Pague com Pix</h2><div class="notice">Pagamento de demonstração. Não escaneie nem transfira valores.</div><svg class="qr" viewBox="0 0 100 100" aria-label="Representação de pagamento"><path d="M0 0h30v30H0zm70 0h30v30H70zM0 70h30v30H0z" fill="#17331e"/><path d="M8 8h14v14H8zm70 0h14v14H78zM8 78h14v14H8z" fill="white"/><text x="50" y="58" font-size="12" text-anchor="middle" fill="#17331e">DEMO</text></svg>${btn('Simular pagamento aprovado','pay')}<div class="tiny center mt">Seu horário fica disponível novamente se o tempo acabar.</div>${btn('Voltar e liberar horário','releaseHold','text-btn mt')}`}
case'booking':return bookingHTML();case'ranking':return rankingHTML();case'challenge':return challengeHTML();case'events':return eventsHTML();
case'event':{let e=db.events.find(x=>x.id===state.event)||db.events[0];if(!e)return '<div class="empty">Evento indisponível.</div>';return sectionHeader('Agenda do clube',esc(e.title))+eventCard(e)+`<div class="details-grid"><div class="card"><div class="tiny">QUANDO</div><b>${dayLabel(e.date)}</b></div><div class="card"><div class="tiny">ONDE</div><b>${esc(e.place||'IN Tennis Club')}</b></div></div><h2>Sobre o encontro</h2><p>${esc(e.desc)}</p><div class="notice">${e.type==='Torneio'?'Os 8 primeiros do ranking são convidados. O clube confirma as inscrições.':'Consulte a equipe do clube sobre vagas e condições.'}</div>${btn(e.joined?'✓ Interesse registrado':'Tenho interesse',`joinEvent:${e.id}`)}`}
case'social':return sectionHeader('Nossa comunidade','O jogo continua por aqui.')+`<div class="between" style="margin-bottom:15px"><span class="sub">Histórias de quem está IN.</span>${btn('+ Publicar','go:compose','primary small-btn')}</div>`+(db.posts.map(postHTML).join('')||'<div class="empty">Ainda não há publicações. Seja a primeira pessoa a compartilhar.</div>');
case'compose':return sectionHeader('Compartilhe seu momento','De dentro da quadra.')+`<form data-form="post"><div class="field"><label for="postText">O que rolou no seu jogo?</label><textarea id="postText" name="text" placeholder="Aquele ponto que valeu o treino…" maxlength="600"></textarea></div><div class="field"><label for="postMedia">Foto ou vídeo (opcional)</label><input id="postMedia" name="media" type="file" accept="image/*,video/*"></div><div id="mediaPreview"></div><div class="notice">Fotos e vídeos de até 20 MB.</div><button class="primary" type="submit">Publicar no feed</button></form>`;
case'profile':return profileHTML();case'edit':return editHTML();
case'settings':return sectionHeader('Do seu jeito','Configurações.')+`<div class="card"><b>${esc(db.me?.name)}</b><div class="sub">@${esc(db.me?.username)}</div><span class="tag mt">${esc(db.email)}</span></div>${btn('Editar meu perfil ↗','go:edit','menu-row')}${btn('Instalar na tela inicial ↗','install','menu-row')}${btn('Como funciona a pontuação? ↗','rules','menu-row')}${btn('Apagar meus dados ↗','deleteMe','menu-row')}${btn('Sair da conta ↗','logout','menu-row')}<div class="notice">Seu acesso é protegido: preços, pontos e permissões são validados pelo servidor do clube.</div>`;
case'classes':return classesHTML();default:return scheduleHTML()}}

/* ---------- sheets ---------- */
function sheet(title,body){$('#sheet')?.remove();activeSheet=title;$('#phone').insertAdjacentHTML('beforeend',`<div class="modal-shade" id="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet"><button class="close" data-action="closeSheet" aria-label="Fechar">×</button><h2>${title}</h2>${body}</div></div>`);$('#sheet input')?.focus()}
function closeSheet(){$('#sheet')?.remove();activeSheet=''}
function formField(label,name,type='text',value='',extra=''){return `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" type="${type}" name="${name}" value="${esc(value)}" ${extra}></div>`}
function timerText(sec){return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function updateTimer(){let el=$('#phone #holdTimer');if(!el)return;let sec=Math.max(0,Math.ceil(((state.hold?.expires||0)-Date.now())/1000));el.textContent=timerText(sec);if(sec===0){state.hold=null;clearInterval(timerHandle);go('schedule');toast('O prazo expirou. Escolha um horário novamente.')}}
async function openComments(id){
  let list=await api(`/posts/${id}/comments`).then(r=>r.comments);
  sheet('Na conversa',`<div class="stack">${list.map(c=>`<div class="notice"><b>${esc(c.authorName)}</b>: ${esc(c.text)}</div>`).join('')||'<p class="sub">Seja o primeiro a comentar.</p>'}</div><form data-form="comment" data-id="${id}">${formField('Seu comentário','comment','text','','required maxlength="220"')}<button class="primary" type="submit">Comentar</button></form>`);
  let p=[...db.posts,...db.myPosts].filter(x=>x.id===id);p.forEach(x=>x.commentCount=list.length);
}
function installApp(){
  if(deferredInstall){deferredInstall.prompt();deferredInstall=null;return}
  sheet('Leve o IN com você',`<p class="sub">No iPhone: abra no Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p><p class="sub">No Android: abra o menu do Chrome e escolha “Instalar app” ou “Adicionar à tela inicial”.</p>${btn('Entendi','closeSheet')}`);
}
function notificationsSheet(){
  let items=[],n=spNow();
  db.reservations.filter(r=>r.status==='paid'&&!r.checked&&r.date===n.date).forEach(r=>items.push(`<div class="notice">🎾 Sua reserva de hoje às ${r.time} está confirmada.</div>`));
  let review=db.challenges.filter(c=>c.status==='review').length;
  if(review)items.push(`<div class="notice">🏆 Você tem ${review} resultado${review>1?'s':''} aguardando sua confirmação.</div>`);
  sheet('Tudo em dia',(items.join('')||'<p class="sub">Nenhuma novidade por enquanto.</p>')+(review?btn('Ver desafios','go:challenge'):''));
}

/* ---------- ações ---------- */
async function action(a){
  let [cmd,...parts]=a.split(':'),id=parts[0];
  switch(cmd){
  case'go':go(parts[0]);break;
  case'type':state.type=parts[0];go('schedule');break;
  case'court':state.court=id;state.time='';renderApp();fixTime();renderApp(true);break;
  case'teacher':state.teacher=id;renderApp();break;
  case'time':state.time=parts.join(':');renderApp(true);break;
  case'date':state.date=parts[0];if(parts[1]==='schedule'&&state.page==='calendar')go('calendar');else renderApp(true);break;
  case'month':{let next=new Date(state.month.getFullYear(),state.month.getMonth()+Number(id),1);if(next<new Date(dateISO(today).getFullYear(),dateISO(today).getMonth(),1)&&parts[1]!=='classes')return;if(next>dateISO(maxDate()))return;state.month=next;renderApp(true);break}
  case'map':state.court=id;state.time=parts.slice(1).join(':');go('schedule');break;
  case'reserve':{
    if(!state.court||!state.time)return toast('Escolha uma quadra e um horário.');
    if(state.type==='lesson'&&!state.teacher)return toast('Escolha o professor.');
    if(isTaken(state.court,state.date,state.time))return toast('Horário ocupado. Escolha outro.');
    let r;try{r=await api('/bookings',{method:'POST',body:{courtId:state.court,date:state.date,hour:Number(state.time.slice(0,2)),kind:state.type==='lesson'?'aula':'jogo',teacherId:state.type==='lesson'?state.teacher:undefined}})}catch(e){delete avail[availKey()];ensureAvail(true);return toast(e.message)}
    state.hold={id:r.booking.id,expires:Date.now()+r.holdSeconds*1000};go('checkout');break}
  case'pay':{
    if(!state.hold||state.hold.expires<Date.now())return toast('O prazo expirou. Volte e reserve novamente.');
    await api(`/bookings/${state.hold.id}/pay`,{method:'POST',body:{method:'pix'}});
    let bid=state.hold.id;state.hold=null;delete avail[availKey()];await loaders.bookings();state.reservation=bid;go('booking');toast('Pagamento aprovado. Reserva confirmada!');break}
  case'releaseHold':{let h=state.hold;state.hold=null;if(h)api(`/bookings/${h.id}/cancel`,{method:'POST'}).catch(()=>{});delete avail[availKey()];go('schedule');break}
  case'booking':state.reservation=id;go('booking');break;
  case'checkin':{let r=db.reservations.find(x=>x.id===state.reservation)||db.reservations.find(x=>x.status==='paid');if(!r||r.checked||r.status!=='paid')return;if(!checkinAllowed(r))return toast('Check-in fora do horário.');let res=await api(`/bookings/${r.id}/checkin`,{method:'POST'});r.checked=true;await Promise.allSettled([loaders.me(),loaders.ranking()]);renderApp();toast(`Presença confirmada: +${res.points} pontos.`);break}
  case'cancelMine':{let r=state.reservation;sheet('Cancelar reserva?',`<p class="sub">O horário será liberado para outras pessoas. Se você já pagou, fale com o clube sobre o reembolso.</p>${btn('Confirmar cancelamento',`cancelConfirm:${r}`,'danger')}${btn('Manter reserva','closeSheet','secondary mt')}`);break}
  case'cancelConfirm':{await api(`/bookings/${id}/cancel`,{method:'POST'});let r=db.reservations.find(x=>x.id===id);if(r)r.status='cancelled';avail[availKey()]=null;closeSheet();renderApp();toast('Reserva cancelada e horário liberado.');break}
  case'rank':state.rank=parts[0];renderApp(true);break;
  case'challengeNew':{let x=db.players.find(x=>x.id===id);sheet('Desafiar '+esc(x.name),`<p class="sub">Convide ${esc(x.name.split(' ')[0])} para uma partida e combine os detalhes.</p>${btn('Enviar desafio',`challengeSend:${id}`)}<div class="notice">O desafio aparece na lista dos dois jogadores.</div>`);break}
  case'challengeSend':{await api('/matches',{method:'POST',body:{opponentId:id}});await loaders.matches();closeSheet();go('challenge');toast('Desafio criado.');break}
  case'score':sheet('Como foi o jogo?',`<form data-form="score" data-id="${id}"><div class="field"><label for="winner">Quem venceu?</label><select name="winner" id="winner"><option value="me">Eu venci</option><option value="other">Meu adversário venceu</option></select></div>${formField('Placar dos sets','sets','text','','required placeholder="Ex.: 6–4 / 6–3" maxlength="40"')}<div class="notice">O adversário precisa confirmar antes de os pontos entrarem.</div><button class="primary" type="submit">Enviar para confirmação</button></form>`);break;
  case'scoreConfirm':{let r=await api(`/matches/${id}/confirm`,{method:'POST',body:{accept:true}});await Promise.allSettled([loaders.matches(),loaders.me(),loaders.ranking()]);renderApp();toast(r.finalized?'Placar confirmado. Pontos lançados.':'Placar confirmado.');break}
  case'scoreDispute':await api(`/matches/${id}/confirm`,{method:'POST',body:{accept:false}});await loaders.matches();renderApp();toast('Placar devolvido para revisão. Nenhum ponto lançado.');break;
  case'eventTab':state.eventTab=parts[0];renderApp(true);break;
  case'event':state.event=id;go('event');break;
  case'joinEvent':{let r=await api(`/events/${id}/interest`,{method:'POST'}),e=db.events.find(x=>x.id===id);e.joined=r.interestedByMe;e.count=r.interestCount;renderApp(true);toast(e.joined?'Interesse registrado. O clube foi avisado.':'Interesse removido.');break}
  case'profileTab':state.profileTab=parts[0];renderApp(true);break;
  case'kudos':{let ps=[...db.posts,...db.myPosts].filter(x=>x.id===id);if(!ps.length)return;let liked=!ps[0].liked;ps.forEach(x=>{x.liked=liked;x.kudos+=liked?1:-1});renderApp(true);try{await api(`/posts/${id}/kudos`,{method:'POST'})}catch(e){ps.forEach(x=>{x.liked=!liked;x.kudos+=liked?-1:1});renderApp(true);throw e}break}
  case'comments':await openComments(id);break;
  case'share':{let x=[...db.posts,...db.myPosts].find(x=>x.id===id),text=`IN Tennis Club — ${x.name}: ${x.text}`;try{if(navigator.share){await navigator.share({text})}else{await navigator.clipboard.writeText(text);toast('Texto da publicação copiado para compartilhar.')}}catch(e){if(e?.name!=='AbortError')sheet('Compartilhar',`<div class="notice">${esc(x.text)}</div><p class="sub">Selecione e copie o texto para compartilhar.</p>`)}break}
  case'deletePost':sheet('Apagar publicação?',`<p class="sub">Você pode apagar somente as suas publicações.</p>${btn('Apagar',`deletePostConfirm:${id}`,'danger')}`);break;
  case'deletePostConfirm':await api(`/posts/${id}`,{method:'DELETE'});db.posts=db.posts.filter(x=>x.id!==id);db.myPosts=db.myPosts.filter(x=>x.id!==id);closeSheet();renderApp(true);toast('Sua publicação foi apagada.');break;
  case'logout':await sb.auth.signOut();break;
  case'deleteMe':sheet('Apagar meus dados?',`<p class="sub">Isso apaga seu perfil, reservas, publicações e pontos do clube. Não dá para desfazer.</p>${btn('Apagar tudo',`deleteMeConfirm`,'danger')}${btn('Cancelar','closeSheet','secondary mt')}`);break;
  case'deleteMeConfirm':await api('/me',{method:'DELETE'});await sb.auth.signOut();toast('Seus dados foram apagados.');break;
  case'closeSheet':closeSheet();break;
  case'install':installApp();break;
  case'rules':sheet('Seu jogo vale pontos',`<div class="check-list">Check-in em jogo livre: +10<br>Check-in em aula: +20<br>Vitória em desafio confirmado: +30<br>Derrota em desafio confirmado: +10<br>Até 3 jogos pontuados por jogador/dia<br>Top 8 do ranking: convite para o torneio</div><div class="notice">O servidor valida presença, horários, placares, limites e pontos.</div>`);break;
  case'notifications':notificationsSheet();break;
  }
}

/* ---------- fotos ---------- */
const readFile=file=>new Promise((resolve,reject)=>{let r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
async function cropPhoto(src,zoom=1,cors=false){let img=new Image();if(cors)img.crossOrigin='anonymous';img.src=src;await img.decode();let canvas=document.createElement('canvas');canvas.width=canvas.height=360;let ctx=canvas.getContext('2d'),side=Math.min(img.width,img.height)/zoom;ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,360,360);return canvas}
const toBlob=(canvas,type='image/jpeg',q=.84)=>new Promise((res,rej)=>canvas.toBlob(b=>b?res(b):rej(new Error('Falha ao preparar a imagem')),type,q));
async function upload(bucket,blob,ext,contentType){
  let uid=(await sb.auth.getSession()).data.session.user.id,path=`${uid}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  let {error}=await sb.storage.from(bucket).upload(path,blob,{contentType,cacheControl:'31536000'});
  if(error)throw new Error('Não foi possível enviar o arquivo. Tente novamente.');
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/* ---------- eventos do documento ---------- */
const friendly=m=>/Invalid login/i.test(m)?'E-mail ou senha incorretos.':/not confirmed/i.test(m)?'Confirme seu e-mail antes de entrar.':/already registered/i.test(m)?'Esse e-mail já tem conta. Entre ou recupere a senha.':/rate limit/i.test(m)?'Muitas tentativas. Aguarde um pouco.':/Password should/i.test(m)?'A senha precisa ter pelo menos 6 caracteres.':m;
document.addEventListener('click',async e=>{let el=e.target.closest('#phone [data-action]');if(el&&!el.disabled){try{await action(el.dataset.action)}catch(err){console.error(err);toast(friendly(err.message||'Não foi possível concluir. Tente novamente.'))}}});
document.addEventListener('submit',async e=>{
  let f=e.target;if(!f.matches('#phone form[data-form]'))return;e.preventDefault();
  let data=Object.fromEntries(new FormData(f)),id=f.dataset.id,kind=f.dataset.form,submit=f.querySelector('[type=submit]');if(submit?.disabled)return;if(submit)submit.disabled=true;
  try{switch(kind){
  case'login':{let {error}=await sb.auth.signInWithPassword({email:data.email.trim(),password:data.password});if(error)throw new Error(friendly(error.message));await enter();return}
  case'register':{let {data:r,error}=await sb.auth.signUp({email:data.email.trim(),password:data.password,options:{data:{name:data.name.trim()},emailRedirectTo:location.origin}});if(error)throw new Error(friendly(error.message));if(r.user&&r.user.identities&&r.user.identities.length===0)throw new Error('Esse e-mail já tem conta. Entre ou recupere a senha.');if(r.session){await enter();return}state.pendingEmail=data.email.trim();go('verify');return}
  case'recover':{let {error}=await sb.auth.resetPasswordForEmail(data.email.trim(),{redirectTo:location.origin});if(error)throw new Error(friendly(error.message));sheet('Pedido enviado',`<p>Se existir uma conta com esse e-mail, você receberá um link para redefinir a senha.</p>${btn('Voltar ao login','go:login')}`);return}
  case'newpass':{let {error}=await sb.auth.updateUser({password:data.password});if(error)throw new Error(friendly(error.message));closeSheet();toast('Senha atualizada.');await enter();return}
  case'profile':{
    let handle=data.handle.trim().toLowerCase(),body={name:data.name.trim(),username:handle,bio:(data.bio||'').trim()};
    if(state.newProfile){await api('/me',{method:'POST',body})}
    if(state.photo||state.zoom!==1){
      let src=state.photo||db.me?.avatarUrl,canvas;
      if(src){try{canvas=await cropPhoto(src,state.zoom,!state.photo)}catch(err){if(state.photo)throw err}}
      if(canvas)body.avatarUrl=await upload('avatars',await toBlob(canvas),'jpg','image/jpeg');
    }
    await api('/me',{method:'PATCH',body});
    state.photo='';state.zoom=1;let wasNew=state.newProfile;state.newProfile=false;
    if(wasNew){await loadAll();go('schedule');toast('Perfil criado. Bem-vindo ao IN!')}else{await loaders.me();await Promise.allSettled([loaders.ranking(),loaders.myPosts()]);go('profile');toast('Perfil atualizado.')}
    return}
  case'post':{
    let file=f.elements.media.files[0],text=(data.text||'').trim();
    if(!text&&!file){toast('Escreva algo ou escolha uma foto ou vídeo.');return}
    if(file&&file.size>20*1024*1024){toast('Escolha uma foto ou vídeo de até 20 MB.');return}
    if(file&&!/^(image|video)\//.test(file.type)){toast('Escolha uma foto ou vídeo.');return}
    let mediaUrl,tag='treino';
    if(file){let ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,5)||'bin';mediaUrl=await upload('posts',file,ext,file.type);tag=file.type.startsWith('video')?'video':'foto'}
    await api('/posts',{method:'POST',body:{text,tag,mediaUrl}});
    await Promise.allSettled([loaders.posts(),loaders.myPosts()]);go('social');toast('Seu momento está no feed.');return}
  case'comment':{await api(`/posts/${id}/comments`,{method:'POST',body:{text:data.comment}});await openComments(id);renderApp(true);return}
  case'score':{await api(`/matches/${id}/report`,{method:'POST',body:{result:data.winner==='me'?'vitoria':'derrota',score:data.sets}});await loaders.matches();closeSheet();renderApp();toast('Placar enviado. Aguardando confirmação do adversário.');return}
  }}catch(err){console.error(err);toast(friendly(err.message||'Não foi possível salvar.'))}finally{if(submit)submit.disabled=false}
});
document.addEventListener('change',async e=>{
  let el=e.target;if(!el.closest('#phone'))return;
  if(el.matches('[data-date]')){if(!el.value||el.value<today||el.value>maxDate()){toast('Escolha uma data dentro dos próximos 12 meses.');return}state.date=el.value;state.month=dateISO(el.value);renderApp(true)}
  if(el.matches('[data-photo]')&&el.files[0]){let f=el.files[0];if(!f.type.startsWith('image/'))return toast('Escolha uma imagem.');if(f.size>8*1024*1024)return toast('Escolha uma foto de até 8 MB.');try{let c=await cropPhoto(await readFile(f));state.photo=c.toDataURL('image/jpeg',.9);state.zoom=1;let preview=$('#phone #cropPreview');preview.innerHTML=`<img src="${state.photo}" alt="Prévia de enquadramento">`;preview.style.setProperty('--zoom',1);$('#phone [data-zoom]').value=1}catch{toast('Não foi possível abrir essa imagem.')}}
});
document.addEventListener('input',e=>{if(e.target.matches('#phone [data-zoom]')){state.zoom=Number(e.target.value);$('#phone #cropPreview').style.setProperty('--zoom',state.zoom)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeSheet)closeSheet()});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&db.me&&!activeSheet&&!['compose','edit','checkout'].includes(state.page)){today=spNow().date;refreshFor(state.page);if(['schedule','lesson','calendar'].includes(state.page))ensureAvail(true)}});

/* ---------- início ---------- */
async function enter(){
  db=emptyDb();state.newProfile=false;state.hold=null;
  await loadAll();
  if(!db.me){
    let {data}=await sb.auth.getSession(),meta=data.session?.user?.user_metadata||{},email=data.session?.user?.email||'';
    db.me={name:meta.name||'',username:(email.split('@')[0]||'').toLowerCase().replace(/[^a-z0-9._]/g,'').slice(0,20),bio:''};
    state.newProfile=true;go('edit');return;
  }
  state.date=today;state.month=dateISO(today);state.type='free';state.page='schedule';go('schedule');
}
async function boot(){
  state.page='boot';renderApp();
  if(!window.supabase){$('#phone').innerHTML='<div class="empty center" style="padding:40vh 24px 0">Não foi possível carregar o app. Atualize a página.</div>';return}
  sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  sb.auth.onAuthStateChange((ev)=>{
    if(ev==='SIGNED_OUT'){db=emptyDb();state.hold=null;state.newProfile=false;setTimeout(()=>go('welcome'),0)}
    if(ev==='PASSWORD_RECOVERY')setTimeout(()=>{go('welcome');sheet('Nova senha',`<form data-form="newpass">${formField('Nova senha','password','password','','required minlength="6" autocomplete="new-password"')}<button class="primary" type="submit">Salvar senha</button></form>`)},0);
  });
  try{
    let {data}=await sb.auth.getSession();
    if(location.hash.includes('type=recovery'))return;
    if(data.session)await enter();else go('welcome');
  }catch(err){console.error(err);go('welcome');toast(friendly(err.message||'Não foi possível carregar.'))}
}
if('serviceWorker'in navigator)navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});
boot();
