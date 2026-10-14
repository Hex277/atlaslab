/* AtlasLab Code — apply-patch.js
   İstifadə: node apply-patch.js problem-script.js problem.html
   C++ (wasm-clang) + Java (CheerpJ) + kod yaddaşı (draft-store) inteqrasiyası.
   Hər dəyişiklik yalnız faylda DƏQİQ 1 yerdə tapılarsa avtomatik tətbiq olunur; qalanları ekrana əl ilə çıxarır. */
const edits = [
// 1) C++ artıq icra oluna bilər (batch = bir dəfə kompilyasiya, bütün testlər)
[`dotColor: '#00599C', executable: false }`,
 `dotColor: '#00599C', executable: true, batch: true }`],

// 1b) Java artıq icra oluna bilər (batch = CheerpJ worker, bir dəfə kompilyasiya + bütün testlər)
[`dotColor: '#e76f00', executable: false },`,
 `dotColor: '#e76f00', executable: true, batch: true },`],

// 2) draft + C++ mühərriki
[`const codeByLang = {};`,
`const codeByLang = {};

// ─── Draft yaddaşı + C++ mühərriki ────────────────────────────
let drafts = null;
const cppEngine = AtlasCppEngine.create({
  workerUrl: 'wasm-clang/cpp-worker.js',
  runTimeoutMs: RUN_TIMEOUT_MS,
  onStateChange: () => updateEnvStatus(),
});
const javaEngine = AtlasCppEngine.create({
  workerUrl: 'java-worker.js',
  runTimeoutMs: RUN_TIMEOUT_MS,
  compileTimeoutMs: 60000,
  onStateChange: () => updateEnvStatus(),
});
const BATCH_ENGINES = { cpp: cppEngine, java: javaEngine };

function draftSignature() {
  return [problem.function_name, problem.class_name, problem.return_type, JSON.stringify(problem.params || [])].join('|');
}
function getInitialCode(lang) {
  return codeByLang[lang] ?? (drafts && drafts.load(lang)) ?? TEMPLATE_BUILDERS[lang]();
}`],

// 3) initEditor
[`function initEditor() {`,
`function initEditor() {
  drafts = AtlasDrafts.create({
    userId: CURRENT_USER_ID,
    problemId: PROBLEM_ID,
    getSignature: draftSignature,
    maxChars: 20000,      // bir dilin kodu üçün maksimum simvol
    maxLines: 500,        // maksimum sətr
    maxEntries: 60,       // bir istifadəçi üçün saxlanan maksimum (sual × dil) sayı
    onLimit: () => showToast('Kod çox uzundur — avtomatik yadda saxlama bu kod üçün dayandırıldı.', 'warn'),
  });`],
[`      value: TEMPLATE_BUILDERS[currentLang](),`, `      value: getInitialCode(currentLang),`],
[`    codeByLang[currentLang] = TEMPLATE_BUILDERS[currentLang]();`, `    codeByLang[currentLang] = monacoEditor.getValue();`],
[`    monacoEditor.onDidChangeModelContent(() => clearErrorHighlight());`,
`    monacoEditor.onDidChangeModelContent(() => {
      clearErrorHighlight();
      drafts.schedule(currentLang, monacoEditor.getValue(), TEMPLATE_BUILDERS[currentLang]());
    });`],

// 4) switchLanguage
[`  if (monacoEditor) codeByLang[currentLang] = monacoEditor.getValue();`,
 `  if (monacoEditor) { codeByLang[currentLang] = monacoEditor.getValue(); if (drafts) drafts.flush(); }`],
[`    monacoEditor.setValue(codeByLang[lang] ?? TEMPLATE_BUILDERS[lang]());
  }

  updateEnvStatus();`,
`    monacoEditor.setValue(getInitialCode(lang));
  }

  updateEnvStatus();
  if (BATCH_ENGINES[lang]) BATCH_ENGINES[lang].warmUp().catch(() => {});`],

// 5) updateEnvStatus
[`  } else if (currentLang === 'javascript') {
    envStatus.classList.add('ready');
    envStatusText.textContent = 'JavaScript mühiti hazırdır';
  }`,
`  } else if (currentLang === 'javascript') {
    envStatus.classList.add('ready');
    envStatusText.textContent = 'JavaScript mühiti hazırdır';
  } else if (currentLang === 'cpp') {
    const s = cppEngine.state;
    envStatus.classList.toggle('ready', s === 'ready');
    envStatusText.textContent = s === 'ready' ? 'C++ mühiti hazırdır'
      : s === 'error' ? 'C++ mühiti yüklənmədi (təkrar cəhd olunacaq)'
      : 'C++ mühiti hazırlanır (ilk dəfə ~20 MB)...';
  } else if (currentLang === 'java') {
    const s = javaEngine.state;
    envStatus.classList.toggle('ready', s === 'ready');
    envStatusText.textContent = s === 'ready' ? 'Java mühiti hazırdır'
      : s === 'error' ? 'Java mühiti yüklənmədi (təkrar cəhd olunacaq)'
      : 'Java mühiti hazırlanır (ilk dəfə JVM yüklənir, bir az çəkə bilər)...';
  }`],

// 6) executeAllTests
[`  if (currentLang === 'python' && !pyodideReady) {
    showToast('Python mühiti hələ hazırlanır, bir neçə saniyə gözləyin.', 'warn');
    return;
  }`,
`  if (currentLang === 'python' && !pyodideReady) {
    showToast('Python mühiti hələ hazırlanır, bir neçə saniyə gözləyin.', 'warn');
    return;
  }
  if (cfg.batch && BATCH_ENGINES[currentLang].state !== 'ready') {
    showToast('Mühit hazırlanır — hazır olan kimi kod icra olunacaq.', 'info');
  }`],
[`  const results = [];
  let stoppedOnError = false;`,
`  const results = [];
  let stoppedOnError = false;

  // C++ kimi dillər: bir dəfə kompilyasiya, bütün testlər birlikdə
  const batch = cfg.batch
    ? await BATCH_ENGINES[currentLang].runBatch({ userCode: code, problem, testCases })
    : null;`],
[`    const { resultJson, output, error, errorLine } = await executeCode(code, tc.input_data || {}, paramNames);`,
`    const r = batch ? batch[i] : await executeCode(code, tc.input_data || {}, paramNames);
    if (!r) break;
    const { resultJson, output, error, errorLine, compileError } = r;`],
[`      index: i + 1, passed, error, errorLine,`, `      index: i + 1, passed, error, errorLine, compileError,`],

// 7) Compile Error etiketi
[`  if (results.some(r => r.error)) return { key: 'runtime-error', label: 'Runtime Error' };`,
`  if (results.some(r => r.compileError)) return { key: 'runtime-error', label: 'Compile Error' };
  if (results.some(r => r.error)) return { key: 'runtime-error', label: 'Runtime Error' };`],
[`function renderCaseDetail(r) {
  const inputHTML = renderInputLines(r.input);`,
`function renderCaseDetail(r) {
  if (r.compileError) {
    return \`<div class="tr-label">Compile Error</div><div class="tr-box tr-error-box">\${escHtml(r.error)}</div>\`;
  }
  const inputHTML = renderInputLines(r.input);`],

// 8) draft flush + Sıfırla düyməsi (faylın sonuna)
[`  syncSession(CURRENT_USER_ID);
  refreshEnergyBadge(CURRENT_USER_ID);
}`,
`  syncSession(CURRENT_USER_ID);
  refreshEnergyBadge(CURRENT_USER_ID);
}

// ═══════════════════════════════════════════════════════════════
// DRAFT: səhifə gizlənəndə/bağlananda dərhal yaz + "Sıfırla" düyməsi
// ═══════════════════════════════════════════════════════════════
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && drafts) drafts.flush();
});
window.addEventListener('pagehide', () => { if (drafts) drafts.flush(); });

document.getElementById('btn-reset').addEventListener('click', async () => {
  if (!monacoEditor) return;
  const ok = await showMessage(
    'Yazdığınız kod silinəcək və başlanğıc şablon bərpa olunacaq. Davam edək?',
    'confirm', 'Sıfırla', 'Ləğv et');
  if (!ok) return;
  drafts.clear(currentLang);
  delete codeByLang[currentLang];
  monacoEditor.setValue(TEMPLATE_BUILDERS[currentLang]());
  clearErrorHighlight();
});`],
];

