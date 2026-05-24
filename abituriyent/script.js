const groupMatch = window.location.pathname.match(/(\d)ciqrup\.html$/),
    groupNumber = groupMatch ? groupMatch[1] : "1",
    jsonFile = `qrup${groupNumber}.json`;
let globalData = [];
const groupNames = {
    1: "1-ci Qrup",
    2: "2-ci Qrup",
    3: "3-c\xfc Qrup",
    4: "4-c\xfc Qrup",
    5: "5-ci Qrup"
};

function loadData() {
    fetch(jsonFile).then(e => {
        if (!e.ok) throw Error(`Failed to fetch ${jsonFile}: ${e.statusText}`);
        return e.json()
    }).then(e => {
        globalData = e, initPage()
    }).catch(e => {
        console.error("Error loading data:", e)
    })
}

function initPage() {
    let e = localStorage.getItem("selectedLanguage") || "az",
        a = document.getElementById("group-title");
    
    if (a) {
        a.textContent = groupNames[groupNumber] || "Qrup";
    }
    
    let t = document.querySelectorAll("#menu-bar ul li a");

    function i() {
        let a = getCurrentFilters(),
            t = filterData(globalData, a);
        renderData(t, e);
        setupEventListeners();
    }
    
    t.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `${groupNumber}ciqrup.html`) {
            link.classList.add("active");
        }
    });

    renderData(globalData, e);
    setupEventListeners();
    window.addEventListener("resize", i);
    window.addEventListener("orientationchange", i);
}

function setupEventListeners() {
    let e = document.getElementById("search"),
        a = document.getElementById("tehsilSelect"),
        t = document.getElementById("dilSelect"),
        i = document.getElementById("altSelect"),
        l = document.getElementById("locationSelect"),
        n = document.getElementById("searchBtn"),
        r = document.getElementById("minScore"),
        s = document.getElementById("maxScore");
    e.removeEventListener("input", applyFilters), a.removeEventListener("change", applyFilters), t.removeEventListener("change", applyFilters), i.removeEventListener("change", applyFilters), l.removeEventListener("change", applyFilters), r.removeEventListener("input", applyFilters), s.removeEventListener("input", applyFilters), n && n.removeEventListener("click", applyFilters), window.innerWidth > 768 ? (e.addEventListener("input", applyFilters), r.addEventListener("input", applyFilters), s.addEventListener("input", applyFilters)) : n && n.addEventListener("click", applyFilters), a.addEventListener("change", applyFilters), t.addEventListener("change", applyFilters), i.addEventListener("change", applyFilters), l.addEventListener("change", applyFilters)
}

function renderData(data, lang) {
    let tableContainer = document.getElementById("table-container"),
        cardContainer = document.getElementById("card-container"),
        l = translations[lang] || {},
        isMobileView = window.innerWidth <= 768;
    tableContainer.innerHTML = "";
    cardContainer.innerHTML = "";
    if (isMobileView) {
      let html = "";
      data.forEach(group => {
          group.universitetler.forEach((univ, index) => {
  
              html += `<div class="uni-basliq">${lang === "en" && univ.universitet_en ? univ.universitet_en : univ.universitet}</div>`;
  
              univ.ixtisaslar.forEach(ixtisas => {
                  let tehsilFormasi = lang === "en" && ixtisas.tehsil_formasi_en
                      ? ixtisas.tehsil_formasi_en
                      : ixtisas.tehsil_formasi;
                  html += `
                      <div class="card">
                        <div class="field" id="ixtisasad"><strong>${l.ixtisas || "İxtisas"}:</strong> ${lang === "en" && ixtisas.ad_en ? ixtisas.ad_en : ixtisas.ad}</div>
                        <div class="field"><strong>${l.dil || "Dil"}:</strong> ${lang === "en" && ixtisas.dil_en ? ixtisas.dil_en : ixtisas.dil}</div>
                        <div class="field"><strong>${l.balOdenissiz || "Bal (Ödənişsiz)"}:</strong> ${ixtisas.bal_pulsuz ?? "—"}</div>
                        <div class="field"><strong>${l.balOdenisli || "Bal (Ödənişli)"}:</strong> ${ixtisas.bal_pullu ?? "—"}</div>
                        <div class="extra-info" style="display: none;">
                          <div class="field"><strong>${l.tehsilFormasi || "Təhsil forması"}:</strong> ${tehsilFormasi}</div>
                          <div class="field"><strong>${l.altQrup || "Alt qrup"}:</strong>${ixtisas.alt_qrup ?? " — "}</div>
                        </div>
                        <a href="#" class="toggle-more" onclick="toggleMore(this); return false;" data-state="collapsed">${l.dahaCox || "Daha çox"}</a>
                      </div>`;
              });
          });
      });
  
      cardContainer.innerHTML = html;
      tableContainer.style.display = "none";
      cardContainer.style.display = "block";
} else {
        let html = "";
        data.forEach(group => {
            group.universitetler.forEach(univ => {
                html += `<div class="uni-basliq">${lang === "en" && univ.universitet_en ? univ.universitet_en : univ.universitet}</div>`;
                html += `
                <table>
                    <thead>
                        <tr>
                            <th>${l.ixtisas || "İxtisas"}</th>
                            <th>${l.tehsilFormasi || "Təhsil forması"}</th>
                            <th>${l.dil || "Dil"}</th>
                            <th>${l.altQrup || "Alt qrup"}</th>
                            <th>${l.balOdenissiz || "Bal (Ödənişsiz)"}</th>
                            <th>${l.balOdenisli || "Bal (Ödənişli)"}</th>
                        </tr>
                    </thead>
                    <tbody>
                `;
                univ.ixtisaslar.forEach((ixtisas, idx) => {
                    let tehsilFormasi = lang === "en" && ixtisas.tehsil_formasi_en
                        ? ixtisas.tehsil_formasi_en
                        : ixtisas.tehsil_formasi;
                    html += `
                    <tr class="${idx % 2 === 0 ? "even-row" : ""}">
                        <td>${lang === "en" && ixtisas.ad_en ? ixtisas.ad_en : ixtisas.ad}</td>
                        <td>${tehsilFormasi}</td>
                        <td>${lang == "en" && ixtisas.dil_en ? ixtisas.dil_en : ixtisas.dil}</td>
                        <td>${ixtisas.alt_qrup ?? "—"}</td>
                        <td>${ixtisas.bal_pulsuz ?? "—"}</td>
                        <td>${ixtisas.bal_pullu ?? "—"}</td>
                    </tr>`;
                });
                html += "</tbody></table>";
            });
        });
        tableContainer.innerHTML = html;
        cardContainer.style.display = "none";
        tableContainer.style.display = "block";
    }
}


    
function applyFilters() {
    let e = getCurrentFilters(),
        a = filterData(globalData, e),
        t = 0;
    a.forEach(e => {
        e.universitetler.forEach(e => {
            t += e.ixtisaslar.length
        })
    });
    let i = document.getElementById("resultCount"),
        l = document.getElementById("resultNumber"),
        n = JSON.stringify(e) !== JSON.stringify({
            searchValue: "",
            tehsilValue: "",
            dilValue: "",
            altValue: "",
            locationValue: "",
            minScore: 0,
            maxScore: 700
        });
    n ? (l.textContent = t, i.style.display = "inline") : i.style.display = "none";

    let r = localStorage.getItem("selectedLanguage") || "az";
    renderData(a, r);
    setupEventListeners();
    changeLanguage(r);
}

