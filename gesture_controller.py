import cv2
import mediapipe as mp
import pyautogui
import time
import json
import os
import math

# ============================================================
# NLP-OS : Voice + Hand Gesture Computer Control
# ============================================================

BASE = os.path.dirname(os.path.abspath(__file__))
STATUS = os.path.join(BASE, "gesture_status.json")
MODEL_PATH = os.path.join(BASE, "hand_landmarker.task")

last_action_time = 0.0
cooldown = 1.0


# ------------------------------------------------------------
# Save current gesture/action status
# ------------------------------------------------------------
def status(gesture, action, running=True):
    try:
        tmp = STATUS + ".tmp"

        data = {
            "running": running,
            "gesture": gesture,
            "action": action,
            "time": time.time()
        }

        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f)

        os.replace(tmp, STATUS)

    except Exception:
        pass


# ------------------------------------------------------------
# Distance between two hand landmarks
# ------------------------------------------------------------
def distance(a, b):
    return math.hypot(
        a.x - b.x,
        a.y - b.y
    )


# ------------------------------------------------------------
# Detect raised fingers
# Index, Middle, Ring, Little
# ------------------------------------------------------------
def fingers(hand):
    return [
        hand[8].y < hand[6].y,
        hand[12].y < hand[10].y,
        hand[16].y < hand[14].y,
        hand[20].y < hand[18].y
    ]


# ============================================================
# CHECK MODEL
# ============================================================

if not os.path.exists(MODEL_PATH):

    status(
        "Model missing",
        "hand_landmarker.task not found",
        False
    )

    raise SystemExit(
        "\nERROR: hand_landmarker.task not found.\n"
        "Make sure the model file is inside:\n"
        f"{BASE}\n"
    )


# ============================================================
# MEDIAPIPE TASKS API
# ============================================================

try:

    BaseOptions = mp.tasks.BaseOptions

    HandLandmarker = mp.tasks.vision.HandLandmarker

    HandLandmarkerOptions = (
        mp.tasks.vision.HandLandmarkerOptions
    )

    RunningMode = mp.tasks.vision.RunningMode

except AttributeError:

    status(
        "MediaPipe API error",
        "mp.tasks unavailable",
        False
    )

    raise SystemExit(
        "\nERROR: MediaPipe mp.tasks API unavailable.\n"
        "Your installed MediaPipe version may be incorrect.\n"
    )


# ============================================================
# MEDIAPIPE CONFIGURATION
# ============================================================

options = HandLandmarkerOptions(

    base_options=BaseOptions(
        model_asset_path=MODEL_PATH
    ),

    running_mode=RunningMode.IMAGE,

    num_hands=1,

    min_hand_detection_confidence=0.5,

    min_hand_presence_confidence=0.5,

    min_tracking_confidence=0.5
)


# ============================================================
# OPEN WINDOWS CAMERA
# CAP_DSHOW helps Windows camera access
# ============================================================

print("Starting camera...")

cap = cv2.VideoCapture(
    0,
    cv2.CAP_DSHOW
)

if not cap.isOpened():

    status(
        "Camera unavailable",
        "Camera could not be opened",
        False
    )

    raise SystemExit(
        "\nERROR: Camera could not be opened.\n"
        "Camera test should be checked again.\n"
    )


# Camera resolution
cap.set(
    cv2.CAP_PROP_FRAME_WIDTH,
    1280
)

cap.set(
    cv2.CAP_PROP_FRAME_HEIGHT,
    720
)

print("Camera started successfully.")
print("Show your hand in front of the camera.")
print("Press Q to close.")


# ============================================================
# START HAND LANDMARKER
# ============================================================

