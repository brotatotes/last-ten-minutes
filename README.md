# The Last Ten Minutes

**Play it:** https://brotatotes.github.io/last-ten-minutes/

A rough prototype. It is ten rainy minutes on a station platform, 9:50 to 10:00 p.m., before the last train leaves. Drag the slider to move through time, backward or forward. Tap or click a person to follow them. Something small happens that you may or may not notice. At 10:00 you get one question.

The whole scene is a pure function of time, so scrubbing to the same moment always shows exactly the same thing.

## Controls
- Drag the slider, or use Play, the speed button, and the −5s and +5s buttons.
- Keyboard: space plays and pauses, the arrow keys step 5 seconds (shift steps 30), comma and period step 1 second, f follows the next person, Escape stops following, s changes speed, + and − zoom.
- Mouse or touch: drag to look around, pinch or scroll to zoom, tap a person to follow them.

## Files
- `index.html` is the complete game in one file, with no network access and an embedded subset of EB Garamond (SIL Open Font License).
- `src/` holds the readable source. `python3 build.py` rebuilds `dist/The-Last-Ten-Minutes.html` from it (needs fontTools and the EB Garamond TTFs).
- `tests/test_scene.js` runs under Node. `tests/verify_check.py` runs Playwright browser checks.

No license has been chosen yet, so all rights are reserved.
