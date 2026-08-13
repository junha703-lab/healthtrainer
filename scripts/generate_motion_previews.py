from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps

PUBLIC = Path(__file__).resolve().parents[1] / "public"
SOURCES = [
    "exercise-bench-press.png", "exercise-shoulder-press.png",
    "exercise-lat-pulldown.png", "exercise-seated-row.png",
    "exercise-leg-press.png", "exercise-leg-extension.png",
    "exercise-leg-curl.png", "exercise-chest-fly.png",
    "exercise-lateral-raise.png", "exercise-face-pull.png",
    "exercise-back-extension.png", "exercise-hip-abduction.png",
    "exercise-calf-raise.png", "exercise-deadbug.png",
    "cardio-stair.png", "cardio-treadmill.png",
]

for filename in SOURCES:
    source = PUBLIC / filename
    with Image.open(source) as image:
        image = image.convert("RGB")
        width, height = image.size
        frames = []
        for panel in range(3):
            left = round(width * panel / 3)
            right = round(width * (panel + 1) / 3)
            crop = image.crop((left, 0, right, height))
            crop = ImageOps.fit(crop, (720, 480), method=Image.Resampling.LANCZOS)
            frames.append(ImageEnhance.Contrast(crop).enhance(1.02))

        output = PUBLIC / filename.replace(".png", "-motion.webp")
        frames[0].save(
            output,
            save_all=True,
            append_images=frames[1:],
            duration=[1200, 1450, 1200],
            loop=0,
            quality=72,
            method=6,
        )
        print(output.name)
