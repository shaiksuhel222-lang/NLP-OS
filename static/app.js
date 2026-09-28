const input = document.getElementById("cmd");

/* =========================================================
   CAMERA + HAND GESTURE UI
   ========================================================= */

let cameraStream = null;
let handModel = null;
let cameraRunning = false;

function createCameraUI() {

    if (document.getElementById("browserCameraBox")) {
        return;
    }

    const box = document.createElement("div");

    box.id = "browserCameraBox";

    box.style.cssText = `
        margin:20px 0;
        padding:20px;
        border-radius:16px;
        background:#111827;
        color:white;
        text-align:center;
    `;

    box.innerHTML = `
        <h2>✋ Hand Gesture Control</h2>

        <video
            id="browserCamera"
            autoplay
            playsinline
            muted
            style="
                width:100%;
                max-width:500px;
                border-radius:15px;
                transform:scaleX(-1);
                background:black;
            ">
        </video>

        <div id="gestureResult"
             style="
                margin-top:12px;
                font-size:20px;
                font-weight:bold;
             ">
            Camera OFF
        </div>

        <button
            id="startCameraBtn"
            style="
                margin-top:12px;
                padding:12px 20px;
                border:none;
                border-radius:10px;
                cursor:pointer;
                font-size:16px;
            ">
            📷 Start Camera
        </button>
    `;

    const main =
        document.querySelector("main") ||
        document.body;

    main.appendChild(box);

    document
        .getElementById("startCameraBtn")
        .addEventListener("click", startBrowserCamera);
}


/* =========================================================
   START BROWSER CAMERA
   ========================================================= */

async function startBrowserCamera() {

    const video =
        document.getElementById("browserCamera");

    const status =
        document.getElementById("gestureResult");

    if (!video) return;

    try {

        cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: {
                        ideal: 640
                    },
                    height: {
                        ideal: 480
                    }
                },
                audio: false
            });

        video.srcObject = cameraStream;

        await video.play();

        cameraRunning = true;

        status.textContent =
            "📷 CAMERA ACTIVE — Show your hand";

        const btn =
            document.getElementById("startCameraBtn");

        if (btn)
            btn.textContent = "📷 Camera Running";

        startHandDetection();

    } catch (error) {

        console.error("Camera error:", error);

        status.textContent =
            "❌ Camera permission denied";

        alert(
            "Camera permission allow cheyyi bro.\n" +
            "Chrome address bar lo camera icon click chesi Allow cheyyi."
        );
    }
}


/* =========================================================
   LOAD MEDIAPIPE HANDS
   ========================================================= */

async function loadMediaPipe() {

    if (window.Hands) {
        return true;
    }

    return new Promise((resolve, reject) => {

        const script =
            document.createElement("script");

        script.src =
            "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";

        script.onload = () => {

            console.log(
                "MediaPipe Hands loaded"
            );

            resolve(true);
        };

        script.onerror = () => {

            console.error(
                "Could not load MediaPipe"
            );

            reject(
                new Error("MediaPipe load failed")
            );
        };

        document.head.appendChild(script);
    });
}


/* =========================================================
   HAND DETECTION
   ========================================================= */

async function startHandDetection() {

    const status =
        document.getElementById("gestureResult");

    try {

        await loadMediaPipe();

        handModel = new Hands({
            locateFile: (file) => {
                return (
                    "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
                    file
                );
            }
        });

        handModel.setOptions({

            maxNumHands: 1,

            modelComplexity: 1,

            minDetectionConfidence: 0.6,

            minTrackingConfidence: 0.6
        });

        handModel.onResults(
            processHandResults
        );

        detectFrame();

    } catch (error) {

        console.error(
            "Hand detection error:",
            error
        );

        if (status) {
            status.textContent =
                "❌ Hand detector failed";
        }
    }
}


/* =========================================================
   PROCESS CAMERA FRAMES
   ========================================================= */

async function detectFrame() {

    if (!cameraRunning) {
        return;
    }

    const video =
        document.getElementById("browserCamera");

    if (
        video &&
        video.readyState >= 2 &&
        handModel
    ) {

        try {

            await handModel.send({
                image: video
            });

        } catch (error) {

            console.log(
                "Frame error:",
                error
            );
        }
    }

    requestAnimationFrame(
        detectFrame
    );
}


/* =========================================================
   GESTURE DETECTION
   ========================================================= */