const htmlEdits = [
[`<div class="spacer"></div>`,
`<button class="btn-reset" id="btn-reset" title="Başlanğıc koda qayıt" style="background:none;border:1px solid var(--border);color:var(--muted);border-radius:6px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;">↺ Sıfırla</button>
                <div class="spacer"></div>`],
[`<script src="problem-script.js" defer></script>`,
`<script src="draft-store.js"></script>
<script src="cpp-engine.js"></script>
<script src="problem-script.js" defer></script>`],
[`<div class="lang-option" data-lang="java">
                            <span class="lang-dot" style="background:#e76f00"></span> Java
                            <span class="lang-soon">Tezliklə</span>
                        </div>`,
`<div class="lang-option" data-lang="java">
                            <span class="lang-dot" style="background:#e76f00"></span> Java
                        </div>`],
[`<div class="lang-option" data-lang="cpp">
                            <span class="lang-dot" style="background:#00599C"></span> C++
                            <span class="lang-soon">Tezliklə</span>
                        </div>`,
`<div class="lang-option" data-lang="cpp">
                            <span class="lang-dot" style="background:#00599C"></span> C++
                        </div>`],
];

function applyAll(label, file, list) {
  const fs = require('fs');
  let text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file + '.bak', text);
  const manual = [];
  list.forEach(([find, rep, hint], i) => {
    const count = typeof find === 'string' ? text.split(find).length - 1 : (text.match(new RegExp(find.source, 'g')) || []).length;
    if (count !== 1) { manual.push({ i: i + 1, find, rep, count, hint }); return; }
    text = typeof find === 'string' ? text.replace(find, () => rep) : text.replace(find, rep);
  });
  fs.writeFileSync(file, text);
  console.log(`\n[${label}] ${list.length - manual.length}/${list.length} dəyişiklik avtomatik tətbiq olundu (ehtiyat nüsxə: ${file}.bak)`);
  manual.forEach(m => {
    console.log(`\n  ⚠ ${label} dəyişiklik #${m.i} əl ilə edilməlidir (tapıldı: ${m.count} yer, 1 olmalı idi).`);
    console.log('  --- TAP (və ya buna oxşar sətri) ---\n' + String(m.find));
    console.log('  --- ƏVƏZ ET ---\n' + m.rep);
    if (m.hint) console.log('  --- QEYD ---\n  ' + m.hint);
  });
  return manual.length;
}

const [, , jsFile, htmlFile] = process.argv;
if (!jsFile) { console.log('İstifadə: node apply-patch.js problem-script.js [problem.html]'); process.exit(1); }
let bad = applyAll('problem-script.js', jsFile, edits);
if (htmlFile) bad += applyAll('problem.html', htmlFile, htmlEdits);
console.log(bad ? `\n${bad} dəyişiklik əl ilə qaldı (yuxarıda göstərilib).` : '\nHamısı tətbiq olundu.');