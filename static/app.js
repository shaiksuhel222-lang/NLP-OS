let handLandmarker = null;
let lastVideoTime = -1;
let cameraStream = null;
let lastDetectedGesture = null;


/* =====================================================
   INITIALIZE MEDIAPIPE HAND LANDMARKER
   ===================================================== */

async function initHandLandmarker() {

    console.log("Loading MediaPipe...");

    const vision = await import(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/+esm"
    );

    const {
        FilesetResolver,
        HandLandmarker
    } = vision;

    const filesetResolver =
        await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm"
        );

    handLandmarker =
        await HandLandmarker.createFromOptions(
            filesetResolver,
            {
                baseOptions: {
                    modelAssetPath: "/hand_landmarker.task",
                    delegate: "GPU"
                },

                runningMode: "VIDEO",

                numHands: 1,

                minHandDetectionConfidence: 0.5,

                minHandPresenceConfidence: 0.5,

                minTrackingConfidence: 0.5
            }
        );

    console.log(
        "Hand Landmarker initialized successfully"
    );
}


/* =====================================================
   START CAMERA
   ===================================================== */

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
                "Camera API is not supported"
            );
        }

        if (status) {
            status.textContent =
                "📷 Starting camera...";
        }

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

        if (video) {

            video.srcObject =
                cameraStream;

            await video.play();
        }

        if (cam) {
            cam.textContent =
                "✋ CAMERA ON";
        }

        if (status) {
            status.textContent =
                "📷 Camera ON";
        }

        console.log(
            "Camera started successfully"
        );

        await initHandLandmarker();

        console.log(
            "Starting hand detection..."
        );

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


/* =====================================================
   STOP CAMERA
   ===================================================== */

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
            .forEach(track => {
                track.stop();
            });

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


/* =====================================================
   RECOGNIZE HAND GESTURE
   ===================================================== */

function recognizeGesture(landmarks) {

    if (
        !landmarks ||
        landmarks.length < 21
    ) {
        return null;
    }


    /*
       Finger states

       Index  = 8
       Middle = 12
       Ring   = 16
       Pinky  = 20

       PIP joints

       Index  = 6
       Middle = 10
       Ring   = 14
       Pinky  = 18
    */


    const indexUp =
        landmarks[8].y <
        landmarks[6].y;

    const middleUp =
        landmarks[12].y <
        landmarks[10].y;

    const ringUp =
        landmarks[16].y <
        landmarks[14].y;

    const pinkyUp =
        landmarks[20].y <
        landmarks[18].y;


    const fingerCount =
        [
            indexUp,
            middleUp,
            ringUp,
            pinkyUp
        ].filter(Boolean).length;


    /* OPEN PALM */

    if (fingerCount === 4) {

        return "OPEN PALM";
    }


    /* FIST */

    if (fingerCount === 0) {

        return "FIST";
    }


    /* TWO FINGERS */

    if (
        indexUp &&
        middleUp &&
        !ringUp &&
        !pinkyUp
    ) {

        return "TWO FINGERS";
    }


    /* INDEX FINGER */

    if (
        indexUp &&
        !middleUp &&
        !ringUp &&
        !pinkyUp
    ) {

        return "INDEX FINGER";
    }


    /* THREE FINGERS */

    if (
        indexUp &&
        middleUp &&
        ringUp &&
        !pinkyUp
    ) {

        return "THREE FINGERS";
    }


    return null;
}


/* =====================================================
   DETECT HANDS
   ===================================================== */

function detectHands() {

    const video =
        document.getElementById("camera");

    if (!video) {

        console.error(
            "Camera video element not found"
        );

        return;
    }

    if (!handLandmarker) {

        console.error(
            "Hand Landmarker is not initialized"
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
                    Date.now()
                );


            if (
                results &&
                results.landmarks &&
                results.landmarks.length > 0
            ) {

                const landmarks =
                    results.landmarks[0];


                const gesture =
                    recognizeGesture(
                        landmarks
                    );


                const gestureElement =
                    document.getElementById(
                        "gesture"
                    );


                if (gesture) {

                    lastDetectedGesture =
                        gesture;


                    if (gestureElement) {

                        gestureElement.textContent =
                            gesture;
                    }


                    /*
                       Send gesture to
                       performGesture()
                    */

                    performGesture(
                        gesture
                    );

                }

                else {

                    if (gestureElement) {

                        gestureElement.textContent =
                            "Hand detected";
                    }
                }

            }

            else {

                const gestureElement =
                    document.getElementById(
                        "gesture"
                    );

                if (gestureElement) {

                    gestureElement.textContent =
                        "No hand detected";
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