function getCurrentFilters() {
    return {
        searchValue: document.getElementById("search").value.trim().toLowerCase(),
        tehsilValue: document.getElementById("tehsilSelect").value,
        dilValue: document.getElementById("dilSelect").value,
        altValue: document.getElementById("altSelect").value,
        locationValue: document.getElementById("locationSelect").value,
        minScore: parseInt(document.getElementById("minScore").value) || 0,
        maxScore: parseInt(document.getElementById("maxScore").value) || 700
    }
}
function filterData(data, {
    searchValue,
    tehsilValue,
    dilValue,
    altValue,
    locationValue,
    minScore,
    maxScore
}) {
    if (!data) return [];

    const selectedLang = localStorage.getItem("selectedLanguage") || "az";

    return data.map(group => {
        let filteredUniversities = group.universitetler.map(univ => {
            if (locationValue && !univ.yer.toLowerCase().includes(locationValue.toLowerCase())) return null;

            let filteredIxtisaslar = univ.ixtisaslar.filter(ixtisas => {
                // Filtrlər
                if ((tehsilValue && ixtisas.tehsil_formasi !== tehsilValue) ||
                    (dilValue && ixtisas.dil !== dilValue) ||
                    (altValue && ixtisas.alt_qrup !== altValue)) return false;

                // Bal filtiri
                let bal_pulsuz = ixtisas.bal_pulsuz !== null && ixtisas.bal_pulsuz !== undefined ? parseInt(ixtisas.bal_pulsuz) : null;
                let bal_pullu = ixtisas.bal_pullu !== null && ixtisas.bal_pullu !== undefined ? parseInt(ixtisas.bal_pullu) : null;

                let balUygun = true;
                if (minScore !== null || maxScore !== null) {
                    balUygun = false;
                
                    if (bal_pulsuz !== null) {
                        if ((minScore === null || bal_pulsuz >= minScore) && (maxScore === null || bal_pulsuz <= maxScore)) {
                            balUygun = true;
                        }
                    }
                } 
                
                let searchText = searchValue.toLowerCase();
                let adAz = ixtisas.ad.toLowerCase();
                let adEn = ixtisas.ad_en ? ixtisas.ad_en.toLowerCase() : "";

                let axtarisUygun = !searchText || (selectedLang === "en" ? adEn.includes(searchText) : adAz.includes(searchText));

                return balUygun && axtarisUygun;
            });

            if (filteredIxtisaslar.length === 0) return null;

            return { ...univ, ixtisaslar: filteredIxtisaslar };
        }).filter(Boolean);

        if (filteredUniversities.length === 0) return null;

        return { ...group, universitetler: filteredUniversities };
    }).filter(Boolean);
}
document.addEventListener('DOMContentLoaded', () => {
  const abituriyentMenu = document.getElementById('abituriyent-menu');
  const abituriyentHeader = document.querySelector('[onclick*="abituriyent-menu"] .arrow');
  
  if (abituriyentMenu && abituriyentHeader) {
      abituriyentMenu.classList.add('open');
      abituriyentHeader.textContent = 'v';
  }

  if (window.innerWidth <= 768) {
      const filterBar = document.querySelector(".filter-bar");
      const filterToggleBtn = document.getElementById("filterToggleBtn");

      if (filterBar && filterToggleBtn) {
          const span = filterToggleBtn.querySelector("span");
          const img = filterToggleBtn.querySelector("img");

          filterBar.style.display = "none";

          filterToggleBtn.addEventListener("click", () => {
              const lang = localStorage.getItem("selectedLanguage") || "az";
              const isOpen = filterBar.style.display === "block";
              
              filterBar.style.display = isOpen ? "none" : "block";
              span.textContent = isOpen ? "Filter" : (translations[lang]?.closeFilterText || "Bağla");
              img.style.display = isOpen ? "inline" : "none";
          });
      }
  }
});


