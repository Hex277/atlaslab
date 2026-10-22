/* ================================================
   AtlasLab Code — problem-script.js
   Məsələ Həlli Workspace: Monaco + Pyodide + Web Worker
   Funksiya-imzası əsaslı (LeetCode tərzi) mühakimə
   ================================================ */

'use strict';

// ─── Supabase Config ──────────────────────────────────────────
const SUPABASE_URL = 'https://xoebhhdirsvjorjlrfzi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FpT1VBCd5NKEnrYQbmx9Gw_MqWxVMvN';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── URL param ────────────────────────────────────────────────
const PROBLEM_ID = new URLSearchParams(window.location.search).get('id');
const ELO_REWARD = { easy: 10, medium: 20, hard: 50 };
let problemStartTime = null;

// ─── State ────────────────────────────────────────────────────
let problem       = null;
let testCases     = [];
let monacoEditor  = null;
let currentLang   = 'python';
let pyodide       = null;
let pyodideReady  = false;
let pyodideLoading = false;
let isRunning     = false;
let CURRENT_USER_ID = null;
let energyRemaining = null;
let errorDecorations = [];
let lastResults = [];

const RUN_TIMEOUT_MS = 6000;

function getCurrentUserId() {
  const sessionStr = localStorage.getItem('sb-xoebhhdirsvjorjlrfzi-auth-token');
  if (!sessionStr) return null;
  try { return JSON.parse(sessionStr).user.id; } catch (_) { return null; }
}

async function refreshEnergyBadge(uId) {
  const display = document.getElementById('limit-text');
  const energyIcon = document.getElementById('energy-icon');
  const premiumAds = document.getElementById('premium-href');
  if (!uId) { if (display) display.innerText = '—'; return; }

  const cachedBitis = localStorage.getItem('premiumBitis_' + uId);
  const isPremium = cachedBitis && new Date().getTime() < parseInt(cachedBitis);
  const profileImg = document.querySelector('.profile-bg img');
  if (isPremium) {
    if (energyIcon) energyIcon.src = '../images/premium-thunder.webp';
    if (display) display.innerHTML = `<img src="../images/infinity.webp" alt="∞" style="width:18px;vertical-align:middle;">`;
    if (premiumAds) premiumAds.style.display = 'none';
    if (profileImg) profileImg.src = '../images/premium-profile.webp';
    energyRemaining = Infinity;
    return;
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const { data: stats } = await db.from('user_stats')
    .select('daily_limit_count, last_quiz_date').eq('user_id', uId).maybeSingle();

  const usedToday = (stats && stats.last_quiz_date === todayStr) ? (Number(stats.daily_limit_count) || 0) : 0;
  energyRemaining = Math.max(0, 5 - usedToday);
  if (display) display.innerText = energyRemaining;
  if (energyIcon) energyIcon.src = '../images/thunder.webp';
}

// Hər dil üçün Monaco dil id-si və icra imkanı
const LANG_CONFIG = {
  python:     { label: 'Python',     monacoId: 'python',     dotColor: '#3572A5', executable: true },
  javascript: { label: 'JavaScript', monacoId: 'javascript', dotColor: '#f0db4f', executable: true },
  java:       { label: 'Java',       monacoId: 'java',       dotColor: '#e76f00', executable: true, batch: true },
  cpp:        { label: 'C++',        monacoId: 'cpp',        dotColor: '#00599C', executable: true, batch: true },
};

// Hər dil üzrə istifadəçinin yazdığı kodu yadda saxla (dil dəyişəndə itməsin)
const codeByLang = {};

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
}

// ═══════════════════════════════════════════════════════════════
// ŞABLON QURUCULARI (funksiya imzasından)
// ═══════════════════════════════════════════════════════════════
function buildPythonTemplate() {
  const className = problem.class_name || 'Solution';
  const funcName  = problem.function_name || 'solve';
  const returnType = problem.return_type || 'None';
  const params = problem.params || [];
  const needsTyping = params.some(p => (p.type || '').startsWith('List')) || returnType.startsWith('List');
  const paramStr = params.map(p => `${p.name}: ${p.type}`).join(', ');

  let code = '';
  if (needsTyping) code += 'from typing import List\n\n';
  code += `class ${className}:\n`;
  code += `    def ${funcName}(self${paramStr ? ', ' + paramStr : ''}) -> ${returnType}:\n`;
  code += `        `;
  return code;
}

function jsTypeOf(t) {
  if (t === 'int' || t === 'float') return 'number';
  if (t === 'str') return 'string';
  if (t === 'bool') return 'boolean';
  const m = /^List\[(.+)\]$/.exec(t || '');
  if (m) return jsTypeOf(m[1]) + '[]';
  return t || '';
}

function buildJsTemplate() {
  const funcName = problem.function_name || 'solve';
  const returnType = problem.return_type || '';
  const params = problem.params || [];

  let doc = '/**\n';
  params.forEach(p => { doc += ` * @param {${jsTypeOf(p.type)}} ${p.name}\n`; });
  doc += ` * @return {${jsTypeOf(returnType)}}\n */\n`;
  const paramNames = params.map(p => p.name).join(', ');
  return `${doc}var ${funcName} = function(${paramNames}) {\n    \n};`;
}

function javaTypeOf(t) {
  const map = { int: 'int', float: 'double', str: 'String', bool: 'boolean' };
  if (map[t]) return map[t];
  const boxMap = { int: 'Integer', float: 'Double', str: 'String', bool: 'Boolean' };
  const m = /^List\[(.+)\]$/.exec(t || '');
  if (m) {
    const inner = boxMap[m[1]] || javaTypeOf(m[1]);
    return `List<${inner}>`;
  }
  return t || 'void';
}

function buildJavaTemplate() {
  const funcName = problem.function_name || 'solve';
  const params = problem.params || [];
  const returnType = javaTypeOf(problem.return_type || 'void');
  const paramStr = params.map(p => `${javaTypeOf(p.type)} ${p.name}`).join(', ');
  return `class Solution {\n    public ${returnType} ${funcName}(${paramStr}) {\n        \n    }\n}`;
}

function cppTypeOf(t) {
  const map = { int: 'int', float: 'double', str: 'string', bool: 'bool' };
  if (map[t]) return map[t];
  const m = /^List\[(.+)\]$/.exec(t || '');
  if (m) return `vector<${cppTypeOf(m[1])}>`;
  return t || 'void';
}

function buildCppTemplate() {
  const funcName = problem.function_name || 'solve';
  const params = problem.params || [];
  const returnType = cppTypeOf(problem.return_type || 'void');
  const paramStr = params.map(p => `${cppTypeOf(p.type)} ${p.name}`).join(', ');
  return `class Solution {\npublic:\n    ${returnType} ${funcName}(${paramStr}) {\n        \n    }\n};`;
}

const TEMPLATE_BUILDERS = {
  python: buildPythonTemplate,
  javascript: buildJsTemplate,
  java: buildJavaTemplate,
  cpp: buildCppTemplate,
};

