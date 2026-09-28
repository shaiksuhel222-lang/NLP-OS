const input = document.getElementById("cmd");

async function send() {
    const text = input.value.trim();
    if (!text) return;

    document.getElementById("result").textContent = "Processing...";

    try {
        const r = await fetch("/api/command", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text })
        });

        const d = await r.json();

        if (!d.ok) {
            document.getElementById("result").textContent =
                d.error || "Command failed";
            return;
        }

        document.getElementById("intent").textContent =
            d.intent || "—";

        document.getElementById("conf").textContent =
            Math.round((d.confidence || 0) * 100) + "%";

        document.getElementById("entities").textContent =
            JSON.stringify(d.entities || {});

        document.getElementById("action").textContent =
            d.action || "—";

        document.getElementById("result").textContent =
            d.result || "Done";

    } catch (e) {
        document.getElementById("result").textContent =
            "Server connection error";
        console.error(e);
    }
}


/* QUICK COMMAND */
function quick(t) {
    input.value = t;
    send();
}


/* =========================
   VOICE CONTROL
========================= */

const SR =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SR) {

    const rec = new SR();

    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
        const voice = document.getElementById("voice");

        if (voice)
            voice.textContent = "🎤 LISTENING...";
    };

    rec.onend = () => {
        const voice = document.getElementById("voice");

        if (voice)
            voice.textContent = "🎤 VOICE READY";
    };

    rec.onerror = (event) => {
        console.log("Voice error:", event.error);

        const voice = document.getElementById("voice");

        if (voice)
            voice.textContent = "🎤 VOICE ERROR";
    };

    rec.onresult = (event) => {

        const text =
            event.results[0][0].transcript;

        input.value = text;

        send();
    };

    const voiceBtn =
        document.getElementById("voiceBtn");

    if (voiceBtn) {
        voiceBtn.onclick = () => {

            try {
                rec.start();
            } catch (e) {
                console.log("Voice already running");
            }

        };
    }

} else {

    const voiceBtn =
        document.getElementById("voiceBtn");

    if (voiceBtn)
        voiceBtn.textContent =
            "Use Chrome for Voice";
}


/* =========================
   GESTURE STATUS
========================= */

async function updateGestureStatus() {

    try {

        const response =
            await fetch("/api/gesture-status");

        const d = await response.json();

        const gesture =
            document.getElementById("gesture");

        const action =
            document.getElementById("gaction");

        const cam =
            document.getElementById("cam");

        if (gesture)
            gesture.textContent =
                d.gesture || "Waiting...";

        if (action)
            action.textContent =
                d.action || "—";

        if (cam) {

            if (d.running) {
                cam.textContent =
                    "✋ CAMERA ACTIVE";
            } else {
                cam.textContent =
                    "✋ CAMERA OFFLINE";
            }

        }

    } catch (e) {

        const cam =
            document.getElementById("cam");

        if (cam)
            cam.textContent =
                "✋ CAMERA OFFLINE";

    }
}


setInterval(updateGestureStatus, 700);

updateGestureStatus();
