// ---------------------- GLOBAL SCRIPTS ----------------------
document.addEventListener("DOMContentLoaded", () => {
    const preloader = document.getElementById("preloader");
      
      if (preloader) {
          // 1000ms ulduzun tam 360 dərəcə fırlanmasına gedir.
          // +400ms ulduz dayandıqdan sonra ekranda sabit qalmasını görmək üçündür.
          // Ümumi: 1400ms (1.4 saniyə) sonra yüklənmə ekranı yox olur.
          setTimeout(() => {
              preloader.classList.add("hidden");
          }, 1600);
      }
  });
document.addEventListener("DOMContentLoaded", function () {

    // 1. Mövcud Menyu Kodunuz
    const kodlamaMenu = document.getElementById('kodlama-menu');
    if (kodlamaMenu && kodlamaMenu.previousElementSibling) {
        kodlamaMenu.classList.add('open');
        kodlamaMenu.previousElementSibling.querySelector('.arrow').textContent = '';
    }

    // ==========================================
    // 2. QLOBAL PREMİUM YOXLANIŞI (Gecikməsiz & Ağıllı Yenilənmə)
    // ==========================================

    // UI-ı dəyişən və ya geri qaytaran (Sıfırlayan) funksiya
    function setPremiumUI(isActive) {
        const premiumHref = document.getElementById('premium-href');
        const profileImg = document.querySelector('.profile-bg img');

        if (isActive) {
            // Premium aktivdir
            document.body.classList.add('premium-aktiv');
            if (premiumHref) premiumHref.style.display = 'none';
            if (profileImg) profileImg.src = '../images/premium-profile.webp';
        } else {
            // Premium DEYİL (və ya vaxtı bitib) - Hər şeyi standart vəziyyətə qaytarırıq
            document.body.classList.remove('premium-aktiv');
            if (premiumHref) premiumHref.style.display = ''; // CSS-dəki original display dəyərinə qayıdır
            if (profileImg) profileImg.src = '../images/profile.webp';
        }
    }

    if (window.supabase) {
        const supabaseUrl = 'https://xoebhhdirsvjorjlrfzi.supabase.co';
        const supabaseKey = 'sb_publishable_FpT1VBCd5NKEnrYQbmx9Gw_MqWxVMvN';

        // Supabase Tək İnstance Yoxlanışı
        if (!window.globalSupabaseClient) {
            window.globalSupabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        }
        const supabaseGlobal = window.globalSupabaseClient;

        // --- ADDIM 1: SIFIR GECİKMƏ İLƏ LOCALSTORAGE YOXLANIŞI ---
        let userId = null;
        try {
            // Supabase-in öz qlobal tokenindən (gecikmə olmadan) User ID-ni çəkirik
            const sbSession = localStorage.getItem('sb-xoebhhdirsvjorjlrfzi-auth-token');
            if (sbSession) {
                userId = JSON.parse(sbSession).user.id;
            }
        } catch (e) { }

        const indi = new Date().getTime();

        if (userId) {
            // Hər istifadəçinin ÖZÜNƏ məxsus premium yaddaşını yoxlayırıq
            const cachedBitis = localStorage.getItem('premiumBitis_' + userId);

            if (cachedBitis && indi < parseInt(cachedBitis)) {
                setPremiumUI(true); // Gözləmədən anında Premium rəngləri ver
            } else {
                setPremiumUI(false); // Keş yoxdursa və ya bitibsə standart UI göstər
            }
        }

        // --- ADDIM 2: ARXA FONDA DƏQİQ BAZA YOXLANIŞI ---
        supabaseGlobal.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                const currentUserId = session.user.id;
                const { data: abuneData } = await supabaseGlobal
                    .from('abunelikler')
                    .select('bitis_tarixi')
                    .eq('user_id', currentUserId)
                    .maybeSingle();

                if (abuneData) {
                    const bitis = new Date(abuneData.bitis_tarixi).getTime();
                    const rightNow = new Date().getTime();

                    if (rightNow < bitis) {
                        // Baza təsdiqlədi: Hələ də premiumdur. Yaddaşı yeniləyirik.
                        localStorage.setItem('premiumBitis_' + currentUserId, bitis);
                        setPremiumUI(true);
                    } else {
                        // Baza dedi ki: Vaxtı BİTİB! Yaddaşı sil və UI-ı geri al.
                        localStorage.removeItem('premiumBitis_' + currentUserId);
                        setPremiumUI(false);
                    }
                } else {
                    // Cədvəldə bu istifadəçiyə aid heç nə yoxdur (Pulsuzdur). Yaddaşı sil və UI-ı geri al.
                    localStorage.removeItem('premiumBitis_' + currentUserId);
                    setPremiumUI(false);
                }
            }
        });
    } else {
        console.warn("Diqqət: Bu səhifədə Supabase yüklənməyib.");
    }
});

