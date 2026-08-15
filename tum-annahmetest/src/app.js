/* ══ Annahmetest Garching — Lern- und Prüfungstrainer ══════════════════ */

var TEST_AT = new Date("2026-08-21T09:00:00+02:00");

var TOPICS = [
  {id:"algebra", n:"Algebra & Gleichungen",        g:"Mathematik"},
  {id:"potenz",  n:"Potenzen, Wurzeln, Logarithmen", g:"Mathematik"},
  {id:"prozent", n:"Prozent, Zins & Dreisatz",     g:"Mathematik"},
  {id:"analysis",n:"Analysis",                     g:"Mathematik"},
  {id:"geo",     n:"Geometrie & Trigonometrie",    g:"Mathematik"},
  {id:"stoch",   n:"Stochastik & Kombinatorik",    g:"Mathematik"},
  {id:"folgen",  n:"Folgen & Reihen",              g:"Mathematik"},
  {id:"logik",   n:"Aussagenlogik & Mengen",       g:"Logik"},
  {id:"schluss", n:"Schlussfolgerndes Denken",     g:"Logik"},
  {id:"reihen",  n:"Zahlenreihen & Muster",        g:"Logik"},
  {id:"algo",    n:"Algorithmisches Denken",       g:"Logik"},
  {id:"english", n:"English Reading Comprehension",g:"Textverständnis"},
  {id:"wi",      n:"Wahlbereich Wirtschaftsinformatik", g:"Wahlbereich"}
];
var TOPIC_BY = {}; TOPICS.forEach(function(t){ TOPIC_BY[t.id] = t; });

var MATH  = ["algebra","potenz","prozent","analysis","geo","stoch","folgen"];
var LOGIC = ["logik","schluss","reihen","algo"];

