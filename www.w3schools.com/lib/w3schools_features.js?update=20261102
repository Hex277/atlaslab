function displayInternalFeatures() {
  function addTryitSpaces(subject,spacesurl) {
    let spacesButt = document.createElement("a");
    spacesButt.innerHTML="Get your own " + subject + " Server"
    if (subject == "TypeScript") {
      if (innerWidth < 500) {
        spacesButt.innerHTML="Get your own TS Server";
      }
    }
    spacesButt.classList.add("ws-black", "ws-hover-black", "spaces-tryit", "ga-featured");
    spacesButt.href=spacesurl;
    spacesButt.setAttribute("title", "W3Schools Spaces");
    spacesButt.setAttribute("target", "_blank");

    var tryits = document.getElementsByClassName("w3-example");
    for (var i = 0; i < tryits.length; i++) {
      if (tryits[i].firstElementChild.nodeName == "H3") {
        tryits[i].firstElementChild.appendChild(spacesButt.cloneNode(true));
        break;
      }
    }
  }

  var uplink1 = "https://campus.w3schools.com/products/w3schools-full-access-course";
  var upclass1 = "ga-fa-nextmove";
  var upimgstart1 = "/images/img_fa_nextmove_";
  var upimgend1 = ".webp";
  var uplink4 = "https://campus.w3schools.com/collections/course-catalog";
  var upclass4 = "ga-2026-cert";
  var upimgstart4 = "/images/img_2026_cert_";
  var upimgend4 = ".webp";
  var upimgsubject4 = "";

  var upshowcase120 = document.getElementById("upperfeatureshowcase120");
  var upshowcase160 = document.getElementById("upperfeatureshowcase160");
  var upshowcase300 = document.getElementById("upperfeatureshowcase300");
  var upshowcase3001 = document.getElementById("upperfeatureshowcase3001");
  var upshowcaselink = document.getElementById("upperfeatureshowcaselink");

  switch (subjectFolder) {
    case "accessibility":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/accessibility-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "angular":
      addTryitSpaces("Angular","/angular/angular_server.asp");
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/certifications/products/angularjs-certificate";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "bash":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/certifications/products/bash-certification-exam";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "bootstrap":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-bootstrap-5";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "bootstrap4":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-bootstrap-5";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "bootstrap5":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-bootstrap-5";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "c":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-c";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "cpp":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/c-course-1";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "cs":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/c-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("C#","/cs/cs_server.php");
      break;
    case "css":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/css-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "cssref":
      upimgsubject4 = "css_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/css-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "cybersecurity":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/cyber-security-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "datascience":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/certifications/products/dsa-certification-exam";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "django":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-django";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("Django","/django/django_server.php");
      break;
    case "dsa":
      upimgsubject4 = "datascience_";
      uplink4 = "https://campus.w3schools.com/collections/certifications/products/dsa-certification-exam";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "excel":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-excel";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "git":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-git";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "go":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/certifications/products/go-certificate";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "html":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/html-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "java":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/java-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("Java","/java/java_server.asp");
      break;
    case "jquery":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/jquery-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "js":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/javascript-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "jsref":
      upimgsubject4 = "js_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/javascript-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "kotlin":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-kotlin";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "mongodb":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-mongodb";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "mysql":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-mysql-1";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("SQL","/sql/sql_server.asp");
      break;
    case "nodejs":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-node-js";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("Node.js","/nodejs/nodejs_server.asp");
      break;
    case "numpy":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/numpy-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("Python","/python/python_server.asp");
      break;
    case "pandas":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/pandas-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("Python","/python/python_server.asp");
      break;
    case "php":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/php-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("PHP","/php/php_server.asp");
      break;
    case "postgresql":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-postgresql";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "react":
      addTryitSpaces("React.js","/react/react_server.asp");
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/react-js-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "r":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/r-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "scipy":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-scipy";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("Python","/python/python_server.asp");
      break;
    case "sql":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/sql-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("SQL","/sql/sql_server.asp");
      break;
    case "statistics":
      addTryitSpaces("Python","/python/python_server.asp");
      break;
    case "tags":
      upimgsubject4 = "html_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/html-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "typescript":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-typescript";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("TypeScript","/spaces/");
      break;
    case "vue":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/learn-vue-js";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("Vue","/vue/vue_server.php");
      break;
    case "xml":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/xml-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      break;
    case "python":
      upimgsubject4 = subjectFolder + "_";
      uplink4 = "https://campus.w3schools.com/collections/course-catalog/products/python-course";
      upclass4 = "ga-2026-cert-" + subjectFolder;
      addTryitSpaces("Python","/python/python_server.asp");
      break;
  }

  var FULLACCESS_SHARE = 0.25;
  var CERT_SHARE = 0.25;
  var COURSE_SHARE = 0.25;

  var courseAds = [
    { name: "buildskills", alt: "W3Schools courses - build skills, get hired" },
    { name: "learnit",     alt: "W3Schools courses - learn it, get certified, get hired" }
  ];
  var courseLink = "https://campus.w3schools.com/collections/course-catalog";

  var appAds = [
    { name: "climb",       alt: "W3Schools app - someone is ahead of you in the weekly league" },
    { name: "grindxp",     alt: "W3Schools app - grind XP, not tutorials" },
    { name: "learntocode", alt: "W3Schools app - coding is an adventure" },
    { name: "streak",      alt: "W3Schools app - build a streak worth keeping" }
  ];
  var appLink = "https://www.w3schools.com/adventure/";

  upshowcaselink.className = "ga-right";

  var pictureEl = document.getElementById('upperfeatureshowcase');
  if (pictureEl) {
    pictureEl.style.display = 'block';
  }

  var adRnd = Math.random();
  if (adRnd < FULLACCESS_SHARE) {
    upshowcase120.srcset = upimgstart1 + "120" + upimgend1;
    upshowcase160.srcset = upimgstart1 + "160" + upimgend1;
    upshowcase300.src = upimgstart1 + "300" + upimgend1;
    upshowcase3001.srcset = upimgstart1 + "300" + upimgend1;
    upshowcase300.alt = "W3Schools Full Access - your next career move";
    upshowcaselink.href = uplink1;
    upshowcaselink.classList.add(upclass1);
  } else if (adRnd < FULLACCESS_SHARE + CERT_SHARE) {
    upshowcase120.srcset = upimgstart4 + upimgsubject4 + "120" + upimgend4;
    upshowcase160.srcset = upimgstart4 + upimgsubject4 + "160" + upimgend4;
    upshowcase300.src = upimgstart4 + upimgsubject4 + "300" + upimgend4;
    upshowcase3001.srcset = upimgstart4 + upimgsubject4 + "300" + upimgend4;
    upshowcase300.alt = "W3Schools Certificate";
    upshowcaselink.href = uplink4;
    upshowcaselink.classList.add(upclass4);
  } else if (adRnd < FULLACCESS_SHARE + CERT_SHARE + COURSE_SHARE) {
    var courseAd = courseAds[Math.floor(Math.random() * courseAds.length)];
    var courseImgStart = "/images/img_course_" + courseAd.name + "_";
    upshowcase120.srcset = courseImgStart + "120.webp";
    upshowcase160.srcset = courseImgStart + "160.webp";
    upshowcase300.src = courseImgStart + "300.webp";
    upshowcase3001.srcset = courseImgStart + "300.webp";
    upshowcase300.alt = courseAd.alt;
    upshowcaselink.href = courseLink;
    upshowcaselink.classList.add("ga-course-" + courseAd.name);
  } else {
    var appAd = appAds[Math.floor(Math.random() * appAds.length)];
    var appImgStart = "/images/app_" + appAd.name + "_";
    upshowcase120.srcset = appImgStart + "120.webp";
    upshowcase160.srcset = appImgStart + "160.webp";
    upshowcase300.src = appImgStart + "300.webp";
    upshowcase3001.srcset = appImgStart + "300.webp";
    upshowcase300.alt = appAd.alt;
    upshowcaselink.href = appLink;
    upshowcaselink.classList.add("ga-2026-app-" + appAd.name);
  }
}
