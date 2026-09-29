from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    send_from_directory
)

from nlp_engine import analyze_command
from system_controller import execute_action

import subprocess
import sys
import os
import atexit
import json


app = Flask(__name__)


# =========================================================
# PROJECT PATHS
# =========================================================

BASE = os.path.dirname(
    os.path.abspath(__file__)
)

STATUS = os.path.join(
    BASE,
    "gesture_status.json"
)

MODEL = os.path.join(
    BASE,
    "hand_landmarker.task"
)


gesture_process = None


# =========================================================
# START LOCAL GESTURE CONTROLLER
# =========================================================

def start_gesture():

    global gesture_process

    if (
        gesture_process
        and gesture_process.poll() is None
    ):
        return


    # Gesture controller is only
    # for the local Windows computer.

    if os.name != "nt":
        print(
            "Cloud/Linux environment detected."
        )

        print(
            "Local gesture controller skipped."
        )

        return


    script = os.path.join(
        BASE,
        "gesture_controller.py"
    )


    if not os.path.exists(script):

        print(
            "ERROR: gesture_controller.py not found."
        )

        return


    try:

        flags = (
            subprocess.CREATE_NEW_PROCESS_GROUP
        )


        gesture_process = subprocess.Popen(

            [
                sys.executable,
                script
            ],

            cwd=BASE,

            creationflags=flags
        )


        print(
            "Gesture controller started."
        )


    except Exception as e:

        print(
            "Could not start gesture controller:",
            e
        )


# =========================================================
# STOP LOCAL GESTURE CONTROLLER
# =========================================================

def stop_gesture():

    global gesture_process


    if (
        gesture_process
        and gesture_process.poll() is None
    ):

        try:

            gesture_process.terminate()

            gesture_process.wait(
                timeout=3
            )


        except Exception:

            try:

                gesture_process.kill()

            except Exception:

                pass


atexit.register(
    stop_gesture
)


# =========================================================
# MAIN PAGE
# =========================================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# =========================================================
# MEDIA PIPE HAND LANDMARKER MODEL
# =========================================================

@app.route(
    "/hand_landmarker.task"
)
def hand_landmarker_model():

    if not os.path.exists(MODEL):

        return jsonify({

            "ok": False,

            "error":
                "hand_landmarker.task not found on server."

        }), 404


    return send_from_directory(

        BASE,

        "hand_landmarker.task",

        mimetype="application/octet-stream"
    )


# =========================================================
# NLP COMMAND API
# =========================================================

@app.route(
    "/api/command",
    methods=["POST"]
)
def command():

    data = (
        request.get_json(
            silent=True
        )
        or {}
    )


    text = (
        data.get("text")
        or ""
    ).strip()


    if not text:

        return jsonify({

            "ok": False,

            "error":
                "Empty command"

        }), 400


    try:

        analysis = (
            analyze_command(text)
        )


        result = (
            execute_action(
                analysis
            )
        )


        return jsonify({

            "ok": True,

            "text": text,

            **analysis,

            "result": result

        })


    except Exception as e:

        return jsonify({

            "ok": False,

            "text": text,

            "error": str(e)

        }), 500


# =========================================================
# GESTURE STATUS API
# =========================================================

@app.route(
    "/api/gesture-status",
    methods=["GET"]
)
def gesture_status():

    data = {

        "running": (

            gesture_process is not None

            and
            gesture_process.poll() is None

        ),

        "gesture":
            "Waiting...",

        "action":
            "Starting camera"

    }


    try:

        if os.path.exists(STATUS):

            with open(

                STATUS,

                "r",

                encoding="utf-8"

            ) as f:

                status_data = (
                    json.load(f)
                )


                if isinstance(
                    status_data,
                    dict
                ):

                    data.update(
                        status_data
                    )


    except Exception as e:

        print(
            "Could not read gesture status:",
            e
        )


    return jsonify(data)


# =========================================================
# START APPLICATION
# =========================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print(
        "       NLP-OS VOICE + HAND CONTROL"
    )
    print("=" * 60)
    print()


    # Start desktop gesture controller
    # only on local Windows.

    if os.name == "nt":

        start_gesture()


    print(
        "NLP-OS application started."
    )


    print(
        "Open: http://127.0.0.1:5000"
    )


    app.run(

        host="127.0.0.1",

        port=5000,

        debug=False,

        use_reloader=False
    )