function showMessage(message, type = "alert", customConfirm = "Təsdiqlə", customCancel = "Ləğv et") {
    return new Promise((resolve) => {
        const overlay = document.getElementById("messageOverlay");
        const messageText = document.getElementById("messageText");
        const okBtn = document.getElementById("okBtn");
        const confirmBtn = document.getElementById("confirmBtn");
        const cancelBtn = document.getElementById("cancelBtn");

        if (!overlay) return resolve(false);

        // Mesajı qutuya yazırıq və ekranı açırıq
        messageText.innerHTML = message;
        overlay.style.display = "flex";

        // Əgər növ "confirm" (Sual) idisə:
        if (type === "confirm") {
            okBtn.style.display = "none";
            confirmBtn.style.display = "inline-block";
            cancelBtn.style.display = "inline-block";

            // YENİLİK: Düymə yazıları kənardan gələn adlarla dəyişdirilir
            confirmBtn.textContent = customConfirm;
            cancelBtn.textContent = customCancel;

            // "İndi al" və ya əsas təsdiq düyməsinə basıldıqda
            confirmBtn.onclick = () => {
                overlay.style.display = "none";
                resolve(true);
            };

            // "Sonra" və ya ləğv düyməsinə basıldıqda
            cancelBtn.onclick = () => {
                overlay.style.display = "none";
                resolve(false);
            };
        }
        // Əgər növ "alert" (Sadəcə bildiriş) idisə:
        else {
            okBtn.style.display = "inline-block";
            confirmBtn.style.display = "none";
            cancelBtn.style.display = "none";

            // Tək düyməli mesajlar üçün mətni dəyişə bilərik
            okBtn.textContent = customConfirm !== "Təsdiqlə" ? customConfirm : "OK";

            okBtn.onclick = () => {
                overlay.style.display = "none";
                resolve(true);
            };
        }
    });
}
function openActionModal(contentHTML) {
    const overlay = document.getElementById("actionOverlay");
    const modalContent = document.getElementById("actionModalContent");

    if (overlay && modalContent) {
        modalContent.innerHTML = contentHTML;
        overlay.style.display = "flex";
        document.body.style.overflow = "hidden";
    }
}
function closeActionModal() {
    const overlay = document.getElementById("actionOverlay");
    const modalContent = document.getElementById("actionModalContent");

    if (overlay) {
        // Modalı gizlədirik
        overlay.style.display = "none";
        // Səhifənin sürüşməsini (scroll) geri qaytarırıq
        document.body.style.overflow = "";
    }

    if (modalContent) {
        // Növbəti dəfə açılanda köhnə elementlər görünməsin deyə içini təmizləyirik
        modalContent.innerHTML = "";
    }
}
// ---------------------- STATISTICS PAGE ----------------------
if (window.location.pathname.endsWith("statistics.html")) {

    let myChart = null;
    let currentChartType = 'total'; // 'total' | 'code' | 'quiz'

    const getSupabase = () => window.globalSupabaseClient || window.supabaseClient;

    async function loadUserDashboard(userId) {
        const client = getSupabase();
        if (!client) return;

        const { data, error } = await client
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error || !data) return;

        document.getElementById('totalQuizzes').innerText = data.quizzes_completed || 0;
        document.getElementById('totalCode').innerText = data.totalCode || 0; // sütun adını öz DB-nlə tutuşdur
        document.getElementById('eloValue').innerText = data.elo_rating || 1000;
        document.getElementById('userStreak').innerText = `${data.current_streak || 0} Gün`;

        const total = data.total_answered_questions || 0;
        const correct = data.total_correct_answers || 0;
        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
        document.getElementById('accuracyRate').innerText = `${percent}%`;

        const minutes = Math.floor((data.total_time_spent || 0) / 60);
        const seconds = (data.total_time_spent || 0) % 60;
        document.getElementById('avgTime').innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function chartLabelFor(type) {
        if (type === 'code') return 'Kodlama Sayı';
        if (type === 'quiz') return 'Sınaq Sayı';
        return 'Ümumi Fəaliyyət';
    }

    async function fetchHistoryRows(client, table, dateCol, countCol, userId, startDateStr) {
        let query = client.from(table).select(`${dateCol}, ${countCol}`).eq('user_id', userId);
        if (startDateStr) query = query.gte(dateCol, startDateStr);
        const { data, error } = await query;
        if (error) { console.error(`${table} fetch error:`, error); return []; }
        return data || [];
    }

    async function loadActivityChart(userId, type = currentChartType) {
        const client = getSupabase();
        if (!client) return;

        const fixedLabels = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'];
        let countsData = [0, 0, 0, 0, 0, 0, 0];

        const now = new Date();
        const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - currentDayOfWeek + 1);
        const startOfWeekStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

        const addToCounts = (rows, dateCol, countCol) => {
            rows.forEach(item => {
                const parts = item[dateCol].split('-');
                const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                let dayIndex = dateObj.getDay();
                dayIndex = (dayIndex === 0) ? 6 : dayIndex - 1;
                countsData[dayIndex] += Number(item[countCol]) || 0;
            });
        };

        if (type === 'quiz' || type === 'total') {
            const rows = await fetchHistoryRows(client, 'quiz_history', 'quiz_date', 'quiz_count', userId, startOfWeekStr);
            addToCounts(rows, 'quiz_date', 'quiz_count');
        }
        if (type === 'code' || type === 'total') {
            const rows = await fetchHistoryRows(client, 'code_history', 'code_date', 'code_count', userId, startOfWeekStr);
            addToCounts(rows, 'code_date', 'code_count');
        }

        renderChart(fixedLabels, countsData, chartLabelFor(type));
    }

    async function loadLeaderboard(currentUserId) {
        const client = getSupabase();
        if (!client) return;

        const { data: statsData, error: statsError } = await client
            .from('user_stats')
            .select('*')
            .order('elo_rating', { ascending: false })
            .limit(30);

        if (statsError || !statsData) return;

        const userIds = statsData.map(row => row.user_id);

        const { data: premiumData, error: premiumError } = await client
            .from('aktiv_premiumlar')
            .select('user_id')
            .in('user_id', userIds);

        const activePremiumUserIds = new Set();
        if (!premiumError && premiumData) {
            premiumData.forEach(p => activePremiumUserIds.add(p.user_id));
        }

        const tbody = document.getElementById('leaderboardBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        statsData.forEach((row, index) => {
            const accuracy = row.total_answered_questions > 0
                ? Math.round((row.total_correct_answers / row.total_answered_questions) * 100)
                : 0;

            const isMe = row.user_id === currentUserId;
            let nameToShow = row.display_name || 'İstifadəçi #' + row.user_id.slice(0, 5);
            if (isMe) nameToShow += ' (Siz)';

            const isPremium = activePremiumUserIds.has(row.user_id);
            const premiumBadge = isPremium ? `<div class="lb-premium-text-bg" id="lb-premium-text"><p>Premium</p></div>` : '';

            tbody.innerHTML += `
                <tr class="${isMe ? 'current-user' : ''}" style="${isMe ? 'background: rgba(234, 207, 30, 0.077);' : ''}">
                    <td>${index + 1}</td>
                    <td>${nameToShow} ${premiumBadge}</td>
                    <td>${row.elo_rating || 1000}</td>
                    <td>${accuracy}%</td>
                </tr>
            `;
        });
    }

    function renderChart(labels, counts, label = 'Ümumi Fəaliyyət') {
        const canvas = document.getElementById('weeklyActivityChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (typeof myChart !== 'undefined' && myChart) {
            myChart.destroy();
        }

        const isDarkMode = document.body.classList.contains('dark-theme') || document.body.classList.contains('dark-mode');
        const labelColor = isDarkMode ? '#ffffff' : '#333333';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: counts,
                    borderColor: '#B89A5A',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    tension: 0,
                    pointRadius: 4,
                    pointBackgroundColor: '#B89A5A',
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: labelColor, stepSize: 1 },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: labelColor },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    async function handleChartFilterChange(userId) {
        const filterSelect = document.getElementById('chart-filter-select');
        const typeSelect = document.getElementById('chart-type-select');
        const premiumOverlay = document.getElementById('premiumOverlay');
        const canvas = document.getElementById('weeklyActivityChart');
        if (!filterSelect) return;

        const cachedBitis = localStorage.getItem('premiumBitis_' + userId);
        const isPremium = cachedBitis && new Date().getTime() < parseInt(cachedBitis);

        async function reload() {
            const period = filterSelect.value;
            currentChartType = typeSelect ? typeSelect.value : 'total';

            if (period === 'all') {
                if (!isPremium) {
                    canvas?.classList.add('blurred-chart');
                    premiumOverlay?.classList.remove('hidden');
                } else {
                    canvas?.classList.remove('blurred-chart');
                    premiumOverlay?.classList.add('hidden');
                    await loadAllTimeActivityChart(userId, currentChartType);
                }
            } else {
                canvas?.classList.remove('blurred-chart');
                premiumOverlay?.classList.add('hidden');
                await loadActivityChart(userId, currentChartType);
            }
        }

        filterSelect.addEventListener('change', reload);
        if (typeSelect) typeSelect.addEventListener('change', reload);
    }

    async function loadAllTimeActivityChart(userId, type = currentChartType) {
        const client = getSupabase();
        if (!client) return;

        try {
            const { data: authData } = await client.auth.getUser();
            const user = authData?.user;
            if (!user) return;

            const startDate = new Date(user.created_at);
            const endDate = new Date();
            const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
            const monthlyTotals = {};

            let tempDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            while (tempDate <= endDate) {
                const label = `${monthNames[tempDate.getMonth()]} ${tempDate.getFullYear()}`;
                monthlyTotals[label] = 0;
                tempDate.setMonth(tempDate.getMonth() + 1);
            }

            const addMonthly = (rows, dateCol, countCol) => {
                rows.forEach(item => {
                    const d = new Date(item[dateCol]);
                    const label = `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
                    if (monthlyTotals[label] !== undefined) monthlyTotals[label] += Number(item[countCol]) || 0;
                });
            };

            if (type === 'quiz' || type === 'total') {
                const { data } = await client.from('quiz_history').select('quiz_date, quiz_count').eq('user_id', userId);
                addMonthly(data || [], 'quiz_date', 'quiz_count');
            }
            if (type === 'code' || type === 'total') {
                const { data } = await client.from('code_history').select('code_date, code_count').eq('user_id', userId);
                addMonthly(data || [], 'code_date', 'code_count');
            }

            renderChart(Object.keys(monthlyTotals), Object.values(monthlyTotals), chartLabelFor(type));

        } catch (err) {
            console.error("Aylıq statistika xətası:", err.message);
        }
    }

    setTimeout(async () => {
        const client = getSupabase();
        if (!client) return;

        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const currentUserId = user.id;

        loadUserDashboard(currentUserId);
        loadActivityChart(currentUserId);
        loadLeaderboard(currentUserId);
        handleChartFilterChange(currentUserId);

    }, 100);
}
// ---------------------- PROFILE PAGE ----------------------
if (window.location.pathname.includes("profile.html")) {
    const supabaseUrl = 'https://xoebhhdirsvjorjlrfzi.supabase.co';
    const supabaseKey = 'sb_publishable_FpT1VBCd5NKEnrYQbmx9Gw_MqWxVMvN';
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    document.addEventListener("DOMContentLoaded", async () => {
        // 1. İstifadəçi məlumatlarını Supabase-dən çəkirik
        const { data: { user }, error } = await supabaseClient.auth.getUser();

        if (error || !user) {
            // Əgər istifadəçi giriş etməyibsə, login səhifəsinə atırıq
            window.location.href = "login.html";
            return;
        }

        // 2. HTML-dəki inputları tapırıq və dəyərləri içinə yazırıq
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const createdAtText = document.getElementById('createdat');

        if (usernameInput) usernameInput.value = user.user_metadata?.full_name || "";
        if (emailInput) emailInput.value = user.email || "";
        if (passwordInput) passwordInput.value = "********"; // Şifrə gizli qalmalıdır
        if (createdAtText && user.created_at) {
            const createdDate = new Date(user.created_at);
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            createdAtText.textContent = createdDate.toLocaleDateString('az-AZ', options);
        }
        // ==========================================
        // 3. ABUNƏLİK YOXLANIŞI VƏ EKRANA YAZDIRILMASI
        // ==========================================
        const abunelikBg = document.querySelector('.abunelik-bg');
        const premiumBg = document.querySelector('.premium-abunelik-bg');
        const premiumText = document.querySelector('#premium-text p');
        const bitmeTarixi = document.getElementById('bitme-tarixi');

        const { data: abuneData, error: abuneError } = await supabaseClient
            .from('abunelikler')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(); // Həmin istifadəçinin sətirini tapırıq

        if (abuneData) {
            const indi = new Date();
            const bitis = new Date(abuneData.bitis_tarixi);
            // Əgər vaxtı hələ bitməyibsə
            if (indi < bitis) {

                if (abunelikBg) abunelikBg.style.display = 'none';
                if (premiumBg) premiumBg.style.display = 'flex'; // və ya sizin css necə tələb edirsə

                // Planın adını və bitiş tarixini yaz
                if (premiumText) premiumText.textContent = abuneData.plan_adi;

                // Tarixi qəşəng və anlaşılan formata salırıq (məs: 20 Mart 2026)
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                if (bitmeTarixi) bitmeTarixi.textContent = bitis.toLocaleDateString('az-AZ', options);
            } else {
                abunelikBg.style.display = "flex"
            }
        } else {
            if (abunelikBg) abunelikBg.style.display = 'flex';
            if (premiumBg) premiumBg.style.display = 'none';
        }
        // ==========================================
        // DƏYİŞDİRMƏ MODALI (E-poçt və Şifrə üçün)
        // ==========================================
        // 1. Modalı açan funksiya
        window.openChangeFrame = function (type) {
            if (type === 'password') {
                // Şifrə üçün əvvəlcə e-poçtu təsdiqləməyə yönləndiririk
                openPasswordResetStep1();
            } else {
                // E-poçt dəyişmə köhnə qaydada qalır (link ilə)
                const modalHTML = `
                    <h2>E-poçtu yenilə</h2>
                    <p style="font-size: 14px; opacity: 0.8; margin-bottom: 15px;">Yeni e-poçt ünvanınızı daxil edin. Təsdiq linki göndəriləcək.</p>
                    <div class="input-group">
                        <label>Yeni e-poçt</label>
                        <input type="email" id="newActionValue" placeholder="yeni@mail.com">
                    </div>
                    <div class="action-buttons">
                        <button class="btn-cancel" onclick="closeActionModal()">Ləğv et</button>
                        <button class="btn-continue" id="modalSubmitBtn" onclick="submitChange('email')">Təsdiqlə</button>
                    </div>
                `;
                openActionModal(modalHTML);
            }
        };

        // 2. Şifrə dəyişmənin 1-ci mərhələsi: OTP göndərmək
        async function openPasswordResetStep1() {
            const { data: { user } } = await supabaseClient.auth.getUser();
            const email = user.email;

            const modalHTML = `
                <h2>Şifrəni yenilə</h2>
                <p style="font-size: 14px; opacity: 0.8; margin-bottom: 15px;">
                    Şifrəni dəyişmək üçün <b>${email}</b> ünvanına təsdiq kodu göndərilməlidir.
                </p>
                <div class="action-buttons">
                    <button class="btn-cancel" onclick="closeActionModal()">Ləğv et</button>
                    <button class="btn-continue" id="sendOtpBtn" onclick="sendProfileOtp('${email}')">Kod Göndər</button>
                </div>
            `;
            openActionModal(modalHTML);
        }

        // 3. OTP göndər və 2-ci mərhələyə keç
        window.sendProfileOtp = async function (email) {
            const btn = document.getElementById("sendOtpBtn");
            btn.textContent = "Göndərilir...";
            btn.disabled = true;

            const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

            if (error) {
                await showMessage("Xəta: " + error.message);
                btn.disabled = false;
                btn.textContent = "Kod Göndər";
            } else {
                showProfileOtpEntry(email);
            }
        };

        // 4. OTP və Yeni Şifrə daxil etmə modalı
        function showProfileOtpEntry(email) {
            const modalContent = document.getElementById("actionModalContent");
            modalContent.innerHTML = `
                <h2>Təsdiqləmə</h2>
                <p style="font-size: 14px; opacity: 0.8; margin-bottom: 15px;">E-poçtunuza gələn kodu və yeni şifrəni daxil edin.</p>
                <div class="input-group">
                    <label>OTP Kod</label>
                    <input type="text" id="otpCodeInput" placeholder="12345678" maxlength="8">
                </div>
                <div class="input-group">
                    <label>Yeni Şifrə</label>
                    <input type="password" id="newProfilePassword" placeholder="Ən azı 8 simvol">
                </div>
                <div class="action-buttons">
                    <button class="btn-cancel" onclick="closeActionModal()">Ləğv et</button>
                    <button class="btn-continue" id="finalSubmitBtn" onclick="verifyAndFinish('${email}')">Yenilə</button>
                </div>
            `;
        }

        // 5. Kodu yoxla və bitir
        window.verifyAndFinish = async function (email) {
            const token = document.getElementById("otpCodeInput").value.trim();
            const password = document.getElementById("newProfilePassword").value.trim();
            const btn = document.getElementById("finalSubmitBtn");

            if (token.length < 8 || password.length < 6) {
                await showMessage("Kod və şifrə tam doldurulmalıdır!");
                return;
            }

            btn.textContent = "Gözləyin...";
            btn.disabled = true;

            // Kodu yoxlayırıq
            const { error: verifyError } = await supabaseClient.auth.verifyOtp({
                email,
                token,
                type: 'recovery'
            });

            if (verifyError) {
                await showMessage("Kod yanlışdır!");
                btn.disabled = false;
                btn.textContent = "Yenilə";
            } else {
                // Şifrəni yeniləyirik
                const { error: updateError } = await supabaseClient.auth.updateUser({ password });

                closeActionModal();
                if (updateError) {
                    await showMessage("Xəta: " + updateError.message);
                } else {
                    await showMessage("Şifrəniz uğurla yeniləndi!");
                }
            }
        };
        // ==========================================
        // DƏYİŞİKLİKLƏRİ SAXLA (Yalnız Ad üçün)
        // ==========================================
        const saveBtn = document.querySelector('.btn-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const newName = usernameInput.value.trim();

                if (!newName) {
                    await showMessage("İstifadəçi adı boş ola bilməz!");
                    return;
                }

                const originalText = saveBtn.textContent;
                saveBtn.textContent = "Saxlanılır...";
                saveBtn.disabled = true;

                // Adı metadata kimi yeniləyirik
                const { data, error } = await supabaseClient.auth.updateUser({
                    data: { full_name: newName }
                });

                saveBtn.textContent = originalText;
                saveBtn.disabled = false;

                if (error) {
                    await showMessage("Xəta: " + error.message);
                } else {
                    await showMessage("Profil məlumatlarınız uğurla yadda saxlanıldı!", "showMessage", "Tamam");
                }
            });
        }

        // ==========================================
        // HESABDAN ÇIX (Logout)
        // ==========================================
        const logoutBtn = document.querySelector('.btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                // Sizin yaratdığınız "confirm" tipli showMessage ilə soruşuruq
                const isConfirmed = await showMessage("Hesabdan çıxmaq istədiyinizə əminsiniz?", "confirm");

                if (isConfirmed) {
                    await supabaseClient.auth.signOut();
                    window.location.href = "login.html";
                }
            });
        }

        // ==========================================
        // HESABI SİL (Supabase Cədvəlinə Yazmaq - Spam qorumalı)
        // ==========================================
        const deleteBtn = document.querySelector('.btn-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                const isConfirmed = await showMessage("Hesabınızı silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz!", "confirm");

                if (isConfirmed) {
                    deleteBtn.textContent = "Yoxlanılır...";
                    deleteBtn.disabled = true;

                    const userEmail = user.email;

                    // 1. Əvvəlcə yoxlayırıq: Bu e-poçt artıq cədvəldə varmı?
                    const { data: existingData, error: checkError } = await supabaseClient
                        .from('hesab_silme_telebleri')
                        .select('email')
                        .eq('email', userEmail); // Cədvəldəki 'email' sütunu istifadəçinin e-poçtuna bərabər olanları tap

                    if (checkError) {
                        await showMessage("Sorğu yoxlanılarkən xəta baş verdi: " + checkError.message);
                        deleteBtn.textContent = "Hesabı sil";
                        deleteBtn.disabled = false;
                        return;
                    }

                    // 2. Əgər data içində nəticə varsa, deməli artıq müraciət edib
                    if (existingData && existingData.length > 0) {
                        await showMessage("Sizin hesab silmə istəyiniz artıq qeydə alınıb və hazırda icra olunur.", "showMessage", "Tamam");
                        deleteBtn.textContent = "Hesabı sil";
                        deleteBtn.disabled = false;
                        return; // funksiyanı buradaca dayandırırıq ki, yenidən bazaya yazmasın
                    }

                    // 3. Əgər əvvəllər müraciət etməyibsə, cədvələ yeni sorğu kimi əlavə edirik
                    deleteBtn.textContent = "Göndərilir...";

                    const { error: insertError } = await supabaseClient
                        .from('hesab_silme_telebleri')
                        .insert([
                            { email: userEmail }
                        ]);

                    if (insertError) {
                        await showMessage("Sorğu göndərilərkən xəta baş verdi: " + insertError.message);
                        deleteBtn.textContent = "Hesabı sil";
                        deleteBtn.disabled = false;
                        return;
                    }

                    // Uğurla yazıldıqdan sonra istifadəçiyə yekun mesajı veririk
                    await showMessage("Hesab silmə tələbiniz qeydə alındı. 1 həftə içərisində hesabınız tamamilə silinəcək.", "showMessage", "Tamam");

                    // Sistemdən çıxış edib login-ə atırıq
                    await supabaseClient.auth.signOut();
                    window.location.href = "login.html";
                }
            });
        }

    });
}
// ---------------------- PREMIUM PAGE ----------------------
if (window.location.pathname.includes("premium.html")) {
    const supabaseUrl = 'https://xoebhhdirsvjorjlrfzi.supabase.co';
    const supabaseKey = 'sb_publishable_FpT1VBCd5NKEnrYQbmx9Gw_MqWxVMvN';
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

    // --- 1. SƏHİFƏ AÇILANDA ABUNƏLİYİ YOXLA VƏ DÜYMƏLƏRİ KİLİDLƏ ---
    // DOMContentLoaded əvəzinə xüsusi asinxron funksiya yaradıb dərhal çağırırıq
    async function checkActivePlan() {
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (user) {
            const { data: abuneData } = await supabaseClient
                .from('abunelikler')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (abuneData) {
                const indi = new Date();
                const bitis = new Date(abuneData.bitis_tarixi);

                if (indi < bitis) {
                    // Bütün premium düymələrini tapırıq
                    const freePlanBtn = document.querySelector('.plan-free .btn-plan-current');
                    if (freePlanBtn) {
                        freePlanBtn.textContent = "Mövcud planınız var";
                        freePlanBtn.style.opacity = "0.5"
                    }
                    const btns = document.querySelectorAll('.btn-plan-active');

                    btns.forEach(btn => {
                        // Əgər bu düymə istifadəçinin aldığı plandırsa:
                        if (btn.getAttribute('onclick').includes(abuneData.plan_adi)) {
                            btn.textContent = "Aktivdir";
                            btn.disabled = true;
                            btn.style.backgroundColor = "#4CAF50"; // Yaşıl rəng
                            btn.style.cursor = "default";
                        }
                        // Digər planlardırsa:
                        else {
                            btn.textContent = "Mövcud planınız var";
                            btn.disabled = true;
                            btn.style.opacity = "0.5";
                            btn.style.cursor = "not-allowed";
                        }
                    });
                }
            }
        }
    }

    // Funksiyanı dərhal işə salırıq
    checkActivePlan();

    // --- YENİLƏNMİŞ: WhatsApp-a Yönləndirmə Funksiyası ---
    window.activatePlan = async function (planAdi, qiymet) {
        // 1. Azərbaycan nömrə formatı (Arada boşluq və ya + işarəsi olmadan 12 rəqəm)
        const phoneNumber = "994776247077"; // <-- Öz real nömrənlə əvəzlə

        let userEmail = "";
        try {
            // 2. Supabase-dən daxil olmuş istifadəçinin məlumatlarını alırıq
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user && user.email) {
                userEmail = user.email;
            }
        } catch (error) {
            console.error("İstifadəçi məlumatı alınarkən xəta:", error);
        }

        // 3. Mesaj şablonu (Email varsa mesaja daxil edilir)
        let rawMessage = `Salam, mən AtlasLab.az saytından ${planAdi} (${qiymet} AZN) premium planını almaq istəyirəm.`;
        
        if (userEmail) {
            rawMessage += ` Qeydiyyat emailim: ${userEmail}`;
        }

        // 4. URL üçün kodlaşdırma
        const encodedMessage = encodeURIComponent(rawMessage);
        
        // 5. WhatsApp rəsmi Click-to-Chat linki
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        // 6. Linki yeni tabda açırıq
        window.open(whatsappUrl, '_blank');
    };
}