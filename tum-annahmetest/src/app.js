/* ══ Annahmetest Garching — Lern- und Prüfungstrainer ══════════════════ */

var TEST_AT = new Date("2026-08-21T09:00:00+02:00");

var TOPICS = [
  {id:"ableitung",n:"Ableitungen — Quotienten- & Kettenregel", g:"Prüfungsrelevant"},
  {id:"symmetrie",n:"Symmetrie von Funktionen",            g:"Prüfungsrelevant"},
  {id:"raetsel",  n:"Ehrliche, Lügner & Normale",          g:"Prüfungsrelevant"},
  {id:"tv",       n:"Technisches Verständnis",             g:"Prüfungsrelevant"},
  {id:"analysis", n:"Analysis — Grundlagen",               g:"Mathematik: Unterbau"},
  {id:"algebra",  n:"Algebra & Gleichungen",               g:"Mathematik: Unterbau"},
  {id:"potenz",   n:"Potenzen, Wurzeln, Logarithmen",      g:"Mathematik: Unterbau"},
  {id:"geo",      n:"Geometrie & Trigonometrie",           g:"Mathematik: Unterbau"},
  {id:"prozent",  n:"Prozent, Zins & Dreisatz",            g:"Mathematik: Unterbau"},
  {id:"stoch",    n:"Stochastik & Kombinatorik",           g:"Mathematik: Unterbau"},
  {id:"folgen",   n:"Folgen & Reihen",                     g:"Mathematik: Unterbau"},
  {id:"logik",    n:"Aussagenlogik & Mengen",              g:"Logik: Unterbau"},
  {id:"schluss",  n:"Schlussfolgerndes Denken",            g:"Logik: Unterbau"},
  {id:"reihen",   n:"Zahlenreihen & Muster",               g:"Logik: Unterbau"},
  {id:"algo",     n:"Algorithmisches Denken",              g:"Logik: Unterbau"},
  {id:"english",  n:"English Reading Comprehension",       g:"Zusatz"},
  {id:"wi",       n:"Wirtschaftsinformatik",               g:"Zusatz"}
];
var TOPIC_BY = {}; TOPICS.forEach(function(t){ TOPIC_BY[t.id] = t; });

/* Aufbau der Originalklausur 2022: 3 Aufgaben, 24 Punkte, 90 Minuten. */
var KERN = ["symmetrie","ableitung","raetsel","tv"];
var PUNKTE = {symmetrie:4, ableitung:8, raetsel:8, tv:1};
var GESAMT = 24;

var SPRINT = [
  {tag:"Tag 1", titel:"Die drei Aufgabentypen beherrschen", schritte:[
    {t:"Originalklausur 2022 durcharbeiten", z:"20 min",
     p:"Alle drei echten Aufgaben mit vollständigem Lösungsweg. Danach weißt du genau, worauf es ankommt.",
     act:"startOriginal()", btn:"Ansehen"},
    {t:"Ableitungen — der 8-Punkte-Block", z:"60 min",
     p:"Quotienten- und Kettenregel. Ein Drittel der Klausur hängt an dieser einen Aufgabe. Erst den Crashkurs lesen, dann alle 18 Aufgaben.",
     act:"startPractice('ableitung')", btn:"Üben"},
    {t:"Symmetrie — der 4-Punkte-Block", z:"30 min",
     p:"Substituieren, Bausteine einordnen, zurückübersetzen. Der am schnellsten erlernbare Block der ganzen Klausur.",
     act:"startPractice('symmetrie')", btn:"Üben"},
    {t:"Ehrliche & Lügner — der 8-Punkte-Block", z:"45 min",
     p:"Das Verfahren ist immer dasselbe: Rolle unterstellen, Widerspruch suchen. Zwölf Rätsel vom leichten bis zum Klausurniveau.",
     act:"startPractice('raetsel')", btn:"Üben"},
    {t:"Erste Prüfungssimulation", z:"90 min",
     p:"Im Originalformat: 24 Punkte, 90 Minuten, Rückmeldung erst am Ende.",
     act:"startExam()", btn:"Starten"}
  ]},
  {tag:"Tag 2", titel:"Festigen und Lücken schließen", schritte:[
    {t:"Fehlerarchiv leeren", z:"30 min",
     p:"Alles von gestern, was noch nicht sitzt. Das ist die wirksamste halbe Stunde des ganzen Plans.",
     act:"startReview()", btn:"Wiederholen"},
    {t:"Technisches Verständnis", z:"45 min",
     p:"Sechs englische Fachtexte mit je vier Aussagen. Entscheidend sind nicht Englischkenntnisse, sondern das Erkennen der sechs Fallenarten.",
     act:"startPractice('tv')", btn:"Üben"},
    {t:"Ableitungen — zweite Runde", z:"40 min",
     p:"Wiederholung mit Abstand ist der Grund, warum es hängen bleibt. Jetzt auf Zeit: höchstens drei Minuten pro Aufgabe.",
     act:"startPractice('ableitung')", btn:"Üben"},
    {t:"Rätsel und Symmetrie mischen", z:"30 min",
     p:"Gemischte Runde aus allen vier Prüfungsblöcken — so wie es in der Klausur kommt.",
     act:"startPractice('kern')", btn:"Üben"},
    {t:"Zweite Prüfungssimulation", z:"90 min",
     p:"Unter echten Bedingungen. Ziel: über 18 von 24 Punkten.",
     act:"startExam()", btn:"Starten"},
    {t:"Crashkurs querlesen", z:"20 min",
     p:"Zum Abschluss alle Merksätze der vier Prüfungsblöcke durchgehen. Nichts Neues mehr anfangen.",
     act:"go('wissen')", btn:"Öffnen"}
  ]}
];

