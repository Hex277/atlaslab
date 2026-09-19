
// ---------------------- FENNLER MENU ----------------------
if (window.location.pathname.endsWith("fennler-menu.html")) {
    
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
            const totalLimit = 5;
            const remainingLimit = Math.max(0, totalLimit - usedToday);

            // 5. Standart vizualları göstəririk
            if (display) display.innerText = remainingLimit;
            if (energyIcon) energyIcon.src = "../images/thunder.webp";

        } catch (err) {
            console.error("Limit bölməsində xəta yarandı:", err.message);
        }
    })(); // Funksiya burada bağlanır
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