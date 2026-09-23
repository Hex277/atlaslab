(function () {
    // HTML elementlərinin tam yüklənməsini gözləyirik
    document.addEventListener("DOMContentLoaded", () => {
        const mesajGirdisi = document.getElementById('mesajGirdisi');
        const tryItDuymesi = document.getElementById('tryItDuymesi');
        const copyDuymesi = document.getElementById('copyDuymesi');

        // Elementlər səhifədə yoxdursa skriptin xəta verməməsi üçün yoxlama
        if (!mesajGirdisi || !tryItDuymesi || !copyDuymesi) {
            return;
        }

        let aiCavabi = "";
        const API_KEY = "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";

        tryItDuymesi.addEventListener('click', async (event) => {
            // Başqa skriptlərin klik hadisəsinə müdaxilə etməməsi üçün
            if (event) event.stopPropagation();

            const mesaj = mesajGirdisi.value.trim();
            if (mesaj === "") return;

            tryItDuymesi.textContent = "trying...";
            copyDuymesi.style.backgroundColor = "";
            aiCavabi = "";

            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "user", content: mesaj }
                        ]
                    })
                });

                if (!response.ok) {
                    const xetaMelumati = await response.json();
                    console.error("OpenAI API Xətası:", xetaMelumati);
                    return;
                }

                const data = await response.json();

                if (data.choices && data.choices[0] && data.choices[0].message.content) {
                    aiCavabi = data.choices[0].message.content;
                    copyDuymesi.style.backgroundColor = "lightgreen";
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
                
                // Kopyalandıqdan sonra rəngi sıfırlayırıq:
                copyDuymesi.style.backgroundColor = ""; 
            }
        });
    });
})();