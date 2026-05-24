document.addEventListener("DOMContentLoaded", () => {
    // 1. Yaddaşı yoxlayırıq (həm tələbənin "theme", həm də abituriyentin "darkMode" açarını)
    let currentTheme = localStorage.getItem("theme");
    
    // Əgər "theme" yoxdursa, köhnə "darkMode" yaddaşını yoxla
    if (!currentTheme) {
        currentTheme = (localStorage.getItem("darkMode") === "enabled") ? "dark" : "light";
    }

    // 2. Səhifə yüklənəndə hər iki CSS sinfini (həm tələbə, həm abituriyent üçün) tətbiq edirik
    if (currentTheme === "dark") {
        document.body.classList.add("dark-theme", "dark-mode");
    } else {
        document.body.classList.remove("dark-theme", "dark-mode");
    }

    // 3. Düyməni və ikonu hər iki layihənin ID-sinə uyğun axtarırıq
    const toggleBtn = document.getElementById("theme-btn") || document.getElementById("toggle-dark-mode");
    const toggleIcon = document.getElementById("theme-img") || document.querySelector("#toggle-dark-mode #icon") || document.getElementById("icon");

    // Əgər səhifədə düymə varsa, funksiyanı işə salırıq
    if (toggleBtn && toggleIcon) {
        
        // Səhifə açılanda ikonu düzgün göstər (tələbənin issun.webp şəkli ilə)
        toggleIcon.src = (currentTheme === "dark") ? "../images/issun.webp" : "../images/moon.webp";

        // Düyməyə kliklədikdə
        toggleBtn.addEventListener("click", () => {
            // Hər iki CSS sinfini dəyişirik
            document.body.classList.toggle("dark-theme");
            document.body.classList.toggle("dark-mode");
            
            let theme = "light";
            
            // Əgər dark mode aktivdirsə
            if (document.body.classList.contains("dark-theme") || document.body.classList.contains("dark-mode")) {
                theme = "dark";
                toggleIcon.src = "../images/issun.webp";
            } else {
                theme = "light";
                toggleIcon.src = "../images/moon.webp";
            }
            
            // Yaddaşı hər iki layihə üçün eyni anda yeniləyirik ki, səhifələr arası keçiddə itməsin
            localStorage.setItem("theme", theme);
            localStorage.setItem("darkMode", theme === "dark" ? "enabled" : "disabled");
        });
    }

    // Digər məlumatları yükləyən funksiya (əgər mövcuddursa)
    if (typeof loadData === 'function') {
        loadData();
    }
});