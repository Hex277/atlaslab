// Supabase məlumatları (Tək İnstance)
const supabaseUrl = 'https://xoebhhdirsvjorjlrfzi.supabase.co';
const supabaseKey = 'sb_publishable_FpT1VBCd5NKEnrYQbmx9Gw_MqWxVMvN';

if (!window.globalSupabaseClient) {
    window.globalSupabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}
const supabaseClient = window.globalSupabaseClient;

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const actionBtn = document.querySelector('.btn-login'); 

// Sizin təklif etdiyiniz üsul: Səhifəni URL-dən tapırıq
const currentPath = window.location.pathname;
const isRegisterPage = currentPath.includes("register.html");

supabaseClient.auth.getSession().then(({ data: { session } }) => {
    // Əgər aktiv sessiya varsa, heç nə soruşmadan birbaşa profilə atırıq
    if (session) {
        window.location.href = "profile.html";
    }
});
// Düyməyə klikləyəndə işləyəcək əsas funksiya
if (actionBtn) {
    actionBtn.addEventListener('click', async () => {
        const email = emailInput?.value.trim();
        const password = passwordInput?.value;
        
        if (!email || !password) {
            showMessage("Zəhmət olmasa, e-poçt və şifrəni daxil edin!");
            return;
        }
        const originalText = actionBtn.textContent;
        actionBtn.disabled = true;

        if (isRegisterPage) {
            // ==========================================
            // ------ QEYDİYYAT (REGISTER) MƏNTİQİ ------
            // ==========================================
            const nameInput = document.getElementById('name');
            const name = nameInput ? nameInput.value.trim() : "";
            const termsAgree = document.getElementById('terms_agree');
            if (!termsAgree || !termsAgree.checked) {
                showMessage("Davam etmək üçün İstifadə Şərtləri və Məxfilik Siyasətini qəbul etməlisiniz!");
                actionBtn.disabled = false; 
                return;
            }
            if (!name) {
                showMessage("Zəhmət olmasa, adınızı daxil edin!");
                actionBtn.disabled = false; return;
            }
            if (password.length < 6) {
                showMessage("Şifrə ən azı 6 simvol olmalıdır!");
                actionBtn.disabled = false; return;
            }

            actionBtn.textContent = "Yaradılır...";

            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { 
                        full_name: name,
                        is_premium: false // YENİ: Başlanğıcda premium deyil (false)
                    },
                    emailRedirectTo: 'https://atlaslab.az/telebe/tesdiq.html'
                }
            });
            
            if (error) {
                // Əgər email artıq varsa və ya digər Supabase xətası baş verərsə
                showMessage("Xəta baş verdi: " + error.message);
                actionBtn.textContent = originalText;
                actionBtn.disabled = false;
            } else if (data.user && data.user.identities && data.user.identities.length === 0) {
                // YENİ HİSSƏ: Supabase təhlükəsizlik üçün error verməyə bilər, 
                // amma identities boşdursa, bu email artıq bazada var deməkdir.
                showMessage("Bu e-poçt ünvanı ilə artıq hesab yaradılıb. Zəhmət olmasa daxil olun və ya şifrəni bərpa edin.");
                actionBtn.textContent = originalText;
                actionBtn.disabled = false;
            } else {
                // Hər şey qaydasındadırsa
                await showMessage(`Qeydiyyat uğurla tamamlandı! <b>${email}</b> ünvanına göndərilən təsdiq linkinə klikləyərək hesabınızı aktivləşdirin.`, "success", "Daxil ol");
                window.location.href = "login.html"; 
            }
        } else {
            // ====================================
            // ------ GİRİŞ (LOGIN) MƏNTİQİ ------
            // ====================================
            actionBtn.textContent = "Daxil olunur";

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    showMessage("Hesabınıza daxil olmaq üçün əvvəlcə e-poçtunuza göndərilən təsdiq linkinə klikləyin.");
                } else {
                    showMessage("E-poçt və ya şifrə yanlışdır!");
                }
                
                actionBtn.textContent = originalText;
                actionBtn.disabled = false;
            } else {
                await showMessage("Uğurla daxil oldunuz!", "showMessage", "Profilə keç");
                window.location.href = "profile.html"; 
            }
        }
    });
}
// -----------------------------------------------------------------------------------------------------------
// 3-cü parametr kimi customBtnText əlavə etdik
function showMessage(message, type = "showMessage", customBtnText = "OK") {
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

            confirmBtn.onclick = () => {
                overlay.style.display = "none";
                resolve(true); 
            };

            cancelBtn.onclick = () => {
                overlay.style.display = "none";
                resolve(false); 
            };
        } 
        // Əgər növ "showMessage" (Sadəcə bildiriş) idisə:
        else {
            okBtn.style.display = "inline-block";
            
            // YENİLİK: Düymənin yazısını burada dəyişirik
            okBtn.textContent = customBtnText; 
            
            confirmBtn.style.display = "none";
            cancelBtn.style.display = "none";

            // Düyməyə basıldıqda bağla və növbəti koda keçməyə icazə ver (resolve)
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
// ---------------------- REGISTER PAGE ---------------------
if (window.location.pathname.endsWith("register.html")) {
    const inputs = document.querySelectorAll('.giris-form input[type="text"], .giris-form input[type="email"], .giris-form input[type="password"]');
    const registerBtn = document.querySelector('.btn-login');

    inputs.forEach((input, index) => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Formun səhvən göndərilməsini dayandırır

                // Əgər növbəti input varsa, ona fokuslan
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } 
                // Əgər sonuncu inputdursa (Şifrə), düyməni kliklə
                else {
                    registerBtn.click();
                }
            }
        });
    });
}
// ---------------------- LOGIN PAGE ---------------------
if (window.location.pathname.endsWith("login.html")) {
    // 1. Şifrə bərpa modalını açan funksiya (Email istəyir)
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.btn-login');
    emailInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Səhifənin yenilənməsinin qarşısını alırıq
            passwordInput.focus(); // Şifrə xanasına keçid edirik
        }
    });

    // Şifrə xanasında Enter basıldıqda
    passwordInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginBtn.click(); // "Daxil ol" düyməsini klikləyirik
        }
    });
    window.openResetPasswordModal = function() {
        const modalHTML = `
            <h2>Şifrəni bərpa et</h2>
            <p style="font-size: 14px; opacity: 0.8; margin-bottom: 15px;">
                Hesabınızın e-poçt ünvanını daxil edin. Sizə təsdiq kodu göndəriləcək.
            </p>
            <div class="input-group">
                <label>E-poçt</label>
                <input type="email" id="resetEmailInput" placeholder="example@mail.com">
            </div>
            <div class="action-buttons">
                <button class="btn-cancel" onclick="closeActionModal()">Ləğv et</button>
                <button class="btn-continue" id="sendOtpBtn" onclick="sendResetOtp()">Kod Göndər</button>
            </div>
        `;
        openActionModal(modalHTML);
    };

    // 2. Supabase vasitəsilə OTP göndərən funksiya
    window.sendResetOtp = async function() {
        const email = document.getElementById("resetEmailInput").value.trim();
        const btn = document.getElementById("sendOtpBtn");

        if (!email) {
            await showMessage("Zəhmət olmasa e-poçtunuzu daxil edin!");
            return;
        }

        btn.textContent = "Göndərilir...";
        btn.disabled = true;

        // Supabase-ə şifrə bərpa sorğusu göndəririk
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

        if (error) {
            await showMessage("Xəta: " + error.message);
            btn.textContent = "Kod Göndər";
            btn.disabled = false;
        } else {
            // Uğurludursa, modalın içini dəyişib OTP və YENİ ŞİFRƏ sahəsini göstəririk
            showOtpEntryModal(email);
        }
    };

    // 3. Kod və Yeni Şifrə daxil etmə mərhələsi
    function showOtpEntryModal(email) {
        const modalContent = document.getElementById("actionModalContent");
        modalContent.innerHTML = `
            <h2>Təsdiqləmə</h2>
            <p style="font-size: 14px; opacity: 0.8; margin-bottom: 15px;">
                <b>${email}</b> ünvanına göndərilən 8 rəqəmli kodu və yeni şifrənizi daxil edin.
            </p>
            <div class="input-group">
                <label>Təsdiq Kodu (OTP)</label>
                <input type="text" id="otpCodeInput" placeholder="12345678" maxlength="8">
            </div>
            <div class="input-group">
                <label>Yeni Şifrə</label>
                <input type="password" id="finalNewPassword" placeholder="Ən azı 6 simvol">
            </div>
            <div class="action-buttons">
                <button class="btn-cancel" onclick="closeActionModal()">Ləğv et</button>
                <button class="btn-continue" id="confirmResetBtn" onclick="verifyOtpAndChangePassword('${email}')">Şifrəni Yenilə</button>
            </div>
        `;
    }

    // 4. Kodu yoxlayıb şifrəni dəyişən son funksiya
    window.verifyOtpAndChangePassword = async function(email) {
        const token = document.getElementById("otpCodeInput").value.trim();
        const newPassword = document.getElementById("finalNewPassword").value.trim();
        const btn = document.getElementById("confirmResetBtn");

        if (token.length < 6 || newPassword.length < 6) {
            await showMessage("Kod 6 rəqəmli, şifrə isə ən azı 6 simvol olmalıdır!");
            return;
        }

        btn.textContent = "Yenilənir...";
        btn.disabled = true;

        // Əvvəlcə OTP ilə sessiyanı təsdiqləyirik
        const { error: verifyError } = await supabaseClient.auth.verifyOtp({
            email,
            token,
            type: 'recovery'
        });

        if (verifyError) {
            await showMessage("Kod yanlışdır və ya vaxtı bitib!");
            btn.textContent = "Şifrəni Yenilə";
            btn.disabled = false;
        } else {
            // Sessiya açıldı, indi şifrəni yeniləyirik
            const { error: updateError } = await supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                await showMessage("Şifrə yenilənərkən xəta: " + updateError.message);
            } else {
                closeActionModal();
                await showMessage("Şifrəniz uğurla yeniləndi! İndi daxil ola bilərsiniz.");
            }
        }
    };
}