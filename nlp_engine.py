import re


def analyze_command(text):
    t = re.sub(r"\s+", " ", (text or "").lower().strip())

    rules = [
        (r"\b(open|launch|start)\b.*\bwhatsapp\b", "open_whatsapp", .98, "Open WhatsApp"),
        (r"\b(open|launch|start)\b.*\b(youtube|you tube)\b", "open_youtube", .97, "Open YouTube"),
        (r"\b(open|launch|start)\b.*\b(chrome|google chrome)\b", "open_chrome", .97, "Open Chrome"),
        (r"\b(open|launch|start)\b.*\bgoogle\b", "open_google", .97, "Open Google"),
        (r"\b(open|launch|start)\b.*\b(calculator|calc)\b", "open_calculator", .97, "Open Calculator"),
        (r"\b(open|launch|start)\b.*\bnotepad\b", "open_notepad", .97, "Open Notepad"),
        (r"\b(open|launch|start)\b.*\b(file explorer|explorer|files)\b", "open_explorer", .97, "Open File Explorer"),
        (r"\b(take|capture)\b.*\b(screenshot|screen shot)\b|\bscreenshot\b", "screenshot", .96, "Take Screenshot"),
        (r"\b(play|pause|toggle)\b.*\b(music|media|song)\b|\bplay\s*/?\s*pause\b", "play_pause", .95, "Play/Pause Media"),
        (r"\b(close|exit)\b.*\b(window|current window)\b|\bclose window\b", "close_window", .95, "Close Window"),
        (r"\b(go back|back)\b", "go_back", .95, "Go Back"),
        (r"\block\b.*\b(computer|pc|system)\b|\block\b", "lock_pc", .98, "Lock Computer"),
        (r"\b(volume|sound)\b.*\b(up|increase|higher|louder)\b|\bvolume up\b", "volume_up", .94, "Volume Up"),
        (r"\b(volume|sound)\b.*\b(down|decrease|lower|quieter)\b|\bvolume down\b", "volume_down", .94, "Volume Down"),
        (r"\b(mute|silence)\b", "mute", .98, "Mute"),
        (r"\bscroll\b.*\bup\b", "scroll_up", .94, "Scroll Up"),
        (r"\bscroll\b.*\bdown\b", "scroll_down", .94, "Scroll Down"),
        (r"\b(what is the time|what's the time|current time|time)\b", "time", .96, "Current Time"),
        (r"\b(search|google)\b\s+(for\s+)?(.+)", "search_web", .90, "Search Web"),
    ]

    for pattern, intent, conf, action in rules:
        m = re.search(pattern, t)
        if m:
            entities = {}
            if intent == "search_web":
                entities["query"] = m.group(3).strip()
            return {"intent": intent, "confidence": conf, "entities": entities, "action": action}

    return {"intent": "unknown", "confidence": .20, "entities": {}, "action": "Command not recognized"}
