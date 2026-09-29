/* =========================================================
   NLP-OS — BROWSER VOICE + CAMERA + HAND GESTURES
   ========================================================= */

let input = null;

let handLandmarker = null;
let cameraStream = null;
let lastVideoTime = -1;

let lastGesture = "";
let lastGestureTime = 0;

let localAgentAvailable = false;

const GESTURE_COOLDOWN = 1000;


/* =========================================================
   ELEMENT INITIALIZATION
   ========================================================= */

function getElements() {
    input = document.getElementById("cmd");
}


/* =========================================================
   UPDATE NLP RESULT
   ========================================================= */

function showResult(data) {

    const intent = document.getElementById("intent");
    const conf = document.getElementById("conf");
    const entities = document.getElementById("entities");
    const action = document.getElementById("action");
    const result = document.getElementById("result");

    if (intent) {
        intent.textContent = data.intent || "—";
    }

    if (conf) {
        conf.textContent =
            data.confidence != null
                ? Math.round(data.confidence * 100) + "%"
                : "—";
    }

    if (entities) {
        entities.textContent =
            JSON.stringify(data.entities || {});
    }

    if (action) {
        action.textContent = data.action || "—";
    }

    if (result) {
        result.textContent =
            data.result || "Command processed.";
    }
}


/* =========================================================
   VOICE / TEXT COMMAND
   ========================================================= */

async function send() {

    if (!input) {
        getElements();
    }

    const result =
        document.getElementById("result");

    const text =
        input ? input.value.trim() : "";

    if (!text) {
        return;
    }

    if (result) {
        result.textContent =
            "Processing...";
    }

    const command =
        text.toLowerCase();


    /* -----------------------------------------------------
       OPEN YOUTUBE DIRECTLY IN VISITOR'S BROWSER
       ----------------------------------------------------- */

    if (
        command.includes("open youtube") ||
        command === "youtube"
    ) {

        const youtubeWindow =
            window.open(
                "https://www.youtube.com",
                "_blank"
            );

        if (youtubeWindow) {

            if (result) {
                result.textContent =
                    "YouTube opened.";
            }

        } else {

            if (result) {
                result.textContent =
                    "Browser blocked the new tab. Allow pop-ups for this site.";
            }
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
                "OPEN_WEBSITE";
        }

        if (conf) {
            conf.textContent =
                "100%";
        }

        if (entities) {
            entities.textContent =
                JSON.stringify({
                    website: "youtube"
                });
        }

        if (action) {
            action.textContent =
                "Open YouTube";
        }

        return;
    }


    /* -----------------------------------------------------
       TRY LOCAL WINDOWS AGENT
       ----------------------------------------------------- */

    const localSuccess =
        await sendToLocalAgent(text);

    if (localSuccess) {
        return;
    }


    /* -----------------------------------------------------
       FALLBACK TO RENDER SERVER
       ----------------------------------------------------- */

    try {

        const response =
            await fetch(
                "/api/command",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        text: text
                    })
                }
            );


        const data =
            await response.json();


        if (!data.ok) {

            if (result) {
                result.textContent =
                    data.error ||
                    "Command failed.";
            }

            return;
        }


        showResult(data);

    }

    catch (error) {

        console.error(
            "Server error:",
            error
        );

        if (result) {
            result.textContent =
                "Server connection error.";
        }
    }
}


/* =========================================================
   QUICK COMMAND BUTTONS
   ========================================================= */

function quick(text) {

    if (!input) {
        getElements();
    }

    if (input) {
        input.value = text;
    }

    send();
}


/* =========================================================
   LOCAL WINDOWS AGENT
   ========================================================= */

async function sendToLocalAgent(text) {

    try {

        const response =
            await fetch(
                "http://127.0.0.1:5001/api/command",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        text: text
                    })
                }
            );


        if (!response.ok) {

            localAgentAvailable = false;

            return false;
        }


        const data =
            await response.json();


        if (!data.ok) {

            localAgentAvailable = false;

            return false;
        }


        localAgentAvailable = true;

        showResult(data);

        return true;

    }

    catch (error) {

        localAgentAvailable = false;

        console.log(
            "Local Agent unavailable:",
            error
        );

        return false;
    }
}


/* =========================================================
   VOICE RECOGNITION
   ========================================================= */

function setupVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    const voiceButton =
        document.getElementById("voiceBtn");


    if (!SpeechRecognition) {

        if (voiceButton) {
            voiceButton.textContent =
                "Use Chrome for Voice";
        }

        return;
    }


    const recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    recognition.onstart = () => {

        const voice =
            document.getElementById("voice");

        if (voice) {
            voice.textContent =
                "🎤 LISTENING...";
        }
    };


    recognition.onend = () => {

        const voice =
            document.getElementById("voice");

        if (voice) {
            voice.textContent =
                "🎤 VOICE READY";
        }
    };


    recognition.onerror = (event) => {

        console.error(
            "Speech error:",
            event.error
        );

        const voice =
            document.getElementById("voice");

        if (voice) {
            voice.textContent =
                "🎤 VOICE READY";
        }
    };


    recognition.onresult = (event) => {

        const spoken =
            event.results[0][0].transcript;


        if (!input) {
            getElements();
        }


        if (input) {
            input.value = spoken;
        }


        console.log(
            "Voice command:",
            spoken
        );


        send();
    };


    if (voiceButton) {

        voiceButton.onclick = () => {

            try {
                recognition.start();
            }

            catch (error) {
                console.log(
                    "Recognition already running."
                );
            }
        };
    }
}


/* =========================================================
   MEDIAPIPE HAND LANDMARKER
   ========================================================= */

async function initHandLandmarker() {

    if (handLandmarker) {
        return;
    }


    console.log(
        "Loading MediaPipe..."
    );


    const vision =
        await import(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/+esm"
        );


    const FilesetResolver =
        vision.FilesetResolver;

    const HandLandmarker =
        vision.HandLandmarker;


    const fileset =
        await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm"
        );


    handLandmarker =
        await HandLandmarker.createFromOptions(
            fileset,
            {
                baseOptions: {

                    modelAssetPath:
                        "/hand_landmarker.task",

                    delegate:
                        "GPU"
                },

                runningMode:
                    "VIDEO",

                numHands:
                    1,

                minHandDetectionConfidence:
                    0.5,

                minHandPresenceConfidence:
                    0.5,

                minTrackingConfidence:
                    0.5
            }
        );


    console.log(
        "Hand Landmarker initialized successfully"
    );
}


/* =========================================================
   START CAMERA
   ========================================================= */

async function startCamera() {

    const video =
        document.getElementById("camera");

    const status =
        document.getElementById("cameraStatus");

    const cam =
        document.getElementById("cam");


    try {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            throw new Error(
                "Camera API not supported"
            );
        }


        if (status) {
            status.textContent =
                "📷 Starting camera...";
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

                        facingMode:
                            "user"
                    },

                    audio: false
                }
            );


        if (!video) {
            throw new Error(
                "Camera video element not found"
            );
        }


        video.srcObject =
            cameraStream;


        await video.play();


        if (cam) {
            cam.textContent =
                "✋ CAMERA ON";
        }


        if (status) {
            status.textContent =
                "🟢 Camera ON";
        }


        console.log(
            "Camera started successfully"
        );


        await initHandLandmarker();


        console.log(
            "Starting hand detection..."
        );


        lastVideoTime = -1;

        detectHands();

    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        if (status) {

            status.textContent =
                "❌ Camera Error: " +
                error.message;
        }


        if (cam) {
            cam.textContent =
                "✋ CAMERA OFF";
        }
    }
}


/* =========================================================
   STOP CAMERA
   ========================================================= */

function stopCamera() {

    const video =
        document.getElementById("camera");

    const status =
        document.getElementById("cameraStatus");

    const cam =
        document.getElementById("cam");


    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        cameraStream = null;
    }


    if (video) {
        video.srcObject = null;
    }


    if (cam) {
        cam.textContent =
            "✋ CAMERA OFF";
    }


    if (status) {
        status.textContent =
            "📷 Camera OFF";
    }


    const gesture =
        document.getElementById("gesture");

    if (gesture) {
        gesture.textContent =
            "Waiting...";
    }


    const action =
        document.getElementById("gaction");

    if (action) {
        action.textContent =
            "—";
    }


    console.log(
        "Camera stopped"
    );
}


/* =========================================================
   FINGER DETECTION
   ========================================================= */

