const input = document.getElementById("cmd");

/* =====================================================
   VOICE + NLP COMMAND
   ===================================================== */

async function send() {

    const text = input.value.trim();

    if (!text) return;

    const command = text.toLowerCase();

    const result = document.getElementById("result");

    if (result) {
        result.textContent = "Processing...";
    }

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

            if (result) {
                result.textContent =
                    data.error || "Command failed";
            }

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

        if (intent) {
            intent.textContent =
                data.intent || "—";
        }

        if (conf) {
            conf.textContent =
                Math.round(
                    (data.confidence || 0) * 100
                ) + "%";
        }

        if (entities) {
            entities.textContent =
                JSON.stringify(
                    data.entities || {}
                );
        }

        if (action) {
            action.textContent =
                data.action || "—";
        }

        if (result) {
            result.textContent =
                data.result || "Done";
        }

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

    }

    catch (error) {

        console.error(error);

        if (result) {
            result.textContent =
                "Server connection error";
        }
    }
}


/* =====================================================
   QUICK COMMAND
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

        if (voice) {
            voice.textContent =
                "🎤 LISTENING...";
        }
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

            if (voice) {
                voice.textContent =
                    "🎤 VOICE ERROR: " +
                    event.error;
            }
        };

    recognition.onend =
        function () {

            const voice =
                document.getElementById("voice");

            if (voice) {
                voice.textContent =
                    "🎤 VOICE READY";
            }
        };

    const voiceButton =
        document.getElementById("voiceBtn");

    if (voiceButton) {

        voiceButton.onclick =
            function () {

                try {

                    recognition.start();

                }

                catch (error) {

                    console.log(
                        "Recognition already running"
                    );
                }
            };
    }

}

else {

    const voice =
        document.getElementById("voice");

    if (voice) {
        voice.textContent =
            "🎤 VOICE NOT SUPPORTED";
    }

    const voiceButton =
        document.getElementById("voiceBtn");

    if (voiceButton) {
        voiceButton.textContent =
            "Use Google Chrome";
    }
}


/* =====================================================
   CAMERA + HAND LANDMARKER
   ===================================================== */

let cameraStream = null;

let cameraRunning = false;

let handLandmarker = null;

let handModelLoading = false;

let animationId = null;

let lastVideoTime = -1;

let lastGesture = "";

let lastGestureTime = 0;


/* =====================================================
   MEDIAPIPE TASKS VISION
   ===================================================== */

async function loadHandLandmarker() {

    if (handLandmarker) {
        return true;
    }

    if (handModelLoading) {
        return false;
    }

    handModelLoading = true;

    const status =
        document.getElementById(
            "cameraStatus"
        );

    try {

        if (status) {
            status.textContent =
                "⏳ Loading hand AI model...";
        }

        /*
         * Load MediaPipe Tasks Vision
         */

        if (!window.FilesetResolver) {

            await loadScript(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.js"
            );
        }

        const vision =
            await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
            );

        /*
         * Create Hand Landmarker
         */

        handLandmarker =
            await HandLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {

                        modelAssetPath:
                            "/hand_landmarker.task",

                        delegate: "GPU"
                    },

                    runningMode: "VIDEO",

                    numHands: 1,

                    minHandDetectionConfidence: 0.5,

                    minHandPresenceConfidence: 0.5,

                    minTrackingConfidence: 0.5
                }
            );

        handModelLoading = false;

        if (status) {
            status.textContent =
                "🟢 Camera ON • Hand AI READY";
        }

        console.log(
            "MediaPipe Hand Landmarker ready"
        );

        return true;

    }

    catch (error) {

        handModelLoading = false;

        console.error(
            "Hand Landmarker error:",
            error
        );

        if (status) {

            status.textContent =
                "🔴 Hand AI failed to load";
        }

        return false;
    }
}


/* =====================================================
   LOAD EXTERNAL SCRIPT
   ===================================================== */