// ─── DOM refs ─────────────────────────────────────────────────
const wsLoading      = document.getElementById('ws-loading');
const problemTitleEl = document.getElementById('problem-title');
const problemDiffEl  = document.getElementById('problem-diff-badge');
const problemDescEl  = document.getElementById('problem-desc');
const testCasesList  = document.getElementById('test-cases-list');

const langBadge       = document.getElementById('lang-badge');
const langDropdown    = document.getElementById('lang-dropdown');
const langLabel       = document.getElementById('lang-label');
const langDot         = document.getElementById('lang-dot');

const envStatus       = document.getElementById('env-status');
const envStatusText   = document.getElementById('env-status-text');

const btnRun          = document.getElementById('btn-run');
const btnSubmit       = document.getElementById('btn-submit');

const consoleOutput   = document.getElementById('console-output');
const consoleClearBtn = document.getElementById('console-clear');
const consolePanel    = document.getElementById('console-panel');
const consoleHeader   = document.getElementById('console-header');

const resultModalOverlay = document.getElementById('result-modal-overlay');
const rmIcon    = document.getElementById('rm-icon');
const rmTitle   = document.getElementById('rm-title');
const rmText    = document.getElementById('rm-text');
const rmStayBtn = document.getElementById('rm-stay-btn');
const rmBackBtn = document.getElementById('rm-back-btn');

// ═══════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════
function showToast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
  el.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${escHtml(msg)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('hiding');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function displayValue(v) {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'string') return v; // dırnaqsız, backslash-sız — məhz dəyərin özü
  if (Array.isArray(v)) return '[' + v.map(displayValue).join(', ') + ']';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v); // number, boolean
}
// ═══════════════════════════════════════════════════════════════
// KONSOL (sadə köməkçilər — placeholder və təmizləmə üçün)
// ═══════════════════════════════════════════════════════════════
function consoleClear() {
  consoleOutput.innerHTML = '<span class="c-line c-info">Kod işə salındıqda nəticə burada görünəcək.</span>';
}

consoleClearBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  consoleClear();
  clearErrorHighlight();
});

consoleHeader.addEventListener('click', (e) => {
  if (e.target === consoleClearBtn) return;
  consolePanel.classList.toggle('collapsed');
});

// ═══════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════
document.querySelectorAll('.panel-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel-content').forEach(c => c.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
  });
});

// ═══════════════════════════════════════════════════════════════
// SUPABASE: Sualı və test keyslərini yüklə
// ═══════════════════════════════════════════════════════════════
async function loadProblem() {
  if (!PROBLEM_ID) {
    problemTitleEl.textContent = 'Məsələ tapılmadı';
    problemDescEl.innerHTML = '<p>URL-də sual ID-si göstərilməyib.</p>';
    wsLoading.classList.add('hidden');
    return;
  }

  try {
    const { data: probData, error: probErr } = await db
      .from('coding_problems')
      .select('id, title, description, difficulty, function_name, class_name, params, return_type')
      .eq('id', PROBLEM_ID)
      .single();

    if (probErr) throw probErr;
    problem = probData;

    const { data: tcData, error: tcErr } = await db
      .from('test_cases')
      .select('id, input_data, expected_output')
      .eq('problem_id', PROBLEM_ID);

    if (tcErr) throw tcErr;
    testCases = tcData || [];

    renderProblem();
    renderTestCases();
    initEditor();

  } catch (err) {
    console.error('[AtlasLab Code] loadProblem:', err);
    problemTitleEl.textContent = 'Xəta baş verdi';
    problemDescEl.innerHTML = '<p>Sual yüklənərkən xəta baş verdi. Supabase konfiqurasiyasını yoxlayın.</p>';
    showToast('Sual yüklənmədi.', 'error');
  } finally {
    wsLoading.classList.add('hidden');
  }
  await loadProblemSteps(); 
}

