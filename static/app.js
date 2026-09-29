async function performGesture(gesture) {

    const now = Date.now();

    if (
        gesture === lastGesture &&
        now - lastGestureTime < 1000
    ) {
        return;
    }

    lastGesture = gesture;
    lastGestureTime = now;

    const action = document.getElementById("gaction");

    let command = null;

    if (gesture === "TWO FINGERS") {

        window.scrollBy({
            top: -350,
            behavior: "smooth"
        });

        if (action) {
            action.textContent = "⬆️ Scroll Up";
        }

        return;
    }

    if (gesture === "INDEX FINGER") {

        window.scrollBy({
            top: 350,
            behavior: "smooth"
        });

        if (action) {
            action.textContent = "⬇️ Scroll Down";
        }

        return;
    }

    if (gesture === "OPEN PALM") {

        command = "Volume Up";

        if (action) {
            action.textContent = "🔊 Volume Up";
        }
    }

    else if (gesture === "THREE FINGERS") {

        command = "Volume Down";

        if (action) {
            action.textContent = "🔉 Volume Down";
        }
    }

    else if (gesture === "FIST") {

        command = "Mute";

        if (action) {
            action.textContent = "🔇 Mute";
        }
    }

    if (!command) {
        return;
    }

    try {

        const response = await fetch(
            "http://127.0.0.1:5001/api/command",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    text: command
                })
            }
        );

        const data = await response.json();

        console.log(
            "NLP-OS Local Agent:",
            command,
            data
        );

        if (data.ok) {

            if (action) {
                action.textContent = "✅ " + command;
            }

        } else {

            if (action) {
                action.textContent =
                    "❌ " +
                    (data.error || "Command failed");
            }
        }

    }

    catch (error) {

        console.error(
            "Local Agent Error:",
            error
        );

        if (action) {
            action.textContent =
                "❌ Local Agent not connected";
        }
    }
}