with HandLandmarker.create_from_options(options) as detector:

    status(
        "Camera active",
        "Waiting for hand",
        True
    )

    while True:

        # ----------------------------------------------------
        # READ CAMERA FRAME
        # ----------------------------------------------------

        ok, frame = cap.read()

        if not ok:

            print("Could not read camera frame.")

            break


        # Mirror camera
        frame = cv2.flip(
            frame,
            1
        )


        # ----------------------------------------------------
        # CONVERT BGR -> RGB
        # ----------------------------------------------------

        rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )


        # ----------------------------------------------------
        # MEDIAPIPE IMAGE
        # ----------------------------------------------------

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb
        )


        # ----------------------------------------------------
        # HAND DETECTION
        # ----------------------------------------------------

        result = detector.detect(
            mp_image
        )


        # Default display
        label = "NO HAND"
        action = "Waiting"

        now = time.time()


        # ====================================================
        # IF HAND DETECTED
        # ====================================================

        if result.hand_landmarks:

            hand = result.hand_landmarks[0]

            f = fingers(hand)


            # ------------------------------------------------
            # PINCH
            # Thumb + Index close
            # ------------------------------------------------

            pinch = (
                distance(
                    hand[4],
                    hand[8]
                ) < 0.055
                and f[0]
                and not f[1]
                and not f[2]
                and not f[3]
            )


            # ------------------------------------------------
            # THUMBS UP
            # ------------------------------------------------

            thumb_up = (
                hand[4].y < hand[3].y
                and not any(f)
            )


            # ------------------------------------------------
            # ACTION COOLDOWN
            # ------------------------------------------------

            if (
                now - last_action_time
                > cooldown
            ):

                # ============================================
                # PINCH = LEFT CLICK
                # ============================================

                if pinch:

                    pyautogui.click()

                    label = "PINCH"

                    action = "Left Click"

                    last_action_time = now


                # ============================================
                # THUMBS UP = PLAY / PAUSE
                # ============================================

                elif thumb_up:

                    pyautogui.press(
                        "playpause"
                    )

                    label = "THUMBS UP"

                    action = "Play / Pause"

                    last_action_time = now


                # ============================================
                # OPEN PALM = VOLUME UP
                # ============================================

                elif all(f):

                    pyautogui.press(
                        "volumeup",
                        presses=2
                    )

                    label = "OPEN PALM"

                    action = "Volume +"

                    last_action_time = now


                # ============================================
                # FIST = MUTE
                # ============================================

                elif not any(f):

                    pyautogui.press(
                        "volumemute"
                    )

                    label = "FIST"

                    action = "Mute"

                    last_action_time = now


                # ============================================
                # TWO FINGERS = SCROLL UP
                # ============================================

                elif (
                    f[0]
                    and f[1]
                    and not f[2]
                    and not f[3]
                ):

                    pyautogui.scroll(5)

                    label = "TWO FINGERS"

                    action = "Scroll Up"

                    last_action_time = now


                # ============================================
                # INDEX = SCROLL DOWN
                # ============================================

                elif (
                    f[0]
                    and not any(f[1:])
                ):

                    pyautogui.scroll(-5)

                    label = "INDEX FINGER"

                    action = "Scroll Down"

                    last_action_time = now


                # ============================================
                # THREE FINGERS = VOLUME DOWN
                # ============================================

                elif (
                    f[0]
                    and f[1]
                    and f[2]
                    and not f[3]
                ):

                    pyautogui.press(
                        "volumedown"
                    )

                    label = "THREE FINGERS"

                    action = "Volume -"

                    last_action_time = now


            # ------------------------------------------------
            # SAVE STATUS
            # ------------------------------------------------

            status(
                label,
                action,
                True
            )


            # =================================================
            # DRAW HAND LANDMARKS
            # =================================================

            connections = [

                (0, 1),
                (1, 2),
                (2, 3),
                (3, 4),

                (0, 5),
                (5, 6),
                (6, 7),
                (7, 8),

                (0, 9),
                (9, 10),
                (10, 11),
                (11, 12),

                (0, 13),
                (13, 14),
                (14, 15),
                (15, 16),

                (0, 17),
                (17, 18),
                (18, 19),
                (19, 20),

                (5, 9),
                (9, 13),
                (13, 17),
                (0, 17)
            ]


            # Draw connections

            for a, b in connections:

                x1 = int(
                    hand[a].x
                    * frame.shape[1]
                )

                y1 = int(
                    hand[a].y
                    * frame.shape[0]
                )

                x2 = int(
                    hand[b].x
                    * frame.shape[1]
                )

                y2 = int(
                    hand[b].y
                    * frame.shape[0]
                )

                cv2.line(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 0),
                    2
                )


            # Draw points

            for point in hand:

                x = int(
                    point.x
                    * frame.shape[1]
                )

                y = int(
                    point.y
                    * frame.shape[0]
                )

                cv2.circle(
                    frame,
                    (x, y),
                    5,
                    (0, 0, 255),
                    -1
                )


        else:

            # No hand detected

            status(
                "NO HAND",
                "Waiting for hand",
                True
            )


        # ====================================================
        # DISPLAY TEXT
        # ====================================================

        cv2.putText(
            frame,
            "NLP-OS HAND CONTROL",
            (20, 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )


        cv2.putText(
            frame,
            f"{label} -> {action}",
            (20, 70),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2
        )


        cv2.putText(
            frame,
            "PINCH=CLICK | THUMB=PLAY | Q=CLOSE",
            (20, 105),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (255, 255, 255),
            1
        )


        # ====================================================
        # SHOW CAMERA WINDOW
        # ====================================================

        cv2.imshow(
            "NLP-OS | Hand Control",
            frame
        )


        # ====================================================
        # PRESS Q TO EXIT
        # ====================================================

        key = cv2.waitKey(1) & 0xFF

        if key == ord("q"):

            break


# ============================================================
# CLEANUP
# ============================================================

cap.release()

cv2.destroyAllWindows()

status(
    "Stopped",
    "Camera closed",
    False
)

print("NLP-OS Hand Controller stopped.")