const input = document.getElementById("cmd");

/* =====================================================
   VOICE + NLP COMMAND
   ===================================================== */

async function send() {

    const text = input.value.trim();

    if (!text) return;

    const command = text.toLowerCase();

    const result = document.getElementById("result");

    if (result)
        result.textContent = "Processing...";


    // Open browser tab BEFORE async request
    let browserTab = null;

    if (
        command.includes("open youtube") ||
        command === "youtube"
    ) {
        browserTab = window.open("about:blank", "_blank");
    }

    else if (
        command.includes("open google") ||
        command === "google"
    ) {
        browserTab = window.open("about:blank", "_blank");
    }

    else if (
        command.includes("open github") ||
        command === "github"
    ) {
        browserTab = window.open("about:blank", "_blank");
    }

    else if (
        command.includes("open whatsapp") ||
        command === "whatsapp"
    ) {
        browserTab = window.open("about:blank", "_blank");
    }


    try {

        const response = await fetch(
            "/api/command",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    text: text
                })
            }
        );


        const data = await response.json();


        if (!data.ok) {

            if (result)
                result.textContent =
                    data.error || "Command failed";

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
                data.intent || "—";


        if (conf)
            conf.textContent =
                Math.round(
                    (data.confidence || 0) * 100
                ) + "%";


        if (entities)
            entities.textContent =
                JSON.stringify(
                    data.entities || {}
                );


        if (action)
            action.textContent =
                data.action || "—";


        if (result)
            result.textContent =
                data.result || "Done";


        /* Browser navigation */

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


    } catch (error) {

        console.error(error);

        if (result)
            result.textContent =
                "Server connection error";
    }
}


/* =====================================================
   QUICK COMMANDS
   ===================================================== */

function quick(text) {

    input.value = text;

    send();
}


/* =====================================================
   VOICE RECOGNITION
   ===================================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let recognition = null;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart = function () {

        const voice =
            document.getElementById("voice");

        if (voice)
            voice.textContent =
                "🎤 LISTENING...";
    };


    recognition.onresult =
        function (event) {

            const spokenText =
                event.results[0][0]
                    .transcript;

            console.log(
                "Voice:",
                spokenText
            );

            input.value =
                spokenText;

            send();
        };


    recognition.onerror =
        function (event) {

            console.error(
                "Voice error:",
                event.error
            );

            const voice =
                document.getElementById("voice");

            if (voice)
                voice.textContent =
                    "🎤 VOICE ERROR: " +
                    event.error;
        };


    recognition.onend =
        function () {

            const voice =
                document.getElementById("voice");

            if (voice)
                voice.textContent =
                    "🎤 VOICE READY";
        };


    const voiceButton =
        document.getElementById("voiceBtn");


    if (voiceButton) {

        voiceButton.onclick =
            function () {

                try {

                    recognition.start();

                } catch (error) {

                    console.log(
                        "Recognition already running"
                    );
                }
            };
    }


} else {

    const voice =
        document.getElementById("voice");

    if (voice)
        voice.textContent =
            "🎤 VOICE NOT SUPPORTED";


    const voiceButton =
        document.getElementById("voiceBtn");

    if (voiceButton)
        voiceButton.textContent =
            "Use Google Chrome";
}


/* =====================================================
   CAMERA
   ===================================================== */

let cameraStream = null;

let cameraRunning = false;

let hands = null;

let detecting = false;


/* =====================================================
   START CAMERA
   ===================================================== */

async function startCamera() {

    const video =
        document.getElementById("camera");

    const status =
        document.getElementById("cameraStatus");

    const indicator =
        document.getElementById("cam");


    if (!video) return;


    if (cameraStream) {

        status.textContent =
            "🟢 Camera already running";

        return;
    }


    try {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            status.textContent =
                "❌ Camera not supported";

            return;
        }


        status.textContent =
            "📷 Requesting camera permission...";


        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    width: {
                        ideal: 640
                    },

                    height: {
                        ideal: 480
                    },

                    facingMode: "user"
                },

                audio: false
            });


        video.srcObject =
            cameraStream;


        await video.play();


        cameraRunning = true;


        status.textContent =
            "🟢 Camera ON";


        if (indicator)
            indicator.textContent =
                "✋ CAMERA ON";


        await loadMediaPipe();


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );


        cameraStream = null;

        cameraRunning = false;


        if (
            error.name ===
            "NotAllowedError"
        ) {

            status.textContent =
                "🔴 Camera permission denied";

        }

        else if (
            error.name ===
            "NotFoundError"
        ) {

            status.textContent =
                "🔴 Camera not found";

        }

        else {

            status.textContent =
                "🔴 Camera error";
        }


        if (indicator)
            indicator.textContent =
                "✋ CAMERA OFF";
    }
}


/* =====================================================
   STOP CAMERA
   ===================================================== */

function stopCamera() {

    const video =
        document.getElementById("camera");

    const status =
        document.getElementById("cameraStatus");

    const indicator =
        document.getElementById("cam");


    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        cameraStream = null;
    }


    cameraRunning = false;


    if (video)
        video.srcObject = null;


    if (status)
        status.textContent =
            "⚪ Camera stopped";


    if (indicator)
        indicator.textContent =
            "✋ CAMERA OFF";
}


