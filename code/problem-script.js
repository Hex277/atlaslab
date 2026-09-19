/* ================================================
   AtlasLab Code — problem-script.js
   Məsələ Həlli Workspace: Monaco + Pyodide + Web Worker
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
    if (premiumAds) premiumAds.style.display = 'none'; // Fixed: properties are assigned, not called as functions
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
const RUN_TIMEOUT_MS = 6000;

// Hər dil üçün başlanğıc şablon və Monaco dil id-si
const LANG_CONFIG = {
  python: {
    label: 'Python', monacoId: 'python', dotColor: '#3572A5', executable: true,
    template:
`# Kodunuzu bu sahədə yazın.

def main():
    pass

main()
`
  },
  javascript: {
    label: 'JavaScript', monacoId: 'javascript', dotColor: '#f0db4f', executable: true,
    template:
`// Kodunuzu bu sahədə yazın.
// Məlumatı oxumaq üçün: readline()
// Nəticəni çap etmək üçün: console.log()

function main() {

}

main();
`
  },
  java: {
    label: 'Java', monacoId: 'java', dotColor: '#e76f00', executable: false,
    template:
`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

    }
}
`
  },
  cpp: {
    label: 'C++', monacoId: 'cpp', dotColor: '#00599C', executable: false,
    template:
`#include <bits/stdc++.h>
using namespace std;

int main() {

    return 0;
}
`
  }
};

// Hər dil üzrə istifadəçinin yazdığı kodu yadda saxla (dil dəyişəndə itməsin)
const codeByLang = {};

// ─── DOM refs ─────────────────────────────────────────────────
const wsLoading      = document.getElementById('ws-loading');
const problemTitleEl = document.getElementById('problem-title');
const problemDiffEl  = document.getElementById('problem-diff-badge');
const problemDescEl  = document.getElementById('problem-desc');
const testCasesList  = document.getElementById('test-cases-list');

const langBadge      = document.getElementById('lang-badge');
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

// ═══════════════════════════════════════════════════════════════
// CONSOLE
// ═══════════════════════════════════════════════════════════════
function consoleLog(text, cls = 'output') {
  const span = document.createElement('span');
  span.className = `c-line c-${cls}`;
  span.textContent = text;
  consoleOutput.appendChild(span);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function consoleClear() {
  consoleOutput.innerHTML = '';
}

consoleClearBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  consoleClear();
});

// Konsolu qat/aç (header-ə klik)
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
      .select('id, title, description, difficulty')
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

  // Sual mətnini sətir sonlarına görə paraqraflara böl (sadə render)
  const desc = problem.description || '';
  const paragraphs = desc.split(/\n{2,}/).map(p => `<p>${escHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
  problemDescEl.innerHTML = paragraphs || '<p>Təsvir mövcud deyil.</p>';
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
          <div class="tc-val">${escHtml(tc.input_data) || '—'}</div>
        </div>
        <div class="tc-field">
          <div class="tc-key">Gözlənilən Çıxış</div>
          <div class="tc-val">${escHtml(tc.expected_output) || '—'}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════
// MONACO EDITOR
// ═══════════════════════════════════════════════════════════════
function initEditor() {
  require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
  require(['vs/editor/editor.main'], () => {
    document.getElementById('editor-loading').classList.add('hidden');

    const isDark = document.body.classList.contains('dark-theme');

    monacoEditor = monaco.editor.create(document.getElementById('monaco-host'), {
      value: LANG_CONFIG[currentLang].template,
      language: LANG_CONFIG[currentLang].monacoId,
      theme: isDark ? 'vs-dark' : 'vs',
      fontSize: 14,
      fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      padding: { top: 14 },
      tabSize: 4,
    });

    codeByLang[currentLang] = LANG_CONFIG[currentLang].template;

    // Tema dəyişikliyini izlə (theme.js body.dark-theme sinifini toggle edir)
    const observer = new MutationObserver(() => {
      const dark = document.body.classList.contains('dark-theme');
      monaco.editor.setTheme(dark ? 'vs-dark' : 'vs');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Pyodide-i indi (redaktor hazır olan kimi) arxa planda yükləməyə başla
    loadPyodideInBackground();
  });
  
}
problemStartTime = Date.now();
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

  // Cari dilin kodunu yadda saxla
  if (monacoEditor) codeByLang[currentLang] = monacoEditor.getValue();

  currentLang = lang;
  const cfg = LANG_CONFIG[lang];
  langLabel.textContent = cfg.label;
  langDot.style.background = cfg.dotColor;

  if (monacoEditor) {
    const model = monacoEditor.getModel();
    monaco.editor.setModelLanguage(model, cfg.monacoId);
    monacoEditor.setValue(codeByLang[lang] ?? cfg.template);
  }

  updateEnvStatus();
}

// ═══════════════════════════════════════════════════════════════
// PYODIDE (Python mühərriki) — arxa planda yüklənir
// ═══════════════════════════════════════════════════════════════
async function loadPyodideInBackground() {
  if (pyodideLoading || pyodideReady) return;
  pyodideLoading = true;
  updateEnvStatus();

  try {
    // pyodide.js CDN-dən dinamik yüklə
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
  }
}

// ═══════════════════════════════════════════════════════════════
// PYTHON İCRA — Pyodide, əsas thread
// ═══════════════════════════════════════════════════════════════
async function runPython(code, stdin) {
  if (!pyodideReady) {
    throw { engineError: 'Python mühiti hələ hazır deyil. Bir az gözləyin.' };
  }

  try {
    pyodide.runPython(`
import sys, io
sys.stdin = io.StringIO(${pyStrLiteral(stdin)})
_atlas_stdout = io.StringIO()
sys.stdout = _atlas_stdout
`);

    await pyodide.runPythonAsync(code);

    const output = pyodide.runPython('_atlas_stdout.getvalue()');
    return { output, error: null };

  } catch (err) {
    return { output: '', error: formatPyError(err) };

  } finally {
    try {
      pyodide.runPython('sys.stdout = sys.__stdout__; sys.stdin = sys.__stdin__');
    } catch (_) { /* no-op */ }
  }
}

