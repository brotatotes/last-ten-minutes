# The Last Ten Minutes, prototype design

Goal: test whether scrubbing back and forth through ten minutes at a rainy station, and spotting one planted clue, is fun. Not the full mystery.

## Look
Reuse the approved mood study. Night, rain, amber lamps, blue-grey palette, red coat as the only saturated accent, isometric diorama on a slab, EB Garamond (Georgia fallback). Changes: station building moves to the left end so the engine on the right is visible, closer camera, soft blurred wet reflections instead of streaks, larger figures with a two-frame walk, rounder train roofs and boiler.

## Time
Scene is a pure function of t in [0, 600] seconds, 9:50:00 to 10:00:00 p.m. Clock hands, rain, splashes, steam and every character are computed from t only. Rain drops are seeded by drop index and t, never Math.random per frame, so scrubbing is exact. The 10:00 train leaves at t = 600 (steam burst from 585, doors shut at 590).

## Places (world units, platform y 4.2 to 11.2)
- Booking hall with door and ticket window on its right face, x 0.4 to 4.6.
- Carriage A (rear) door at x 6.7, carriage B (front) door at x 13.9, engine x 14.8 to 21.2.
- Trolley spot T1 (5.6, 9.3) by the door, spot T2 (12.6, 8.2) in open ground right of the clock (moved from behind the clock, where the swap was hidden).
- Clock (11.0, 7.4), bench (8.2, 8.6), lamps along both platform edges.

## Characters and routes
Evelyn Hart, woman in the red coat
- 0:00 to 0:40 inside the booking hall. 0:40 steps out, 1:10 to 1:30 hands her tan case with a red strap to the porter.
- 1:30 to 2:10 walks to the clock and waits, checking her watch.
- 4:00 to 5:30 talks quietly with the man in the grey hat.
- 5:30 to 7:50 stands at the platform edge watching the line, back to the trolley.
- 7:50 to 8:40 walks to carriage B and boards at 8:45.

Mr. Harrow, man in the grey hat
- 0:00 to 1:50 reads the evening paper on the bench.
- 1:50 to 2:50 takes his dark brown case to the porter and hands it over at 2:40.
- 2:50 to 4:00 walks to the clock. 4:00 to 5:30 talks with Evelyn.
- 5:30 to 8:40 beside her at the platform edge, then checks his watch.
- 8:40 to 9:00 walks to carriage A and boards at 9:05.

Albert, the porter
- 0:00 to 3:20 at the trolley by the door, receives both cases (red strap into slot 1, dark case into slot 2).
- 3:20 to 4:20 wheels the trolley to T2 right of the clock. Waits.
- 6:12 to 6:32 THE CLUE. Glances round, lifts both cases off and puts them back in each other's slots. The status line only says he is tidying the trolley.
- 7:10 to 7:50 carries slot 1 to carriage B (now the dark case, Evelyn's carriage).
- 8:00 to 9:05 carries slot 2 to carriage A (now the red-strapped case, Harrow's carriage).
- Result visible to a careful player: the red strap goes into the carriage the woman did not board.

Mr. Dunn, ticket clerk
- 0:00 to 8:00 behind the ticket window. 8:00 steps out and walks to the clock, compares his watch. 9:20 walks to the engine and raises a green lamp at 9:45.

## Controls
- Slider for the full ten minutes, play and pause, speed 1x, 4x, 16x, step back and forward 5 seconds, zoom in and out.
- Keyboard: Space play or pause, Left and Right 5 s, Shift+Left/Right 30 s, comma and period 1 s, F follows the next person, Escape stops following, plus and minus zoom.
- Mouse and touch: drag the scene to pan, click or tap a person to follow, tap empty ground to stop following, pinch to zoom.
- Following keeps the camera on the person and shows their name and what they are doing now.

## Camera
About twice the mood study scale. Starts centred on the clock. Pan clamped to the diorama. Following eases toward the person; with reduced motion it snaps.

## End
At 10:00 a single card asks what the porter did with the luggage, four choices. Answering reveals whether you were right and suggests watching from 9:56 near the trolley. Replay returns to 9:50.