/* ── Zustand ─────────────────────────────────────────────────────────── */
var KEY = "tum-annahmetest-v1";
var S = load();

function load(){
  try{
    var raw = localStorage.getItem(KEY);
    if(raw){
      var o = JSON.parse(raw);
      if(o && o.seen){ o.exams = o.exams||[]; o.plan = o.plan||{}; return o; }
    }
  }catch(e){}
  return {seen:{}, exams:[], plan:{}, live:null};
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
function rec(id){
  if(!S.seen[id]) S.seen[id] = {n:0, ok:0, streak:0, wrong:0};
  return S.seen[id];
}

/* ── Hilfsfunktionen ─────────────────────────────────────────────────── */
function byId(id){ for(var i=0;i<QUESTIONS.length;i++) if(QUESTIONS[i].id===id) return QUESTIONS[i]; return null; }
function inTopic(t){ return QUESTIONS.filter(function(x){ return x.topic===t; }); }
function hash(s){ var h=2166136261; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=(h*16777619)>>>0; } return h; }
function rng(seed){ var s=seed>>>0||1; return function(){ s^=s<<13; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; }; }
function shuffle(arr, rand){
  var a = arr.slice();
  for(var i=a.length-1;i>0;i--){ var j=Math.floor((rand?rand():Math.random())*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}
var PIN = /^(keine der genannten|nichts folgt|nicht bestimmbar|nicht entscheidbar|none —)/i;

/* Antwortreihenfolge: pro Frage stabil gemischt, "keine der genannten" bleibt hinten. */
function arrange(qq){
  var idx = qq.opts.map(function(_,i){ return i; });
  var free = idx.filter(function(i){ return !PIN.test(qq.opts[i]); });
  var pinned = idx.filter(function(i){ return PIN.test(qq.opts[i]); });
  return shuffle(free, rng(hash(qq.id))).concat(pinned);
}

function pad(n){ return (n<10?"0":"")+n; }
/* Kalendertage bis zum Testtag — überall dieselbe Zahl. */
function daysLeft(){
  var a = new Date(), b = TEST_AT;
  var d0 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var d1 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((d1 - d0)/86400000);
}
function mmss(sec){ sec=Math.max(0,sec); return pad(Math.floor(sec/60))+":"+pad(sec%60); }
function today(){ var d=new Date(); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function deDate(iso){
  var p = iso.split("-"), d = new Date(+p[0], +p[1]-1, +p[2]);
  var wd = ["So","Mo","Di","Mi","Do","Fr","Sa"][d.getDay()];
  return wd+" "+p[2]+"."+p[1]+".";
}

/* ── Statistik ───────────────────────────────────────────────────────── */
function statOf(list){
  var mastered=0, seen=0, ok=0, tries=0;
  list.forEach(function(x){
    var r = S.seen[x.id];
    if(!r) return;
    seen++; ok += r.ok; tries += r.n;
    if(r.streak >= 2) mastered++;
  });
  return {total:list.length, seen:seen, mastered:mastered,
          pct:list.length? Math.round(mastered/list.length*100):0,
          acc: tries? Math.round(ok/tries*100):null};
}
function wrongPool(){
  return QUESTIONS.filter(function(x){
    var r = S.seen[x.id];
    return r && r.wrong>0 && r.streak<2;
  });
}
function priority(x){
  var r = S.seen[x.id];
  if(!r) return 2;                    // noch nie gesehen
  if(r.streak === 0) return 3;         // zuletzt falsch
  if(r.streak === 1) return 1.2;       // einmal richtig, noch nicht sitzend
  return 0.15;                         // beherrscht, nur zur Auffrischung
}
function pick(pool, n){
  var scored = pool.map(function(x){ return {x:x, s:priority(x)+Math.random()*0.6}; });
  scored.sort(function(a,b){ return b.s - a.s; });
  return scored.slice(0,n).map(function(o){ return o.x; });
}

/* ── Sitzung ─────────────────────────────────────────────────────────── */
var SES = null, TICK = null;

function startPractice(topic){
  var pool = topic==="alle" ? QUESTIONS.slice()
    : topic==="kern" ? QUESTIONS.filter(function(x){ return KERN.indexOf(x.topic) >= 0; })
    : inTopic(topic);
  var chosen = pick(pool, Math.min(10, pool.length));
  chosen = groupPassages(shuffle(chosen));
  SES = {mode:"practice", topic:topic, ids:chosen.map(function(x){return x.id;}), i:0, ans:{}, done:false};
  go("run");
}
function startReview(){
  var pool = wrongPool();
  if(!pool.length) return;
  var chosen = groupPassages(shuffle(pool).slice(0, Math.min(15, pool.length)));
  SES = {mode:"review", topic:"fehler", ids:chosen.map(function(x){return x.id;}), i:0, ans:{}, done:false};
  go("run");
}
/* Fragen zum selben Text bleiben beieinander. */
function groupPassages(list){
  var out=[], byP={}, order=[];
  list.forEach(function(x){
    if(!x.pid){ out.push(x); return; }
    if(!byP[x.pid]){ byP[x.pid]=[]; order.push(x.pid); }
    byP[x.pid].push(x);
  });
  order.forEach(function(p){ out = out.concat(byP[p]); });
  return out;
}

function buildExam(){
  var out = [];
  /* Aufgabe 1: Symmetrie (4 P) und Ableitung (8 P) */
  out = out.concat(shuffle(inTopic("symmetrie")).slice(0,1));
  out = out.concat(shuffle(inTopic("ableitung")).slice(0,1));
  /* Aufgabe 2: ein Logikrätsel (8 P) */
  out = out.concat(shuffle(inTopic("raetsel")).slice(0,1));
  /* Aufgabe 3: ein Fachtext mit allen vier Aussagen (je 1 P) */
  var texte = {};
  inTopic("tv").forEach(function(x){ if(x.pid) texte[x.pid] = 1; });
  var pid = shuffle(Object.keys(texte))[0];
  out = out.concat(QUESTIONS.filter(function(x){ return x.pid === pid; }));
  return out;
}
function startExam(){
  var qs = buildExam();
  SES = {mode:"exam", ids:qs.map(function(x){return x.id;}), i:0, ans:{},
         ends:Date.now()+90*60*1000, done:false};
  S.live = SES; save();
  go("run");
}
function resumeExam(){ SES = S.live; go("run"); }
function startOriginal(){
  var ids = ["org-1a","org-1b","org-2","org-3a","org-3b","org-3c","org-3d"]
    .filter(function(id){ return byId(id); });
  SES = {mode:"practice", topic:"original", ids:ids, i:0, ans:{}, done:false};
  go("run");
}

function answer(pos){
  var qq = byId(SES.ids[SES.i]);
  /* In der Übung zählt die erste Antwort; in der Simulation darf man sie ändern. */
  if(SES.mode !== "exam" && SES.ans[qq.id] !== undefined) return;
  SES.ans[qq.id] = pos;
  if(SES.mode !== "exam"){
    var r = rec(qq.id);
    r.n++;
    if(pos === qq.ans){ r.ok++; r.streak++; } else { r.streak = 0; r.wrong++; }
    save();
  } else { S.live = SES; save(); }
  render();
}
function next(){
  if(SES.i < SES.ids.length-1){ SES.i++; render(); }
  else finish();
}
function prev(){ if(SES.i>0){ SES.i--; render(); } }

function finish(){
  SES.done = true;
  if(SES.mode === "exam"){
    var right = 0, pts = 0;
    SES.ids.forEach(function(id){
      var qq = byId(id), given = SES.ans[id], r = rec(id);
      r.n++;
      if(given === qq.ans){ right++; pts += (PUNKTE[qq.topic] || 1); r.ok++; r.streak++; }
      else { r.streak = 0; r.wrong++; }
    });
    SES.points = pts;
    SES.right = right;
    S.exams.push({at:Date.now(), points:pts, right:right, of:SES.ids.length});
    S.live = null;
  }
  save();
  render();
}

/* ── Router ──────────────────────────────────────────────────────────── */
var VIEW = "start";
function go(v){ VIEW = v; window.scrollTo(0,0); render(); }

var TABS = [
  {id:"start",   n:"Start"},
  {id:"ueben",   n:"Üben"},
  {id:"pruefung",n:"Prüfung"},
  {id:"fehler",  n:"Fehler"},
  {id:"wissen",  n:"Wissen"}
];

function renderChrome(){
  var d = daysLeft();
  document.getElementById("hcount").innerHTML =
      d > 1  ? "<b>noch "+d+" Tage</b><span class=\"upto\"> bis zum Test</span>"
    : d === 1? "<b>morgen</b><span class=\"upto\"> ist der Test</span>"
    : d === 0? "<b>heute</b><span class=\"upto\"> ist der Test</span>"
    :          "<b>Viel Erfolg.</b>";

  var nw = wrongPool().length;
  document.getElementById("tabs").innerHTML = TABS.map(function(t){
    var cur = (VIEW===t.id || (VIEW==="run" && t.id==="ueben"));
    return '<button onclick="go(\''+t.id+'\')" aria-current="'+(cur?"true":"false")+'">'+t.n+
      (t.id==="fehler" && nw ? '<span class="pill">'+nw+'</span>' : '')+'</button>';
  }).join("");
}

function render(){
  renderChrome();
  var v = document.getElementById("view");
  if(TICK){ clearInterval(TICK); TICK = null; }
  if(VIEW==="run" && SES && !SES.done) v.innerHTML = viewRun();
  else if(VIEW==="run" && SES && SES.done) v.innerHTML = viewResult();
  else if(VIEW==="ueben")    v.innerHTML = viewUeben();
  else if(VIEW==="pruefung") v.innerHTML = viewPruefung();
  else if(VIEW==="fehler")   v.innerHTML = viewFehler();
  else if(VIEW==="wissen")   v.innerHTML = viewWissen();
  else                       v.innerHTML = viewStart();

  if(VIEW==="run" && SES && !SES.done && SES.mode==="exam") TICK = setInterval(tickExam, 1000);
}

function tickExam(){
  var el = document.getElementById("timer");
  if(!el || !SES || SES.done){ clearInterval(TICK); TICK=null; return; }
  var left = Math.round((SES.ends - Date.now())/1000);
  if(left <= 0){ clearInterval(TICK); TICK=null; finish(); return; }
  el.textContent = mmss(left);
  el.className = "timer" + (left < 300 ? " low" : "");
}

/* ── Ansicht: Start ──────────────────────────────────────────────────── */
function viewStart(){
  var kern = QUESTIONS.filter(function(x){ return KERN.indexOf(x.topic) >= 0; });
  var st = statOf(kern);
  var nw = wrongPool().length;
  var last = S.exams.length ? S.exams[S.exams.length-1] : null;

  return '<div class="stack">'+
    '<section class="hero">'+
      '<p class="eyebrow">Eignungsfeststellungsverfahren · TUM · Klausur IN0000</p>'+
      '<h1>Drei Aufgaben, 24 Punkte, 90 Minuten.</h1>'+
      '<p class="lead">Die Klausur besteht aus nur drei Aufgaben — und zwei davon sind Mathematik. '+
      'Das heißt: Du hast pro Aufgabe sehr viel Zeit, aber ein einziger Fehler kostet bis zu einem Drittel der Punkte. '+
      'Sorgfalt schlägt Geschwindigkeit. Hilfsmittel sind nicht zugelassen.</p>'+
      '<dl class="facts">'+
        fact("Aufgabe 1 · Mathematik","12 Punkte")+
        fact("Aufgabe 2 · Logik","8 Punkte")+
        fact("Aufgabe 3 · Text","4 Punkte")+
        fact("Zeit","90 Minuten")+
      '</dl>'+
      '<div class="dday"><b>'+Math.max(0,daysLeft())+'</b><span>Tage bis Freitag, 21.08.2026 · Forschungscampus Garching</span></div>'+
    '</section>'+

    '<div class="tiles">'+
      tile("Originalklausur 2022", "3", "Aufgaben mit Lösungsweg", "startOriginal()")+
      tile("Prüfungssimulation", last? last.points+" / 24" : "24 P.", last? "letztes Ergebnis" : "im Originalformat", "startExam()")+
      tile("Fehlerarchiv", String(nw), nw? "Aufgaben warten auf dich" : "nichts offen", nw? "startReview()" : "go('fehler')")+
    '</div>'+

    '<section class="card" style="border-color:var(--accent-line)">'+
      '<p class="eyebrow">Wo die Punkte liegen</p>'+
      '<p class="lead" style="margin-top:.4rem">In der Originalklausur waren <b>20 von 24 Punkten</b> mit nur drei Fertigkeiten zu holen: '+
      'eine Ableitung mit Quotienten- und Kettenregel (8 P), ein Logikrätsel um Ehrliche und Lügner (8 P) und eine Symmetriebestimmung (4 P). '+
      'Genau diese drei stehen in deinem Plan ganz oben — sie sind alle in zwei Tagen erlernbar.</p>'+
      '<div class="row" style="margin-top:.9rem">'+
        '<button class="btn" onclick="startPractice(\'kern\')">Prüfungsblöcke üben</button>'+
        '<span class="pct" style="align-self:center;color:var(--ink-2)">'+st.mastered+' von '+st.total+' sitzen sicher</span>'+
      '</div>'+
    '</section>'+

    '<section>'+
      '<p class="eyebrow" style="margin-bottom:.5rem">Zwei-Tage-Plan</p>'+
      sprintList()+
    '</section>'+

    '<section>'+
      '<p class="eyebrow" style="margin-bottom:.5rem">Fortschritt nach Themenblock</p>'+
      topicList()+
    '</section>'+
    footer();
}

function sprintList(){
  return SPRINT.map(function(tag, ti){
    var rows = tag.schritte.map(function(sc, si){
      var key = ti+"-"+si, done = !!S.plan[key];
      return '<li class="'+(done?"ok":"")+'">'+
        '<span class="day">'+sc.z+'</span>'+
        '<span class="what"><b>'+sc.t+'</b><p>'+sc.p+'</p>'+
          '<button class="btn ghost" style="margin-top:.55rem;padding:.35rem .7rem;font-size:.82rem" onclick="'+sc.act+'">'+sc.btn+'</button>'+
        '</span>'+
        '<button class="tick" onclick="togglePlan(\''+key+'\')" aria-pressed="'+done+'" '+
          'title="'+(done?"Als offen markieren":"Als erledigt markieren")+'">'+(done?"✓":"")+'</button>'+
      '</li>';
    }).join("");
    return '<div class="list" style="margin-bottom:.75rem">'+
      '<div class="item" style="pointer-events:none;background:var(--raise)">'+
        '<span class="nm">'+tag.tag+' — '+tag.titel+'</span></div>'+
      '<ul class="plan">'+rows+'</ul></div>';
  }).join("");
}

function fact(k,v){ return '<div class="fact"><dt>'+k+'</dt><dd>'+v+'</dd></div>'; }
function tile(t,big,sub,act){
  return '<button class="tile" onclick="'+act+'"><strong>'+t+'</strong>'+
    '<span class="big">'+big+'</span><em>'+sub+'</em></button>';
}
function togglePlan(k){ S.plan[k] = !S.plan[k]; save(); render(); }

function topicList(){
  var out = '', group = '';
  TOPICS.forEach(function(t){
    var st = statOf(inTopic(t.id));
    if(t.g !== group){
      group = t.g;
      out += '<div class="item" style="pointer-events:none;background:var(--raise)"><span class="eyebrow">'+group+'</span></div>';
    }
    out += '<button class="item" onclick="startPractice(\''+t.id+'\')">'+
      '<span class="nm">'+t.n+'</span>'+
      '<span class="pct">'+st.pct+' %</span>'+
      '<span class="sub">'+st.total+' Aufgaben'+(st.acc!==null?' · '+st.acc+' % richtig':'')+'</span>'+
      '<span class="bar meter'+(st.pct>=80?' good':'')+'"><i style="width:'+st.pct+'%"></i></span>'+
    '</button>';
  });
  return '<div class="list">'+out+'</div>';
}

/* ── Ansicht: Üben ───────────────────────────────────────────────────── */
function viewUeben(){
  return '<div class="stack">'+
    '<section><h2>Üben</h2>'+
      '<p class="lead">Zehn Aufgaben je Runde. Die Auswahl bevorzugt automatisch das, was du noch nicht kannst: zuletzt falsch beantwortete Aufgaben zuerst, dann unbekannte, zuletzt bereits sitzende zur Auffrischung.</p>'+
      '<div class="row" style="margin-top:.9rem">'+
        '<button class="btn" onclick="startPractice(\'alle\')">Gemischte Runde</button>'+
        '<button class="btn ghost" onclick="startReview()"'+(wrongPool().length?'':' disabled')+'>Nur Fehler wiederholen</button>'+
      '</div>'+
    '</section>'+
    '<section><p class="eyebrow" style="margin-bottom:.5rem">Nach Themenblock</p>'+topicList()+'</section>'+
    footer();
}

/* ── Ansicht: Prüfung ────────────────────────────────────────────────── */
function viewPruefung(){
  var hist = S.exams.slice().reverse().map(function(e){
    var d = new Date(e.at);
    return '<div class="rev"><span class="mk '+(e.points>=15?'ok':'no')+'">'+e.points+'</span>'+
      '<span><span class="q">'+e.points+' von 24 Punkten · '+e.right+' von '+e.of+' Aufgaben richtig</span>'+
      '<span class="a">'+pad(d.getDate())+"."+pad(d.getMonth()+1)+"."+d.getFullYear()+' · '+pad(d.getHours())+':'+pad(d.getMinutes())+'</span></span></div>';
  }).join("");

  var live = S.live ? '<div class="card" style="border-color:var(--accent-line);background:var(--accent-soft)">'+
      '<strong>Laufende Simulation</strong><p class="lead">Eine Simulation wurde unterbrochen. Die verbleibende Zeit läuft weiter.</p>'+
      '<div class="row" style="margin-top:.7rem"><button class="btn" onclick="resumeExam()">Fortsetzen</button>'+
      '<button class="btn ghost" onclick="dropLive()">Verwerfen</button></div></div>' : '';

  return '<div class="stack">'+ live +
    '<section><h2>Prüfungssimulation</h2>'+
      '<p class="lead">Im Aufbau der Originalklausur vom 30.08.2022: drei Aufgaben, 24 Punkte, 90 Minuten. '+
      'Aufgabe 1 besteht aus einer Symmetriebestimmung (4 P) und einer Ableitung (8 P), Aufgabe 2 ist ein Logikrätsel (8 P), '+
      'Aufgabe 3 ein englischer Fachtext mit vier Aussagen (je 1 P). Rückmeldung gibt es erst am Ende.</p>'+
      '<div class="card" style="margin-top:.9rem">'+
        '<p class="eyebrow">Zeiteinteilung, die aufgeht</p>'+
        '<ul style="margin:.5rem 0 0;padding-left:1.1rem;color:var(--ink-2);font-size:.9rem;line-height:1.7">'+
          '<li><b>35 Minuten</b> für die Ableitung — sie ist mit 8 Punkten am teuersten und rein handwerklich.</li>'+
          '<li><b>25 Minuten</b> für das Logikrätsel. Notfalls alle sechs Fälle durchschreiben, das reicht zeitlich.</li>'+
          '<li><b>15 Minuten</b> für die Symmetrie, <b>15 Minuten</b> für den Text.</li>'+
          '<li>Falsche Antworten kosten keine Punkte — nichts unbeantwortet lassen.</li>'+
        '</ul>'+
      '</div>'+
      '<div class="row" style="margin-top:1rem">'+
        '<button class="btn" onclick="startExam()">Simulation starten</button>'+
        '<button class="btn ghost" onclick="startOriginal()">Originalklausur 2022 ansehen</button>'+
      '</div>'+
    '</section>'+
    (hist? '<section><p class="eyebrow" style="margin-bottom:.3rem">Bisherige Ergebnisse</p><div class="card" style="padding-top:.2rem">'+hist+'</div></section>':'')+
    footer();
}
function dropLive(){ S.live = null; save(); render(); }

/* ── Ansicht: Fehler ─────────────────────────────────────────────────── */
function viewFehler(){
  var pool = wrongPool();
  if(!pool.length){
    return '<div class="stack"><section><h2>Fehlerarchiv</h2>'+
      '<div class="card"><div class="empty"><strong>Nichts offen.</strong>'+
      '<p>Jede Aufgabe, die du falsch beantwortest, landet hier — und verschwindet erst, wenn du sie zweimal hintereinander richtig hast.</p></div></div>'+
      '</section>'+footer();
  }
  var byT = {};
  pool.forEach(function(x){ (byT[x.topic] = byT[x.topic]||[]).push(x); });
  var rows = Object.keys(byT).map(function(t){
    return '<button class="item" onclick="startPractice(\''+t+'\')">'+
      '<span class="nm">'+TOPIC_BY[t].n+'</span><span class="pct">'+byT[t].length+'</span>'+
      '<span class="sub">offene Aufgaben</span></button>';
  }).join("");

  return '<div class="stack"><section><h2>Fehlerarchiv</h2>'+
    '<p class="lead">'+pool.length+' Aufgaben warten auf die Wiederholung. Eine Aufgabe verlässt das Archiv erst, wenn sie zweimal hintereinander richtig beantwortet wurde — einmaliges Raten reicht nicht.</p>'+
    '<div class="row" style="margin-top:.9rem"><button class="btn" onclick="startReview()">Wiederholung starten</button></div></section>'+
    '<section><p class="eyebrow" style="margin-bottom:.5rem">Verteilung</p><div class="list">'+rows+'</div></section>'+
    footer();
}

/* ── Ansicht: Wissen ─────────────────────────────────────────────────── */
function viewWissen(){
  /* Reihenfolge wie in TOPICS: die vier Prüfungsblöcke zuerst. */
  var sorted = THEORIE.slice().sort(function(a,b){
    return TOPICS.findIndex(function(t){return t.id===a.topic;}) -
           TOPICS.findIndex(function(t){return t.id===b.topic;});
  });
  var body = "", group = "";
  sorted.forEach(function(t){
    var g = (TOPIC_BY[t.topic]||{}).g || "Weitere";
    if(g !== group){
      group = g;
      body += '<p class="eyebrow" style="margin:1.4rem 0 .5rem">'+group+'</p>';
    }
    var items = t.items.map(function(it){ return '<dt>'+it[0]+'</dt><dd>'+it[1]+'</dd>'; }).join("");
    body += '<details class="th"><summary>'+t.title+'</summary>'+
      '<div class="thbody"><dl>'+items+'</dl>'+
      '<div class="row" style="margin-top:1rem"><button class="btn ghost" onclick="startPractice(\''+t.topic+'\')">Dazu üben</button></div>'+
      '</div></details>';
  });

  return '<div class="stack"><section><h2>Crashkurs</h2>'+
    '<p class="lead">Alles, was ohne Taschenrechner im Kopf verfügbar sein muss. '+
    'Die vier Blöcke unter „Prüfungsrelevant“ decken die Originalklausur vollständig ab — wenn die Zeit knapp ist, lies nur diese.</p>'+
    '<div style="margin-top:.4rem">'+body+'</div></section>'+footer();
}

/* ── Ansicht: laufende Sitzung ───────────────────────────────────────── */
function viewRun(){
  var qq = byId(SES.ids[SES.i]);
  var order = arrange(qq);
  var given = SES.ans[qq.id];
  var revealed = (SES.mode !== "exam") && given !== undefined;

  var opts = order.map(function(orig, k){
    var letter = "ABCDE".charAt(k), cls = "opt";
    if(revealed){
      if(orig === qq.ans) cls += " right";
      else if(orig === given) cls += " wrong";
    }
    var pressed = (given === orig) ? "true" : "false";
    return '<button class="'+cls+'" aria-pressed="'+pressed+'" onclick="answer('+orig+')"'+
      (revealed?' disabled':'')+'>'+
      '<span class="k">'+letter+'</span><span>'+qq.opts[orig]+'</span></button>';
  }).join("");

  var pas = qq.pid && PASSAGES[qq.pid] ? '<div class="passage"><h3>'+PASSAGES[qq.pid].title+'</h3>'+
      PASSAGES[qq.pid].text.split("\n\n").map(function(p){ return '<p>'+p+'</p>'; }).join("")+'</div>' : '';

  var verdict = "";
  if(revealed){
    var ok = given === qq.ans;
    verdict = '<div class="verdict '+(ok?"ok":"no")+'">'+
      '<span class="tag">'+(ok?"Richtig":"Falsch — richtig ist "+ "ABCDE".charAt(order.indexOf(qq.ans)))+'</span>'+
      '<div class="exp">'+qq.exp+'</div></div>';
  }

  var label = SES.topic==="original" ? "Originalklausur 2022"
            : SES.mode==="exam" ? "Prüfungssimulation"
            : SES.mode==="review" ? "Fehlerarchiv"
            : TOPIC_BY[qq.topic].n;
  var wert = PUNKTE[qq.topic];
  var wertBadge = (SES.mode==="exam" && wert) ? '<span class="pts">'+wert+' P.</span>' : '';

  var timer = SES.mode==="exam"
    ? '<span id="timer" class="timer">'+mmss(Math.round((SES.ends-Date.now())/1000))+'</span>' : '';

  var lastQ = SES.i === SES.ids.length-1;
  var nextBtn = SES.mode==="exam"
    ? (lastQ ? '<button class="btn" onclick="confirmFinish()">Abgeben</button>'
             : '<button class="btn'+(given===undefined?' ghost':'')+'" onclick="next()">Weiter</button>')
    : '<button class="btn" onclick="next()"'+(given===undefined?' disabled':'')+'>'+(lastQ?"Auswerten":"Weiter")+'</button>';

  var answered = Object.keys(SES.ans).length;

  return '<div class="stack">'+
    '<div class="qhead"><span>'+label+'</span>'+wertBadge+timer+
      '<span class="prog">'+(SES.i+1)+' / '+SES.ids.length+
      (SES.mode==="exam"? ' · '+answered+' beantwortet':'')+'</span></div>'+
    '<div class="card">'+ pas +
      '<p class="qtext">'+qq.text+'</p>'+
      '<div class="opts">'+opts+'</div>'+
      verdict+
      '<div class="qfoot">'+
        (SES.i>0? '<button class="btn quiet" onclick="prev()">← Zurück</button>':'')+
        nextBtn+
        (SES.mode!=="exam"? '<button class="btn quiet" onclick="quit()">Beenden</button>':'')+
        '<span class="hint"><kbd>A</kbd>–<kbd>E</kbd> antworten · <kbd>Enter</kbd> weiter</span>'+
      '</div>'+
    '</div>'+
  '</div>';
}
function quit(){ if(SES) SES.done = true; render(); }
function confirmFinish(){
  var open = SES.ids.length - Object.keys(SES.ans).length;
  if(open && !confirm(open+" Aufgaben sind noch unbeantwortet. Trotzdem abgeben?")) return;
  finish();
}

/* ── Ansicht: Auswertung ─────────────────────────────────────────────── */
function viewResult(){
  var ids = SES.ids.filter(function(id){ return SES.ans[id]!==undefined || SES.mode==="exam"; });
  var right = ids.filter(function(id){ return SES.ans[id] === byId(id).ans; }).length;
  var pts = SES.mode==="exam" ? SES.points : Math.round(right/Math.max(1,ids.length)*100);

  var rows = ids.map(function(id){
    var qq = byId(id), given = SES.ans[id], ok = given === qq.ans;
    var order = arrange(qq);
    var line = ok ? '<i>'+qq.opts[qq.ans]+'</i>'
      : (given===undefined ? '<s>nicht beantwortet</s> → <i>'+qq.opts[qq.ans]+'</i>'
         : '<s>'+qq.opts[given]+'</s> → <i>'+qq.opts[qq.ans]+'</i>');
    return '<div class="rev"><span class="mk '+(ok?"ok":"no")+'">'+(ok?"✓":"✗")+'</span>'+
      '<span><span class="q">'+qq.text.replace(/<pre[\s\S]*?<\/pre>/g," …")+'</span>'+
      '<span class="a">'+line+'</span>'+
      (!ok? '<div class="exp" style="margin-top:.35rem">'+qq.exp+'</div>':'')+
      '</span></div>';
  }).join("");

  var quote = SES.mode==="exam" ? Math.round(pts/GESAMT*100) : pts;
  var verdictText = SES.mode==="exam"
    ? (pts>=18 ? "Das trägt. Halte das Niveau und arbeite nur noch das Fehlerarchiv ab."
      : pts>=12 ? "Solide Basis. Schau dir an, welche der drei Aufgaben dich Punkte gekostet hat — dort liegt der ganze Rest."
      : "Noch Luft nach oben. Die Ableitung allein ist 8 Punkte wert und rein handwerklich: Nimm dir den Crashkurs Ableitungen vor und übe den Block am Stück.")
    : "Alles Falsche liegt jetzt im Fehlerarchiv und kommt automatisch wieder — es verschwindet erst nach zwei richtigen Antworten in Folge.";

  return '<div class="stack">'+
    '<section class="hero">'+
      '<p class="eyebrow">'+(SES.mode==="exam"?"Simulation abgeschlossen":"Runde abgeschlossen")+'</p>'+
      '<div class="score" style="margin-top:.5rem"><b>'+pts+'</b><span>'+(SES.mode==="exam"?"von "+GESAMT+" Punkten":"% richtig")+' · '+right+' von '+ids.length+' Aufgaben</span></div>'+
      '<div class="meter'+(quote>=60?' good':'')+'" style="margin-top:.9rem"><i style="width:'+quote+'%"></i></div>'+
      '<p class="lead">'+verdictText+'</p>'+
      '<div class="row" style="margin-top:1rem">'+
        '<button class="btn" onclick="go(\'start\')">Zur Übersicht</button>'+
        (wrongPool().length? '<button class="btn ghost" onclick="startReview()">Fehler wiederholen</button>':'')+
      '</div>'+
    '</section>'+
    '<section><p class="eyebrow" style="margin-bottom:.3rem">Durchsicht</p>'+
      '<div class="card" style="padding-top:.2rem">'+rows+'</div></section>'+
    footer();
}

/* ── Fuß ─────────────────────────────────────────────────────────────── */
function footer(){
  var st = statOf(QUESTIONS);
  return '<div class="foot"><span>'+QUESTIONS.length+' Aufgaben · '+Object.keys(PASSAGES).length+' englische Fachtexte · Fortschritt lokal im Browser gespeichert</span>'+
    '<span style="margin-left:auto">'+st.seen+' bearbeitet</span>'+
    '<button class="btn quiet" onclick="resetAll()">Zurücksetzen</button></div>';
}
function resetAll(){
  if(!confirm("Gesamten Fortschritt löschen?")) return;
  S = {seen:{}, exams:[], plan:{}, live:null}; save(); go("start");
}

/* ── Tastatur ────────────────────────────────────────────────────────── */
document.addEventListener("keydown", function(e){
  if(VIEW!=="run" || !SES || SES.done) return;
  if(e.metaKey||e.ctrlKey||e.altKey) return;
  var qq = byId(SES.ids[SES.i]);
  var k = e.key.toUpperCase();
  var pos = "ABCDE".indexOf(k);
  if(pos<0 && /^[1-5]$/.test(k)) pos = +k - 1;
  if(pos >= 0 && pos < qq.opts.length){
    e.preventDefault();
    answer(arrange(qq)[pos]);
  } else if(e.key === "Enter"){
    e.preventDefault();
    if(SES.mode==="exam" || SES.ans[qq.id]!==undefined) next();
  } else if(e.key === "ArrowLeft"){ prev(); }
});

/* ── Start ───────────────────────────────────────────────────────────── */
if(S.live && S.live.ends > Date.now()){ /* laufende Simulation bleibt in der Prüfungsansicht abrufbar */ }
else if(S.live){ S.live = null; save(); }
render();
