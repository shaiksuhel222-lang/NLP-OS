from flask import Flask, render_template, request, jsonify
from nlp_engine import analyze_command
from system_controller import execute_action
import subprocess, sys, os, atexit, json, time

app = Flask(__name__)
BASE = os.path.dirname(os.path.abspath(__file__))
STATUS = os.path.join(BASE, "gesture_status.json")
gesture_process = None

def start_gesture():
    global gesture_process
    if gesture_process and gesture_process.poll() is None:
        return
    script = os.path.join(BASE, "gesture_controller.py")
    flags = subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0
    gesture_process = subprocess.Popen([sys.executable, script], cwd=BASE,
                                       creationflags=flags)

def stop_gesture():
    global gesture_process
    if gesture_process and gesture_process.poll() is None:
        try:
            gesture_process.terminate()
            gesture_process.wait(timeout=3)
        except Exception:
            try: gesture_process.kill()
            except Exception: pass

atexit.register(stop_gesture)

@app.route("/")
def home():
    return render_template("index.html")

@app.post("/api/command")
def command():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"ok": False, "error": "Empty command"}), 400
    analysis = analyze_command(text)
    result = execute_action(analysis)
    return jsonify({"ok": True, "text": text, **analysis, "result": result})

@app.get("/api/gesture-status")
def gesture_status():
    data = {"running": gesture_process is not None and gesture_process.poll() is None,
            "gesture": "Waiting...", "action": "Starting camera"}
    try:
        with open(STATUS, encoding="utf-8") as f:
            data.update(json.load(f))
    except Exception:
        pass
    return jsonify(data)

if __name__ == "__main__":
    start_gesture()
    print("NLP-OS Voice + Hand Control started")
    print("Open: http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
