/* ================================================
   AtlasLab Code — problems-script.js
   Məsələlər menyusu üçün skript
   ================================================ */

'use strict';

// ─── Supabase Config ──────────────────────────────────────────
const SUPABASE_URL = 'https://xoebhhdirsvjorjlrfzi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FpT1VBCd5NKEnrYQbmx9Gw_MqWxVMvN';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── State ────────────────────────────────────────────────────
let allProblems = [];
let solvedIds   = new Set();
let activeFilter = 'all';
let searchQuery  = '';

// ─── DOM refs ─────────────────────────────────────────────────
const tbody        = document.getElementById('problems-tbody');
const searchInput  = document.getElementById('search-input');
const diffBtns     = document.querySelectorAll('.diff-btn[data-diff]');

const statTotal    = document.getElementById('stat-total');
const statSolved   = document.getElementById('stat-solved');
const statEasy     = document.getElementById('stat-easy');
const statMedium   = document.getElementById('stat-medium');
const statHard     = document.getElementById('stat-hard');
const aforizmler = [
    { text: "Təhsil dünyanı dəyişdirmək üçün istifadə edə biləcəyiniz ən güclü silahdır.", author: "Nelson Mandela" },
    { text: "Biliyə qoyulan sərmayə həmişə ən yüksək gəliri gətirir.", author: "Benjamin Franklin" },
    { text: "Təhsilin məqsədi boş bir ağlı açıq bir ağılla əvəz etməkdir.", author: "Malcolm Forbes" },
    { text: "Elm öyrənmək hər bir müsəlman üçün fərzdir.", author: "Hədisi-şərif" },
    { text: "Bilmək kifayət deyil, tətbiq etmək lazımdır; istəmək kifayət deyil, əməl etmək lazımdır.", author: "Iohan Volfqanq Höte" },
    { text: "Təxəyyül biliyin özündən daha vacibdir, çünki bilik məhduddur, təxəyyül isə bütün dünyanı əhatə edir.", author: "Albert Eynşteyn" },
    { text: "Mən yalnız onu bilirəm ki, heç nə bilmirəm.", author: "Sokrat" },
    { text: "Mütaliə zehin üçün nədirsə, idman bədən üçün odur.", author: "Riçard Stil" },
    { text: "Yeni bir şey öyrənməyi dayandıran insan qocalmışdır, istər iyirmi yaşında olsun, istər səksən.", author: "Henri Ford" },
    { text: "Kitabsız ev pəncərəsiz otaq kimidir.", author: "Horace Mann" },
    { text: "Bilik güclüdür, çünki o insana yeni imkanlar və yeni yollar açır.", author: "Frensis Bekon" },
    { text: "Öyrətmək öyrənməyin ikinci dəfə təkrarıdır.", author: "Jozef Juber" },
    { text: "Bir uşaq, bir müəllim, bir kitab və bir qələm dünyanı dəyişə bilər.", author: "Malala Yusufzai" },
    { text: "Həyatda ən həqiqi yol göstərən elm və fəndir.", author: "Mustafa Kamal Atatürk" },
    { text: "Təhsilli insan təhsilsiz insandan yaşayan ölüdən fərqləndiyi qədər fərqlənir.", author: "Aristotel" },
    { text: "Kim bir məktəb açırsa, əslində bir həbsxananın qapısını bağlayır.", author: "Viktor Hüqo" },
    { text: "Ağıl doldurulası qab deyil, alovlandırılası oddur.", author: "Plutarx" },
    { text: "Təhsil həyata hazırlıq deyil, təhsil həyatın özüdür.", author: "Con Dyui" },
    { text: "Mən heç vaxt məktəbdə oxumağımın öz təhsilimə mane olmasına icazə verməmişəm.", author: "Mark Tven" },
    { text: "Nə qədər yavaş getsən də, dayanmadığın müddətcə önəmli deyil.", author: "Konfutsi" }
];  

function showRandomQuote() {
    const headerParagraph = document.querySelector(".page-header p");
    
    if (headerParagraph) {
        // Riyazi olaraq təsadüfi (random) bir indeks seçirik
        const randomIndex = Math.floor(Math.random() * aforizmler.length);
        const secilmisSitat = aforizmler[randomIndex];
        
        // Mətni və müəllifi HTML daxilinə yerləşdiririk
        headerParagraph.innerHTML = `"${secilmisSitat.text}" <span class="quote-author">- ${secilmisSitat.author}</span>`;
    }
}

const kodlamaMenu = document.getElementById('kodlama-menu');
    if (kodlamaMenu && kodlamaMenu.previousElementSibling) {
        kodlamaMenu.classList.add('open');
        kodlamaMenu.previousElementSibling.querySelector('.arrow').textContent = '';
    }
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
  
  if (!uId) { 
    if (display) display.innerText = '—'; 
    return; 
  }

  const cachedBitis = localStorage.getItem('premiumBitis_' + uId);
  const isPremium = cachedBitis && new Date().getTime() < parseInt(cachedBitis);
  const profileImg = document.querySelector('.profile-bg img');
  if (isPremium) {
    if (energyIcon) energyIcon.src = '../images/premium-thunder.webp';
    if (display) display.innerHTML = `<img src="../images/infinity.webp" alt="∞" style="width:18px;vertical-align:middle;">`;
    if (premiumAds) premiumAds.style.display = 'none'; // Fixed: properties are assigned, not called as functions
    if (profileImg) profileImg.src = '../images/premium-profile.webp';
    let energyRemaining = Infinity; // Fixed: declared variable scope
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
// ─── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
  el.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('hiding');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}

