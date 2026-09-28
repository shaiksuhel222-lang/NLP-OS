```python
import os
import platform
import subprocess
import webbrowser
from datetime import datetime
from urllib.parse import quote_plus

# PyAutoGUI works on Windows desktop.
# Render/Linux is headless, so don't import it there.
if os.name == "nt":
    import pyautogui
else:
    pyautogui = None


def execute_action(a):
    i = a.get("intent", "")
    e = a.get("entities", {})

    if i == "open_whatsapp":
        webbrowser.open("https://web.whatsapp.com")
        return "WhatsApp Web opened"

    if i == "open_youtube":
        webbrowser.open("https://www.youtube.com")
        return "YouTube opened"

    if i == "open_chrome":
        if os.name == "nt":
            candidates = [
                os.path.join(
                    os.environ.get("PROGRAMFILES", ""),
                    "Google", "Chrome", "Application", "chrome.exe"
                ),
                os.path.join(
                    os.environ.get("PROGRAMFILES(X86)", ""),
                    "Google", "Chrome", "Application", "chrome.exe"
                ),
                os.path.join(
                    os.environ.get("LOCALAPPDATA", ""),
                    "Google", "Chrome", "Application", "chrome.exe"
                ),
            ]

            chrome = next(
                (p for p in candidates if p and os.path.exists(p)),
                None
            )

            if chrome:
                subprocess.Popen([chrome])
                return "Chrome opened"

        webbrowser.open("https://www.google.com")
        return "Browser opened"

    if i == "open_google":
        webbrowser.open("https://www.google.com")
        return "Google opened"

    if i == "search_web":
        q = e.get("query", "").strip()

        if not q:
            return "Search query is empty"

        webbrowser.open(
            "https://www.google.com/search?q=" + quote_plus(q)
        )
        return "Searching: " + q

    if i == "open_calculator":
        if os.name == "nt":
            subprocess.Popen(["calc.exe"])
            return "Calculator opened"

        return "Calculator is Windows-only in this project"

    if i == "open_notepad":
        if os.name == "nt":
            subprocess.Popen(["notepad.exe"])
            return "Notepad opened"

        return "Notepad is Windows-only in this project"

    if i == "open_explorer":
        if os.name == "nt":
            subprocess.Popen(["explorer.exe"])
            return "File Explorer opened"

        return "File Explorer is Windows-only in this project"

    if i == "screenshot":
        if pyautogui is None:
            return "Screenshot is available only on Windows desktop"

        path = os.path.join(
            os.path.expanduser("~"),
            "Pictures",
            "NLP_OS_Screenshot.png"
        )

        os.makedirs(os.path.dirname(path), exist_ok=True)

        image = pyautogui.screenshot()
        image.save(path)

        return "Screenshot saved: " + path

    if i == "play_pause":
        if pyautogui is None:
            return "Play/Pause control is available only on Windows desktop"

        pyautogui.press("playpause")
        return "Play/Pause toggled"

    if i == "close_window":
        if pyautogui is None:
            return "Window control is available only on Windows desktop"

        pyautogui.hotkey("alt", "f4")
        return "Current window closed"

    if i == "go_back":
        if pyautogui is None:
            return "Back control is available only on Windows desktop"

        pyautogui.hotkey("alt", "left")
        return "Went back"

    if i == "lock_pc":
        if os.name == "nt":
            subprocess.Popen(
                ["rundll32.exe", "user32.dll,LockWorkStation"]
            )
            return "Computer locked"

        return "Lock command is Windows-specific in this project"

    if i == "volume_up":
        if pyautogui is None:
            return "Volume control is available only on Windows desktop"

        pyautogui.press("volumeup", presses=2)
        return "Volume increased"

    if i == "volume_down":
        if pyautogui is None:
            return "Volume control is available only on Windows desktop"

        pyautogui.press("volumedown", presses=2)
        return "Volume decreased"

    if i == "mute":
        if pyautogui is None:
            return "Mute control is available only on Windows desktop"

        pyautogui.press("volumemute")
        return "Mute toggled"

    if i == "scroll_up":
        if pyautogui is None:
            return "Scroll control is available only on Windows desktop"

        pyautogui.scroll(5)
        return "Scrolled up"

    if i == "scroll_down":
        if pyautogui is None:
            return "Scroll control is available only on Windows desktop"

        pyautogui.scroll(-5)
        return "Scrolled down"

    if i == "time":
        return datetime.now().strftime("%I:%M:%S %p")

    return "Command not recognized"
```