function processHandResults(results) {

    const status =
        document.getElementById("gestureResult");

    if (!status) return;

    if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
    ) {

        status.textContent =
            "✋ No hand detected";

        return;
    }

    const landmarks =
        results.multiHandLandmarks[0];

    const gesture =
        detectGesture(landmarks);

    status.textContent =
        "✋ Gesture: " + gesture;

    performGestureAction(gesture);
}


/* =========================================================
   FINGER CHECK
   ========================================================= */

function fingerUp(
    landmarks,
    tip,
    pip
) {

    return (
        landmarks[tip].y <
        landmarks[pip].y
    );
}


/* =========================================================
   DETECT GESTURE
   ========================================================= */

function detectGesture(landmarks) {

    const index =
        fingerUp(landmarks, 8, 6);

    const middle =
        fingerUp(landmarks, 12, 10);

    const ring =
        fingerUp(landmarks, 16, 14);

    const pinky =
        fingerUp(landmarks, 20, 18);

    const thumb =
        landmarks[4].x <
        landmarks[3].x;


    /* Open palm */

    if (
        index &&
        middle &&
        ring &&
        pinky
    ) {

        return "OPEN PALM";
    }


    /* Four fingers / volume up */

    if (
        index &&
        middle &&
        ring &&
        !pinky
    ) {

        return "VOLUME UP";
    }


    /* Two fingers */

    if (
        index &&
        middle &&
        !ring &&
        !pinky
    ) {

        return "SCROLL UP";
    }


    /* Index finger */

    if (
        index &&
        !middle &&
        !ring &&
        !pinky
    ) {

        return "SCROLL DOWN";
    }


    /* Thumb */

    if (
        thumb &&
        !index &&
        !middle &&
        !ring &&
        !pinky
    ) {

        return "THUMBS UP";
    }


    /* Fist */

    if (
        !index &&
        !middle &&
        !ring &&
        !pinky
    ) {

        return "FIST";
    }


    return "UNKNOWN";
}


/* =========================================================
   GESTURE ACTIONS
   ========================================================= */

let lastGesture = "";
let lastGestureTime = 0;

function performGestureAction(
    gesture
) {

    const now =
        Date.now();

    /* Prevent repeated actions */

    if (
        gesture === lastGesture &&
        now - lastGestureTime < 1200
    ) {
        return;
    }

    lastGesture =
        gesture;

    lastGestureTime =
        now;


    /* OPEN PALM */

    if (
        gesture === "OPEN PALM"
    ) {

        console.log(
            "OPEN PALM detected"
        );

        showAction(
            "✋ Open Palm → Browser action"
        );
    }


    /* VOLUME UP */

    else if (
        gesture === "VOLUME UP"
    ) {

        showAction(
            "🔊 Volume Up gesture detected"
        );
    }


    /* SCROLL UP */

    else if (
        gesture === "SCROLL UP"
    ) {

        window.scrollBy({
            top: -350,
            behavior: "smooth"
        });

        showAction(
            "⬆️ Scroll Up"
        );
    }


    /* SCROLL DOWN */

    else if (
        gesture === "SCROLL DOWN"
    ) {

        window.scrollBy({
            top: 350,
            behavior: "smooth"
        });

        showAction(
            "⬇️ Scroll Down"
        );
    }


    /* THUMBS UP */

    else if (
        gesture === "THUMBS UP"
    ) {

        showAction(
            "👍 Thumbs Up detected"
        );
    }


    /* FIST */

    else if (
        gesture === "FIST"
    ) {

        showAction(
            "✊ Fist detected"
        );
    }
}


/* =========================================================
   ACTION DISPLAY
   ========================================================= */

function showAction(
    message
) {

    console.log(message);

    const action =
        document.getElementById("gaction");

    if (action) {
        action.textContent =
            message;
    }
}


/* =========================================================
   COMMAND SYSTEM
   ========================================================= */