// ─── Difficulty helper ────────────────────────────────────────
function diffBadge(diff) {
  const map = {
    easy:   { label: 'Asan',  cls: 'easy'   },
    medium: { label: 'Orta',  cls: 'medium' },
    hard:   { label: 'Çətin', cls: 'hard'   },
  };
  const d = (diff || '').toLowerCase();
  const item = map[d] || { label: diff || '—', cls: '' };
  return `<span class="diff-badge ${item.cls}">${item.label}</span>`;
}

// ─── Load problems from Supabase ──────────────────────────────
async function loadProblems() {
  try {
    const { data: problems, error: pErr } = await db
      .from('coding_problems')
      .select('id, title, difficulty');

    if (pErr) throw pErr;
    allProblems = problems || [];

    const { data: subs, error: sErr } = await db
      .from('user_submissions')
      .select('problem_id')
      .eq('user_id', CURRENT_USER_ID)
      .eq('status', 'solved');

    if (!sErr && subs) {
      solvedIds = new Set(subs.map(s => String(s.problem_id)));
    }

    updateStats();
    renderTable(filteredProblems());

  } catch (err) {
    console.error('[AtlasLab Code] loadProblems:', err);
    tbody.innerHTML = `
      <tr><td colspan="4">
        <div class="table-empty">
          ⚠ Məsələlər yüklənərkən xəta baş verdi.<br>
          <small style="opacity:0.6;">Supabase konfiqurasiyanı yoxlayın.</small>
        </div>
      </td></tr>`;
    showToast('Məsələlər yüklənmədi. Supabase-i yoxla.', 'error');
  }
}

// ─── Stats ────────────────────────────────────────────────────
function updateStats() {
  const total  = allProblems.length;
  const solved = allProblems.filter(p => solvedIds.has(String(p.id))).length;
  const easy   = allProblems.filter(p => p.difficulty?.toLowerCase() === 'easy').length;
  const medium = allProblems.filter(p => p.difficulty?.toLowerCase() === 'medium').length;
  const hard   = allProblems.filter(p => p.difficulty?.toLowerCase() === 'hard').length;

  statTotal.textContent  = total;
  statSolved.textContent = solved;
  statEasy.textContent   = easy;
  statMedium.textContent = medium;
  statHard.textContent   = hard;
}

// ─── Filter ───────────────────────────────────────────────────
function filteredProblems() {
  return allProblems.filter(p => {
    const matchDiff = activeFilter === 'all' ||
      (p.difficulty || '').toLowerCase() === activeFilter;

    const matchSearch = !searchQuery ||
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchDiff && matchSearch;
  });
}

// ─── Render table ─────────────────────────────────────────────
function renderTable(problems) {
  if (!problems.length) {
    tbody.innerHTML = `
      <tr><td colspan="4">
        <div class="table-empty">Heç bir məsələ tapılmadı 🔍</div>
      </td></tr>`;
    return;
  }

  // Find global index (keep numbering relative to allProblems)
  tbody.innerHTML = problems.map((p, localIdx) => {
    const globalIdx = allProblems.indexOf(p) + 1;
    const solved    = solvedIds.has(String(p.id));
    const statusIc  = solved
      ? `<span class="status-ic solved" title="Həll edilib">✓</span>`
      : `<span class="status-ic unsolved" title="Həll edilməyib">○</span>`;

    return `
      <tr data-id="${escHtml(p.id)}" tabindex="0" role="button"
          aria-label="${escHtml(p.title)} məsələsini aç">
        <td class="col-num">
          <span class="problem-num">${globalIdx}</span>
        </td>
        <td class="col-status">${statusIc}</td>
        <td>
          <span class="problem-title-link">${escHtml(p.title)}</span>
        </td>
        <td class="col-diff">${diffBadge(p.difficulty)}</td>
      </tr>`;
  }).join('');

  // Row click → navigate to problem page
  tbody.querySelectorAll('tr[data-id]').forEach(row => {
    const navigate = () => {
      window.location.href = `problem.html?id=${encodeURIComponent(row.dataset.id)}`;
    };
    row.addEventListener('click', navigate);
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(); }
    });
  });
}

// ─── Helpers ─────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Event Listeners ─────────────────────────────────────────
// Difficulty filter buttons
diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.diff;
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTable(filteredProblems());
  });
});

// Search
let searchDebounce;
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchQuery = searchInput.value.trim();
    renderTable(filteredProblems());
  }, 280);
});

// ─── Init ─────────────────────────────────────────────────────
loadProblems();
CURRENT_USER_ID = getCurrentUserId();
refreshEnergyBadge(CURRENT_USER_ID);
showRandomQuote();