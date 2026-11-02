(function () {
    document.addEventListener("DOMContentLoaded", () => {
        const mesajGirdisi = document.getElementById('mesajGirdisi');
        const tryItDuymesi = document.getElementById('tryItDuymesi');
        const copyDuymesi = document.getElementById('copyDuymesi');

        if (!mesajGirdisi || !tryItDuymesi || !copyDuymesi) {
            return;
        }

        let aiCavabi = "";

        const SUPABASE_URL = "https://xoebhhdirsvjorjlrfzi.supabase.co";
        const SUPABASE_KEY = "sb_publishable_FpT1VBCd5NKEnrYQbmx9Gw_MqWxVMvN";

        tryItDuymesi.addEventListener('click', async (event) => {
            if (event) event.stopPropagation();

            const mesaj = mesajGirdisi.value.trim();
            if (mesaj === "") return;

            tryItDuymesi.textContent = "trying...";
            copyDuymesi.style.backgroundColor = "";
            aiCavabi = "";

            try {
                const response = await fetch(`${SUPABASE_URL}/functions/v1/openai-proxy`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${SUPABASE_KEY}`
                    },
                    body: JSON.stringify({ mesaj: mesaj })
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error("Server xətası:", data);
                    return;
                }

                if (data.choices && data.choices[0] && data.choices[0].message.content) {
                    aiCavabi = data.choices[0].message.content;
                    copyDuymesi.style.backgroundColor = "lightgreen";
                } else {
                    console.error("Gözlənilməz cavab strukturu:", data);
                }
            } catch (xeta) {
                console.error("Şəbəkə və ya sorğu xətası:", xeta);
            } finally {
                tryItDuymesi.textContent = "try it";
            }
        });

        copyDuymesi.addEventListener('click', (event) => {
            if (event) event.stopPropagation();

            if (aiCavabi !== "") {
                navigator.clipboard.writeText(aiCavabi);
                copyDuymesi.style.backgroundColor = "";
            }
        });
    });
})();