/* Prüft den Aufgabenbestand: eindeutige IDs, plausible Optionen, gültige Themen. */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dir = join(root, "src", "data");

const QUESTIONS = [];
const PASSAGES = {};
const THEORIE = [];
const ctx = {
  q: (id, topic, diff, text, opts, ans, exp, pid) =>
    QUESTIONS.push({ id, topic, diff, text, opts, ans, exp, pid: pid || null }),
  passage: (id, title, text) => (PASSAGES[id] = { id, title, text }),
  theorie: (topic, title, items) => THEORIE.push({ topic, title, items }),
};

const code = readdirSync(dir).filter((f) => f.endsWith(".js")).sort()
  .map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
new Function("q", "passage", "theorie", code)(ctx.q, ctx.passage, ctx.theorie);

const TOPICS = ["algebra","potenz","prozent","analysis","geo","stoch","folgen",
                "logik","schluss","reihen","algo","english","wi",
                "ableitung","symmetrie","raetsel","tv"];
const ZWEIWAHL = ["tv"];  // Ja/Nein-Aussagen haben bewusst nur zwei Optionen

const errors = [];
const seen = new Set();
for (const x of QUESTIONS) {
  const at = `${x.id}`;
  if (seen.has(x.id)) errors.push(`${at}: doppelte ID`);
  seen.add(x.id);
  if (!TOPICS.includes(x.topic)) errors.push(`${at}: unbekanntes Thema "${x.topic}"`);
  const min = ZWEIWAHL.includes(x.topic) ? 2 : 4;
  if (!Array.isArray(x.opts) || x.opts.length < min) errors.push(`${at}: weniger als ${min} Optionen`);
  if (new Set(x.opts).size !== x.opts.length) errors.push(`${at}: doppelte Option`);
  if (x.ans !== 0) errors.push(`${at}: Antwort muss beim Autoren-Format an Index 0 stehen`);
  if (!x.exp || x.exp.length < 20) errors.push(`${at}: Erklärung fehlt oder ist zu kurz`);
  if (x.pid && !PASSAGES[x.pid]) errors.push(`${at}: unbekannter Text "${x.pid}"`);
  for (const o of x.opts) if (typeof o !== "string" || !o.trim()) errors.push(`${at}: leere Option`);
}
for (const t of TOPICS) {
  const n = QUESTIONS.filter((x) => x.topic === t).length;
  if (n < 10) errors.push(`Thema ${t}: nur ${n} Aufgaben`);
  if (!THEORIE.some((h) => h.topic === t)) errors.push(`Thema ${t}: kein Crashkurs-Abschnitt`);
}

const byTopic = TOPICS.map((t) => `${t}: ${QUESTIONS.filter((x) => x.topic === t).length}`).join("  ");
console.log(`${QUESTIONS.length} Aufgaben, ${Object.keys(PASSAGES).length} Texte, ${THEORIE.length} Crashkurs-Abschnitte`);
console.log(byTopic);
if (errors.length) {
  console.error(`\n${errors.length} Fehler:`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log("Bestand in Ordnung.");
