#!/usr/bin/env python3
"""Stage 3 browser check: overheard lines, clickable clues and the notebook.
Usage: python3 tests/browser_clues.py OUT_DIR"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = (ROOT / 'dist' / 'The-Last-Ten-Minutes.html').as_uri()
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/ltm_clues'); OUT.mkdir(parents=True, exist_ok=True)
checks, errors = [], []

def check(name, cond, detail=''):
    checks.append({'name': name, 'pass': bool(cond), 'detail': str(detail)[:300]})

def setup(page, t, cam=None, follow=None):
    page.evaluate("""([t,cam,f])=>{const a=window.LTM_app;if(cam) Object.assign(a.state.cam,cam);a.setT(t);window.LTM_follow(f||null);a.state.dirty=true;}""", [t, cam, follow])
    page.wait_for_timeout(120)

def speech(page):
    return page.inner_text('#speech') if page.is_visible('#speech') else ''

def click_target(page, target, t, cam):
    setup(page, t, cam)
    pt = page.evaluate("""([tg,t])=>{const w=window.LTM_notebook.targetPoint(tg,t);return w?window.LTM_notebook.screenOf(w):null;}""", [target, t])
    if pt is None: return None
    page.mouse.click(pt[0], pt[1]); page.wait_for_timeout(150)
    return pt

def ids(page):
    return page.evaluate('window.LTM_notebook.entries.map(e=>e.id)')

with sync_playwright() as p:
    b = p.chromium.launch()
    for vw, vh, tag in [(1440, 900, 'desk'), (390, 844, 'phone')]:
        ctx = b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=1 if tag == 'desk' else 2, has_touch=(tag == 'phone'))
        page = ctx.new_page()
        page.on('pageerror', lambda e, tag=tag: errors.append(f'{tag}: {e}'))
        page.on('console', lambda m, tag=tag: errors.append(f'{tag} console: {m.text}') if m.type == 'error' else None)
        page.goto(HTML); page.wait_for_selector('body[data-ready="1"]', timeout=15000); page.evaluate('()=>{const a=window.LTM_answers;if(a) a.closeIntro();}')
        zoom = 1.8 if tag == 'desk' else 1.4
        # overheard: following Harrow under the clock hears the Crane line; no follow hears nothing
        setup(page, 262, {'x': 10.5, 'y': 6.8, 'zoom': zoom}, None)
        check(f'{tag}: nothing overheard without following', speech(page) == '', speech(page))
        setup(page, 262, {'x': 10.5, 'y': 6.8, 'zoom': zoom}, 'harrow')
        s = speech(page)
        check(f'{tag}: following Harrow at 9:54:22 overhears him', 'only wants the book' in s, s)
        page.screenshot(path=str(OUT / f'{tag}_speech_0262.png'))
        # following someone far away hears nothing at the same moment
        setup(page, 262, None, 'albert')
        check(f'{tag}: following the porter far away overhears nothing', speech(page) == '', speech(page))
        # Bertie line is heard when following the porter at 9:51:10
        setup(page, 70, {'x': 7.0, 'y': 9.8, 'zoom': zoom}, 'albert')
        s = speech(page)
        check(f'{tag}: following the porter at 9:51:10 overhears "Bertie"', 'Bertie' in s, s)
        # outside the window it disappears
        setup(page, 90, None, 'albert')
        check(f'{tag}: line gone after its window', 'Bertie' not in speech(page), speech(page))
        # clickable clues
        click_target(page, 'tin', 30, {'x': 6.5, 'y': 9.3, 'zoom': 2.2})
        check(f'{tag}: tapping the lunch tin adds it', 'tin' in ids(page), ids(page))
        click_target(page, 'case:harrow', 200, {'x': 8.5, 'y': 9.3, 'zoom': 2.2})
        check(f'{tag}: tapping the dark case adds the tag', 'tag' in ids(page), ids(page))
        click_target(page, 'clock', 300, {'x': 11.0, 'y': 7.0, 'zoom': 1.6})
        check(f'{tag}: tapping the clock adds the later reading', 'clock_late' in ids(page), ids(page))
        # a clue outside its window cannot be taken: the glove on the ground only exists 9:55:32 to 9:55:40
        pt = click_target(page, 'glove', 400, {'x': 8.3, 'y': 8.0, 'zoom': 2})
        check(f'{tag}: glove not findable outside its window', pt is None and 'glove' not in ids(page), ids(page))
        # a person clue: tapping the guard while he checks his watch
        setup(page, 545, {'x': 8.4, 'y': 6.4, 'zoom': 2})
        pt = page.evaluate("""()=>{const s=window.LTM_STATE,p=STORY.pos('guard',545),h=STORY.look('guard',545).h;const [a,b]=LTM.worldToScreen(p[0],p[1],LTM.PZ,s.cam,s.W,s.H);return [a,b-h*s.cam.zoom*0.5];}""")
        page.mouse.click(pt[0], pt[1]); page.wait_for_timeout(150)
        check(f'{tag}: tapping the guard at 9:59:05 notes his watch', 'guard_watch' in ids(page), ids(page))
        # persistence through scrubbing
        before = ids(page)
        for t in (0, 600, 123, 377):
            setup(page, t)
        # reaching 10:00 opens the end screen; close it before using the notebook
        page.evaluate('()=>{const e=window.LTM_answers;if(e) e.closeTen();}')
        check(f'{tag}: notebook survives scrubbing', ids(page) == before and len(before) >= 5, before)
        # notebook panel readable
        page.click('#nbbtn'); page.wait_for_timeout(200)
        page.screenshot(path=str(OUT / f'{tag}_notebook.png'))
        box = page.eval_on_selector('#notebook .nbcard', 'e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}')
        fs = page.eval_on_selector('#nblist .entry', 'e=>parseFloat(getComputedStyle(e).fontSize)')
        check(f'{tag}: notebook fits the screen with readable text', box[0] >= 0 and box[2] <= vw and box[3] <= vh and fs >= 16, f'{box} font {fs}')
        txt = page.inner_text('#nblist')
        check(f'{tag}: notebook lists overheard lines and clues', 'Bertie' in txt and 'A. HART' in txt and 'Inquiry Agents' in txt, txt[:200])
        page.click('#nbclose'); page.wait_for_timeout(100)
        check(f'{tag}: notebook closes', not page.is_visible('#notebook'))
        ctx.close()
    b.close()
check('no page errors', not errors, '; '.join(errors[:5]))
res = {'passed': all(c['pass'] for c in checks), 'checks': checks, 'errors': errors, 'shots': sorted(x.name for x in OUT.glob('*.png'))}
(OUT / 'checks.json').write_text(json.dumps(res, indent=1))
print(json.dumps({'passed': res['passed'], 'failed': [c for c in checks if not c['pass']], 'errors': errors[:5]}, indent=1))