if (window.location.pathname.endsWith("1ciqrup.html") || 
  window.location.pathname.endsWith("2ciqrup.html") ||
  window.location.pathname.endsWith("3ciqrup.html") ||
  window.location.pathname.endsWith("4ciqrup.html") ||
  window.location.pathname.endsWith("specializations.html")){

  const revealBox = document.getElementById("secret-reveal");
  let startY = 0;
  let maxHeight = 120;
  let isAtBottom = false;

  // səhifənin ən altına çatdığını yoxla
  window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = window.innerHeight;
  isAtBottom = (scrollTop + clientHeight >= scrollHeight - 2);
  });

  // barmağı aşağı dartmağa başla
  window.addEventListener("touchstart", (e) => {
    if (isAtBottom) startY = e.touches[0].clientY;
  });

  // barmaqla dartma
  window.addEventListener("touchmove", (e) => {
    if (!isAtBottom) return;

    let diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      let move = Math.min(diff, maxHeight);
      revealBox.style.height = move + "px";
    }
  });

  // buraxanda geri qayıt
  window.addEventListener("touchend", () => {
    revealBox.style.height = "0px";
  });

  }


// -------------------------------

// "Daha çox / Daha az" funksiyası
function toggleMore(btn) {
  const content = btn.previousElementSibling;
  const lang = localStorage.getItem("selectedLanguage") || "az";
  const isCollapsed = btn.getAttribute("data-state") === "collapsed";

  if (isCollapsed) {
      content.style.display = "block";
      btn.textContent = translations[lang].dahaAz || "Daha az";
      btn.setAttribute("data-state", "expanded");
  } else {
      content.style.display = "none";
      btn.textContent = translations[lang].dahaCox || "Daha çox";
      btn.setAttribute("data-state", "collapsed");
  }
}


function changeLanguage(e) {
    let a = document.querySelectorAll("[data-i18n]");
    a.forEach(a => {
        let t = a.getAttribute("data-i18n");
        translations[e][t] && (a.innerText = translations[e][t])
    });
    let t = document.querySelector("[data-i18n-placeholder]");
    if (t) {
        let i = t.getAttribute("data-i18n-placeholder");
        translations[e][i] && t.setAttribute("placeholder", translations[e][i])
    }
}
document.getElementById("language-selector")?.addEventListener("change", function() {
    let e = this.value;
    localStorage.setItem("selectedLanguage", e);
    location.reload();
});

window.addEventListener("DOMContentLoaded", () => {
    let e = localStorage.getItem("selectedLanguage") || "az";
    const langSelector = document.getElementById("language-selector");
    
    // Dil seçici varsa dəyəri mənimsət
    if (langSelector) {
        langSelector.value = e;
    }
    
    // Funksiyaların mövcudluğunu yoxla
    if (typeof changeLanguage === "function") changeLanguage(e);
    
    // filteredData və ya originalData mövcuddursa render et
    const dataToRender = (typeof filteredData !== 'undefined' ? filteredData : (typeof originalData !== 'undefined' ? originalData : null));
    if (typeof renderData === "function" && dataToRender) {
        renderData(dataToRender);
    }
});

const tableContainer = document.getElementById("table-container"),
    cardContainer = document.getElementById("card-container"),
    isMobile = () => window.innerWidth <= 768;

function setupTableView() {
    // Əgər tableContainer yoxdursa və ya rowHeight təyin edilməyibsə funksiyanı dayandır
    if (!tableContainer || typeof rowHeight === 'undefined') return;

    let e = document.createElement("table"),
        a = document.createElement("thead");
    e.appendChild(a);
    let t = document.createElement("tbody");
    e.appendChild(t);
    tableContainer.appendChild(e);

    // rowHeight-in varlığı yuxarıda yoxlanıldı
    let i = Math.ceil(tableContainer.clientHeight / rowHeight) + 5;

    function l(e) {
        let a = document.createElement("tr");
        a.style.height = rowHeight + "px";
        return a;
    }

    function n(e) {
        t.innerHTML = "";
        let a = document.createDocumentFragment();
        // totalRows-un da varlığını yoxlayaq (default 0)
        let total = typeof totalRows !== 'undefined' ? totalRows : 0;
        
        for (let n = e; n < e + i && n < total; n++) {
            a.appendChild(l(n));
        }
        t.appendChild(a);
    }

    n(0);
    tableContainer.addEventListener("scroll", function e() {
        let a = tableContainer.scrollTop,
            t = Math.floor(a / rowHeight);
        n(t);
    });
}
function setupCardView() {
    cardContainer.innerHTML = "";
    for (let e = 0; e < totalRows; e++) {
        let a = document.createElement("div");
        a.className = "card-item", cardContainer.appendChild(a)
    }
} 