var PLAN = [
  {d:"2026-08-15", t:"Standort bestimmen",
   p:"Eine vollständige Prüfungssimulation — kalt, ohne Vorbereitung. Danach Crashkurs Algebra und Potenzen und beide Blöcke üben."},
  {d:"2026-08-16", t:"Prozentrechnung & Reihen",
   p:"Prozent, Zins, Dreisatz und Folgen & Reihen. Alles im Kopf rechnen, konsequent ohne Taschenrechner."},
  {d:"2026-08-17", t:"Analysis & Geometrie",
   p:"Ableitungen, Kurvendiskussion, Integrale. Dann Flächen, Körper, Pythagoras und die Standardwerte der Trigonometrie."},
  {d:"2026-08-18", t:"Stochastik & Wahlbereich",
   p:"Laplace, Gegenereignis, Binomialkoeffizient. Anschließend der Wirtschaftsinformatik-Block: Deckungsbeitrag, Break-even, Kennzahlen."},
  {d:"2026-08-19", t:"Logik komplett",
   p:"Aussagenlogik, Schlussfolgern, Zahlenreihen, algorithmisches Denken — die vier Blöcke am Stück. Hier liegen die schnellsten Punkte."},
  {d:"2026-08-20", t:"Simulation & Fehlerarchiv",
   p:"English Reading, dann die zweite Prüfungssimulation unter Zeitdruck. Zum Schluss das Fehlerarchiv leeren. Früh schlafen."},
  {d:"2026-08-21", t:"Testtag in Garching",
   p:"Nichts Neues mehr lernen. Ausweis, Einladung, Stifte. 90 Minuten, 100 Punkte, keine Hilfsmittel — im Zweifel raten und weitergehen."}
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
  var pool = topic==="alle" ? QUESTIONS.slice() : inTopic(topic);
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
  /* 18 Mathematik, gleichmäßig über die sieben Blöcke */
  var mathPool = [];
  MATH.forEach(function(t){ mathPool = mathPool.concat(shuffle(inTopic(t)).slice(0,3)); });
  out = out.concat(shuffle(mathPool).slice(0,18));
  /* 10 Logik */
  var logicPool = [];
  LOGIC.forEach(function(t){ logicPool = logicPool.concat(shuffle(inTopic(t)).slice(0,3)); });
  out = out.concat(shuffle(logicPool).slice(0,10));
  /* 8 Textverständnis: zwei vollständige Texte */
  var pids = shuffle(Object.keys(PASSAGES)).slice(0,2);
  pids.forEach(function(p){
    out = out.concat(QUESTIONS.filter(function(x){ return x.pid===p; }));
  });
  /* 4 Wahlbereich */
  out = out.concat(shuffle(inTopic("wi")).slice(0,4));
  return groupPassages(out);
}
function startExam(){
  var qs = buildExam();
  SES = {mode:"exam", ids:qs.map(function(x){return x.id;}), i:0, ans:{},
         ends:Date.now()+90*60*1000, done:false};
  S.live = SES; save();
  go("run");
}
function resumeExam(){ SES = S.live; go("run"); }

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
    var right = 0;
    SES.ids.forEach(function(id){
      var qq = byId(id), given = SES.ans[id], r = rec(id);
      r.n++;
      if(given === qq.ans){ right++; r.ok++; r.streak++; } else { r.streak = 0; r.wrong++; }
    });
    SES.points = Math.round(right / SES.ids.length * 100);
    SES.right = right;
    S.exams.push({at:Date.now(), points:SES.points, right:right, of:SES.ids.length});
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
  var all = statOf(QUESTIONS);
  var nw = wrongPool().length;
  var last = S.exams.length ? S.exams[S.exams.length-1] : null;
  var td = today();

  var planHtml = PLAN.map(function(p){
    var done = !!S.plan[p.d];
    return '<li class="'+(p.d===td?"now":"")+(done?" ok":"")+'">'+
      '<span class="day">'+deDate(p.d)+'</span>'+
      '<span class="what"><b>'+p.t+'</b><p>'+p.p+'</p></span>'+
      '<button class="tick" onclick="togglePlan(\''+p.d+'\')" aria-pressed="'+done+'" '+
        'title="'+(done?"Als offen markieren":"Als erledigt markieren")+'">'+(done?"✓":"")+'</button>'+
    '</li>';
  }).join("");

  return '<div class="stack">'+
    '<section class="hero">'+
      '<p class="eyebrow">Eignungsfeststellungstest · B.Sc. Wirtschaftsinformatik</p>'+
      '<h1>Sechs Tage, drei Testteile, keine Hilfsmittel.</h1>'+
      '<p class="lead">Der Test dauert 90 Minuten, bringt maximal 100 Punkte und besteht ausschließlich aus Single-Choice-Aufgaben — genau eine Antwort ist richtig. Geprüft werden Schulmathematik, logisches Denken und englisches Textverständnis. Taschenrechner und Formelsammlungen sind nicht zugelassen.</p>'+
      '<div class="dday"><b>'+Math.max(0,daysLeft())+'</b><span>Tage bis Freitag, 21.08.2026 · Forschungscampus Garching</span></div>'+
      '<dl class="facts">'+
        fact("Dauer","90 Minuten")+
        fact("Punkte","max. 100")+
        fact("Format","Single Choice")+
        fact("Hilfsmittel","keine")+
      '</dl>'+
    '</section>'+

    '<div class="tiles">'+
      tile("Weiterlernen", all.mastered+" / "+all.total, "Aufgaben sitzen sicher", "startPractice('alle')")+
      tile("Prüfungssimulation", last? last.points+" P." : "90 min", last? "letztes Ergebnis" : "40 Aufgaben, volle Zeit", "go('pruefung')")+
      tile("Fehlerarchiv", String(nw), nw? "Aufgaben warten auf dich" : "nichts offen", nw? "startReview()" : "go('fehler')")+
    '</div>'+

    '<section>'+
      '<p class="eyebrow" style="margin-bottom:.5rem">Lernplan bis zum Testtag</p>'+
      '<div class="list"><ul class="plan">'+planHtml+'</ul></div>'+
    '</section>'+

    '<section>'+
      '<p class="eyebrow" style="margin-bottom:.5rem">Fortschritt nach Themenblock</p>'+
      topicList()+
    '</section>'+
    footer();
}
function fact(k,v){ return '<div class="fact"><dt>'+k+'</dt><dd>'+v+'</dd></div>'; }
function tile(t,big,sub,act){
  return '<button class="tile" onclick="'+act+'"><strong>'+t+'</strong>'+
    '<span class="big">'+big+'</span><em>'+sub+'</em></button>';
}
function togglePlan(d){ S.plan[d] = !S.plan[d]; save(); render(); }

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
    return '<div class="rev"><span class="mk '+(e.points>=60?'ok':'no')+'">'+e.points+'</span>'+
      '<span><span class="q">'+e.right+' von '+e.of+' richtig</span>'+
      '<span class="a">'+pad(d.getDate())+"."+pad(d.getMonth()+1)+"."+d.getFullYear()+' · '+pad(d.getHours())+':'+pad(d.getMinutes())+'</span></span></div>';
  }).join("");

  var live = S.live ? '<div class="card" style="border-color:var(--accent-line);background:var(--accent-soft)">'+
      '<strong>Laufende Simulation</strong><p class="lead">Eine Simulation wurde unterbrochen. Die verbleibende Zeit läuft weiter.</p>'+
      '<div class="row" style="margin-top:.7rem"><button class="btn" onclick="resumeExam()">Fortsetzen</button>'+
      '<button class="btn ghost" onclick="dropLive()">Verwerfen</button></div></div>' : '';

  return '<div class="stack">'+ live +
    '<section><h2>Prüfungssimulation</h2>'+
      '<p class="lead">40 Aufgaben in 90 Minuten, gewichtet wie im echten Test: 18 Mathematik, 10 Logik, 8 englisches Textverständnis, 4 aus dem Wahlbereich Wirtschaftsinformatik. Jede Aufgabe zählt 2,5 Punkte. Rückmeldung gibt es erst am Ende — genau wie in Garching.</p>'+
      '<div class="card" style="margin-top:.9rem">'+
        '<p class="eyebrow">So läuft es ab</p>'+
        '<ul style="margin:.5rem 0 0;padding-left:1.1rem;color:var(--ink-2);font-size:.9rem;line-height:1.7">'+
          '<li>Kein Taschenrechner, kein Papier außer dem, was du dir selbst hinlegst.</li>'+
          '<li>Falsche Antworten kosten keine Punkte — nichts unbeantwortet lassen.</li>'+
          '<li>Rund 2 Minuten pro Aufgabe. Wer hängen bleibt, geht weiter und kommt zurück.</li>'+
        '</ul>'+
      '</div>'+
      '<div class="row" style="margin-top:1rem"><button class="btn" onclick="startExam()">Simulation starten</button></div>'+
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
  var body = THEORIE.map(function(t){
    var items = t.items.map(function(it){
      return '<dt>'+it[0]+'</dt><dd>'+it[1]+'</dd>';
    }).join("");
    return '<details class="th"><summary>'+t.title+'</summary>'+
      '<div class="thbody"><dl>'+items+'</dl>'+
      '<div class="row" style="margin-top:1rem"><button class="btn ghost" onclick="startPractice(\''+t.topic+'\')">Dazu üben</button></div>'+
      '</div></details>';
  }).join("");

  return '<div class="stack"><section><h2>Crashkurs</h2>'+
    '<p class="lead">Alles, was ohne Taschenrechner im Kopf verfügbar sein muss — Formeln, Rechenwege und die Fallen, die im Test regelmäßig Punkte kosten.</p>'+
    '<div style="margin-top:1rem">'+body+'</div></section>'+footer();
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
      '<p>'+qq.exp+'</p></div>';
  }

  var label = SES.mode==="exam" ? "Prüfungssimulation"
            : SES.mode==="review" ? "Fehlerarchiv"
            : TOPIC_BY[qq.topic].n;

  var timer = SES.mode==="exam"
    ? '<span id="timer" class="timer">'+mmss(Math.round((SES.ends-Date.now())/1000))+'</span>' : '';

  var lastQ = SES.i === SES.ids.length-1;
  var nextBtn = SES.mode==="exam"
    ? (lastQ ? '<button class="btn" onclick="confirmFinish()">Abgeben</button>'
             : '<button class="btn'+(given===undefined?' ghost':'')+'" onclick="next()">Weiter</button>')
    : '<button class="btn" onclick="next()"'+(given===undefined?' disabled':'')+'>'+(lastQ?"Auswerten":"Weiter")+'</button>';

  var answered = Object.keys(SES.ans).length;

  return '<div class="stack">'+
    '<div class="qhead"><span>'+label+'</span>'+timer+
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
      (!ok? '<span class="a" style="color:var(--ink-3);margin-top:.25rem">'+qq.exp+'</span>':'')+
      '</span></div>';
  }).join("");

  var verdictText = SES.mode==="exam"
    ? (pts>=75 ? "Das ist ein sicheres Ergebnis. Halte das Niveau und arbeite gezielt das Fehlerarchiv ab."
      : pts>=55 ? "Solide Basis. Die Punkte liegen jetzt in den Blöcken mit den meisten Fehlern — genau dort weitermachen."
      : "Noch Luft nach oben. Nimm dir die schwächsten zwei Themenblöcke im Crashkurs vor und übe sie am Stück.")
    : "Alles Falsche liegt jetzt im Fehlerarchiv und kommt automatisch wieder.";

  return '<div class="stack">'+
    '<section class="hero">'+
      '<p class="eyebrow">'+(SES.mode==="exam"?"Simulation abgeschlossen":"Runde abgeschlossen")+'</p>'+
      '<div class="score" style="margin-top:.5rem"><b>'+pts+'</b><span>'+(SES.mode==="exam"?"von 100 Punkten":"% richtig")+' · '+right+' von '+ids.length+'</span></div>'+
      '<div class="meter'+(pts>=60?' good':'')+'" style="margin-top:.9rem"><i style="width:'+pts+'%"></i></div>'+
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
  return '<div class="foot"><span>'+QUESTIONS.length+' Aufgaben · '+Object.keys(PASSAGES).length+' englische Texte · Fortschritt lokal im Browser gespeichert</span>'+
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
