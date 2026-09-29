let handLandmarker = null;
let lastVideoTime = -1;

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


async function startCamera() {

    const video = document.getElementById("camera");
    const status = document.getElementById("cameraStatus");
    const cam = document.getElementById("cam");

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

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user"
                },
                audio: false
            });

        if (video) {
            video.srcObject = stream;
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

        detectHands();

    } catch (error) {

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