async function send() {

    const text =
        input.value.trim();

    if (!text) return;


    const command =
        text.toLowerCase();


    /*
       Open popup BEFORE async fetch.
       This prevents Chrome popup blocking.
    */

    let browserTab = null;


    if (
        command.includes("open youtube") ||
        command === "youtube"
    ) {

        browserTab =
            window.open(
                "about:blank",
                "_blank"
            );
    }


    if (
        command.includes("open google") ||
        command === "google"
    ) {

        browserTab =
            window.open(
                "about:blank",
                "_blank"
            );
    }


    if (
        command.includes("open github") ||
        command === "github"
    ) {

        browserTab =
            window.open(
                "about:blank",
                "_blank"
            );
    }


    if (
        command.includes("open whatsapp") ||
        command === "whatsapp"
    ) {

        browserTab =
            window.open(
                "about:blank",
                "_blank"
            );
    }


    const result =
        document.getElementById("result");

    if (result)
        result.textContent =
            "Processing...";


    try {

        const r =
            await fetch(
                "/api/command",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            text: text
                        })
                }
            );


        const d =
            await r.json();


        if (!d.ok) {

            if (result)
                result.textContent =
                    d.error ||
                    "Command failed";

            return;
        }


        const intent =
            document.getElementById("intent");

        const conf =
            document.getElementById("conf");

        const entities =
            document.getElementById("entities");

        const action =
            document.getElementById("action");


        if (intent)
            intent.textContent =
                d.intent || "—";


        if (conf)
            conf.textContent =
                Math.round(
                    (d.confidence || 0) * 100
                ) + "%";


        if (entities)
            entities.textContent =
                JSON.stringify(
                    d.entities || {}
                );


        if (action)
            action.textContent =
                d.action || "—";


        if (result)
            result.textContent =
                d.result || "Done";


        /* Browser actions */

        if (browserTab) {

            if (
                command.includes("youtube") ||
                command === "youtube"
            ) {

                browserTab.location.href =
                    "https://www.youtube.com";
            }

            else if (
                command.includes("google") ||
                command === "google"
            ) {

                browserTab.location.href =
                    "https://www.google.com";
            }

            else if (
                command.includes("github") ||
                command === "github"
            ) {

                browserTab.location.href =
                    "https://github.com";
            }

            else if (
                command.includes("whatsapp") ||
                command === "whatsapp"
            ) {

                browserTab.location.href =
                    "https://web.whatsapp.com";
            }
        }

    } catch (e) {

        console.error(e);

        if (result)
            result.textContent =
                "Server connection error";
    }
}


/* =========================================================
   QUICK COMMANDS
   ========================================================= */

function quick(text) {

    input.value =
        text;

    send();
}


/* =========================================================
   VOICE RECOGNITION
   ========================================================= */

const SR =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SR) {

    const rec =
        new SR();


    rec.lang =
        "en-IN";


    rec.continuous =
        false;


    rec.interimResults =
        false;


    rec.onstart = () => {

        const voice =
            document.getElementById("voice");

        if (voice)
            voice.textContent =
                "🎤 LISTENING...";
    };


    rec.onend = () => {

        const voice =
            document.getElementById("voice");

        if (voice)
            voice.textContent =
                "🎤 VOICE READY";
    };


    rec.onerror = (event) => {

        console.log(
            "Voice error:",
            event.error
        );

        const voice =
            document.getElementById("voice");

        if (voice)
            voice.textContent =
                "🎤 VOICE ERROR";
    };


    rec.onresult = (event) => {

        const text =
            event.results[0][0]
                .transcript;

        input.value =
            text;

        send();
    };


    const voiceBtn =
        document.getElementById(
            "voiceBtn"
        );


    if (voiceBtn) {

        voiceBtn.onclick = () => {

            try {

                rec.start();

            } catch (e) {

                console.log(e);
            }
        };
    }

} else {

    const voiceBtn =
        document.getElementById(
            "voiceBtn"
        );

    if (voiceBtn)
        voiceBtn.textContent =
            "Use Chrome for Voice";
}


/* =========================================================
   OLD SERVER GESTURE STATUS
   ========================================================= */

async function updateGestureStatus() {

    try {

        const response =
            await fetch(
                "/api/gesture-status"
            );

        const d =
            await response.json();


        const gesture =
            document.getElementById(
                "gesture"
            );


        const action =
            document.getElementById(
                "gaction"
            );


        const cam =
            document.getElementById(
                "cam"
            );


        /*
           Do not overwrite browser
           camera status.
        */

        if (gesture &&
            !cameraRunning) {

            gesture.textContent =
                d.gesture ||
                "Waiting...";
        }


        if (
            action &&
            !cameraRunning
        ) {

            action.textContent =
                d.action ||
                "—";
        }


        if (
            cam &&
            !cameraRunning
        ) {

            cam.textContent =
                d.running
                    ? "✋ CAMERA ACTIVE"
                    : "✋ BROWSER CAMERA READY";
        }

    } catch (e) {

        const cam =
            document.getElementById("cam");

        if (
            cam &&
            !cameraRunning
        ) {

            cam.textContent =
                "✋ BROWSER CAMERA READY";
        }
    }
}


/* =========================================================
   START
   ========================================================= */

createCameraUI();

setInterval(
    updateGestureStatus,
    1500
);

updateGestureStatus();