function renderView() {
    isMobile() ? (tableContainer.style.display = "none", cardContainer.style.display = "block", setupCardView()) : (cardContainer.style.display = "none", tableContainer.style.display = "block", setupTableView())
}
let currentIsMobile = isMobile();
window.addEventListener("resize", () => {
    let e = isMobile();
    e !== currentIsMobile && (currentIsMobile = e, renderView())
});
function scrollToQrup(qrupId, clickedBtn) {
    // Bütün qrup bloklarını gizlət
    document.querySelectorAll(".qrup-blok").forEach(block => {
      block.classList.remove("active");
    });
  
    // Aktiv qrupu göstər
    const target = document.getElementById(qrupId);
    if (target) {
      target.classList.add("active");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  
    // Bütün butonlardan 'active' class-ını sil
    document.querySelectorAll(".qrup-btn").forEach(btn => {
      btn.classList.remove("active");
    });
  
    // Kliklənən butona 'active' class əlavə et
    if (clickedBtn) {
      clickedBtn.classList.add("active");
    }
  }
  
  
  window.addEventListener("DOMContentLoaded", () => {
    const firstBtn = document.querySelector(".qrup-btn");
    scrollToQrup("qrup1", firstBtn);
  });
  
  function hesablaQrup1() {
    const isMobile = window.innerWidth <= 768;
    let toplam = 0;
  
    const elements = isMobile
      ? document.querySelectorAll("#qrup1 .mobile-card")
      : document.querySelectorAll("#qrup1 .qiymetlendirme tbody tr");
  
    elements.forEach((el, index) => {
      const dogruInput = el.querySelector(".dogru");
      const yanlisInput = el.querySelector(".yanlis");
      const acikKodInput = el.querySelector(".acik-kod");
      const acikYaziliInput = el.querySelector(".acik-yazili");
  
      let dogru = parseFloat(dogruInput?.value) || 0;
      let yanlis = parseFloat(yanlisInput?.value) || 0;
      let acikKod = parseFloat(acikKodInput?.value) || 0;
      let acikYazili = parseFloat(acikYaziliInput?.value) || 0;
  
      // Limit yoxlamaları və inputa tətbiq
      if (dogru + yanlis > 22) {
        if (dogru > yanlis) dogru = 22 - yanlis;
        else yanlis = 22 - dogru;
      }
      dogruInput.value = dogru;
      yanlisInput.value = yanlis;
  
      if (acikKod > 5) acikKod = 5;
      if (acikYazili > 3) acikYazili = 3;
  
      if (acikKod + acikYazili > 8) {
        if (acikKod > acikYazili) acikKod = 8 - acikYazili;
        else acikYazili = 8 - acikKod;
      }
  
      acikKodInput.value = acikKod;
      acikYaziliInput.value = acikYazili;
  
      // Hesablamalar rəsmi düstura əsasən
      const NBqRaw = (dogru - yanlis / 4);
      const NBq = Math.max(0, (100 / 33) * NBqRaw);
      const NBa = (100 / 33) * (acikKod + 2 * acikYazili);
      let netice = NBq + NBa;
  
      // Əmsal tətbiqi: ilk iki fənn 1.5 əmsalla
      if (index === 0 || index === 1) {
        netice *= 1.5;
      }
  
      netice = Math.round(netice * 10) / 10;
      toplam += netice;
  
      // Nəticəni göstər
      if (isMobile) {
        const result = el.querySelector(".netice");
        if (result) result.textContent = netice.toFixed(1) + " bal";
      } else {
        const resultCell = el.querySelector("td:last-child p");
        if (resultCell) resultCell.textContent = netice.toFixed(1) + " bal";
      }
    });
  
    // Ümumi nəticəni göstər
    const toplamNetice = document.getElementById("umumi-netice");
    if (toplamNetice) {
      toplamNetice.textContent = toplam.toFixed(1) + " bal";
    }
  }
  
  
  const qrupFennleri = {
    qrup1: ["Riyaziyyat", "Fizika", "Kimya / Informatika"],
    qrup2: ["Riyaziyyat", "Coğrafiya", "Tarix"],
    qrup3: ["Azərbaycan dili", "Tarix", "Ədəbiyyat / Coğrafiya"],
    qrup4: ["Riyaziyyat", "Biologiya", "Kimya"],
    qrup5: ["Azərbaycan dili", "Riyaziyyat", "Xarici dil"]
  };
  
  function qrupuYenile(qrupId) {
    if (qrupId === "qrup5") return;
  
    // Bütün qrup bloklarını gizlət
    document.querySelectorAll(".qrup-blok").forEach(block => {
      block.style.display = "none";
    });
  
    // Aktiv qrup blokunu göstər
    const activeDiv = document.getElementById("qrup1");
    if (activeDiv) {
      activeDiv.style.display = "block";
    }
  
    // Buton aktivlik
    document.querySelectorAll(".qrup-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    const btnById = [...document.querySelectorAll(".qrup-btn")].find(btn => btn.getAttribute('data-qrup-id') === qrupId);
    if (btnById) btnById.classList.add("active");
  
    // Başlıq
    const basliq = document.getElementById("qrup-basliq");
    if (!basliq) return;
      basliq.textContent = btnById ? btnById.textContent + " üzrə balların hesablanması" : "";
  
    // Cədvəl və ya kart konteyneri
    const tbody = document.getElementById("qiymetlendirme-body");
    if (!tbody) return;
    tbody.innerHTML = "";
  
    const fennler = qrupFennleri[qrupId] || [];
  
    const isMobile = window.innerWidth <= 768;
  
    fennler.forEach((fennAdı, index) => {
      if (isMobile) {
        // 📱 Mobil görünüş (kart stilində)
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.innerHTML = `
          <div class="mobile-card">
            <strong>${fennAdı}</strong><br><br>

            <div class="form-row">
              <label data-i18n="thqapalidogru">Qapalı - Doğru sayı:</label>
              <input min="0" max="30" class="dogru" placeholder="0" oninput="hesablaQrup1()">
            </div>

            <div class="form-row">
              <label data-i18n="thqapaliyanlis">Qapalı - Yanlış sayı:</label>
              <input min="0" max="30" class="yanlis" placeholder="0" oninput="hesablaQrup1()">
            </div>

            <div class="form-row">
              <label data-i18n="thacikkod">Açıq - Kodlaşdırılan:</label>
              <input min="0" max="5" class="acik-kod" placeholder="0" oninput="hesablaQrup1()">
            </div>

            <div class="form-row">
              <label data-i18n="thaciqyazili">Açıq - Yazılı (Ətraflı):</label>
              <input min="0" max="9" class="acik-yazili" placeholder="0" oninput="hesablaQrup1()">
            </div>

            <p class="netice" data-i18n="thnetice">0 Bal</p>
          </div>
        `;

        row.appendChild(cell);
        tbody.appendChild(row);
      } else {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${fennAdı}</td>
          <td><input min="0" max="30" class="dogru" placeholder="0" oninput="hesablaQrup1()"/></td>
          <td><input min="0" max="30" class="yanlis" placeholder="0" oninput="hesablaQrup1()"/></td>
          <td><input min="0" max="5" class="acik-kod" placeholder="0" oninput="hesablaQrup1()"/></td>
          <td><input min="0" max="9" class="acik-yazili" placeholder="0" oninput="hesablaQrup1()"/></td>
          <td><p class="netice">0 Bal</p></td>
        `;
        tbody.appendChild(row);
      }
    });
  
    // Ümumi nəticə
    const umumiRow = document.createElement("tr");
    umumiRow.className = "umumi-netice-row";
    umumiRow.innerHTML = `
      <td colspan="${isMobile ? 1 : 5}" style="text-align: right;"><strong>Ümumi nəticə:</strong></td>
      <td><p id="umumi-netice">0 bal</p></td>
    `;
    tbody.appendChild(umumiRow);
  }
  
  
  function qrupuYenileBuraxilis() {
    // Bütün qrup bloklarını gizlət
    document.querySelectorAll(".qrup-blok").forEach(block => {
      block.style.display = "none";
    });
  
    // Buraxılış blokunu göstər
    const buraxilisDiv = document.getElementById("buraxilis");
    if (buraxilisDiv) {
      buraxilisDiv.style.display = "block";
    }
  
    // Bütün butonlardan 'active' class-ını sil
    document.querySelectorAll(".qrup-btn").forEach(btn => {
      btn.classList.remove("active");
    });
  
    // Aktiv butona class əlavə et
    const clickedBtn = [...document.querySelectorAll(".qrup-btn")]
      .find(btn => btn.getAttribute("data-qrup-id") === "qrup5");
    if (clickedBtn) clickedBtn.classList.add("active");
  
    // Cədvəli doldur
    const tbody = document.getElementById("buraxilis-body");
    tbody.innerHTML = "";
  
    const isMobile = window.innerWidth <= 768;
  
    const fennler = [
      { ad: "Azərbaycan dili", hasKod: false, kodBal: 0, yaziliBal: 5, qapaliBal: 2.5 },
      { ad: "Riyaziyyat", hasKod: true, kodBal: 3.1, yaziliBal: 6.3, qapaliBal: 3.1 },
      { ad: "Xarici dil", hasKod: false, kodBal: 0, yaziliBal: 5.4, qapaliBal: 2.7 }
    ];
  
    fennler.forEach((fenn, index) => {
      if (isMobile) {
        // 📱 Mobil görünüş (kart)
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.innerHTML = `
          <div class="mobile-card">
            <strong>${fenn.ad}</strong><br><br>

            <div class="form-row">
              <label data-i18n="thqapalidogru">Qapalı - Doğru sayı:</label>
              <input min="0" max="30" class="qapali" placeholder="0" data-index="${index}" oninput="hesablaBuraxilis()">
            </div>

            ${fenn.hasKod ? `
            <div class="form-row">
              <label>Açıq - Kodlaşdırılan:</label>
              <input min="0" max="5" class="kod" placeholder="0" data-index="${index}" oninput="hesablaBuraxilis()">
            </div>
            ` : ''}

            <div class="form-row">
              <label>Açıq - Yazılı (Ətraflı):</label>
              <input min="0" max="5" class="yazili" placeholder="0" data-index="${index}" oninput="hesablaBuraxilis()">
            </div>

            <p class="netice-hucresi">0 bal</p>
          </div>
        `;

        row.appendChild(cell);
        tbody.appendChild(row);
      } else {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${fenn.ad}</td>
          <td><input min="0" max="30" class="qapali" placeholder="0" data-index="${index}" oninput="hesablaBuraxilis()"/></td>
          ${fenn.hasKod ? `<td><input min="0" max="5" class="kod" placeholder="0" data-index="${index}" oninput="hesablaBuraxilis()"/></td>` : `<td>-</td>`}
          <td><input min="0" max="5" class="yazili" placeholder="0" data-index="${index}" oninput="hesablaBuraxilis()"/></td>
          <td><p class="netice-hucresi">0 bal</p></td>
        `;
        tbody.appendChild(row);
      }
    });
  
    const umumiRow = document.createElement("tr");
    umumiRow.className = "umumi-netice-row";
    umumiRow.innerHTML = `
      <td colspan="${isMobile ? 1 : 4}" style="text-align: right;"><strong>Ümumi nəticə:</strong></td>
      <td><p id="umumi-netice-buraxilis">0 bal</p></td>
    `;
    tbody.appendChild(umumiRow);
  }
  
  function hesablaBuraxilis() {
    const isMobile = window.innerWidth <= 768;
    let toplam = 0;
  
    const selector = isMobile
      ? "#buraxilis .mobile-card"
      : "#buraxilis-body tr";
  
    const items = document.querySelectorAll(selector);
  
    items.forEach((item) => {
      const fənnAdı = isMobile
        ? item.querySelector("strong")?.textContent?.trim()
        : item.querySelector("td")?.textContent?.trim();
  
      const qapaliInput = item.querySelector(".qapali");
      const yaziliInput = item.querySelector(".yazili");
      const kodInput = item.querySelector(".kod");
  
      let qapali = parseFloat(qapaliInput?.value) || 0;
      let yazili = parseFloat(yaziliInput?.value) || 0;
      let kod = parseFloat(kodInput?.value) || 0;
  
      // ✅ Limitlər
      if (fənnAdı === "Azərbaycan dili") {
        if (qapali > 20) { qapali = 20; qapaliInput.value = 20; }
        if (yazili > 10) { yazili = 10; yaziliInput.value = 10; }
      } else if (fənnAdı === "Riyaziyyat") {
        if (qapali > 13) { qapali = 13; qapaliInput.value = 13; }
        if (kod > 5)     { kod = 5; kodInput.value = 5; }
        if (yazili > 7)  { yazili = 7; yaziliInput.value = 7; }
      } else if (fənnAdı === "Xarici dil") {
        if (qapali > 23) { qapali = 23; qapaliInput.value = 23; }
        if (yazili > 7)  { yazili = 7; yaziliInput.value = 7; }
      }
  
      // ✅ Hesablama
      let bal = 0;
      if (fənnAdı === "Azərbaycan dili") {
        const maxTotal = 30; // 20 qapalı + 10 açıq
        const faktikiTotal = qapali + yazili;
        bal = (faktikiTotal / maxTotal) * 100;
      } else if (fənnAdı === "Riyaziyyat") {
        const maxTotal = 25; // 13 qapalı + 5 kod + 7 yazılı
        const faktikiTotal = qapali + kod + yazili;
        bal = (faktikiTotal / maxTotal) * 100;
      } else if (fənnAdı === "Xarici dil") {
        const maxTotal = 30; // 23 qapalı + 7 açıq
        const faktikiTotal = qapali + yazili;
        bal = (faktikiTotal / maxTotal) * 100;
      }
  
      bal = Math.round(bal * 10) / 10;
      toplam += bal;
  
      const resultCell = item.querySelector(".netice-hucresi");
      if (resultCell) resultCell.textContent = bal.toFixed(1) + " bal";
    });
  
    const neticeP = document.getElementById("umumi-netice-buraxilis");
    if (neticeP) {
      neticeP.textContent = toplam.toFixed(1) + " bal";
    }
  }
  
  
  function qrupSec(qrupId, clickedBtn) {
    // Bütün blokları gizlət
    document.querySelectorAll(".qrup-blok").forEach(block => {
      block.style.display = "none";
    });
  
    // Bütün butonlardan aktiv class-ı sil
    document.querySelectorAll(".qrup-btn").forEach(btn => {
      btn.classList.remove("active");
    });
  
    // Aktiv qrupu göstər
    const target = document.getElementById(qrupId);
    if (target) {
      target.style.display = "block";
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  
    // Aktiv butonu vurğula
    if (clickedBtn) {
      clickedBtn.classList.add("active");
    }
  
    // Əgər buraxılışdırsa fərqli funksiyanı çağır
    if (qrupId === "qrup5") {
      qrupuYenileBuraxilis(qrupId);
    } else {
      qrupuYenile(qrupId);
    }
  }
  window.addEventListener("DOMContentLoaded", () => {
    const firstBtn = document.querySelectorAll(".qrup-btn")[0];
    qrupSec('qrup1', firstBtn);
  });
  
// Specializations ------------------------------------------------------------------------------------------------------------------

function renderDataSpec(data, lang = "az") {
  const container = document.getElementById("specializations-body"); 
  if (!container) return;

  const language = localStorage.getItem("selectedLanguage") || lang;

  container.innerHTML = "";

  const listWrapper = document.createElement("div");
  listWrapper.className = "specialization-list";

  data.forEach(item => {
    const title = document.createElement("div");
    title.className = "specialization-title";
    title.style.cursor = "pointer";
    title.style.marginTop = "15px";
    title.style.fontWeight = "bold";

    const description = document.createElement("div");
    description.className = "specialization-description";
    description.style.display = "none";
    description.style.marginBottom = "10px";

    if (language === "az") {
      title.textContent = item.key;
      description.textContent = item.az;
    } else {
      title.textContent = item.k_en;
      description.textContent = item.en;
    }

    title.addEventListener("click", () => {
      const isVisible = description.style.display === "block";
      description.style.display = isVisible ? "none" : "block";
    });

    listWrapper.appendChild(title);
    listWrapper.appendChild(description);
  });

  container.appendChild(listWrapper);
}

function loadSpecializations() {
  fetch("qruplar_info.json")
      .then(response => {
          if (!response.ok) {
              throw new Error("JSON faylı yüklənə bilmədi");
          }
          return response.json();
      })
      .then(data => {
          globalData = data;
          const lang = localStorage.getItem("selectedLanguage") || "az";
          renderDataSpec(globalData, lang);
      })
      .catch(error => {
          console.error("Xəta baş verdi:", error);
      });
}

document.addEventListener("DOMContentLoaded", () => {
  // DƏYİŞDİRİLƏN HİSSƏ: Body class-ı yoxlamaq əvəzinə #specializations-body ID-sini yoxlayırıq.
  // Əgər bu element səhifədə yoxdursa, kod işləməyəcək (başqa səhifələrdə xəta verməməsi üçün).
  const container = document.getElementById("specializations-body");
  if (!container) return; 

  const searchInput = document.getElementById("search");
  const searchBtn = document.getElementById("searchBtn");
  const langSelector = document.getElementById("language-selector");

  if (!langSelector || !searchInput || !searchBtn) {
    console.warn("Zəruri elementlər tapılmadı. Kod dayandırıldı.");
    return;
  }

  const selectedLanguage = localStorage.getItem("selectedLanguage") || "az";
  langSelector.value = selectedLanguage;

  changeLanguage(selectedLanguage);
  loadSpecializations();  // ✅ istifadə olunur

  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  langSelector.addEventListener("change", () => {
    const newLang = langSelector.value;
    localStorage.setItem("selectedLanguage", newLang);
    changeLanguage(newLang);
    renderDataSpec(globalData, newLang);
  });
});

function handleSearch() {
  const query = document.getElementById("search").value.trim().toLowerCase();
  const lang = localStorage.getItem("selectedLanguage") || "az";

  if (!query) {
      renderDataSpec(globalData, lang); // Show all if input is empty
      return;
  }

  const filteredData = globalData.filter(item => {
      if (lang === "en") {
          return item.k_en.toLowerCase().includes(query);
      } else {
          return item.key.toLowerCase().includes(query);
      }
  });

  renderDataSpec(filteredData, lang);
}
// Ixtisas Sec Frame


let tempIxtisasData = null;
document.getElementById("ixtisassec").addEventListener("click", function() {
  document.getElementById("ixtisasFrame").style.display = "flex";
  document.getElementById("main-content").style.overflowY = "none";
});
document.getElementById("closeFrame").addEventListener("click", function() {
  document.getElementById("ixtisasFrame").style.display = "none";
});
const selectedContainer = document.querySelector(".selected-cards");

for (let i = 0; i < 15; i++) {
  const wrapper = document.createElement("div");
  wrapper.className = "selected-card-wrapper";

  const index = document.createElement("div");
  index.className = "card-index";
  index.textContent = `${i + 1}.`;

  const card = document.createElement("div");
  card.className = "selected-card";
  card.dataset.index = i;

  // "+" düyməsi və onclick funksiyası
  card.innerHTML = `
    <button class="plus-btn" onclick="openIxtisasSelection(${i})">+</button>
  `;

  wrapper.appendChild(index);
  wrapper.appendChild(card);
  selectedContainer.appendChild(wrapper);
}

function openIxtisasSelection(cardIndex) {
  window.activeCardIndex = cardIndex;
  document.getElementById("ixtisaslar").style.display = "flex";
  renderIxtisasSelection(); 
}


function renderIxtisasSelection() {
  const container = document.querySelector(".ixtisaslar-content");
  container.innerHTML = `
    <h2>İxtisas seçimi</h2>
    <div class="searchIxtisas">
      <input type="text" id="searchIxtisasInput" placeholder="Axtar...">
      <button id="searchIxtisasBtn">Axtar</button>
    </div>
    <div id="ixtisasList"></div>
  `;

  const searchInput = document.getElementById("searchIxtisasInput");
  const listContainer = document.getElementById("ixtisasList");

  const lang = localStorage.getItem("selectedLanguage") || "az";
  const l = translations[lang] || {};

  function renderList(filter = "") {
    listContainer.innerHTML = "";

    globalData.forEach(group => {
      group.universitetler.forEach(univ => {
        const filteredIxtisaslar = univ.ixtisaslar.filter(ixtisas => {
          const ad = lang === "en" && ixtisas.ad_en ? ixtisas.ad_en : ixtisas.ad;
          return ad.toLowerCase().includes(filter.toLowerCase());
        });

        if (filteredIxtisaslar.length > 0) {
          const uniTitle = document.createElement("div");
          uniTitle.className = "uni-basliq";
          uniTitle.textContent = (lang === "en" && univ.universitet_en)
            ? univ.universitet_en
            : univ.universitet;
          listContainer.appendChild(uniTitle);

          filteredIxtisaslar.forEach(ixtisas => {
            const tehsilFormasi = lang === "en" && ixtisas.tehsil_formasi_en
              ? ixtisas.tehsil_formasi_en
              : ixtisas.tehsil_formasi;

            const ixtisasStr = lang === "en" && ixtisas.ad_en ? ixtisas.ad_en : ixtisas.ad;

            // Kart elementi
            const card = document.createElement("div");
            card.className = "card";

            // Kartın içindəki HTML
            card.innerHTML = `
              <div class="field"><strong>${l.ixtisas || "İxtisas"}:</strong> ${ixtisasStr}</div>
              <div class="field"><strong>${l.dil || "Dil"}:</strong> ${lang === "en" && ixtisas.dil_en ? ixtisas.dil_en : ixtisas.dil}</div>
              <div class="field"><strong>${l.balOdenissiz || "Bal (Ödənişsiz)"}:</strong> ${ixtisas.bal_pulsuz ?? "—"}</div>
              <div class="field"><strong>${l.balOdenisli || "Bal (Ödənişli)"}:</strong> ${ixtisas.bal_pullu ?? "—"}</div>
              <div class="field"><strong>${l.tehsilFormasi || "Təhsil forması"}:</strong> ${tehsilFormasi}</div>
            `;

            // Footer və button əlavə et
            const footer = document.createElement("div");
            footer.className = "card-footer";

            const button = document.createElement("button");
            button.className = "select-btn";
            button.textContent = l.seç || "Seç";
            
            
            button.addEventListener("click", () => {
              selectIxtisas(ixtisas, univ.universitet, window.activeCardIndex);
            });

            footer.appendChild(button);
            card.appendChild(footer);
            listContainer.appendChild(card);
          });
        }
      });
    });
  }

  // İlk dəfə tam siyahını göstər
  renderList();
  const searchBtn = document.getElementById("searchIxtisasBtn");

  searchBtn.addEventListener("click", () => {
    const value = searchInput.value.trim();
    renderList(value);
  });

  
}
function selectIxtisas(ixtisas, universitet, cardIndex) {
  tempIxtisasData = {
    ixtisas: ixtisas,
    universitet: universitet,
    cardIndex: cardIndex
  };

  if (!window.selectedIxtisaslar) window.selectedIxtisaslar = [];

  window.selectedIxtisaslar.push({
    ixtisas,
    universitet,
    cardIndex
  });

  document.getElementById("paymentModal").style.display = "flex";
}

function handlePaymentChoice(choice) {
  const selectedCard = document.querySelector(`.selected-card[data-index='${tempIxtisasData.cardIndex}']`);
  const ixtisas = tempIxtisasData.ixtisas;
  const universitet = tempIxtisasData.universitet;

  const lang = localStorage.getItem("selectedLanguage") || "az";
  const l = translations[lang] || {};
  const tehsilFormasi = lang === "en" && ixtisas.tehsil_formasi_en ? ixtisas.tehsil_formasi_en : ixtisas.tehsil_formasi;
  const chosenBal = choice === 'odenissiz' ? ixtisas.bal_pulsuz : ixtisas.bal_pullu;
  const odemeStr = choice === 'odenissiz' ? (l.odenissiz || "Ödənişsiz") : (l.odenisli || "Ödənişli");

  selectedCard.innerHTML = `
    <div class="selected-ixtisas" onclick="openIxtisasSelection(${tempIxtisasData.cardIndex})" style="cursor: pointer;">
      <strong>${l.universitet || "Universitet"}:</strong> ${universitet}<br>
      <strong>${l.ixtisas || "İxtisas"}:</strong> ${ixtisas.ad}<br>
      <strong>${l.dil || "Dil"}:</strong> ${ixtisas.dil}<br>
      <strong>${l.tehsilFormasi || "Təhsil forması"}:</strong> ${tehsilFormasi}<br>
      <strong>${odemeStr} ${l.bal || "bal"}:</strong> ${chosenBal ?? "—"}
    </div>
  `;

  document.getElementById("paymentModal").style.display = "none";
  document.getElementById("ixtisaslar").style.display = "none";
}
const closeBtn = document.getElementById("closeixtisaslarFrame");

if (closeBtn) {
  closeBtn.addEventListener("click", function() {
    const targetFrame = document.getElementById("ixtisaslar");

    if (targetFrame) {
      targetFrame.style.display = "none";
    }
  });
}