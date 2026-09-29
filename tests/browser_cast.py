#!/usr/bin/env python3
"""Stage 2 browser check: cast, doors, coat swap, station clock, follow and status lines.
Usage: python3 tests/browser_cast.py OUT_DIR"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = (ROOT / 'dist' / 'The-Last-Ten-Minutes.html').as_uri()
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/ltm_cast'); OUT.mkdir(parents=True, exist_ok=True)
SECRET = ['Clara', 'Evelyn', 'Evie', 'Hart', 'brother', 'Crane', 'ledger', 'swap', 'really']
checks, errors = [], []

def check(name, cond, detail=''):
    checks.append({'name': name, 'pass': bool(cond), 'detail': detail})

def goto(page, t, cam=None, follow=None):
    page.evaluate("""([t,cam,f])=>{const a=window.LTM_app;if(cam){Object.assign(a.state.cam,cam);}a.state.follow=null;if(f) window.LTM_follow(f);a.setT(t);a.state.dirty=true;}""", [t, cam, follow])
    page.wait_for_timeout(60)

with sync_playwright() as p:
    b = p.chromium.launch()
    for vw, vh, tag in [(1440, 900, 'desk'), (390, 844, 'phone')]:
        ctx = b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=1 if tag == 'desk' else 2)
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append(f'{tag}: {e}'))
        page.on('console', lambda m: errors.append(f'{tag} console: {m.text}') if m.type == 'error' else None)
        page.goto(HTML); page.wait_for_selector('body[data-ready="1"]', timeout=15000); page.evaluate('()=>{const a=window.LTM_answers;if(a) a.closeIntro();}')
        shots = [
            ('0030_clara_street', 30, {'x': 3.5, 'y': 9.8, 'zoom': 1.8}),
            ('0056_ticket', 56, {'x': 5.5, 'y': 7.5, 'zoom': 1.8}),
            ('0192_clock_set', 192, {'x': 10.5, 'y': 7.2, 'zoom': 1.6}),
            ('0374_strap', 374, {'x': 13.0, 'y': 8.8, 'zoom': 2.2}),
            ('0445_red_out', 445, {'x': 6.0, 'y': 9.2, 'zoom': 1.8}),
            ('0512_grey_out', 512, {'x': 6.0, 'y': 9.2, 'zoom': 1.8}),
            ('0531_street_out', 531, {'x': 3.5, 'y': 9.8, 'zoom': 1.8}),
            ('0545_guard', 545, {'x': 9.0, 'y': 7.0, 'zoom': 1.6}),
        ]
        if tag == 'phone': shots = [s for s in shots if s[0] in ('0374_strap', '0512_grey_out', '0192_clock_set')]
        for name, t, cam in shots:
            goto(page, t, cam)
            page.screenshot(path=str(OUT / f'{tag}_{name}.png'))
        # every person can be followed, and the status line never names a secret
        leaks = []
        for pid in ['evelyn', 'clara', 'harrow', 'albert', 'dunn', 'guard', 'tommy']:
            seen = False
            for t in range(0, 600, 20):
                vis = page.evaluate('([id,t])=>STORY.visible(id,t)', [pid, t])
                if not vis: continue
                goto(page, t, None, pid)
                txt = page.inner_text('#follow') if page.is_visible('#follow') else ''
                if txt: seen = True
                if pid in ('evelyn', 'clara'):
                    for w in SECRET:
                        if w in txt: leaks.append(f'{pid}@{t}: {txt}')
                break_early = tag == 'phone' and t > 120
                if break_early: break
            check(f'{tag}: follow {pid} shows a status line', seen)
        check(f'{tag}: status lines never name a disguised woman or a secret', not leaks, '; '.join(leaks[:5]))
        # following through the waiting-room door loses sight of her
        goto(page, 340, {'x': 6, 'y': 9, 'zoom': 1.6}, 'evelyn'); page.evaluate('window.LTM_app.setT(350)'); page.wait_for_timeout(300)
        lost = page.inner_text('#follow')
        check(f'{tag}: following into the waiting room loses sight', 'lose sight' in lost and page.evaluate('window.LTM_app.state.follow') is None, lost)
        # station clock drawn from its own time; slider shows true time
        for t in (100, 300, 480):
            st = page.evaluate('t=>STORY.hms(STORY.stationSeconds(t))', t)
            goto(page, t)
            shown = page.inner_text('#clock')
            check(f'{tag}: slider clock true at t={t}, station clock {st}', shown.startswith(page.evaluate('t=>LTM.clockText(t)', t)), shown)
        # the red coat is shorter after the swap, and the umbrella figure is taller
        hts = page.evaluate("""()=>({redEarly:STORY.look('evelyn',100).h,redLate:STORY.look('clara',460).h,greyEarly:STORY.look('clara',50).h,greyLate:STORY.look('evelyn',520).h})""")
        check(f'{tag}: coat swap height difference', hts['redEarly'] > hts['redLate'] and hts['greyLate'] > hts['greyEarly'], json.dumps(hts))
        # tapping a person on screen selects them
        goto(page, 100, {'x': 10.0, 'y': 7.0, 'zoom': 1.8})
        pt = page.evaluate("""()=>{const s=window.LTM_STATE,p=STORY.pos('evelyn',100),h=STORY.look('evelyn',100).h;const [a,b]=LTM.worldToScreen(p[0],p[1],LTM.PZ,s.cam,s.W,s.H);return [a,b-h*s.cam.zoom*0.5];}""")
        page.mouse.click(pt[0], pt[1]); page.wait_for_timeout(200)
        check(f'{tag}: tapping the red coat follows her', page.evaluate('window.LTM_app.state.follow') == 'evelyn', page.inner_text('#follow'))
        ctx.close()
    b.close()
check('no page errors', not errors, '; '.join(errors[:5]))
res = {'passed': all(c['pass'] for c in checks), 'checks': checks, 'errors': errors, 'shots': sorted(x.name for x in OUT.glob('*.png'))}
(OUT / 'checks.json').write_text(json.dumps(res, indent=1))
print(json.dumps({'passed': res['passed'], 'failed': [c for c in checks if not c['pass']], 'errors': errors[:5]}, indent=1))