/* =====================================================
   MEDIAPIPE
   ===================================================== */

function loadMediaPipe() {

    return new Promise(
        function (resolve, reject) {

            if (window.Hands) {

                initializeHands();

                resolve();

                return;
            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";


            script.onload =
                function () {

                    initializeHands();

                    resolve();
                };


            script.onerror =
                function () {

                    reject(
                        new Error(
                            "MediaPipe failed to load"
                        )
                    );
                };


            document.head.appendChild(
                script
            );
        }
    );
}


/* =====================================================
   INITIALIZE HANDS
   ===================================================== */

function initializeHands() {

    if (hands) return;


    hands =
        new Hands({

            locateFile:
                function (file) {

                    return (
                        "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
                        file
                    );
                }
        });


    hands.setOptions({

        maxNumHands: 1,

        modelComplexity: 1,

        minDetectionConfidence: 0.6,

        minTrackingConfidence: 0.6
    });


    hands.onResults(
        onHandResults
    );


    detectHands();
}


/* =====================================================
   DETECT HANDS
   ===================================================== */

async function detectHands() {

    if (!cameraRunning) {

        setTimeout(
            detectHands,
            500
        );

        return;
    }


    if (
        !hands ||
        detecting
    ) {

        requestAnimationFrame(
            detectHands
        );

        return;
    }


    const video =
        document.getElementById(
            "camera"
        );


    if (
        video &&
        video.readyState >= 2
    ) {

        detecting = true;

        try {

            await hands.send({
                image: video
            });

        } catch (error) {

            console.log(
                "Hand detection error:",
                error
            );
        }

        detecting = false;
    }


    requestAnimationFrame(
        detectHands
    );
}


/* =====================================================
   HAND RESULT
   ===================================================== */

function onHandResults(results) {

    const gestureElement =
        document.getElementById(
            "gesture"
        );


    if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
    ) {

        if (gestureElement)
            gestureElement.textContent =
                "No hand detected";

        return;
    }


    const landmarks =
        results.multiHandLandmarks[0];


    const gesture =
        detectGesture(
            landmarks
        );


    if (gestureElement)
        gestureElement.textContent =
            gesture;


    performGesture(
        gesture
    );
}


/* =====================================================
   FINGER DETECTION
   ===================================================== */

function isFingerUp(
    landmarks,
    tip,
    pip
) {

    return (
        landmarks[tip].y <
        landmarks[pip].y
    );
}


/* =====================================================
   GESTURE DETECTION
   ===================================================== */

function detectGesture(
    landmarks
) {

    const index =
        isFingerUp(
            landmarks,
            8,
            6
        );


    const middle =
        isFingerUp(
            landmarks,
            12,
            10
        );


    const ring =
        isFingerUp(
            landmarks,
            16,
            14
        );


    const pinky =
        isFingerUp(
            landmarks,
            20,
            18
        );


    if (
        index &&
        middle &&
        ring &&
        pinky
    ) {

        return "OPEN PALM";
    }


    if (
        index &&
        middle &&
        !ring &&
        !pinky
    ) {

        return "TWO FINGERS";
    }


    if (
        index &&
        !middle &&
        !ring &&
        !pinky
    ) {

        return "INDEX FINGER";
    }


    if (
        !index &&
        !middle &&
        !ring &&
        !pinky
    ) {

        return "FIST";
    }


    if (
        index &&
        middle &&
        ring &&
        !pinky
    ) {

        return "THREE FINGERS";
    }


    return "UNKNOWN";
}


/* =====================================================
   GESTURE ACTION
   ===================================================== */

let lastGesture =
    "";

let lastGestureTime =
    0;


function performGesture(
    gesture
) {

    const now =
        Date.now();


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


    const action =
        document.getElementById(
            "gaction"
        );


    if (
        gesture ===
        "TWO FINGERS"
    ) {

        window.scrollBy({

            top: -350,

            behavior: "smooth"
        });


        if (action)
            action.textContent =
                "⬆️ Scroll Up";
    }


    else if (
        gesture ===
        "INDEX FINGER"
    ) {

        window.scrollBy({

            top: 350,

            behavior: "smooth"
        });


        if (action)
            action.textContent =
                "⬇️ Scroll Down";
    }


    else if (
        gesture ===
        "OPEN PALM"
    ) {

        if (action)
            action.textContent =
                "🔊 Volume Up";
    }


    else if (
        gesture ===
        "THREE FINGERS"
    ) {

        if (action)
            action.textContent =
                "🔉 Volume Down";
    }


    else if (
        gesture ===
        "FIST"
    ) {

        if (action)
            action.textContent =
                "🔇 Mute";
    }
}


/* =====================================================
   STARTUP
   ===================================================== */

window.addEventListener(
    "load",
    function () {

        console.log(
            "NLP-OS loaded"
        );

        const voice =
            document.getElementById(
                "voice"
            );

        if (
            voice &&
            SpeechRecognition
        ) {

            voice.textContent =
                "🎤 VOICE READY";
        }

    }
);
