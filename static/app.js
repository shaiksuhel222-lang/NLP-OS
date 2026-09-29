async function startCamera() {

    const video = document.getElementById("camera");
    const status = document.getElementById("cameraStatus");
    const cam = document.getElementById("cam");

    try {

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {

            throw new Error("Camera API is not supported");
        }

        if (status) {
            status.textContent = "📷 Starting camera...";
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
            cam.textContent = "✋ CAMERA ON";
        }

        if (status) {
            status.textContent = "📷 Camera ON";
        }

        console.log("Camera started successfully");

        // Start hand detection
        await initHandLandmarker();

        detectHands();

    } catch (error) {

        console.error("Camera error:", error);

        if (status) {
            status.textContent =
                "❌ Camera Error: " + error.message;
        }

        if (cam) {
            cam.textContent = "✋ CAMERA OFF";
        }
    }
}
