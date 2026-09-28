import os
import platform
import subprocess
import webbrowser
from datetime import datetime
from urllib.parse import quote_plus

import pyautogui


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
                os.path.join(os.environ.get("PROGRAMFILES", ""), "Google", "Chrome", "Application", "chrome.exe"),
                os.path.join(os.environ.get("PROGRAMFILES(X86)", ""), "Google", "Chrome", "Application", "chrome.exe"),
                os.path.join(os.environ.get("LOCALAPPDATA", ""), "Google", "Chrome", "Application", "chrome.exe"),
            ]
            chrome = next((p for p in candidates if p and os.path.exists(p)), None)
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
        webbrowser.open("https://www.google.com/search?q=" + quote_plus(q))
        return "Searching: " + q
    if i == "open_calculator":
        if os.name == "nt":
            subprocess.Popen(["calc.exe"])
        else:
            return "Calculator is Windows-only in this project"
        return "Calculator opened"
    if i == "open_notepad":
        if os.name == "nt":
            subprocess.Popen(["notepad.exe"])
        else:
            return "Notepad is Windows-only in this project"
        return "Notepad opened"
    if i == "open_explorer":
        if os.name == "nt":
            subprocess.Popen(["explorer.exe"])
        else:
            return "File Explorer is Windows-only in this project"
        return "File Explorer opened"
    if i == "screenshot":
        path = os.path.join(os.path.expanduser("~"), "Pictures", "NLP_OS_Screenshot.png")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        image = pyautogui.screenshot()
        image.save(path)
        return "Screenshot saved: " + path
    if i == "play_pause":
        pyautogui.press("playpause")
        return "Play/Pause toggled"
    if i == "close_window":
        pyautogui.hotkey("alt", "f4")
        return "Current window closed"
    if i == "go_back":
        pyautogui.hotkey("alt", "left")
        return "Went back"
    if i == "lock_pc":
        if os.name == "nt":
            subprocess.Popen(["rundll32.exe", "user32.dll,LockWorkStation"])
            return "Computer locked"
        return "Lock command is Windows-specific in this project"
    if i == "volume_up":
        pyautogui.press("volumeup", presses=2)
        return "Volume increased"
    if i == "volume_down":
        pyautogui.press("volumedown", presses=2)
        return "Volume decreased"
    if i == "mute":
        pyautogui.press("volumemute")
        return "Mute toggled"
    if i == "scroll_up":
        pyautogui.scroll(5)
        return "Scrolled up"
    if i == "scroll_down":
        pyautogui.scroll(-5)
        return "Scrolled down"
    if i == "time":
        return datetime.now().strftime("%I:%M:%S %p")

    return "Command not recognized"
