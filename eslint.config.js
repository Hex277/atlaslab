import globals from "globals";

export default [
    {
        languageOptions: {
            globals: {
                ...globals.browser, // document, window və s. tanıması üçün
                ...globals.node
            }
        },
        rules: {
            "no-unused-vars": "off", // İstifadə olunmayan dəyişənləri görməzdən gəl (çünki HTML-dən çağırılırlar)
            "no-undef": "warn",      // Tapılmayan dəyişənləri xəta yox, xəbərdarlıq et
            "no-console": "off"      // console.log-lara icazə ver
        }
    }
];