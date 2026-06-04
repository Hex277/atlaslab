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
    const telebeMenu = document.getElementById('telebe-menu');
    if (telebeMenu && telebeMenu.previousElementSibling) {
        telebeMenu.classList.add('open');
        telebeMenu.previousElementSibling.querySelector('.arrow').textContent = 'v';
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

// ---------------------- FENNLER MENU ----------------------
if (window.location.pathname.endsWith("fennler-menu.html")) {
    const container = document.getElementById("subjects-bg");
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");

    const filterContainer = document.getElementById("filter-container");
    const uniSelect = document.getElementById("university-select");
    const facultySelect = document.getElementById("faculty-select");

    const infoModal = document.getElementById("infoModal");
    const infoModalText = document.getElementById("infoModalText");
    const closeInfoModal = document.getElementById("closeInfoModal");
    let allSubjects = []; // Bütün fənnləri burada saxlayacağıq
    let globalSubjects = []; // Yalnız qlobal fənnlərin ID-lərini saxlamaq üçün (Info modalı üçün lazımdır)
    let universitiesData = {};
    let searchTimeout = null;
    fetch("subjects.json")
        .then(response => response.json())
        .then(data => {
            const global = data.subject_pool.global_subjects || [];
            const special = data.subject_pool.special_subjects || [];
            universitiesData = data.universities || {};

            // Global fənnlərin ID-lərini yadda saxlayaq (Reverse lookup üçün)
            globalSubjects = global.map(s => s.id);

            allSubjects = [...global, ...special].sort((a, b) =>
                a.title.localeCompare(b.title, 'az')
            );
            
            // Əgər universitet datası varsa, filteri göstər və doldur
            if (Object.keys(universitiesData).length > 0) {
                filterContainer.style.display = "flex";
                populateUniversities();
            }

            renderSubjects(allSubjects);
        })
        .catch(error => console.error("JSON Error:", error));
    function populateUniversities() {
        for (const uniKey in universitiesData) {
            const option = document.createElement("option");
            option.value = uniKey;
            option.textContent = universitiesData[uniKey].name;
            uniSelect.appendChild(option);
        }
    }

    uniSelect.addEventListener("change", function() {
        const selectedUni = this.value;
        
        // Fakültə select-ini sıfırla
        facultySelect.innerHTML = '<option value="">-- Fakültə Seçin --</option>';
        facultySelect.disabled = true;

        if (selectedUni && universitiesData[selectedUni]) {
            const faculties = universitiesData[selectedUni].faculties;
            for (const facKey in faculties) {
                const option = document.createElement("option");
                option.value = facKey;
                option.textContent = faculties[facKey].name;
                facultySelect.appendChild(option);
            }
            facultySelect.disabled = false;
        }

        applyFilters(); // Universitet dəyişəndə filteri yenilə
    });

    facultySelect.addEventListener("change", applyFilters);

    function applyFilters() {
        const selectedUni = uniSelect.value;
        const selectedFac = facultySelect.value;
        const searchTerm = searchInput.value.toLowerCase().trim();

        let filtered = allSubjects;

        // 1. Dropdown filteri
        if (selectedUni && selectedFac) {
            // Seçilmiş fakültənin icazə verilən fənn ID-lərini alırıq
            const assignedIds = universitiesData[selectedUni].faculties[selectedFac].assigned_subjects || [];
            
            // Fənn siyahısını bu ID-lərə görə süzürük
            filtered = allSubjects.filter(subject => assignedIds.includes(subject.id));
        }

        // 2. Axtarış filteri (Mövcud axtarış məntiqin)
        if (searchTerm !== "") {
            filtered = filtered.filter(subject => isMatch(subject.title, searchTerm));
        }

        renderSubjects(filtered);
    }
    function isMatch(text, query) {
        text = text.toLowerCase();
        query = query.toLowerCase();

        // Əgər yazı fənnin daxilində varsa, dərhal tap
        if (text.includes(query)) return true;

        // Əgər axtarış sözü çox qısadırsa (3 hərfdən az), səhvə icazə vermə
        if (query.length < 3) return false;

        // Dinamik səhv limiti: Hər 4 hərfə 1 səhv icazə verək (maksimum 3)
        const allowedMistakes = Math.min(3, Math.floor(query.length / 3));

        let mistakes = 0;
        let j = 0;
        for (let i = 0; i < query.length; i++) {
            if (j < text.length && query[i] === text[j]) {
                j++;
            } else {
                mistakes++;
            }
        }

        return mistakes <= allowedMistakes;
    }
    function renderSubjects(data) {
        if (!data || data.length === 0) {
            container.innerHTML = `<p style="width:100%; text-align:center; color:#666; grid-column: 1 / -1;">Heç bir nəticə tapılmadı.</p>`;
            return;
        }

        container.innerHTML = data.map((subject, index) => {
            
            let facultyText = "";
            
            // 1. Qlobal fənn yoxlanışı
            if (globalSubjects.includes(subject.id)) {
                facultyText = "Ümumi (Bütün fakültələr)";
            } else {
                // 2. Canlı axtarış (İnfo düyməsində olduğu kimi)
                let foundFaculties = [];
                for (const uniKey in universitiesData) {
                    const faculties = universitiesData[uniKey].faculties;
                    for (const facKey in faculties) {
                        const assigned = faculties[facKey].assigned_subjects || [];
                        if (assigned.includes(subject.id)) {
                            // Burada ancaq fakültə adlarını yığırıq (çünki kartın üstündə çox uzun yer tutmasın)
                            foundFaculties.push(faculties[facKey].name);
                        }
                    }
                }

                // Əgər tapıldılarsa, onları vergüllə birləşdir
                if (foundFaculties.length > 0) {
                    facultyText = foundFaculties.map(name => {
                        const cleanName = name
                            .replace(/fakültəsi/gi, '') 
                            .replace(/və/gi, '')
                            .trim();
                        return cleanName
                            .split(/\s+/) // Birdən çox boşluq olsa belə bölür
                            .filter(word => word.length > 0) // Boş sözləri təmizləyir
                            .map(word => word.charAt(0).toUpperCase())
                            .join('');
                    }).join(", ");
                } else {
                    facultyText = "Fakültə təyin edilməyib";
                }
            }

            return `
                <div class="subject-card animate-card" 
                    onclick="startQuiz('${subject.id}')"
                    style="animation-delay: ${index * 0.05}s">
                    
                    <div class="info-btn" onclick="showSubjectInfo(event, '${subject.id}', '${subject.title}')">i</div>
                    
                    <div class="card-icon">${subject.icon}</div>
                    <div class="card-title">${subject.title}</div>
                    
                    <!-- Fakültə ad(lar)ı kartın üstündə yazılır -->
                    <div class="card-faculty">${facultyText}</div>
                    
                    <div class="card-meta">${subject.count} sual • Hər gün yenilənir</div>
                    <div class="card-arrow">→</div>
                </div>
            `;
        }).join("");
    }
    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        // Əgər köhnə taymer varsa, onu ləğv et
        clearTimeout(searchTimeout);

        // Yeni taymer başlat (istifadəçi 300ms susanda işləyəcək)
        searchTimeout = setTimeout(() => {
            if (searchTerm === "") {
                renderSubjects(allSubjects);
                return;
            }

            const filteredSubjects = allSubjects.filter(subject =>
                isMatch(subject.title, searchTerm)
            );

            renderSubjects(filteredSubjects);
        }, 300); // Gecikmə müddəti
    });

    // "Axtar" düyməsi üçün də (əlavə olaraq)
    searchButton.addEventListener("click", () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredSubjects = allSubjects.filter(subject =>
            subject.title.toLowerCase().includes(searchTerm)
        );
        renderSubjects(filteredSubjects);
    });

    window.startQuiz = function (subjectId) {
        window.location.href = `quiz.html?subject=${subjectId}`;
    };  
    window.showSubjectInfo = function(event, subjectId, subjectTitle) {
        event.stopPropagation(); // Kartın kliklənməsinin (startQuiz) qarşısını alır

        // 1. Qlobal fənn yoxlanışı
        if (globalSubjects.includes(subjectId)) {
            infoModalText.innerHTML = `<strong>${subjectTitle}</strong><br><br>Bu qlobal fəndir və universitet/fakültədən asılı olmayaraq hər kəs üçün keçərlidir.`;
            infoModal.style.display = "flex";
            return;
        }

        // 2. Spesifik fənn yoxlanışı (Bütün aid olduğu yerləri tapmaq üçün)
        let foundList = [];
        
        for (const uniKey in universitiesData) {
            const faculties = universitiesData[uniKey].faculties;
            for (const facKey in faculties) {
                const assigned = faculties[facKey].assigned_subjects || [];
                if (assigned.includes(subjectId)) {
                    // Tapılan hər bir müəssisə və fakültəni siyahıya (Array) əlavə edirik
                    foundList.push(`<li style="margin-bottom: 8px;"><span style="color:#B89A5A; font-weight:bold;">${universitiesData[uniKey].name}</span> - ${faculties[facKey].name}</li>`);
                }
            }
        }

        // Əgər siyahıda nəsə varsa, hamısını alt-alta (<ul><li>) çap edirik
        if (foundList.length > 0) {
            infoModalText.innerHTML = `<strong>${subjectTitle}</strong><br><br>Bu fənn aşağıdakı müəssisə və fakültələrdə tədris olunur:<br>
                <ul style="text-align: left; margin-top: 15px; padding-left: 20px; font-size: 14px;">
                    ${foundList.join("")}
                </ul>`;
        } else {
            infoModalText.innerHTML = `<strong>${subjectTitle}</strong><br><br>Bu fənn hələ heç bir fakültəyə təyin edilməyib.`;
        }

        infoModal.style.display = "flex";
    };

    // Modalı bağlamaq üçün
    closeInfoModal.addEventListener("click", () => {
        infoModal.style.display = "none";
    });

    // Modaldan kənara klikləyəndə bağlansın
    window.addEventListener("click", (e) => {
        if (e.target === infoModal) {
            infoModal.style.display = "none";
        }
    });

    // --- GÜNDƏLİK LİMİT VƏ PREMİUM VİZUAL İDARƏETMƏSİ ---
    (async () => {
        try {
            const supabaseUrl = 'https://xoebhhdirsvjorjlrfzi.supabase.co';
            const supabaseKey = 'sb_publishable_FpT1VBCd5NKEnrYQbmx9Gw_MqWxVMvN';
            const client = window.supabase.createClient(supabaseUrl, supabaseKey);

            // 1. İstifadəçi sessiyasını əldə edirik
            const sessionStr = localStorage.getItem('sb-xoebhhdirsvjorjlrfzi-auth-token');
            if (!sessionStr) return; // Funksiya daxilində olduğu üçün burada return xəta vermir

            const userData = JSON.parse(sessionStr).user;
            const uId = userData.id;

            // 2. Elementləri seçirik
            const display = document.getElementById('limit-text');
            const energyIcon = document.getElementById('energy-icon');

            // 3. Premium yoxlanışı
            const cachedBitis = localStorage.getItem('premiumBitis_' + uId);
            const isPremium = cachedBitis && new Date().getTime() < parseInt(cachedBitis);

            if (isPremium) {
                // Premium vizualları
                if (energyIcon) energyIcon.src = "../images/premium-thunder.webp";
                if (display) display.innerHTML = `<img src="../images/infinity.webp" alt="∞" style="width: 18px; vertical-align: middle;">`;

                return; // Premiumdursa, aşağıdakı kodları icra etmə və funksiyadan çıx
            }

            // 4. Standart istifadəçi üçün bazadan limit məlumatını alırıq
            const today = new Date().toISOString().split('T')[0];
            const { data: stats } = await client
                .from('user_stats')
                .select('daily_limit_count, last_quiz_date')
                .eq('user_id', uId)
                .maybeSingle();

            const usedToday = (stats && stats.last_quiz_date === today) ? (Number(stats.daily_limit_count) || 0) : 0;
            const totalLimit = 3;
            const remainingLimit = Math.max(0, totalLimit - usedToday);

            // 5. Standart vizualları göstəririk
            if (display) display.innerText = remainingLimit;
            if (energyIcon) energyIcon.src = "../images/thunder.webp";

        } catch (err) {
            console.error("Limit bölməsində xəta yarandı:", err.message);
        }
    })(); // Funksiya burada bağlanır
}
// ---------------------- STATISTICS PAGE ----------------------
if (window.location.pathname.endsWith("statistics.html")) {

    let myChart = null;

    // Kliyenti hər dəfə təhlükəsiz şəkildə götürmək üçün köməkçi funksiya
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

    async function loadActivityChart(userId) {
        const client = getSupabase();
        if (!client) return;

        // 1. Bazar ertəsindən Bazara qədər olan etiketlər
        const fixedLabels = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'];

        // Bütün günlər üçün başlanğıc dəyəri 0 qoyuruq (0 xətti görünsün deyə)
        let countsData = [0, 0, 0, 0, 0, 0, 0];

        // 2. Bu həftənin Bazar ertəsinin tarixini tapırıq
        const now = new Date();
        // getDay(): 0=Bazar, 1=B.e... Bazar gününü 7 kimi qəbul edirik ki, geriyə hesablaya bilək
        const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

        const monday = new Date(now);
        monday.setDate(now.getDate() - currentDayOfWeek + 1); // Bazar ertəsinə qayıdırıq

        const startOfWeekStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

        // 3. Bazar ertəsindən sonrakı (bu həftəki) dataları çəkirik
        const { data, error } = await client
            .from('quiz_history')
            .select('quiz_date, quiz_count')
            .eq('user_id', userId)
            .gte('quiz_date', startOfWeekStr);

        if (error) {
            console.error("Chart data error:", error);
            return;
        }

        // 4. Əgər data varsa, onu sabit günlərə yerləşdiririk
        if (data && data.length > 0) {
            data.forEach(item => {
                const parts = item.quiz_date.split('-');
                const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

                // Həftənin hansı günüdür? (0=Bazar, 1=B.e)
                let dayIndex = dateObj.getDay();
                // JS-də Bazar(0) olduğu üçün onu 6 edirik, qalanları 1 çıxırıq (B.e(1) -> 0 olur)
                dayIndex = (dayIndex === 0) ? 6 : dayIndex - 1;

                // Həmin günün sayını massivə yazırıq
                countsData[dayIndex] = item.quiz_count;
            });
        }
        renderChart(fixedLabels, countsData);
    }
    async function loadLeaderboard(currentUserId) {
        const client = getSupabase();
        if (!client) return;

        const { data, error } = await client
            .from('user_stats')
            .select('*')
            .order('elo_rating', { ascending: false })
            .limit(10);

        if (error || !data) return;

        const tbody = document.getElementById('leaderboardBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        data.forEach((row, index) => {
            const accuracy = row.total_answered_questions > 0
                ? Math.round((row.total_correct_answers / row.total_answered_questions) * 100)
                : 0;

            const isMe = row.user_id === currentUserId;
            let nameToShow = row.display_name || 'İstifadəçi #' + row.user_id.slice(0, 5);
            // YENİLİK: Əgər bazada ad varsa onu, yoxdursa ID-ni göstər
            const displayName = isMe ? `${nameToShow} (Siz)` : nameToShow;
            tbody.innerHTML += `
                <tr class="${isMe ? 'current-user' : ''}" style="${isMe ? 'background: rgba(234, 207, 30, 0.077);' : ''}">
                    <td>${index + 1}</td>
                    <td>${displayName}</td> 
                    <td>${row.elo_rating || 1000}</td>
                    <td>${accuracy}%</td>
                </tr>
            `;
        });
    }

    function renderChart(labels, counts) {
        const canvas = document.getElementById('weeklyActivityChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (typeof myChart !== 'undefined' && myChart) {
            myChart.destroy();
        }

        // DÜZƏLİŞ: Dark Mode-u düzgün təyin edirik
        const isDarkMode = document.body.classList.contains('dark-theme') || document.body.classList.contains('dark-mode');

        // Tünd moddasa ağ yazılar, işıqlı moddasa tünd boz yazılar
        const labelColor = isDarkMode ? '#ffffff' : '#333333';
        // Arxadakı xətlərin rəngini də modlara uyğunlaşdırırıq
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quiz Sayı',
                    data: counts,
                    borderColor: '#B89A5A',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    tension: 0,
                    pointRadius: 4,
                    pointBackgroundColor: '#B89A5A',
                    pointHoverRadius: 6 // Üzərinə gəldikdə dairənin bir az böyüməsi üçün (opsional)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Div-ə görə formalaşması üçün

                // YENİ ƏLAVƏ EDİLƏN HİSSƏ:
                interaction: {
                    mode: 'index',
                    intersect: false, // Mütləq kəsişmə tələbini ləğv edir
                },

                plugins: {
                    legend: { display: false }
                    // İstəyə görə hover olduqda şaquli bir xətt çəkmək üçün tooltip ayarlarını da burdan genişləndirə bilərsiniz
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: labelColor,
                            stepSize: 1
                        },
                        grid: { color: gridColor } // Şəbəkə rəngini dinamik etdik
                    },
                    x: {
                        ticks: {
                            color: labelColor
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }
    async function handleChartFilterChange(userId) {
        const filterSelect = document.getElementById('chart-filter-select');
        const premiumOverlay = document.getElementById('premiumOverlay');
        const canvas = document.getElementById('weeklyActivityChart');

        if (!filterSelect) return;

        // Sənin localStorage üzərindəki premium yoxlanışın
        const cachedBitis = localStorage.getItem('premiumBitis_' + userId);
        const isPremium = cachedBitis && new Date().getTime() < parseInt(cachedBitis);

        filterSelect.addEventListener('change', async (e) => {
            const selectedValue = e.target.value;

            if (selectedValue === 'all') {
                if (!isPremium) {
                    // Premium deyilsə: Bluru göstər
                    canvas?.classList.add('blurred-chart');
                    premiumOverlay?.classList.remove('hidden');
                } else {
                    // Premiumdursa: Bluru qaldır və məlumatları yüklə
                    canvas?.classList.remove('blurred-chart');
                    premiumOverlay?.classList.add('hidden');
                    await loadAllTimeActivityChart(userId);
                }
            } else {
                // Həftəlik seçim: Standart vəziyyət
                canvas?.classList.remove('blurred-chart');
                premiumOverlay?.classList.add('hidden');
                await loadActivityChart(userId);
            }
        });
    }
    async function loadAllTimeActivityChart(userId) {
        const client = window.globalSupabaseClient || window.supabaseClient;
        if (!client) return;

        try {
            // 1. Məlumatları çəkirik
            const [{ data: authData }, { data: historyData, error }] = await Promise.all([
                client.auth.getUser(),
                client.from('quiz_history').select('quiz_date, quiz_count').eq('user_id', userId)
            ]);

            if (error) throw error;
            const user = authData?.user;
            if (!user) return;

            const startDate = new Date(user.created_at);
            const endDate = new Date();
            const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

            const monthlyTotals = {};

            // 2. Qrafik üçün ayları hazırlayırıq (Boş aylar 0 olaraq qalır)
            let tempDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            while (tempDate <= endDate) {
                const label = `${monthNames[tempDate.getMonth()]} ${tempDate.getFullYear()}`;
                monthlyTotals[label] = 0;
                tempDate.setMonth(tempDate.getMonth() + 1);
            }

            // 3. Tarixçəni hesablayırıq
            if (historyData) {
                historyData.forEach(item => {
                    // UTC istifadə edərək vaxt zonası sürüşməsinin qarşısını alırıq
                    const d = new Date(item.quiz_date);
                    const monthIndex = d.getUTCMonth();
                    const year = d.getUTCFullYear();
                    const label = `${monthNames[monthIndex]} ${year}`;

                    if (monthlyTotals[label] !== undefined) {
                        monthlyTotals[label] += Number(item.quiz_count);
                    }
                });
            }

            // DEBUG: Konsolda yoxlayaq görək cəmi neçə tapdı
            console.log("Aylıq hesablamalar:", monthlyTotals);
            const totalInChart = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
            console.log("Chart-dakı cəmi quiz sayı:", totalInChart);

            // 4. Chart-ı render edirik
            renderChart(Object.keys(monthlyTotals), Object.values(monthlyTotals));

        } catch (err) {
            console.error("Aylıq statistika xətası:", err.message);
        }
    }
    // ƏSAS İŞƏSALMA
    setTimeout(async () => {
        const client = getSupabase();
        if (!client) return;

        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const currentUserId = user.id;

        // Sənin mövcud yükləmələrin
        loadUserDashboard(currentUserId);
        loadActivityChart(currentUserId); // Default olaraq həftəlik yüklənir
        loadLeaderboard(currentUserId);

        // YENİ: Filtr dəyişikliyini dinləyən funksiyanı çağırırıq
        handleChartFilterChange(currentUserId);

    }, 100);
}
// ---------------------- QUIZ PAGE ----------------------
if (window.location.pathname.endsWith("quiz.html")) {
    const supabaseUrl = 'https://xoebhhdirsvjorjlrfzi.supabase.co';
    const supabaseKey = 'sb_publishable_FpT1VBCd5NKEnrYQbmx9Gw_MqWxVMvN';
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    document.addEventListener("DOMContentLoaded", async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const subjectId = urlParams.get('subject');
        const currentSubjectId = urlParams.get('subject') || 'default';
        if (!subjectId) {
            console.error("No subject provided!");
            return;
        }
        // ==========================================
        // 1. AUTH VƏ GÜNDƏLİK LİMİT YOXLANIŞI
        // ==========================================

        // Sürətli olması üçün istifadəçi ID-sini birbaşa token-dən çəkirik
        const sbSessionStr = localStorage.getItem('sb-xoebhhdirsvjorjlrfzi-auth-token');
        if (!sbSessionStr) {
            const authHTML = `
                <div style="text-align: center;">
                    <h3 style="color: #B89A5A;">Giriş lazımdır</h3>
                    <p>Sual işləmək üçün zəhmət olmasa hesabınıza daxil olun.</p>
                </div>
            `;

            showMessage(authHTML, "alert", "Daxil ol").then(() => {
                window.location.href = "login.html";
            });

            return;
        }

        const userId = JSON.parse(sbSessionStr).user.id;
        const currentSessionId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('active_session_id', currentSessionId);

        async function syncSession() {
            const sbToken = localStorage.getItem('sb-xoebhhdirsvjorjlrfzi-auth-token');
            if (!sbToken) return;

            const uId = JSON.parse(sbToken).user.id;
            const sId = localStorage.getItem('active_session_id');

            // MÜHÜM: Update sorğusunda 'id' sütununa uyğunlaşırıq
            const { data, error } = await supabaseClient
                .from('user_stats')
                .update({ "last_session_id": sId }) // Sütun adını dırnaqda yazmaq bəzən xətanın qarşısını alır
                .match({ 'user_id': uId }); // .eq() yerinə .match() daha dəqiqdir

            if (error) {
                console.error("Supabase xətası:", error.message);
            }
        }

        syncSession();

        // Premium yoxlanışı
        const cachedBitis = localStorage.getItem('premiumBitis_' + userId);
        const isPremium = cachedBitis && new Date().getTime() < parseInt(cachedBitis);

        // --- LİMİT YOXLAMA MƏNTİQİ ---
        if (!isPremium) {
            // 1. Cari tarixi lokal vaxtla alırıq (YYYY-MM-DD formatında)
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            let { data: stats } = await supabaseClient
                .from('user_stats')
                .select('daily_limit_count, last_quiz_date')
                .eq('user_id', userId)
                .maybeSingle();

            if (stats && stats.last_quiz_date === today && (Number(stats.daily_limit_count) || 0) >= 3) {
                const limitHTML = `
                    <div style="text-align: center;">
                        <img src="../images/freeplanreminder.webp" alt="Limit" style="width: 200px; margin-bottom: 15px;">
                        <h3 style="margin-bottom: 10px; color: #B89A5A;">Gündəlik limit doldu!</h3>
                        <p style="font-size: 15px; opacity: 0.9;">
                            Pulsuz hesabla gündə yalnız <b>3 fənn</b> (30 sual) işləyə bilərsiniz.
                             Pulsuz hesabla gündə yalnız <b>3 fənn</b> (30 sual) işləyə bilərsiniz.
                       </p>
                    </div>
                `;

                // showMessage funksiyasını gözləyirik (await)
                const userChoice = await showMessage(limitHTML, "confirm", "İndi al", "Sonra");

                // Seçimə görə yönləndirmə
                if (userChoice) {
                    window.location.href = "premium.html";
                } else {
                    window.location.href = "fennler-menu.html";
                }
                return; // Funksiyadan çıxırıq ki, quiz başlamasın
            }
        }
        // --- AI YÜKLƏMƏ MƏNTİQİ ---
        if (isPremium) {
            const isMobile = window.innerWidth <= 768;
            const fakeBtn = document.getElementById('fake-ai-btn');

            if (isMobile) {
                // --- 📱 MOBİL REJİM (Üzən Buton - Solda) ---
                window.chtlConfig = { chatbotId: "3756376919" };
                const script = document.createElement('script');
                script.async = true;
                script.dataset.id = "3756376919";
                script.id = "chtl-script";
                script.type = "text/javascript";
                script.src = "https://chatling.ai/js/embed.js";
                document.body.appendChild(script);
                if (fakeBtn) fakeBtn.style.display = 'flex';
            } else {
                // --- 💻 DESKTOP REJİM (Səhifə İçi / Inline - Sağda) ---
                window.chtlConfig = { chatbotId: "9896744625", display: "page_inline" };

                // Animasiyanın rəvan işləməsi üçün keçid effekti veririk
                if (document.querySelector('.main-content')) {
                    document.querySelector('.main-content').style.transition = "all 0.4s ease-in-out";
                }

                // 1. Inline bot üçün div yaradırıq (Əgər HTML-də yoxdursa)
                let inlineContainer = document.getElementById('chtl-inline-bot');
                if (!inlineContainer) {
                    inlineContainer = document.createElement('div');
                    inlineContainer.id = "chtl-inline-bot";
                    inlineContainer.style.width = "30%";
                    inlineContainer.style.height = "calc(100vh - 61px)"; // Öncəki turn təyin etdiyimiz hündürlük
                    inlineContainer.style.position = "fixed";
                    inlineContainer.style.right = "0";
                    inlineContainer.style.top = "61px";
                    inlineContainer.style.zIndex = "1000";
                    inlineContainer.style.backgroundColor = "#fff";
                    inlineContainer.style.boxShadow = "-2px 0px 10px rgba(0,0,0,0.1)";

                    // Başlanğıcda bağlı (gizli) olsun ki, düyməyə basanda açılsın
                    inlineContainer.style.display = "none";
                    document.body.appendChild(inlineContainer);
                }

                // Buton ilə Açıb-Bağlama Məntiqi
                const openAiBtn = document.getElementById('open-ai-btn');
                if (openAiBtn) {
                    openAiBtn.onclick = function () {
                        let inlineContainer = document.getElementById('chtl-inline-bot');

                        if (inlineContainer.style.display === "none") {
                            // --- AI PƏNCƏRƏSİNİ AÇIRIQ ---
                            inlineContainer.style.display = "block";
                            document.querySelector('.main-content').style.width = "70%";
                            document.querySelector('.main-content').style.maxWidth = "none";
                            document.querySelector('.main-content').style.marginLeft = "0";
                            document.querySelector('.main-background').style.justifyContent = "flex-start";
                        } else {
                            // --- AI PƏNCƏRƏSİNİ BAĞLAYIRIQ VƏ APARAT ANIMASIYALI MƏRKƏZƏ QAYIDIR ---
                            inlineContainer.style.display = "none";
                            document.querySelector('.main-content').style.width = "95%";
                            document.querySelector('.main-content').style.maxWidth = "1200px";
                            document.querySelector('.main-background').style.justifyContent = "center";
                        }
                    };
                }

                // 2. Skripti dinamik yükləyirik və data-display parametrini veririk
                const script = document.createElement('script');
                script.async = true;
                script.dataset.id = "9896744625";
                script.dataset.display = "page_inline";
                script.id = "chtl-script";
                script.type = "text/javascript";
                script.src = "https://chatling.ai/js/embed.js";
                document.body.appendChild(script);

                if (fakeBtn) fakeBtn.style.display = 'none';
            }
        } else {
            const fakeBtn = document.getElementById('fake-ai-btn');
            if (fakeBtn) fakeBtn.style.display = 'none';

            const inlineContainer = document.getElementById('chtl-inline-bot');
            if (inlineContainer) inlineContainer.style.display = 'none';

            console.log("Qeyd: Pulsuz istifadəçilər üçün AI aktiv deyil.");
        }
        (async () => {
            // 1. Supabase Müştərisini təyin edirik (ReferenceError-un qarşısını almaq üçün)
            const supabaseUrl = 'https://xoebhhdirsvjorjlrfzi.supabase.co';
            const supabaseKey = 'sb_publishable_FpT1VBCd5NKEnrYQbmx9Gw_MqWxVMvN';
            const client = window.supabase.createClient(supabaseUrl, supabaseKey);

            try {
                // 2. İstifadəçi sessiyasını yoxlayırıq
                const sessionStr = localStorage.getItem('sb-xoebhhdirsvjorjlrfzi-auth-token');
                if (!sessionStr) return;
                const uId = JSON.parse(sessionStr).user.id;

                // 3. Bazadan stats məlumatını çəkirik (stats burada təyin olunur)
                const today = new Date().toISOString().split('T')[0];
                const { data: stats } = await client
                    .from('user_stats')
                    .select('daily_limit_count, last_quiz_date')
                    .eq('user_id', uId)
                    .maybeSingle();

                // 4. Sənin istifadə etdiyin dəyişən məntiqi
                let currentLimitInDb = (stats && stats.last_quiz_date === today) ? (Number(stats.daily_limit_count) || 0) : 0;

                // 5. Ekrana yazdırma
                const display = document.getElementById('limit-text');
                if (display) display.innerText = currentLimitInDb;

            } catch (err) {
                console.error("Limit göstərilərkən xəta:", err.message);
            }
        })();
        // ==========================================
        // 2. QUIZ MƏNTİQİ (Sizin köhnə kodunuz)
        // ==========================================
        // LocalStorage-dan cari fənnin səhvlərini gətirən köməkçi funksiya
        function getWrongQuestions(subjectId) {
            let wrongData = JSON.parse(localStorage.getItem("wrong_questions")) || {};
            return wrongData[subjectId] || [];
        }

        // Səhv cavab verəndə ID-ni əlavə edən funksiya
        function addWrongQuestion(subjectId, questionId) {
            let wrongData = JSON.parse(localStorage.getItem("wrong_questions")) || {};

            // Əgər bu fənn üçün hələ array yoxdursa, yarat
            if (!wrongData[subjectId]) {
                wrongData[subjectId] = [];
            }

            // Əgər bu ID artıq siyahıda yoxdursa, əlavə et
            if (!wrongData[subjectId].includes(questionId)) {
                wrongData[subjectId].push(questionId);
                localStorage.setItem("wrong_questions", JSON.stringify(wrongData));
            }
        }

        // Düzgün cavab verəndə ID-ni siyahıdan silən funksiya
        function removeWrongQuestion(subjectId, questionId) {
            let wrongData = JSON.parse(localStorage.getItem("wrong_questions")) || {};

            if (wrongData[subjectId]) {
                // ID-ni tap və array-dən çıxar
                wrongData[subjectId] = wrongData[subjectId].filter(id => id !== questionId);
                localStorage.setItem("wrong_questions", JSON.stringify(wrongData));
            }
        }
        fetch("subjects.json")
            .then(res => res.json())
            .then(data => {
                // Hər iki massivi (global və special) bir yerə toplayırıq
                const allSubjects = [
                    ...(data.subject_pool.global_subjects || []),
                    ...(data.subject_pool.special_subjects || [])
                ];

                const subject = allSubjects.find(s => s.id === subjectId);

                if (subject) {
                    const titleEl = document.querySelector(".fenn-id h1");
                    if (titleEl) titleEl.textContent = subject.title;
                } else {
                    console.warn("Fənn tapılmadı: " + subjectId);
                }
            })
            .catch(err => console.error("Subject fetch error:", err));
        // Köhnə fetch blokunu sil və bunu əlavə et:
        async function loadQuestions() {
            try {
                // Supabase-dən subjectId-yə uyğun cədvəldən bütün sətirləri çəkirik
                const { data: allQuestions, error } = await supabaseClient
                    .from(subjectId) // Cədvəl adı fənnin ID-si ilə eyni olmalıdır
                    .select('*');

                if (error) throw error;

                if (!allQuestions || allQuestions.length === 0) {
                    console.error("Suallar tapılmadı!");
                    return;
                }

                // BURADA SUAL SAYINI 10 EDİRİK! (və ya test üçün slice(0, 2))
                const questions = shuffleArray(allQuestions).slice(0, 10);

                let isQuizFinished = false;
                let currentIndex = 0;
                let score = 0;
                let timerInterval;
                let secondsElapsed = 0;
                let userAnswers = {};

                const questionEl = document.getElementById("question-text");
                const optionsContainer = document.getElementById("options-container");
                const counterEl = document.getElementById("question-counter");
                const progressEl = document.getElementById("progress-fill");
                const prevBtn = document.getElementById("evvelki-btn");
                const nextBtn = document.getElementById("novbeti-btn");

                if (prevBtn) prevBtn.onclick = () => navigate(-1);
                if (nextBtn) nextBtn.onclick = () => navigate(1);
                function formatTime(seconds) {
                    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
                    const s = (seconds % 60).toString().padStart(2, '0');
                    return `${m}:${s}`;
                }

                function startTimer() {
                    if (timerInterval) clearInterval(timerInterval);
                    secondsElapsed = 0;
                    const timerEl = document.getElementById("quiz-timer");
                    if (timerEl) timerEl.textContent = "00:00";

                    timerInterval = setInterval(() => {
                        secondsElapsed++;
                        if (timerEl) timerEl.textContent = formatTime(secondsElapsed);
                    }, 1000);
                }
                function checkMultiLogin() {
                    const checkInterval = setInterval(async () => {
                        const sbToken = localStorage.getItem('sb-xoebhhdirsvjorjlrfzi-auth-token');
                        if (!sbToken) return;
                        const uId = JSON.parse(sbToken).user.id;

                        const { data, error } = await supabaseClient
                            .from('user_stats')
                            .select('last_session_id')
                            .match({ 'user_id': uId })
                            .single();
                        if (data && data.last_session_id !== localStorage.getItem('active_session_id')) {
                            clearInterval(checkInterval);
                            const limitHTML = `
                                <div style="text-align: center;">
                                    <img src="../images/matrix-looking.webp" alt="Alert" style="width: 200px; margin-bottom: 15px;">
                                    <h3 style="margin-bottom: 10px; color: #B89A5A;">Hesabınıza başqa cihazdan giriş edilib. Quiz dayandırıldı!</h3>
                                    <p style="font-size: 15px; opacity: 0.9;">
                                    Hesabınızın qorunması üçün şifrənizi dərhal yeniləməyiniz tövsiyə olunur.
                                    Bu halın təkrarlanması platforma qaydalarının manipulyasiyası kimi qiymətləndiriləcək. Bu zaman hesabınız avtomatik olaraq 'Yüksək Risk' kateqoriyasına keçəcək.
                                </p>
                                </div>
                            `;

                            // showMessage funksiyasını gözləyirik (await)
                            await showMessage(limitHTML, "Sonra");
                            window.location.href = "fennler-menu.html"; // İstifadəçini ana səhiffəyə at
                        }
                    }, 10000);
                }

                // Funksiyanı başlat
                checkMultiLogin();
                function renderQuestion(index) {
                    const q = questions[index];
                    if (!q) return;

                    // 1. Sual mətnini innerHTML-ə çevirdik
                    if (questionEl) questionEl.innerHTML = q.question;
                    
                    if (counterEl) counterEl.textContent = `${index + 1} / ${questions.length}`;

                    if (progressEl) {
                        const progressPercent = ((index) / questions.length) * 100;
                        progressEl.style.width = `${progressPercent}%`;
                    }

                    if (optionsContainer) {
                        const currentOptions = {
                            "A": q.options__A,
                            "B": q.options__B,
                            "C": q.options__C,
                            "D": q.options__D,
                            "E": q.options__E
                        };

                        // 2. Variantların içindəki mətni də innerHTML ilə dinamik yaratdıq
                        optionsContainer.innerHTML = Object.entries(currentOptions)
                            .filter(([key, text]) => text !== null && text !== undefined && text !== "")
                            .map(([key, text]) =>
                                // Buradakı mətni `key) ${text}` şəklində qoyuruq ki, 
                                // text içindəki <u> və ya digər teqlər render olunsun
                                `<button class="option-btn" data-key="${key}">${key}) <span>${text}</span></button>`
                            ).join("");
                    }

                    const optionBtns = document.querySelectorAll(".option-btn");

                    if (userAnswers[index]) {
                        const savedAnswer = userAnswers[index];
                        const correctAnswer = q.correct_answer;

                        optionsContainer.classList.add("disabled");

                        optionBtns.forEach(btn => {
                            const key = btn.dataset.key;
                            if (key === savedAnswer) {
                                btn.classList.add(key === correctAnswer ? "correct" : "wrong");
                            }
                            if (key === correctAnswer) {
                                btn.classList.add("correct");
                            }
                        });
                        if (nextBtn) nextBtn.disabled = false;
                    } else {
                        optionsContainer.classList.remove("disabled");
                        if (nextBtn) nextBtn.disabled = true;

                        optionBtns.forEach(btn => {
                            btn.onclick = () => handleOptionClick(btn, q, index);
                        });
                    }

                    if (prevBtn) prevBtn.disabled = (index === 0);
                    if (nextBtn) {
                        nextBtn.textContent = (index === questions.length - 1) ? "Nəticə" : "Növbəti";
                    }
                }
                function openChatling() {
                    if (window.chatling && typeof window.chatling.open === 'function') {
                        window.chatling.open();
                    } else {
                        // Əgər API hələ hazır deyilsə, gizli orijinal düyməni klikləyirik
                        const originalBtn = document.getElementById('chatling-embed-trigger');
                        if (originalBtn) {
                            // Chatling butonu daxilindəki əsl kliklənə bilən elementi tapırıq
                            const realClickable = originalBtn.querySelector('button') || originalBtn;
                            realClickable.click();
                        }
                    }
                }
                // Qısa səs effektləri (SFX) üçün obyektlər
                const sfxCorrect = new Audio(window.location.origin + '/sounds/correct.mp3');
                const sfxWrong = new Audio(window.location.origin + '/sounds/wrong.mp3');
                async function handleOptionClick(btn, questionData, index) {
                    const selected = btn.dataset.key;
                    userAnswers[index] = selected;

                    const questionId = questionData.id;
                    const correctAnswer = questionData.correct_answer;

                    // YENİLİK: Butonları tək-tək bağlamırıq, bütöv qutunu dondururuq
                    optionsContainer.classList.add("disabled");

                    if (selected === correctAnswer) {
                        // 🔊 Doğru cavab səsini anında başladırıq
                        sfxCorrect.currentTime = 0;
                        sfxCorrect.play().catch(err => console.log("Səs başladılarkən xəta baş verdi:", err));

                        btn.classList.add("correct");
                        if (nextBtn) nextBtn.disabled = false;
                        score++;
                        removeWrongQuestion(currentSubjectId, questionId);
                    } else {
                        // 🔊 Yanlış cavab səsini anında başladırıq
                        sfxWrong.currentTime = 0;
                        sfxWrong.play().catch(err => console.log("Səs başladılarkən xəta baş verdi:", err));

                        btn.classList.add("wrong");
                        if (nextBtn) nextBtn.disabled = false;
                        addWrongQuestion(currentSubjectId, questionId);

                        setTimeout(() => {
                            const correctBtn = optionsContainer.querySelector(`[data-key="${correctAnswer}"]`);
                            if (correctBtn) correctBtn.classList.add("correct");
                        }, 500);
                    }

                    // Daxili checkAnswer funksiyan (toxunulmadı, olduğu kimi qalır)
                    function checkAnswer(selectedOptionButton, selectedAnswerKey) {
                        const correctAnswerKey = currentQuestion.correct_answer;
                        const questionId = currentQuestion.id;
                        const allOptions = document.querySelectorAll(".option-btn");

                        allOptions.forEach(btn => btn.disabled = true);

                        if (selectedAnswerKey === correctAnswerKey) {
                            selectedOptionButton.style.backgroundColor = "#4CAF50"; 
                            selectedOptionButton.style.color = "white";
                            removeWrongQuestion(currentSubjectId, questionId);
                        } else {
                            selectedOptionButton.style.backgroundColor = "#F44336"; 
                            selectedOptionButton.style.color = "white";

                            allOptions.forEach(btn => {
                                if (btn.getAttribute("data-key") === correctAnswerKey) {
                                    btn.style.backgroundColor = "#4CAF50";
                                    btn.style.color = "white";
                                }
                            });

                            addWrongQuestion(currentSubjectId, questionId);
                        }
                    }

                    const container = document.getElementById("options-container");
                    if (container) container.classList.add("disabled");
                    if (nextBtn) nextBtn.disabled = false;
                }

                function navigate(direction) {
                    const newIndex = currentIndex + direction;

                    if (newIndex >= 0 && newIndex < questions.length) {
                        currentIndex = newIndex;
                        renderQuestion(currentIndex);
                    } else if (newIndex >= questions.length) {
                        showResult();
                    }
                }
                async function updatePlayerStats(uId, currentScore, currentSeconds, totalQuestions, correctAnswers) {
                    try {
                        const client = window.globalSupabaseClient || window.supabaseClient;

                        // 1. İSTİFADƏÇİ MƏLUMATLARINI ALIRIQ
                        const { data: { user } } = await client.auth.getUser();
                        const fullName = user?.user_metadata?.full_name || "Adsız İstifadəçi";

                        // 2. TARİXLƏRİN HESABLANMASI
                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                        const yesterday = new Date(now);
                        yesterday.setDate(now.getDate() - 1);
                        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

                        // 3. MÖVCUD STATİSTİKANIN ÇƏKİLMƏSİ (Rating Deviation daxil olmaqla)
                        let { data: stats, error: fetchErr } = await client
                            .from('user_stats')
                            .select('*')
                            .eq('user_id', uId)
                            .maybeSingle();

                        if (fetchErr) throw fetchErr;

                        let lastDateInDb = stats ? stats.last_quiz_date : null;
                        let currentStreakInDb = stats ? (Number(stats.current_streak) || 0) : 0;
                        let currentLimitInDb = stats ? (Number(stats.daily_limit_count) || 0) : 0;

                        let finalStreak = 0;
                        let finalLimit = 1;

                        // --- STREAK VƏ LİMİT MƏNTİQİ ---
                        if (!stats) {
                            finalStreak = 1;
                            finalLimit = 1;
                        } else if (lastDateInDb === todayStr) {
                            finalStreak = currentStreakInDb;
                            finalLimit = currentLimitInDb + 1;
                        } else if (lastDateInDb === yesterdayStr) {
                            finalStreak = currentStreakInDb + 1;
                            finalLimit = 1;
                        } else {
                            finalStreak = 1;
                            finalLimit = 1;
                        }

                        // --- YENİ ELO (GLICKO) HESABLAMA MƏNTİQİ ---

                        function calculateNewRating(currentElo, currentRD, percentage) {
                            // 1. Sabitlər
                            const q = Math.log(10) / 400;
                            const quizDifficulty = 1000; // Quiz-in baza çətinliyi

                            // 2. Quiz nəticəsini 0.0 - 1.0 arasına gətiririk (Actual Score)
                            const s = percentage / 100;

                            // 3. Ehtimal olunan nəticəni hesablayırıq (Expected Score)
                            // Düstur: E = 1 / (1 + 10^((difficulty - elo) / 400))
                            const e = 1 / (1 + Math.pow(10, (quizDifficulty - currentElo) / 400));

                            // 4. RD-nin təsiri ilə d^2 dəyərini tapırıq
                            const dSquared = 1 / (Math.pow(q, 2) * (e * (1 - e)));

                            // 5. Yeni Elo (Rating)
                            // K-faktoru yerinə dinamik bir çarpan istifadə olunur
                            const multiplier = q / ((1 / Math.pow(currentRD, 2)) + (1 / dSquared));
                            const newElo = currentElo + multiplier * (s - e);

                            let newRD = Math.sqrt(1 / ((1 / Math.pow(currentRD, 2)) + (1 / dSquared)));

                            // RD limitləri: Nə qədər usta olsa da, şübhə 30-dan aşağı düşmür
                            newRD = Math.max(30, Math.min(350, newRD));

                            return {
                                rating: Math.round(newElo),
                                rd: Math.round(newRD),
                                diff: Math.round(newElo - currentElo)
                            };
                        }

                        const percentage = (correctAnswers / totalQuestions) * 100;
                        const currentElo = stats ? (Number(stats.elo_rating) || 1000) : 1000;
                        const currentRD = stats ? (Number(stats.rating_deviation) || 350) : 350;

                        // Hesablamanı icra edirik
                        const eloResult = calculateNewRating(currentElo, currentRD, percentage);

                        // 4. USER_STATS YENİLƏMƏSİ (Upsert)
                        const updatePayload = {
                            display_name: fullName,
                            quizzes_completed: (stats ? (Number(stats.quizzes_completed) || 0) : 0) + 1,
                            total_time_spent: (stats ? (Number(stats.total_time_spent) || 0) : 0) + currentSeconds,
                            total_answered_questions: (stats ? (Number(stats.total_answered_questions) || 0) : 0) + totalQuestions,
                            total_correct_answers: (stats ? (Number(stats.total_correct_answers) || 0) : 0) + correctAnswers,
                            total_score: (stats ? (Number(stats.total_score) || 0) : 0) + currentScore,

                            // YENİ MƏLUMATLAR
                            elo_rating: eloResult.rating,
                            rating_deviation: eloResult.rd,

                            current_streak: finalStreak,
                            last_quiz_date: todayStr,
                            daily_limit_count: finalLimit,
                            updated_at: new Date().toISOString()
                        };

                        const { error: updErr } = await client
                            .from('user_stats')
                            .upsert({ user_id: uId, ...updatePayload });

                        if (updErr) throw updErr;

                        // 5. QUIZ_HISTORY (Olduğu kimi qalır)
                        const { data: historyData } = await client
                            .from('quiz_history')
                            .select('quiz_count')
                            .eq('user_id', uId)
                            .eq('quiz_date', todayStr)
                            .maybeSingle();

                        const newHistoryCount = (historyData ? (Number(historyData.quiz_count) || 0) : 0) + 1;

                        await client.from('quiz_history').upsert({
                            user_id: uId,
                            quiz_date: todayStr,
                            quiz_count: newHistoryCount
                        }, { onConflict: 'user_id, quiz_date' });

                        // NƏTİCƏNİ QAYTARIRIQ (UI üçün eloDifference və newElo)
                        return {
                            diff: eloResult.diff,
                            newElo: eloResult.rating
                        };

                    } catch (err) {
                        console.error("Gözlənilməz xəta:", err.message);
                        return null;
                    }
                }
                async function showResult() {
                    clearInterval(timerInterval);
                    
                    if (isQuizFinished) return;
                    isQuizFinished = true;

                    // ==========================================
                    // 1. ADDIMS: UI-I DƏRHAL DƏYİŞDİRİK (DONMANI QABAQLAMAQ ÜÇÜN)
                    // ==========================================
                    const topPart = document.querySelector(".top-part");
                    const sualWord = document.querySelector(".sual-word");
                    const quizButtons = document.querySelector(".quiz-buttons-bg");
                    const sualTextBg = document.querySelector(".sual-text-bg");
                    const exitBg = document.querySelector(".exit-bg a");

                    if (topPart) topPart.style.display = "none";
                    if (sualWord) sualWord.style.display = "none";
                    if (quizButtons) quizButtons.style.display = "none";
                    if (sualTextBg) sualTextBg.style.display = "none";
                    if (exitBg) exitBg.style.display = "none";

                    const headerTitle = document.querySelector(".fenn-id h1");
                    let subjectTitle = "";
                    if (headerTitle) {
                        subjectTitle = headerTitle.textContent;
                        headerTitle.style.display = "none";
                    }
                    const isDarkTheme = document.body.classList.contains("dark-theme") || document.body.classList.contains("dark-mode");
                    const dynamicBorderSrc = isDarkTheme ? "../images/al-border-w.webp" : "../images/al-border-b.webp";
                    const dynamicCenterSrc = isDarkTheme ? "../images/al-center-w.webp" : "../images/al-center-b.webp";

                    // Seçimlər qutusunun içinə dərhal yumşaq animasiyalı yüklənmə ekranı qoyuruq
                    optionsContainer.innerHTML = `
                        <div class="loader-container sfx-fade-in" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0;">
                            
                            <div class="logo-wrapper" style="width: 75px; height: 75px; margin-bottom: 20px;">
                                <img src="${dynamicBorderSrc}" class="al-border" style="animation: spinLogo 2s linear infinite;" alt="AtlasLab Border">
                                <img src="${dynamicCenterSrc}" class="al-center" alt="AtlasLab Center">
                            </div>
                            
                            <p class="loader-text" style="text-align: center; margin: 0;">Nəticələriniz yoxlanılır və Elo reytinqiniz hesablanır...</p>
                        </div>
                    `;
                    optionsContainer.classList.remove("disabled");
                    
                    // ==========================================
                    // 2. ADDIM: ARXA FONDA ASİNXRON SORĞUNUN GÖNDƏRİLMƏSİ
                    // ==========================================
                    let eloData = { diff: 0, newElo: 1000 }; // Default dəyərlər
                    
                    if (userId) {
                        try {
                            // UI artıq dəyişib və loader fırlanır, ona görə bu gözləmə istifadəçini yorruyacaq
                            const result = await updatePlayerStats(userId, score, secondsElapsed, questions.length, score);
                            if (result) eloData = result;
                        } catch (error) {
                            console.error("Statistika yenilənərkən xəta baş verdi:", error);
                        }
                    }

                    // ==========================================
                    // 3. ADDIM: REYTİNQ HESABLANDIQDAN SONRA SƏS VƏ NƏTİCƏ
                    // ==========================================
                    const finalTime = formatTime(secondsElapsed);
                    let eloStatusClass = "elo-neutral";
                    let eloSign = eloData.diff > 0 ? "+" : "";

                    if (eloData.diff > 0) {
                        eloStatusClass = "elo-up";
                    } else if (eloData.diff < 0) {
                        eloStatusClass = "elo-down";
                    }

                    const percentage = Math.round((score / questions.length) * 100);
                    const wrongAnswers = questions.length - score;
                    const eloHTML = `${eloData.newElo} <span class="${eloStatusClass}" style="font-size: 0.9em; margin-left: 5px;">${eloSign}${eloData.diff}</span>`;

                    // Loader-i silib əvəzinə yekun nəticəni yumşaq fade-in animasiyası ilə daxil edirik
                    optionsContainer.innerHTML = `
                        <div class="result-container sfx-fade-in">
                            <div class="circle-progress-container">
                                <div class="circle-progress" style="--degrees: ${percentage * 3.6}deg;">
                                    <span class="progress-value">${percentage}%</span>
                                </div>
                            </div>

                            <h1 class="result-title">Yekun nəticə: ${score}/${questions.length}</h1>
                            <p class="result-subject">${subjectTitle}</p>

                            <div class="stats-card">
                                <div class="stat-row">
                                    <span class="stat-label"><span class="dot-blue">●</span> Düzgün cavablar</span>
                                    <span class="stat-count">${score}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label"><span class="dot-red">●</span> Səhv cavablar</span>
                                    <span class="stat-count">${wrongAnswers}</span>
                                </div>
                                
                                <div class="stat-row">
                                    <span class="stat-label"><span class="dot-grey">●</span> Sərf olunan vaxt</span>
                                    <span class="stat-count">${finalTime}</span>
                                </div>

                                <div class="stat-row last-row">
                                    <span class="stat-label"><span class="dot-green">●</span> Keçmə faizi</span>
                                    <span class="stat-count green-text">${percentage}%</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label"><span class="dot-yellow">●</span> Reytinq (Elo)</span>
                                    <span class="stat-count" style="color: inherit; font-weight: bold;">${eloHTML}</span>
                                </div>
                            </div>

                            <div class="result-actions">
                                <a href="fennler-menu.html" class="link-blue">Əsas səhifə</a>
                                <button class="btn-blue" onclick="window.location.reload()">Yenidən sına</button>
                            </div>
                        </div>
                    `;
                }
                // ============================================================================
                // --- KƏSİNTİSİZ VƏ RƏVAN FOKUS SƏSLƏRİ (FADE-IN / FADE-OUT WEB AUDIO API) ---
                // ============================================================================
                const soundToggleBtn = document.getElementById('sound-toggle-btn');
                const customNoiseMenu = document.getElementById('custom-noise-menu');

                // Səs yollarını brauzerin cari domain ünvanına bağlayırıq (404 xətası almaması üçün)
                const noiseSources = {
                    white: window.location.origin + '/sounds/white-noise.mp3',
                    brown: window.location.origin + '/sounds/brown-noise.mp3',
                    rain: window.location.origin + '/sounds/rain.mp3'
                };

                let audioCtx = null;
                let audioBuffer = null;
                let audioSourceNode = null;
                let gainNode = null;        // Səsin rəvan azalıb-çoxalmasını idarə edən modul
                let isAudioPlaying = false; // Səsin durumunu dəqiq izləmək üçün flag

                // Səsi rəvan şəkildə azaldaraq dayandıran funksiya (Fade-out)
                function stopCurrentNoise() {
                    if (audioSourceNode && gainNode && audioCtx) {
                        try {
                            const currentTime = audioCtx.currentTime;
                            
                            // 0.8 saniyə ərzində səsi cari səviyyədən 0-a qədər rəvan azaldırıq
                            gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
                            gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.8);
                            
                            // Səs tam batdıqdan sonra (0.8 saniyə sonra) oxutmanı tam dayandırırıq
                            const oldSource = audioSourceNode;
                            const oldGain = gainNode;
                            setTimeout(() => {
                                try {
                                    oldSource.stop();
                                    oldSource.disconnect();
                                    oldGain.disconnect();
                                } catch (e) { /* Artıq dayandırılıb */ }
                            }, 850);

                        } catch (e) {
                            console.error("Səs dayandırılarkən xəta:", e);
                        }
                    }
                    
                    // Node və statusları dərhal sıfırlayırıq ki, istifadəçi yeni səs seçə bilsin
                    audioSourceNode = null;
                    gainNode = null;
                    isAudioPlaying = false;
                }

                // Səsi yükləyən və rəvan şəkildə başladan funksiya (Fade-in)
                async function playNoise(url) {
                    // Əgər arxa fonda səs varsa, öncə onu rəvan dayandırırıq
                    stopCurrentNoise(); 

                    if (!audioCtx) {
                        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    }

                    if (audioCtx.state === 'suspended') {
                        await audioCtx.resume();
                    }

                    try {
                        const response = await fetch(url);
                        const arrayBuffer = await response.arrayBuffer();
                        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

                        // 1. Səs mənbəyini yaradırıq
                        audioSourceNode = audioCtx.createBufferSource();
                        audioSourceNode.buffer = audioBuffer;
                        audioSourceNode.loop = true; // Kəsintisiz dövr etsin

                        // 2. Səs səviyyəsi (Gain) tənzimləyicisini yaradırıq
                        gainNode = audioCtx.createGain();
                        
                        // Səsi sıfır (tam səssiz) səviyyəsindən başladırıq
                        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

                        // 3. Bağlantıları qururuq: Mənbə -> Gain Modulu -> Səs Kartı
                        audioSourceNode.connect(gainNode);
                        gainNode.connect(audioCtx.destination);

                        // Səsi başladırıq
                        audioSourceNode.start(0);
                        isAudioPlaying = true;

                        // 🚀 FADE-IN EFFECT: 1 saniyə ərzində səsi 0-dan 1-ə (normal səviyyəyə) qaldırırıq
                        gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1.0);

                    } catch (err) {
                        console.error("Web Audio xətası:", err);
                        isAudioPlaying = false;
                    }
                }

                // --- KLİK HADİSƏLƏRİ VƏ İNTERFEYS İDARƏETMƏSİ ---
                if (soundToggleBtn && customNoiseMenu) {
                    soundToggleBtn.onclick = function(e) {
                        e.stopPropagation(); 
                        const btnImg = soundToggleBtn.querySelector('img');

                        // 1. Əgər səs aktivdirsə, onu dərhal rəvan SÖNDÜRÜRÜK
                        if (isAudioPlaying) {
                            stopCurrentNoise();
                            
                            if (btnImg) btnImg.src = "../images/audio-off.png";
                            soundToggleBtn.classList.remove('sound-active');
                        } 

                        // 2. Səsin olub-olmamasından asılı olmayaraq, hər iki halda menyunu AÇIRIQ/BAĞLAYIRIQ
                        if (customNoiseMenu.style.display === "none" || customNoiseMenu.style.display === "") {
                            customNoiseMenu.style.display = "block";
                        } else {
                            customNoiseMenu.style.display = "none";
                        }
                    };

                    // Menyu daxilindəki fərqli səslərə kliklədikdə
                    const options = customNoiseMenu.querySelectorAll('.noise-option');
                    options.forEach(option => {
                        option.onclick = async function(e) {
                            e.stopPropagation();
                            const selectedValue = this.getAttribute('data-value');
                            const btnImg = soundToggleBtn.querySelector('img');
                            
                            if (selectedValue !== "none" && noiseSources[selectedValue]) {
                                // Seçilən kəsintisiz səs paketini rəvan başladırıq
                                await playNoise(noiseSources[selectedValue]);
                                
                                if (btnImg) btnImg.src = "../images/audio-on.png";
                                soundToggleBtn.classList.add('sound-active');
                            } else {
                                // Siyahıdan "Söndür" seçilərsə
                                stopCurrentNoise();
                                if (btnImg) btnImg.src = "../images/audio-off.png";
                                soundToggleBtn.classList.remove('sound-active');
                            }

                            customNoiseMenu.style.display = "none"; // Seçimdən sonra menyunu gizlət
                        };
                    });

                    // Səhifədə boş bir yerə kliklədikdə açıq olan menyunu bağla
                    document.addEventListener('click', function() {
                        customNoiseMenu.style.display = "none";
                    });
                }
                // ==========================================
                // SUALI REPORT ETMƏK (ŞİKAYƏT) FUNKSİYASI
                // ==========================================
                window.openReportFrame = function () {
                    const currentQuestionText = document.getElementById("question-text").innerText;

                    const reportHTML = `
                        <h2>Sualı Şikayət Et</h2>
                        <div>
                            <span class="report-label">Problemli sual:</span>
                            <div class="reported-question-box">${currentQuestionText}</div>
                        </div>
                        <div>
                            <span class="report-label">Problemin təsviri:</span>
                            <textarea id="reportReasonText" class="report-textarea" placeholder="Sualda hansı səhvi və ya problemi gördüyünüzü ətraflı yazın..."></textarea>
                        </div>
                        <div class="action-buttons">
                            <button class="btn-cancel" onclick="closeActionModal()">Ləğv et</button>
                            <button class="btn-continue" onclick="submitReport()">Göndər</button>
                        </div>
                    `;
                    openActionModal(reportHTML);
                };

                window.submitReport = async function () {
                    const reason = document.getElementById("reportReasonText").value.trim();
                    if (!reason) {
                        showMessage("Zəhmət olmasa problemin nə olduğunu qeyd edin!");
                        return;
                    }

                    try {
                        // 1. Giriş etmiş istifadəçinin emailini alırıq
                        const { data: { user } } = await supabaseClient.auth.getUser();
                        const userEmail = user ? user.email : "Anonim";

                        // 2. Hazırda ekranda görünən sualın mətni
                        const currentQuestionText = document.getElementById("question-text").innerText;

                        // 3. Fənnin adını DOM-dan oxuyuruq
                        const titleEl = document.querySelector(".fenn-id h1");
                        const fennAdi = titleEl ? titleEl.innerText.trim() : "Bilinməyən Fənn";

                        // 4. Supabase-ə məlumatı göndəririk
                        const { error: reportError } = await supabaseClient
                            .from('reported_questions')
                            .insert([
                                {
                                    email: userEmail,
                                    sual: currentQuestionText,
                                    comment: reason,
                                    fenn_adi: fennAdi // Yeni sütuna fənnin adını yazırıq
                                }
                            ]);

                        if (reportError) throw reportError;

                        closeActionModal();
                        showMessage("Şikayətiniz uğurla göndərildi. Təşəkkür edirik!");

                    } catch (err) {
                        console.error("Şikayət göndərilərkən xəta baş verdi:", err);
                        showMessage("Xəta baş verdi! Şikayət göndərilə bilmədi.");
                    }
                };
                // Quiz-i başlat
                renderQuestion(currentIndex);
                startTimer();
                // Quiz-i başlat
                renderQuestion(currentIndex);
                startTimer();

            } catch (err) {
                console.error("Supabase fetch error:", err.message);
            }
        }

        // Funksiyanı çağırırıq
        loadQuestions();
    });

    function shuffleArray(array) {
        return array
            .map(a => [Math.random(), a])
            .sort((a, b) => a[0] - b[0])
            .map(a => a[1]);
    }
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