// Python string literalını təhlükəsiz qurmaq üçün (JSON.stringify Python
// sintaksisi ilə uyğun gəlir, çünki ikisi də cüt-dırnaqlı escape edir)
function pyStrLiteral(str) {
  return JSON.stringify(str ?? '');
}

function formatPyError(err) {
  const msg = (err && err.message) ? err.message : String(err);
  // Pyodide traceback-in son mənalı sətrini çıxar
  const lines = msg.trim().split('\n');
  return lines[lines.length - 1] || msg;
}

// ═══════════════════════════════════════════════════════════════
// JAVASCRIPT İCRA — Web Worker
// ═══════════════════════════════════════════════════════════════
function runJavaScript(code, stdin) {
  return new Promise((resolve) => {
    const workerSrc = `
      const __lines = ${JSON.stringify(stdin)}.split('\\n');
      let __idx = 0;
      function readline() { return __idx < __lines.length ? __lines[__idx++] : ''; }
      const __out = [];
      console.log = (...args) => __out.push(args.map(a =>
        typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      try {
        ${code}
        postMessage({ output: __out.join('\\n'), error: null });
      } catch (e) {
        postMessage({ output: __out.join('\\n'), error: e.message || String(e) });
      }
    `;
    const blob = new Blob([workerSrc], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ output: '', error: 'Vaxt bitdi (mümkün sonsuz dövr). Kodunuzu yoxlayın.' });
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
      resolve({ output: '', error: e.message || 'Naməlum xəta' });
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// KODU İCRA ET (bir test keysi üçün)
// ═══════════════════════════════════════════════════════════════
async function executeCode(code, stdin) {
  if (currentLang === 'python') return runPython(code, stdin);
  if (currentLang === 'javascript') return runJavaScript(code, stdin);
  return { output: '', error: 'Bu dil hələ dəstəklənmir.' };
}

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

  consoleClear();
  consoleLog(`▶ ${cfg.label} kodu icra olunur (${testCases.length} test keysi)...`, 'info');

  const code = monacoEditor.getValue();
  let passedCount = 0;
  let stoppedOnError = false;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const { output, error } = await executeCode(code, tc.input_data || '');
    const actual = (output || '').trim();
    const expected = (tc.expected_output || '').trim();
    const passed = !error && actual === expected;

    consoleLog(passed ? `✓ Test ${i + 1} — Keçdi` : `✕ Test ${i + 1} — Keçmədi`, passed ? 'success' : 'error');
    if (!passed && !error) {
      consoleLog(`  Giriş: ${tc.input_data || '—'}`, 'info');
      consoleLog(`  Gözlənilən: ${expected || '—'}`, 'info');
      consoleLog(`  Sizin nəticə: ${actual || '—'}`, 'warn');
    }

    if (output) output.split('\n').forEach(line => consoleLog(line, 'output'));
    if (passed) passedCount++;

    if (error) {
      consoleLog(`Xəta: ${error}`, 'error');
      consoleLog(`Test ${i + 1}-də xəta baş verdiyi üçün sonrakı testlər işə salınmadı.`, 'warn');
      stoppedOnError = true;
      break;
    }
  }

  const allPassed = !stoppedOnError && passedCount === testCases.length;

  if (isSubmit) {
    await recordDailyActivity(CURRENT_USER_ID);
    await incrementCodeStats(CURRENT_USER_ID);
    await addTimeSpent(CURRENT_USER_ID);

    if (allPassed) {
      consoleLog('✓ Bütün testlər keçdi. Nəticə yadda saxlanılır...', 'gold');
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
// SUPABASE: Həll edildi kimi qeyd et
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// SUPABASE: Həll edildi kimi qeyd et (Real Auth)
// ═══════════════════════════════════════════════════════════════
async function markAsSolved() {
  try {
    // 1. Cari daxil olmuş istifadəçini yoxla
    const { data: { user }, error: authError } = await db.auth.getUser();
    
    if (authError || !user) {
      showToast('Nəticəni qeyd etmək üçün sistemə daxil olmalısınız.', 'error');
      return;
    }

    const userId = user.id;

    // 2. Əvvəllər həll edilib-edilmədiyini yoxla
    const { data: existing } = await db
      .from('user_submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('problem_id', PROBLEM_ID)
      .eq('status', 'solved')
      .maybeSingle();

    if (existing) return; // artıq həll edilib

    // 3. Real user_id ilə bazaya yaz
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
    rmText.textContent = `${passedCount}/${totalCount} test keçdi. "Nəticələr" bölməsindən fərqləri yoxlayıb kodunuzu düzəldin.`;
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
updateEnvStatus();
loadProblem();
CURRENT_USER_ID = getCurrentUserId();
syncSession(CURRENT_USER_ID);
refreshEnergyBadge(CURRENT_USER_ID);