document.addEventListener("DOMContentLoaded", () => {
    // --- AVTOMATİK YOL TƏYİNİ ---
    // Əgər ID "index-page"-dirsə kök qovluqdadır (images/), yoxdursa alt qovluqdadır (../images/)
    const isIndexPage = document.body.id === "index-page";
    const imgFolder = isIndexPage ? "images/" : "../images/";

    // 1. Yaddaşı yoxlayırıq
    let currentTheme = localStorage.getItem("theme");
    
    if (!currentTheme) {
        currentTheme = (localStorage.getItem("darkMode") === "enabled") ? "dark" : "light";
    }

    // 2. Səhifə yüklənəndə CSS siniflərini tətbiq edirik
    if (currentTheme === "dark") {
        document.body.classList.add("dark-theme", "dark-mode");
    } else {
        document.body.classList.remove("dark-theme", "dark-mode");
    }

    // Loqoları və elementləri tapırıq
    const centerLogo = document.getElementById("center-logo");
    const alLogo = document.getElementById("atlaslab-logo");
    const heroTelebe = document.getElementById("telebe-hero");
    const loaderBorders = document.querySelectorAll(".al-border");
    const loaderCenters = document.querySelectorAll(".al-center");
    const sideLogo = document.querySelector(".logopng");

    // Səhifə yüklənəndə şəkillərin düzgün versiyasını göstəririk
    if (centerLogo) {
        centerLogo.src = (currentTheme === "dark") ? `${imgFolder}logo-crop-w.png` : `${imgFolder}logo-crop-b.png`;
    }
    if (alLogo) {
        alLogo.src = (currentTheme === "dark") ? `${imgFolder}logo-w.webp` : `${imgFolder}logo-b.webp`;
    }
    if (heroTelebe) {
        heroTelebe.src = (currentTheme === "dark") ? `${imgFolder}hero-visual-w.webp` : `${imgFolder}hero-visual-b.webp`;
    }
    if (sideLogo) {
        sideLogo.src = (currentTheme === "dark") ? `${imgFolder}logo-crop-w.png` : `${imgFolder}logo-crop-b.png`;
    }
    loaderBorders.forEach(img => img.src = (currentTheme === "dark") ? `${imgFolder}al-border-w.webp` : `${imgFolder}al-border-b.webp`);
    loaderCenters.forEach(img => img.src = (currentTheme === "dark") ? `${imgFolder}al-center-w.webp` : `${imgFolder}al-center-b.webp`);

    // 3. Düyməni və ikonu axtarırıq
    const toggleBtn = document.getElementById("theme-btn") || document.getElementById("toggle-dark-mode");
    const toggleIcon = document.getElementById("theme-img") || document.querySelector("#toggle-dark-mode #icon") || document.getElementById("icon");

    if (toggleBtn && toggleIcon) {
        
        // Səhifə açılanda ikonu düzgün göstər
        toggleIcon.src = (currentTheme === "dark") ? `${imgFolder}issun.webp` : `${imgFolder}moon.webp`;

        // Düyməyə kliklədikdə
        toggleBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-theme");
            document.body.classList.toggle("dark-mode");
            
            let theme = "light";
            
            if (document.body.classList.contains("dark-theme") || document.body.classList.contains("dark-mode")) {
                theme = "dark";
                toggleIcon.src = `${imgFolder}issun.webp`;
                
                if (centerLogo) centerLogo.src = `${imgFolder}logo-crop-w.png`;
                if (heroTelebe) heroTelebe.src = `${imgFolder}hero-visual-w.webp`;
                if (alLogo) alLogo.src = `${imgFolder}logo-w.webp`;
                if (sideLogo) sideLogo.src = `${imgFolder}logo-crop-w.png`;
                loaderBorders.forEach(img => img.src = `${imgFolder}al-border-w.webp`);
                loaderCenters.forEach(img => img.src = `${imgFolder}al-center-w.webp`);
            } else {
                theme = "light";
                toggleIcon.src = `${imgFolder}moon.webp`;
                
                if (centerLogo) centerLogo.src = `${imgFolder}logo-crop-b.png`;
                if (alLogo) alLogo.src = `${imgFolder}logo-b.webp`;  
                if (heroTelebe) heroTelebe.src = `${imgFolder}hero-visual-b.webp`;
                if (sideLogo) sideLogo.src = `${imgFolder}logo-crop-b.png`;
                loaderBorders.forEach(img => img.src = `${imgFolder}al-border-b.webp`);
                loaderCenters.forEach(img => img.src = `${imgFolder}al-center-b.webp`);
            }
            
            localStorage.setItem("theme", theme);
            localStorage.setItem("darkMode", theme === "dark" ? "enabled" : "disabled");
        });
    }

    if (typeof loadData === 'function') {
        loadData();
    }
});