function renderProblem() {
  problemTitleEl.textContent = problem.title || 'Adsız məsələ';

  const diff = (problem.difficulty || '').toLowerCase();
  const diffMap = { easy: 'Asan', medium: 'Orta', hard: 'Çətin' };
  if (diffMap[diff]) {
    problemDiffEl.textContent = diffMap[diff];
    problemDiffEl.className = `diff-mini ${diff}`;
  } else {
    problemDiffEl.style.display = 'none';
  }

  const desc = problem.description || '';
  const paragraphs = desc.split(/\n{2,}/).map(p => `<p>${escHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
  problemDescEl.innerHTML = paragraphs || '<p>Təsvir mövcud deyil.</p>';
}

function renderInputLines(inputObj) {
  if (!inputObj || typeof inputObj !== 'object') return '—';
  const values = Object.values(inputObj);
  if (!values.length) return '—';
  return values.map(v => `<div class="io-row">${escHtml(displayValue(v))}</div>`).join('');
}

function renderTestCases() {
  if (!testCases.length) {
    testCasesList.innerHTML = '<div class="table-empty">Bu sual üçün test keysi əlavə edilməyib.</div>';
    return;
  }

  testCasesList.innerHTML = testCases.map((tc, i) => `
    <div class="test-case-card">
      <div class="tc-header">Test ${i + 1}</div>  
      <div class="tc-row">
        <div class="tc-field">
          <div class="tc-key">Giriş</div>
          <div class="tc-val">${renderInputLines(tc.input_data)}</div>
        </div>
        <div class="tc-field">
          <div class="tc-key">Gözlənilən Çıxış</div>
          <div class="tc-val">${escHtml(displayValue(tc.expected_output))}</div>
        </div>
      </div>
    </div>
  `).join('');
}
// ═══════════════════════════════════════════════════════════════
// KÖMƏKÇİ ADDIMLAR (hər addımın öz editoru + öz Test Result terminalı)
// ═══════════════════════════════════════════════════════════════
let problemSteps = [];
let stepEditors = [];
let stepLangs = {};              // { idx: 'python' }
let stepCodeByLang = {};         // { idx: { python: '...', java: '...' } }
let stepErrorDecorations = {};
let stepResults = {};            // { idx: [results] }

// Mövcud şablon qurucularına toxunmadan addım üçün şablon al
function stepTemplate(step, lang) {
  const prev = problem;
  problem = step;                // builder-lər global `problem` oxuyur
  try { return TEMPLATE_BUILDERS[lang](); }
  finally { problem = prev; }
}

async function loadProblemSteps() {
  const container = document.getElementById('steps-container');
  try {
    const { data, error } = await db
      .from('problem_steps')
      .select('id, step_order, title, description, function_name, return_type, params, step_test_cases(id, input_data, expected_output)')
      .eq('problem_id', PROBLEM_ID)
      .order('step_order', { ascending: true });
    if (error) throw error;

    problemSteps = (data || []).map(s => ({
      ...s,
      testCases: (s.step_test_cases || []).sort((a, b) => a.id - b.id),
    }));
    problemSteps.forEach((_, i) => { stepLangs[i] = 'python'; stepCodeByLang[i] = {}; });
    renderSteps();
  } catch (err) {
    console.error('[AtlasLab Code] loadProblemSteps:', err);
    container.innerHTML = '<div class="table-empty">Köməkçi addımlar yüklənmədi.</div>';
  }
}

function stepEnvInfo(lang) {
  const label = LANG_CONFIG[lang].label;
  if (lang === 'python') {
    return pyodideReady ? { ready: true, text: 'Python mühiti hazırdır' }
                        : { ready: false, text: 'Mühit hazırlanır...' };
  }
  if (lang === 'javascript') return { ready: true, text: 'JavaScript mühiti hazırdır' };
  const s = BATCH_ENGINES[lang].state;
  return s === 'ready' ? { ready: true, text: `${label} mühiti hazırdır` }
       : s === 'error' ? { ready: false, text: `${label} mühiti yüklənmədi (təkrar cəhd olunacaq)` }
       : { ready: false, text: `${label} mühiti hazırlanır...` };
}

function updateStepEnv(idx) {
  const card = document.querySelector(`.step-card[data-step-index="${idx}"]`);
  if (!card) return;
  const el = card.querySelector('.env-status');
  const info = stepEnvInfo(stepLangs[idx] || 'python');
  el.classList.toggle('ready', info.ready);
  el.querySelector('.step-env-text').textContent = info.text;
}
function updateAllStepEnv() { problemSteps.forEach((_, i) => updateStepEnv(i)); }

const STEP_EMPTY_OUTPUT = '<span class="c-line c-info">Kod işə salındıqda nəticə burada görünəcək.</span>';

function renderSteps() {
  const container = document.getElementById('steps-container');
  if (!problemSteps.length) {
    container.innerHTML = '<div class="table-empty">Bu məsələ üçün köməkçi addım əlavə edilməyib.</div>';
    return;
  }

  const langOptions = Object.entries(LANG_CONFIG).map(([key, c]) => `
    <div class="step-lang-option" data-lang="${key}">
      <span class="lang-dot" style="background:${c.dotColor}"></span> ${c.label}
    </div>`).join('');

  container.innerHTML = problemSteps.map((step, idx) => {
    const cfg = LANG_CONFIG[stepLangs[idx]];
    return `
      <div class="step-card" data-step-index="${idx}">
        <div class="step-header">Addım ${step.step_order}: ${escHtml(step.title)}</div>
        <div class="step-desc">${escHtml(step.description)}</div>

        <div class="step-toolbar">
          <div class="step-toolbar-left">
            <div class="step-lang-badge">
              <span class="lang-dot" style="background:${cfg.dotColor}"></span>
              <span class="step-lang-label">${cfg.label}</span>
              <span class="lang-caret">▾</span>
              <div class="step-lang-dropdown">${langOptions}</div>
            </div>
            <div class="env-status">
              <span class="env-spin"></span>
              <span class="step-env-text">Mühit hazırlanır...</span>
            </div>
          </div>
          <button class="btn-run step-run-btn">▶ İşə sal</button>
        </div>

        <div class="step-editor-host" id="step-editor-${idx}"></div>

        <div class="console-panel step-console">
          <div class="console-header step-console-header" title="Kiçilt / böyüt">
            <span class="console-title">Test Result</span>
            <div class="console-dots"><span class="d1"></span><span class="d2"></span><span class="d3"></span></div>
            <button class="console-clear step-console-clear">Təmizlə</button>
          </div>
          <div class="console-output" id="step-output-${idx}">${STEP_EMPTY_OUTPUT}</div>
        </div>
      </div>`;
  }).join('');

  createStepEditors();
}

function createStepEditors() {
  // Monaco hələ yüklənməyibsə gözləyir (köhnə setTimeout(100) yarışını aradan qaldırır)
  require(['vs/editor/editor.main'], () => {
    const isDark = document.body.classList.contains('dark-theme');
    stepEditors = problemSteps.map((step, idx) => {
      const host = document.getElementById(`step-editor-${idx}`);
      if (!host) return null;
      const editor = monaco.editor.create(host, {
        value: stepTemplate(step, stepLangs[idx]),
        language: LANG_CONFIG[stepLangs[idx]].monacoId,
        theme: isDark ? 'vs-dark' : 'vs',
        fontSize: 13,
        fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        glyphMargin: false,
        padding: { top: 10 },
        tabSize: 4,
        scrollbar: { alwaysConsumeMouseWheel: false },   // səhifə scroll-u editorda ilişib qalmasın
      });
      editor.onDidChangeModelContent(() => clearStepErrorHighlight(idx));
      return editor;
    });
    updateAllStepEnv();
  });
}

// ─── Hadisələr (delegation — bir dəfə qoşulur) ────────────────
document.getElementById('steps-container').addEventListener('click', (e) => {
  const card = e.target.closest('.step-card');
  if (!card) return;
  const idx = parseInt(card.dataset.stepIndex, 10);

  if (e.target.closest('.step-lang-option')) {
    e.stopPropagation();
    switchStepLanguage(idx, e.target.closest('.step-lang-option').dataset.lang);
    card.querySelector('.step-lang-dropdown').classList.remove('open');
    return;
  }
  if (e.target.closest('.step-lang-badge')) {
    e.stopPropagation();
    document.querySelectorAll('.step-lang-dropdown').forEach(d => {
      if (d !== card.querySelector('.step-lang-dropdown')) d.classList.remove('open');
    });
    card.querySelector('.step-lang-dropdown').classList.toggle('open');
    return;
  }
  if (e.target.closest('.step-run-btn')) { runStep(idx); return; }

  if (e.target.closest('.step-console-clear')) {
    document.getElementById(`step-output-${idx}`).innerHTML = STEP_EMPTY_OUTPUT;
    delete stepResults[idx];
    clearStepErrorHighlight(idx);
    return;
  }
  if (e.target.closest('.step-console-header')) {
    card.querySelector('.step-console').classList.toggle('collapsed');
    return;
  }
  const tab = e.target.closest('.tr-tab');
  if (tab) {
    const r = (stepResults[idx] || [])[parseInt(tab.dataset.idx, 10)];
    if (!r) return;
    card.querySelectorAll('.tr-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    card.querySelector('.tr-detail').innerHTML = renderCaseDetail(r);
    if (r.error && r.errorLine) highlightStepErrorLine(idx, r.errorLine);
    else clearStepErrorHighlight(idx);
  }
});
document.addEventListener('click', () => {
  document.querySelectorAll('.step-lang-dropdown').forEach(d => d.classList.remove('open'));
});

function switchStepLanguage(idx, lang) {
  const editor = stepEditors[idx];
  if (!editor || !LANG_CONFIG[lang] || lang === stepLangs[idx]) return;

  stepCodeByLang[idx][stepLangs[idx]] = editor.getValue();   // dil dəyişəndə kod itməsin
  stepLangs[idx] = lang;

  const cfg = LANG_CONFIG[lang];
  const card = document.querySelector(`.step-card[data-step-index="${idx}"]`);
  card.querySelector('.step-lang-label').textContent = cfg.label;
  card.querySelector('.step-lang-badge .lang-dot').style.background = cfg.dotColor;

  monaco.editor.setModelLanguage(editor.getModel(), cfg.monacoId);
  editor.setValue(stepCodeByLang[idx][lang] ?? stepTemplate(problemSteps[idx], lang));
  clearStepErrorHighlight(idx);
  updateStepEnv(idx);
  if (BATCH_ENGINES[lang]) BATCH_ENGINES[lang].warmUp().catch(() => {});
}

function clearStepErrorHighlight(idx) {
  const ed = stepEditors[idx];
  if (ed) stepErrorDecorations[idx] = ed.deltaDecorations(stepErrorDecorations[idx] || [], []);
}

function highlightStepErrorLine(idx, lineNumber) {
  clearStepErrorHighlight(idx);
  const ed = stepEditors[idx];
  if (!lineNumber || !ed || !window.monaco) return;
  stepErrorDecorations[idx] = ed.deltaDecorations([], [{
    range: new monaco.Range(lineNumber, 1, lineNumber, 1),
    options: {
      isWholeLine: true,
      className: 'error-line-highlight',
      glyphMarginClassName: 'error-line-glyph',
    }
  }]);
  ed.revealLineInCenter(lineNumber);
}

// ─── Addımı işə sal (əsas editorun eyni mühakiməsi) ───────────
async function runStep(idx) {
  if (isRunning) { showToast('Başqa kod icra olunur, bir az gözləyin.', 'warn'); return; }

  const step = problemSteps[idx];
  const editor = stepEditors[idx];
  if (!step || !editor) return;

  const lang = stepLangs[idx];
  const cfg = LANG_CONFIG[lang];
  const cases = step.testCases;

  if (lang === 'python' && !pyodideReady) {
    showToast('Python mühiti hələ hazırlanır, bir neçə saniyə gözləyin.', 'warn');
    return;
  }
  if (!cases.length) { showToast('Bu addım üçün test keysi tapılmadı.', 'error'); return; }
  if (cfg.batch && BATCH_ENGINES[lang].state !== 'ready') {
    showToast('Mühit hazırlanır — hazır olan kimi kod icra olunacaq.', 'info');
  }

  const card = document.querySelector(`.step-card[data-step-index="${idx}"]`);
  const btn = card.querySelector('.step-run-btn');
  const btnText = btn.textContent;

  isRunning = true;           // Pyodide və mühərriklər paylaşılır — eyni anda bir icra
  btn.disabled = true;
  btn.textContent = '⏳ İcra olunur...';
  clearStepErrorHighlight(idx);

  try {
    const code = editor.getValue();
    const paramNames = (step.params || []).map(p => p.name);
    const results = [];

    const batch = cfg.batch
      ? await BATCH_ENGINES[lang].runBatch({ userCode: code, problem: step, testCases: cases })
      : null;

    const t0 = performance.now();
    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      const r = batch ? batch[i] : await executeCode(code, tc.input_data || {}, paramNames, lang, step);
      if (!r) break;
      const { resultJson, output, error, errorLine, compileError } = r;

      let actual = null, passed = false;
      if (!error) {
        try {
          actual = (resultJson === null || resultJson === undefined) ? null : JSON.parse(resultJson);
          passed = deepEqual(actual, tc.expected_output);
        } catch (_) { passed = false; }
      }
      results.push({
        index: i + 1, passed, error, errorLine, compileError,
        input: tc.input_data, expected: tc.expected_output, actual, output,
      });
      if (error) break;
    }

    renderStepResult(idx, results, Math.round(performance.now() - t0));
    const passedCount = results.filter(r => r.passed).length;
    showToast(`Addım ${step.step_order}: ${passedCount}/${cases.length} test keçdi.`,
      passedCount === cases.length ? 'success' : 'warn');
  } catch (err) {
    console.error('[AtlasLab Code] runStep:', err);
    showToast('İcra zamanı xəta baş verdi.', 'error');
  } finally {
    isRunning = false;
    btn.disabled = false;
    btn.textContent = btnText;
  }
}

function renderStepResult(idx, results, runtimeMs) {
  const out = document.getElementById(`step-output-${idx}`);
  stepResults[idx] = results;
  if (!results.length) {
    out.innerHTML = '<span class="c-line c-warn">Nəticə alınmadı.</span>';
    return;
  }

  const allPassed = results.every(r => r.passed);
  const status = computeOverallStatus(results, allPassed);
  const firstFail = results.findIndex(r => !r.passed);
  const active = firstFail === -1 ? 0 : firstFail;

  const tabsHTML = results.map((r, i) => `
    <button class="tr-tab ${r.passed ? 'pass' : 'fail'} ${i === active ? 'active' : ''}" data-idx="${i}">
      <span class="tr-tab-ic">${r.passed ? '✓' : '✕'}</span> Case ${i + 1}
    </button>`).join('');

  out.innerHTML = `
    <div class="test-result">
      <div class="tr-status-row">
        <span class="tr-status ${status.key}">${status.label}</span>
        <span class="tr-runtime">Runtime: ${runtimeMs} ms</span>
      </div>
      <div class="tr-tabs">${tabsHTML}</div>
      <div class="tr-detail">${renderCaseDetail(results[active])}</div>
    </div>`;

  const r = results[active];
  if (r.error && r.errorLine) highlightStepErrorLine(idx, r.errorLine);
  else clearStepErrorHighlight(idx);
}
// ═══════════════════════════════════════════════════════════════
// MONACO EDITOR
// ═══════════════════════════════════════════════════════════════
function initEditor() {
  drafts = AtlasDrafts.create({
    userId: CURRENT_USER_ID,
    problemId: PROBLEM_ID,
    getSignature: draftSignature,
    maxChars: 20000,      // bir dilin kodu üçün maksimum simvol
    maxLines: 500,        // maksimum sətr
    maxEntries: 60,       // bir istifadəçi üçün saxlanan maksimum (sual × dil) sayı
    onLimit: () => showToast('Kod çox uzundur — avtomatik yadda saxlama bu kod üçün dayandırıldı.', 'warn'),
  });
  require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
  require(['vs/editor/editor.main'], () => {
    document.getElementById('editor-loading').classList.add('hidden');

    const isDark = document.body.classList.contains('dark-theme');

    monacoEditor = monaco.editor.create(document.getElementById('monaco-host'), {
      value: getInitialCode(currentLang),
      language: LANG_CONFIG[currentLang].monacoId,
      theme: isDark ? 'vs-dark' : 'vs',
      fontSize: 14,
      fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      glyphMargin: false,
      padding: { top: 14 },
      tabSize: 4,
    });

    codeByLang[currentLang] = monacoEditor.getValue();

    monacoEditor.onDidChangeModelContent(() => {
      clearErrorHighlight();
      resetBrainBreakTimer()
      drafts.schedule(currentLang, monacoEditor.getValue(), TEMPLATE_BUILDERS[currentLang]());
    });
    resetBrainBreakTimer();
    const observer = new MutationObserver(() => {
      const dark = document.body.classList.contains('dark-theme');
      monaco.editor.setTheme(dark ? 'vs-dark' : 'vs');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    loadPyodideInBackground();
  });

  problemStartTime = Date.now();
}

// ═══════════════════════════════════════════════════════════════
// MONACO XƏTA SƏTRİ VURĞULANMASI
// ═══════════════════════════════════════════════════════════════
function highlightErrorLine(lineNumber) {
  clearErrorHighlight();
  if (!lineNumber || !monacoEditor || !window.monaco) return;
  errorDecorations = monacoEditor.deltaDecorations([], [{
    range: new monaco.Range(lineNumber, 1, lineNumber, 1),
    options: {
      isWholeLine: true,
      className: 'error-line-highlight',
      glyphMarginClassName: 'error-line-glyph',
    }
  }]);
  monacoEditor.revealLineInCenter(lineNumber);
}

function clearErrorHighlight() {
  if (monacoEditor) errorDecorations = monacoEditor.deltaDecorations(errorDecorations, []);
}

// ═══════════════════════════════════════════════════════════════
// DİL SEÇİMİ
// ═══════════════════════════════════════════════════════════════
langBadge.addEventListener('click', (e) => {
  e.stopPropagation();
  langDropdown.classList.toggle('open');
});
document.addEventListener('click', () => langDropdown.classList.remove('open'));

document.querySelectorAll('.lang-option').forEach(opt => {
  opt.addEventListener('click', () => {
    const lang = opt.dataset.lang;
    switchLanguage(lang);
    langDropdown.classList.remove('open');
  });
});

function switchLanguage(lang) {
  if (lang === currentLang || !LANG_CONFIG[lang]) return;

  if (monacoEditor) { codeByLang[currentLang] = monacoEditor.getValue(); if (drafts) drafts.flush(); }

  currentLang = lang;
  const cfg = LANG_CONFIG[lang];
  langLabel.textContent = cfg.label;
  langDot.style.background = cfg.dotColor;

  clearErrorHighlight();

  if (monacoEditor) {
    const model = monacoEditor.getModel();
    monaco.editor.setModelLanguage(model, cfg.monacoId);
    monacoEditor.setValue(getInitialCode(lang));
  }

  updateEnvStatus();
  if (BATCH_ENGINES[lang]) BATCH_ENGINES[lang].warmUp().catch(() => {});
}

// ═══════════════════════════════════════════════════════════════
// PYODIDE (Python mühərriki) — arxa planda yüklənir
// ═══════════════════════════════════════════════════════════════
async function loadPyodideInBackground() {
  if (pyodideLoading || pyodideReady) return;
  pyodideLoading = true;
  updateEnvStatus();

  try {
    await loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
    pyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
    });
    pyodideReady = true;
  } catch (err) {
    console.error('[AtlasLab Code] Pyodide yüklənmə xətası:', err);
    showToast('Python mühiti yüklənmədi. Səhifəni yeniləyin.', 'error');
  } finally {
    pyodideLoading = false;
    updateEnvStatus();
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function updateEnvStatus() {
  updateAllStepEnv();
  const cfg = LANG_CONFIG[currentLang];

  if (!cfg.executable) {
    envStatus.classList.remove('ready');
    envStatusText.textContent = 'Bu dil tezliklə dəstəklənəcək';
    return;
  }

  if (currentLang === 'python') {
    if (pyodideReady) {
      envStatus.classList.add('ready');
      envStatusText.textContent = 'Python mühiti hazırdır';
    } else {
      envStatus.classList.remove('ready');
      envStatusText.textContent = 'Mühit hazırlanır...';
    }
  } else if (currentLang === 'javascript') {
    envStatus.classList.add('ready');
    envStatusText.textContent = 'JavaScript mühiti hazırdır';
  } else if (currentLang === 'cpp') {
    const s = cppEngine.state;
    envStatus.classList.toggle('ready', s === 'ready');
    envStatusText.textContent = s === 'ready' ? 'C++ mühiti hazırdır'
      : s === 'error' ? 'C++ mühiti yüklənmədi (təkrar cəhd olunacaq)'
      : 'C++ mühiti hazırlanır...';
  } else if (currentLang === 'java') {
    const s = javaEngine.state;
    envStatus.classList.toggle('ready', s === 'ready');
    envStatusText.textContent = s === 'ready' ? 'Java mühiti hazırdır'
      : s === 'error' ? 'Java mühiti yüklənmədi (təkrar cəhd olunacaq)'
      : 'Java mühiti hazırlanır...';
  }
}

// Python string literalını təhlükəsiz qurmaq üçün
function pyStrLiteral(str) {
  return JSON.stringify(str ?? '');
}

// ═══════════════════════════════════════════════════════════════
// PYTHON İCRA — Pyodide, funksiya çağırışı
// ═══════════════════════════════════════════════════════════════
async function runPython(code, argsObj, paramNames, funcName, className) {
  if (!pyodideReady) {
    return { resultJson: null, output: '', error: 'Python mühiti hələ hazır deyil. Bir az gözləyin.', errorLine: null };
  }

  const driver = `
import sys, io, json, traceback

sys.stdout = io.StringIO()
_atlas_stdout = sys.stdout

__error_line = None
__error_msg = None
__result_json = None

try:
    __ns = {}
    exec(compile(${pyStrLiteral(code)}, '<user_code>', 'exec'), __ns)
    __Solution = __ns[${pyStrLiteral(className)}]
    __sol = __Solution()
    __args = json.loads(${pyStrLiteral(JSON.stringify(argsObj))})
    __param_names = json.loads(${pyStrLiteral(JSON.stringify(paramNames))})
    __ordered_args = [__args[p] for p in __param_names]
    __result = getattr(__sol, ${pyStrLiteral(funcName)})(*__ordered_args)
    __result_json = json.dumps(__result)
except SyntaxError as e:
    __error_line = e.lineno
    __error_msg = f"SyntaxError: {e.msg}"
except Exception as e:
    tb = traceback.extract_tb(e.__traceback__)
    for frame in reversed(tb):
        if frame.filename == '<user_code>':
            __error_line = frame.lineno
            break
    __error_msg = f"{type(e).__name__}: {e}"

sys.stdout = sys.__stdout__
`;

  try {
    await pyodide.runPythonAsync(driver);
  } catch (fatalErr) {
    return { resultJson: null, output: '', error: (fatalErr && fatalErr.message) || String(fatalErr), errorLine: null };
  }

  const stdoutText = pyodide.globals.get('_atlas_stdout').getvalue();
  const errorMsg = pyodide.globals.get('__error_msg');
  const errorLineRaw = pyodide.globals.get('__error_line');
  const resultJson = pyodide.globals.get('__result_json');

  return {
    resultJson: resultJson ?? null,
    output: stdoutText || '',
    error: errorMsg ?? null,
    errorLine: (errorLineRaw === undefined || errorLineRaw === null) ? null : errorLineRaw,
  };
}

// ═══════════════════════════════════════════════════════════════
// JAVASCRIPT İCRA — Web Worker, funksiya çağırışı
// ═══════════════════════════════════════════════════════════════
function runJavaScript(code, argsObj, paramNames, funcName) {
  return new Promise((resolve) => {
    const prefixLines = [
      `const __args = ${JSON.stringify(argsObj)};`,
      `const __paramNames = ${JSON.stringify(paramNames)};`,
      `const __out = [];`,
      `console.log = (...a) => __out.push(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));`,
    ];
    const prefixLineCount = prefixLines.length;

    const workerSrc = prefixLines.join('\n') + '\n' +
      code + '\n' +
`
try {
  const __ordered = __paramNames.map(p => __args[p]);
  const __result = ${funcName}(...__ordered);
  postMessage({ resultJson: JSON.stringify(__result), output: __out.join('\\n'), error: null, errorLine: null });
} catch (e) {
  let line = null;
  try {
    const m = e.stack && e.stack.match(/:(\\d+):(\\d+)/);
    if (m) line = parseInt(m[1], 10) - ${prefixLineCount};
  } catch (_e2) {}
  postMessage({ resultJson: null, output: __out.join('\\n'), error: e.message || String(e), errorLine: line });
}
`;
    const blob = new Blob([workerSrc], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ resultJson: null, output: '', error: 'Vaxt bitdi (mümkün sonsuz dövr). Kodunuzu yoxlayın.', errorLine: null });
    }, RUN_TIMEOUT_MS);

    worker.onmessage = (e) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(e.data);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ resultJson: null, output: '', error: e.message || 'Naməlum xəta', errorLine: null });
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// KODU İCRA ET (bir test keysi üçün)
// ═══════════════════════════════════════════════════════════════
async function executeCode(code, argsObj, paramNames, lang = currentLang, spec = problem) {
  if (lang === 'python') {
    return runPython(code, argsObj, paramNames, spec.function_name, spec.class_name || 'Solution');
  }
  if (lang === 'javascript') {
    return runJavaScript(code, argsObj, paramNames, spec.function_name);
  }
  return { resultJson: null, output: '', error: 'Bu dil hələ dəstəklənmir.', errorLine: null };
}

// ═══════════════════════════════════════════════════════════════
// DƏRİN BƏRABƏRLİK (nəticə müqayisəsi üçün)
// ═══════════════════════════════════════════════════════════════
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(k => deepEqual(a[k], b[k]));
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════
// TEST RESULT PANELİ (LeetCode tərzi)
// ═══════════════════════════════════════════════════════════════
function computeOverallStatus(results, allPassed) {
  if (results.some(r => r.compileError)) return { key: 'runtime-error', label: 'Compile Error' };
  if (results.some(r => r.error)) return { key: 'runtime-error', label: 'Runtime Error' };
  if (allPassed) return { key: 'accepted', label: 'Accepted' };
  return { key: 'wrong', label: 'Wrong Answer' };
}

function renderCaseDetail(r) {
  if (r.compileError) {
    return `<div class="tr-label">Compile Error</div><div class="tr-box tr-error-box">${escHtml(r.error)}</div>`;
  }
  const inputHTML = renderInputLines(r.input);

  if (r.error) {
    return `
      <div class="tr-label">Giriş</div>
      <div class="tr-box">${inputHTML}</div>
      <div class="tr-label">Runtime Error</div>
      <div class="tr-box tr-error-box">${escHtml(r.error)}</div>
      ${r.output ? `<div class="tr-label">Çap olunanlar (stdout)</div><div class="tr-box">${escHtml(r.output)}</div>` : ''}
    `;
  }

  return `
    <div class="tr-label">Giriş</div>
    <div class="tr-box">${inputHTML}</div>
    <div class="tr-label">Sizin Nəticə</div>
    <div class="tr-box ${r.passed ? '' : 'tr-mismatch'}">${escHtml(displayValue(r.actual))}</div>    <div class="tr-label">Gözlənilən</div>
    <div class="tr-box">${escHtml(displayValue(r.expected))}</div>
    ${r.output ? `<div class="tr-label">Çap olunanlar (stdout)</div><div class="tr-box">${escHtml(r.output)}</div>` : ''}
  `;
}

function renderTestResultPanel(results, runtimeMs) {
  lastResults = results;
  const allPassed = results.every(r => r.passed) && results.length > 0;
  const status = computeOverallStatus(results, allPassed);
  const firstFailIdx = results.findIndex(r => !r.passed);
  const activeIdx = firstFailIdx === -1 ? 0 : firstFailIdx;

  const tabsHTML = results.map((r, i) => `
    <button class="tr-tab ${r.passed ? 'pass' : 'fail'} ${i === activeIdx ? 'active' : ''}" data-idx="${i}">
      <span class="tr-tab-ic">${r.passed ? '✓' : '✕'}</span> Case ${i + 1}
    </button>`).join('');

  consoleOutput.innerHTML = `
    <div class="test-result">
      <div class="tr-status-row">
        <span class="tr-status ${status.key}">${status.label}</span>
        <span class="tr-runtime">Runtime: ${runtimeMs} ms</span>
      </div>
      <div class="tr-tabs">${tabsHTML}</div>
      <div class="tr-detail" id="tr-detail">${renderCaseDetail(results[activeIdx])}</div>
    </div>
  `;

  const activeResult = results[activeIdx];
  if (activeResult.error && activeResult.errorLine) {
    highlightErrorLine(activeResult.errorLine);
  } else {
    clearErrorHighlight();
  }
}

consoleOutput.addEventListener('click', (e) => {
  const tab = e.target.closest('.tr-tab');
  if (!tab) return;
  const idx = parseInt(tab.dataset.idx, 10);
  const r = lastResults[idx];
  if (!r) return;

  consoleOutput.querySelectorAll('.tr-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');

  const detail = document.getElementById('tr-detail');
  if (detail) detail.innerHTML = renderCaseDetail(r);

  if (r.error && r.errorLine) highlightErrorLine(r.errorLine);
  else clearErrorHighlight();
});

// ═══════════════════════════════════════════════════════════════
// RUN / SUBMIT
// ═══════════════════════════════════════════════════════════════
btnRun.addEventListener('click', () => executeAllTests(false));
btnSubmit.addEventListener('click', () => executeAllTests(true));

async function executeAllTests(isSubmit) {
  if (isRunning) return;

  const cfg = LANG_CONFIG[currentLang];
  if (!cfg.executable) {
    showToast(`${cfg.label} icrası tezliklə dəstəklənəcək.`, 'warn');
    return;
  }
  if (currentLang === 'python' && !pyodideReady) {
    showToast('Python mühiti hələ hazırlanır, bir neçə saniyə gözləyin.', 'warn');
    return;
  }
  if (cfg.batch && BATCH_ENGINES[currentLang].state !== 'ready') {
    showToast('Mühit hazırlanır — hazır olan kimi kod icra olunacaq.', 'info');
  }
  if (!testCases.length) {
    showToast('Bu sual üçün test keysi tapılmadı.', 'error');
    return;
  }
  if (isSubmit && energyRemaining !== Infinity && energyRemaining <= 0) {
    showToast('Enerjiniz bitdi, sabah təkrar gəlin.', 'error');
    return;
  }

  isRunning = true;
  btnRun.disabled = true;
  btnSubmit.disabled = true;
  const originalSubmitText = btnSubmit.textContent;
  btnSubmit.textContent = isSubmit ? '⏳ Yoxlanılır...' : originalSubmitText;
  clearErrorHighlight();

  const code = monacoEditor.getValue();
  const paramNames = (problem.params || []).map(p => p.name);
  const results = [];
  let stoppedOnError = false;

  // C++ kimi dillər: bir dəfə kompilyasiya, bütün testlər birlikdə
  const batch = cfg.batch
    ? await BATCH_ENGINES[currentLang].runBatch({ userCode: code, problem, testCases })
    : null;

  const t0 = performance.now();

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const r = batch ? batch[i] : await executeCode(code, tc.input_data || {}, paramNames);
    if (!r) break;
    const { resultJson, output, error, errorLine, compileError } = r;

    let actual = null;
    let passed = false;
    if (!error) {
      try {
        actual = (resultJson === null || resultJson === undefined) ? null : JSON.parse(resultJson);
        passed = deepEqual(actual, tc.expected_output);
      } catch (_) {
        passed = false;
      }
    }

    results.push({
      index: i + 1, passed, error, errorLine, compileError,
      input: tc.input_data, expected: tc.expected_output, actual, output,
    });

    if (error) { stoppedOnError = true; break; }
  }

  const runtimeMs = Math.round(performance.now() - t0);
  const allPassed = !stoppedOnError && results.length === testCases.length && results.every(r => r.passed);
  const passedCount = results.filter(r => r.passed).length;

  renderTestResultPanel(results, runtimeMs);

  if (isSubmit) {
    await recordDailyActivity(CURRENT_USER_ID);
    await incrementCodeStats(CURRENT_USER_ID);
    await addTimeSpent(CURRENT_USER_ID);

    if (allPassed) {
      const alreadySolved = await checkAlreadySolved();
      if (!alreadySolved) {
        await markAsSolved();
        const diff = (problem.difficulty || '').toLowerCase();
        await applyEloChange(CURRENT_USER_ID, ELO_REWARD[diff] || 10);
      }
      showResultModal(true);
    } else {
      await applyEloChange(CURRENT_USER_ID, -5);
      showResultModal(false, passedCount, testCases.length);
    }
  } else {
    showToast(`${passedCount}/${testCases.length} test keçdi.`, allPassed ? 'success' : 'warn');
  }

  isRunning = false;
  btnRun.disabled = false;
  btnSubmit.disabled = false;
  btnSubmit.textContent = originalSubmitText;
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE: Həll edildi kimi qeyd et (Real Auth)
// ═══════════════════════════════════════════════════════════════
async function markAsSolved() {
  try {
    const { data: { user }, error: authError } = await db.auth.getUser();

    if (authError || !user) {
      showToast('Nəticəni qeyd etmək üçün sistemə daxil olmalısınız.', 'error');
      return;
    }

    const userId = user.id;

    const { data: existing } = await db
      .from('user_submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('problem_id', PROBLEM_ID)
      .eq('status', 'solved')
      .maybeSingle();

    if (existing) return;

    const { error } = await db
      .from('user_submissions')
      .insert({
        user_id: userId,
        problem_id: PROBLEM_ID,
        status: 'solved'
      });

    if (error) throw error;
  } catch (err) {
    console.error('[AtlasLab Code] markAsSolved:', err);
    showToast('Nəticə bazaya yazılarkən xəta baş verdi.', 'error');
  }
}

async function checkAlreadySolved() {
  const { data } = await db.from('user_submissions')
    .select('id').eq('user_id', CURRENT_USER_ID).eq('problem_id', PROBLEM_ID)
    .eq('status', 'solved').maybeSingle();
  return !!data;
}

async function applyEloChange(uId, delta) {
  if (!uId) return;
  const { data: stats } = await db.from('user_stats')
    .select('elo_rating').eq('user_id', uId).maybeSingle();
  const currentElo = stats ? (Number(stats.elo_rating) || 1000) : 1000;
  await db.from('user_stats').upsert({ user_id: uId, elo_rating: currentElo + delta });
}

async function incrementCodeStats(uId) {
  if (!uId) return;
  try {
    const { data: stats } = await db.from('user_stats')
      .select('totalCode').eq('user_id', uId).maybeSingle();
    const newTotal = (stats ? (Number(stats.totalCode) || 0) : 0) + 1;
    await db.from('user_stats').upsert({ user_id: uId, totalCode: newTotal });

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const { data: hist } = await db.from('code_history')
      .select('code_count').eq('user_id', uId).eq('code_date', todayStr).maybeSingle();
    const newCount = (hist ? (Number(hist.code_count) || 0) : 0) + 1;
    await db.from('code_history').upsert(
      { user_id: uId, code_date: todayStr, code_count: newCount },
      { onConflict: 'user_id, code_date' }
    );
  } catch (err) {
    console.error('[AtlasLab Code] incrementCodeStats:', err);
  }
}

async function addTimeSpent(uId) {
  if (!uId || !problemStartTime) return;
  const elapsedSeconds = Math.floor((Date.now() - problemStartTime) / 1000);
  problemStartTime = Date.now();
  try {
    const { data: stats } = await db.from('user_stats')
      .select('total_time_spent').eq('user_id', uId).maybeSingle();
    const newTotal = (stats ? (Number(stats.total_time_spent) || 0) : 0) + elapsedSeconds;
    await db.from('user_stats').upsert({ user_id: uId, total_time_spent: newTotal });
  } catch (err) {
    console.error('[AtlasLab Code] addTimeSpent:', err);
  }
}

function getSessionId() {
  let sId = localStorage.getItem('active_session_id');
  if (!sId) {
    sId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('active_session_id', sId);
  }
  return sId;
}

async function syncSession(uId) {
  if (!uId) return;
  const { error } = await db.from('user_stats')
    .update({ last_session_id: getSessionId() }).match({ user_id: uId });
  if (error) console.error('[AtlasLab Code] syncSession:', error.message);
}

async function recordDailyActivity(uId) {
  if (!uId) return;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;

  const { data: stats } = await db.from('user_stats')
    .select('daily_limit_count, current_streak, last_quiz_date')
    .eq('user_id', uId).maybeSingle();

  const lastDate = stats ? stats.last_quiz_date : null;
  const usedToday = (lastDate === todayStr) ? (Number(stats.daily_limit_count) || 0) : 0;

  let newStreak;
  if (lastDate === todayStr) newStreak = Number(stats.current_streak) || 0;
  else if (lastDate === yesterdayStr) newStreak = (Number(stats.current_streak) || 0) + 1;
  else newStreak = 1;

  await db.from('user_stats').upsert({
    user_id: uId,
    daily_limit_count: usedToday + 1,
    current_streak: newStreak,
    last_quiz_date: todayStr,
    updated_at: new Date().toISOString()
  });

  energyRemaining = Math.max(0, 5 - (usedToday + 1));
  const display = document.getElementById('limit-text');
  if (display) display.innerText = energyRemaining;
}

// ═══════════════════════════════════════════════════════════════
// NƏTİCƏ MODALI
// ═══════════════════════════════════════════════════════════════
function showResultModal(success, passedCount, totalCount) {
  if (success) {
    rmIcon.textContent = '🎉';
    rmTitle.textContent = 'Uğurla tamamlandı!';
    rmText.textContent = 'Bütün test keysləri uğurla keçdi və nəticəniz qeyd olundu.';
  } else {
    rmIcon.textContent = '⚠️';
    rmTitle.textContent = 'Hələ tam deyil';
    rmText.textContent = `${passedCount}/${totalCount} test keçdi. "Test Result" bölməsindən fərqləri yoxlayıb kodunuzu düzəldin.`;
  }
  resultModalOverlay.classList.add('show');
}

rmStayBtn.addEventListener('click', () => resultModalOverlay.classList.remove('show'));
rmBackBtn.addEventListener('click', () => { window.location.href = 'problems-menu.html'; });
resultModalOverlay.addEventListener('click', (e) => {
  if (e.target === resultModalOverlay) resultModalOverlay.classList.remove('show');
});

// ═══════════════════════════════════════════════════════════════
// SPLITTER — Sol/sağ panel eni (üfüqi) və responsive-də şaquli
// ═══════════════════════════════════════════════════════════════
(function setupMainSplitter() {
  const layout = document.getElementById('workspace-layout');
  const splitter = document.getElementById('main-splitter');
  let dragging = false;

  splitter.addEventListener('mousedown', (e) => {
    dragging = true;
    splitter.classList.add('dragging');
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const isStacked = window.matchMedia('(max-width: 820px)').matches;
    const rect = layout.getBoundingClientRect();

    if (isStacked) {
      const y = e.clientY - rect.top;
      const pct = Math.min(80, Math.max(20, (y / rect.height) * 100));
      layout.style.gridTemplateRows = `${pct}% 4px ${100 - pct}%`;
    } else {
      const x = e.clientX - rect.left;
      const pct = Math.min(75, Math.max(20, (x / rect.width) * 100));
      layout.style.gridTemplateColumns = `${pct}% 4px ${100 - pct}%`;
    }
    if (monacoEditor) monacoEditor.layout();
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    splitter.classList.remove('dragging');
    document.body.style.userSelect = '';
  });
})();
// ═══════════════════════════════════════════════════════════════
// MESSAGE OVERLAY
// ═══════════════════════════════════════════════════════════════
function showMessage(message, type = "alert", customConfirm = "Təsdiqlə", customCancel = "Ləğv et") {
  return new Promise((resolve) => {
    const overlay = document.getElementById("messageOverlay");
    const messageText = document.getElementById("messageText");
    const okBtn = document.getElementById("okBtn");
    const confirmBtn = document.getElementById("confirmBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    if (!overlay) return resolve(false);

    messageText.innerHTML = message;
    overlay.style.display = "flex";

    if (type === "confirm") {
      okBtn.style.display = "none";
      confirmBtn.style.display = "inline-block";
      cancelBtn.style.display = "inline-block";
      confirmBtn.textContent = customConfirm;
      cancelBtn.textContent = customCancel;
      confirmBtn.onclick = () => { overlay.style.display = "none"; resolve(true); };
      cancelBtn.onclick = () => { overlay.style.display = "none"; resolve(false); };
    } else {
      okBtn.style.display = "inline-block";
      confirmBtn.style.display = "none";
      cancelBtn.style.display = "none";
      okBtn.textContent = customConfirm !== "Təsdiqlə" ? customConfirm : "OK";
      okBtn.onclick = () => { overlay.style.display = "none"; resolve(true); };
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// BEYİN FASİLƏSİ — idle aşkarlama
// ═══════════════════════════════════════════════════════════════
const BRAIN_BREAK_IDLE_MS = 10 * 60 * 1000; 
let brainBreakTimer = null;
let brainBreakShown = false;

const BRAIN_BREAK_MESSAGES = [
  "404: Diqqət tapılmadı. Zəhmət olmasa kursoru kənara qoyun və təmiz hava alın.",
  "15 dəqiqədir eyni sətrə baxırsan. Bir fincan çay alıb gəl, kod bir yerə qaçmır.",
  "Beyin yüklənir... Resurslar tükəndi. Sistemə 'Çay/Qəhvə' yenilənməsi lazımdır.",
  "Status 408: Request Timeout. Diqqətinizin vaxtı bitdi! Sistemə təcili təmiz hava və su qəbulu lazımdır.",
  "RAM doldu? Keşi təmizləmək və beyni sıfırlamaq üçün 5 dəqiqəlik gəzinti tövsiyə olunur.",
];

function resetBrainBreakTimer() {
  if (brainBreakShown) return;
  clearTimeout(brainBreakTimer);
  brainBreakTimer = setTimeout(triggerBrainBreakPrompt, BRAIN_BREAK_IDLE_MS);
}

async function triggerBrainBreakPrompt() {
  if (brainBreakShown) return;
  brainBreakShown = true;
  const msg = BRAIN_BREAK_MESSAGES[Math.floor(Math.random() * BRAIN_BREAK_MESSAGES.length)];
  const wantsBreak = await showMessage(msg, "confirm", "Fasilə ver", "Sonra");
  if (wantsBreak) startBreakOverlay();
}

function formatBreakTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startBreakOverlay() {
  const overlay = document.getElementById('breakOverlay');
  const timerEl = document.getElementById('breakTimer');
  const continueBtn = document.getElementById('breakContinueBtn');
  if (!overlay) return;

  overlay.style.display = 'flex';
  timerEl.style.display = 'block';

  let secondsLeft = 5 * 60; 
  timerEl.textContent = formatBreakTime(secondsLeft);

  const interval = setInterval(() => {
    secondsLeft--;
    if (secondsLeft <= 0) { clearInterval(interval); timerEl.style.display = 'none'; }
    else timerEl.textContent = formatBreakTime(secondsLeft);
  }, 1000);

  const closeBreak = () => {
    clearInterval(interval);
    overlay.style.display = 'none';
    continueBtn.removeEventListener('click', closeBreak);
  };
  continueBtn.addEventListener('click', closeBreak);
}
// ─── Splitter: editor / konsol hündürlüyü (şaquli) ────────────
(function setupConsoleSplitter() {
  const editorPanel = document.getElementById('editor-panel');
  const splitter = document.getElementById('console-splitter');
  const consolePanelEl = document.getElementById('console-panel');
  let dragging = false;

  splitter.addEventListener('mousedown', (e) => {
    dragging = true;
    splitter.classList.add('dragging');
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    consolePanelEl.classList.remove('collapsed');
    const rect = editorPanel.getBoundingClientRect();
    const fromBottom = rect.bottom - e.clientY;
    const newHeight = Math.min(rect.height - 120, Math.max(80, fromBottom));
    consolePanelEl.style.height = `${newHeight}px`;
    if (monacoEditor) monacoEditor.layout();
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    splitter.classList.remove('dragging');
    document.body.style.userSelect = '';
  });
})();

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
CURRENT_USER_ID = getCurrentUserId();

if (!CURRENT_USER_ID) {
  window.location.href = 'register.html';
} else {
  updateEnvStatus();
  loadProblem();
  syncSession(CURRENT_USER_ID);
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
});