function loadScript(src) {

    return new Promise(
        function (resolve, reject) {

            const script =
                document.createElement(
                    "script"
                );

            script.src = src;

            script.onload =
                function () {
                    resolve();
                };

            script.onerror =
                function () {

                    reject(
                        new Error(
                            "Could not load: " + src
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
   START CAMERA
   ===================================================== */

async function startCamera() {

    const video =
        document.getElementById("camera");

    const status =
        document.getElementById(
            "cameraStatus"
        );

    const indicator =
        document.getElementById("cam");

    if (!video) {
        return;
    }

    if (cameraStream) {

        if (status) {
            status.textContent =
                "🟢 Camera already running";
        }

        return;
    }

    try {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            if (status) {
                status.textContent =
                    "❌ Camera not supported";
            }

            return;
        }

        if (status) {
            status.textContent =
                "📷 Requesting camera permission...";
        }

        cameraStream =
            await navigator.mediaDevices.getUserMedia(
                {
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
                }
            );

        video.srcObject =
            cameraStream;

        video.muted = true;

        video.playsInline = true;

        await video.play();

        cameraRunning = true;

        if (indicator) {
            indicator.textContent =
                "✋ CAMERA ON";
        }

        if (status) {
            status.textContent =
                "⏳ Camera ON • Loading Hand AI...";
        }

        /*
         * Load hand model
         */

        const ready =
            await loadHandLandmarker();

        if (!ready) {
            return;
        }

        /*
         * Start detection
         */

        lastVideoTime = -1;

        detectHands();

    }

    catch (error) {

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

            if (status) {
                status.textContent =
                    "🔴 Camera permission denied";
            }
        }

        else if (
            error.name ===
            "NotFoundError"
        ) {

            if (status) {
                status.textContent =
                    "🔴 Camera not found";
            }
        }

        else {

            if (status) {
                status.textContent =
                    "🔴 Camera error";
            }
        }

        if (indicator) {
            indicator.textContent =
                "✋ CAMERA OFF";
        }
    }
}


/* =====================================================
   STOP CAMERA
   ===================================================== */

function stopCamera() {

    const video =
        document.getElementById("camera");

    const status =
        document.getElementById(
            "cameraStatus"
        );

    const indicator =
        document.getElementById("cam");

    if (animationId) {

        cancelAnimationFrame(
            animationId
        );

        animationId = null;
    }

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                function (track) {
                    track.stop();
                }
            );

        cameraStream = null;
    }

    cameraRunning = false;

    lastVideoTime = -1;

    if (video) {
        video.srcObject = null;
    }

    if (status) {
        status.textContent =
            "⚪ Camera stopped";
    }

    if (indicator) {
        indicator.textContent =
            "✋ CAMERA OFF";
    }

    const gesture =
        document.getElementById(
            "gesture"
        );

    const action =
        document.getElementById(
            "gaction"
        );

    if (gesture) {
        gesture.textContent =
            "Waiting...";
    }

    if (action) {
        action.textContent =
            "—";
    }
}


/* =====================================================
   HAND DETECTION LOOP
   ===================================================== */

function detectHands() {

    if (!cameraRunning) {
        return;
    }

    const video =
        document.getElementById(
            "camera"
        );

    if (
        !video ||
        !handLandmarker
    ) {

        animationId =
            requestAnimationFrame(
                detectHands
            );

        return;
    }

    if (
        video.readyState >=
        HTMLMediaElement.HAVE_CURRENT_DATA
    ) {

        /*
         * Only process a new video frame
         */

        if (
            video.currentTime !==
            lastVideoTime
        ) {

            lastVideoTime =
                video.currentTime;

            try {

                const results =
                    handLandmarker.detectForVideo(
                        video,
                        performance.now()
                    );

                processHandResults(
                    results
                );

            }

            catch (error) {

                console.error(
                    "Detection error:",
                    error
                );
            }
        }
    }

    animationId =
        requestAnimationFrame(
            detectHands
        );
}


/* =====================================================
   PROCESS HAND RESULTS
   ===================================================== */

function processHandResults(
    results
) {

    const gestureElement =
        document.getElementById(
            "gesture"
        );

    if (
        !results ||
        !results.landmarks ||
        results.landmarks.length === 0
    ) {

        if (gestureElement) {

            gestureElement.textContent =
                "No hand detected";
        }

        return;
    }

    /*
     * First detected hand
     */

    const landmarks =
        results.landmarks[0];

    const gesture =
        detectGesture(
            landmarks
        );

    if (gestureElement) {

        gestureElement.textContent =
            gesture;
    }

    performGesture(
        gesture
    );
}


/* =====================================================
   DISTANCE BETWEEN TWO LANDMARKS
   ===================================================== */

function distance(a, b) {

    const dx =
        a.x - b.x;

    const dy =
        a.y - b.y;

    const dz =
        (a.z || 0) -
        (b.z || 0);

    return Math.sqrt(
        dx * dx +
        dy * dy +
        dz * dz
    );
}


/* =====================================================
   FINGER UP DETECTION
   ===================================================== */

function isFingerUp(
    landmarks,
    tip,
    pip
) {

    /*
     * Camera image Y:
     * smaller Y = higher on screen
     */

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

    /*
     * Landmark indexes:
     *
     * Index:
     * tip 8 / pip 6
     *
     * Middle:
     * tip 12 / pip 10
     *
     * Ring:
     * tip 16 / pip 14
     *
     * Pinky:
     * tip 20 / pip 18
     */

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


    /*
     * Open Palm
     */

    if (
        index &&
        middle &&
        ring &&
        pinky
    ) {

        return "OPEN PALM";
    }


    /*
     * Three Fingers
     */

    if (
        index &&
        middle &&
        ring &&
        !pinky
    ) {

        return "THREE FINGERS";
    }


    /*
     * Two Fingers
     */

    if (
        index &&
        middle &&
        !ring &&
        !pinky
    ) {

        return "TWO FINGERS";
    }


    /*
     * Index Finger
     */

    if (
        index &&
        !middle &&
        !ring &&
        !pinky
    ) {

        return "INDEX FINGER";
    }


    /*
     * Fist
     */

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


/* =====================================================
   GESTURE ACTION
   ===================================================== */

function performGesture(
    gesture
) {

    const now =
        Date.now();

    /*
     * Prevent the same gesture
     * from firing continuously.
     */

    if (
        gesture === lastGesture &&
        now - lastGestureTime <
        1000
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


    /*
     * TWO FINGERS
     * Scroll UP
     */

    if (
        gesture ===
        "TWO FINGERS"
    ) {

        window.scrollBy(
            {
                top: -350,

                behavior: "smooth"
            }
        );

        if (action) {

            action.textContent =
                "⬆️ Scroll Up";
        }
    }


    /*
     * INDEX
     * Scroll DOWN
     */

    else if (
        gesture ===
        "INDEX FINGER"
    ) {

        window.scrollBy(
            {
                top: 350,

                behavior: "smooth"
            }
        );

        if (action) {

            action.textContent =
                "⬇️ Scroll Down";
        }
    }


    /*
     * OPEN PALM
     */

    else if (
        gesture ===
        "OPEN PALM"
    ) {

        if (action) {

            action.textContent =
                "🔊 Volume Up";
        }

        console.log(
            "Gesture Action: Volume Up"
        );
    }


    /*
     * THREE FINGERS
     */

    else if (
        gesture ===
        "THREE FINGERS"
    ) {

        if (action) {

            action.textContent =
                "🔉 Volume Down";
        }

        console.log(
            "Gesture Action: Volume Down"
        );
    }


    /*
     * FIST
     */

    else if (
        gesture ===
        "FIST"
    ) {

        if (action) {

            action.textContent =
                "🔇 Mute";
        }

        console.log(
            "Gesture Action: Mute"
        );
    }
}


/* =====================================================
   PAGE LOAD
   ===================================================== */

window.addEventListener(
    "load",
    function () {

        console.log(
            "NLP-OS Voice + Hand system loaded"
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

        const gesture =
            document.getElementById(
                "gesture"
            );

        if (gesture) {

            gesture.textContent =
                "Waiting...";
        }
    }
);