function fingerExtended(
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
   GESTURE CLASSIFICATION
   ========================================================= */

function classifyGesture(landmarks) {

    if (
        !landmarks ||
        landmarks.length < 21
    ) {
        return "";
    }


    const index =
        fingerExtended(
            landmarks,
            8,
            6
        );


    const middle =
        fingerExtended(
            landmarks,
            12,
            10
        );


    const ring =
        fingerExtended(
            landmarks,
            16,
            14
        );


    const pinky =
        fingerExtended(
            landmarks,
            20,
            18
        );


    /* THUMB UP */

    const thumbUp =
        landmarks[4].y <
        landmarks[3].y &&
        !index &&
        !middle &&
        !ring &&
        !pinky;


    if (thumbUp) {
        return "Thumb Up";
    }


    /* OPEN PALM */

    if (
        index &&
        middle &&
        ring &&
        pinky
    ) {
        return "Open Palm";
    }


    /* THREE FINGERS */

    if (
        index &&
        middle &&
        ring &&
        !pinky
    ) {
        return "Three Fingers";
    }


    /* TWO FINGERS */

    if (
        index &&
        middle &&
        !ring &&
        !pinky
    ) {
        return "Two Fingers";
    }


    /* INDEX */

    if (
        index &&
        !middle &&
        !ring &&
        !pinky
    ) {
        return "Index Finger";
    }


    /* FIST */

    if (
        !index &&
        !middle &&
        !ring &&
        !pinky
    ) {
        return "Fist";
    }


    return "";
}


/* =========================================================
   HAND DETECTION LOOP
   ========================================================= */

function detectHands() {

    const video =
        document.getElementById("camera");


    if (
        !video ||
        !handLandmarker
    ) {

        requestAnimationFrame(
            detectHands
        );

        return;
    }


    if (
        video.readyState < 2
    ) {

        requestAnimationFrame(
            detectHands
        );

        return;
    }


    const currentTime =
        video.currentTime;


    if (
        currentTime !== lastVideoTime
    ) {

        lastVideoTime =
            currentTime;


        try {

            const results =
                handLandmarker.detectForVideo(
                    video,
                    performance.now()
                );


            if (
                results &&
                results.landmarks &&
                results.landmarks.length > 0
            ) {

                const landmarks =
                    results.landmarks[0];


                const gesture =
                    classifyGesture(
                        landmarks
                    );


                if (gesture) {

                    const gestureElement =
                        document.getElementById(
                            "gesture"
                        );


                    if (gestureElement) {

                        gestureElement.textContent =
                            gesture;
                    }


                    /* IMPORTANT:
                       use performGesture()
                       consistently
                    */

                    performGesture(
                        gesture
                    );
                }

            }

            else {

                const gestureElement =
                    document.getElementById(
                        "gesture"
                    );


                if (gestureElement) {

                    gestureElement.textContent =
                        "No hand";
                }
            }

        }

        catch (error) {

            console.error(
                "Hand detection error:",
                error
            );
        }
    }


    requestAnimationFrame(
        detectHands
    );
}


/* =========================================================
   GESTURE → COMMAND
   ========================================================= */

async function performGesture(gesture) {

    const now =
        Date.now();


    if (
        gesture === lastGesture &&
        now - lastGestureTime <
        GESTURE_COOLDOWN
    ) {
        return;
    }


    lastGesture =
        gesture;

    lastGestureTime =
        now;


    let command =
        "";


    switch (gesture) {

        case "Open Palm":
            command =
                "Volume Up";
            break;


        case "Fist":
            command =
                "Mute";
            break;


        case "Two Fingers":
            command =
                "Scroll Up";
            break;


        case "Index Finger":
            command =
                "Scroll Down";
            break;


        case "Three Fingers":
            command =
                "Volume Down";
            break;


        case "Thumb Up":
            command =
                "Play Pause";
            break;


        default:
            return;
    }


    const action =
        document.getElementById(
            "gaction"
        );


    if (action) {
        action.textContent =
            command;
    }


    const success =
        await sendToLocalAgent(
            command
        );


    if (!success) {

        if (action) {

            action.textContent =
                command +
                " — Local Agent OFF";
        }
    }
}


/* =========================================================
   CAMERA STATUS
   ========================================================= */

function updateCameraStatus() {

    const video =
        document.getElementById(
            "camera"
        );

    const status =
        document.getElementById(
            "cameraStatus"
        );

    const cam =
        document.getElementById(
            "cam"
        );


    if (
        video &&
        video.srcObject &&
        video.readyState >= 2
    ) {

        if (status) {
            status.textContent =
                "🟢 Camera ON";
        }

        if (cam) {
            cam.textContent =
                "✋ CAMERA ON";
        }
    }
}


/* =========================================================
   PAGE LOAD
   ========================================================= */

window.addEventListener(
    "load",
    () => {

        getElements();

        setupVoice();

        console.log(
            "NLP-OS browser loaded."
        );

        console.log(
            "send:",
            typeof send
        );

        console.log(
            "quick:",
            typeof quick
        );

        console.log(
            "startCamera:",
            typeof startCamera
        );

        console.log(
            "performGesture:",
            typeof performGesture
        );
    }
);


/* =========================================================
   CAMERA STATUS TIMER
   ========================================================= */

setInterval(
    updateCameraStatus,
    1000
);
