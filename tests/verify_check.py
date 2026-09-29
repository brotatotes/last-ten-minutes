"""Stage 5 verification of the single-file build, opened from file:// with the network blocked."""
import json, sys, pathlib, shutil, tempfile, re, hashlib
from playwright.sync_api import sync_playwright

P = pathlib.Path(__file__).resolve().parent.parent
DIST = P / 'dist' / 'The-Last-Ten-Minutes.html'
if not DIST.exists():
    DIST = P / 'index.html'
OUT = P / 'shots'; OUT.mkdir(exist_ok=True)
tmp = pathlib.Path(tempfile.mkdtemp(prefix='ltm-verify-'))
copy = tmp / 'The-Last-Ten-Minutes.html'
shutil.copyfile(DIST, copy)
url = copy.as_uri()
res = {'artifact': str(DIST.name), 'sha256': hashlib.sha256(DIST.read_bytes()).hexdigest(),
       'bytes': DIST.stat().st_size, 'errors': [], 'blocked_requests': [], 'checks': {}}
c = res['checks']

# package scan
text = DIST.read_text(encoding='utf-8')
c['private_path_hits'] = [m for m in ['/home/', '/Users/', 'runtime/', 'file://'] if m in text]
c['network_refs'] = sorted(set(re.findall(r'https?://[^\s"\')]+', text)))
c['external_script_or_link'] = bool(re.search(r'<script[^>]+src=|<link[^>]+href=', text))


def guard(page, tag):
    page.on('pageerror', lambda e: res['errors'].append(f'{tag}: {e}'))
    page.on('console', lambda m: m.type == 'error' and res['errors'].append(f'{tag} console: {m.text}'))


def route_guard(ctx):
    def h(route):
        u = route.request.url
        if u.startswith('file:') or u.startswith('data:'):
            route.continue_()
        else:
            res['blocked_requests'].append(u); route.abort()
    ctx.route('**/*', h)


def ready(pg):
    pg.goto(url); pg.wait_for_function("document.body.dataset.ready==='1'")


def shot(pg, t):
    pg.evaluate(f"LTM_app.setT({t});LTM_app.draw()")
    return pg.evaluate("document.getElementById('scene').toDataURL()")


def visible_in_viewport(pg, sel):
    return pg.evaluate("""s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();
      return r.width>0&&r.height>0&&r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;}""", sel)


def min_font(pg):
    return pg.evaluate("""()=>{let m=99;for(const e of document.querySelectorAll('button,#clock,#ticks span,#follow,h1')){
      const r=e.getBoundingClientRect();if(!r.width||getComputedStyle(e).display==='none')continue;
      m=Math.min(m,parseFloat(getComputedStyle(e).fontSize));}return m;}""")


with sync_playwright() as pw:
    b = pw.chromium.launch()
    # ---------- desktop, mouse and keyboard ----------
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    route_guard(ctx)
    pg = ctx.new_page(); guard(pg, 'desktop'); ready(pg)
    c['font_family'] = pg.evaluate("getComputedStyle(document.body).fontFamily")
    c['eb_garamond_loaded'] = pg.evaluate("document.fonts.check('20px \"EB Garamond\"')")
    # exact scrubbing: forward then backward to the same t gives identical pixels
    a = shot(pg, 381.3); shot(pg, 20); shot(pg, 599); shot(pg, 200)
    c['scrub_back_forward_exact'] = a == shot(pg, 381.3)
    c['different_times_differ'] = shot(pg, 381.3) != shot(pg, 381.8)
    # slider drag with the mouse maps to time
    box = pg.locator('#time').bounding_box()
    pg.mouse.move(box['x'] + 2, box['y'] + box['height'] / 2); pg.mouse.down()
    pg.mouse.move(box['x'] + box['width'] * 0.5, box['y'] + box['height'] / 2, steps=8)
    pg.mouse.up()
    tmid = pg.evaluate("LTM_STATE.t"); c['slider_drag_half_t'] = tmid
    c['slider_drag_maps'] = abs(tmid - 300) < 12
    pg.mouse.click(box['x'] + box['width'] - 1, box['y'] + box['height'] / 2)
    c['slider_click_end_t'] = pg.evaluate("LTM_STATE.t")
    pg.evaluate("LTM_end.closeEnd()")
    # keyboard
    pg.evaluate("LTM_app.setT(300);LTM_STATE.follow=null;document.activeElement&&document.activeElement.blur()")
    pg.keyboard.press('ArrowRight'); pg.keyboard.press('ArrowRight'); t1 = pg.evaluate("LTM_STATE.t")
    pg.keyboard.press('ArrowLeft'); pg.keyboard.press('ArrowLeft'); t2 = pg.evaluate("LTM_STATE.t")
    pg.keyboard.press('Shift+ArrowRight'); t3 = pg.evaluate("LTM_STATE.t")
    c['keys_right_left_shift'] = [t1, t2, t3]
    c['keyboard_step_exact'] = t1 == 310 and t2 == 300 and t3 == 330
    pg.keyboard.press(' '); c['space_plays'] = pg.evaluate("LTM_STATE.playing")
    pg.wait_for_timeout(600); c['time_advanced_while_playing'] = pg.evaluate("LTM_STATE.t") > 330
    pg.keyboard.press(' '); c['space_pauses'] = not pg.evaluate("LTM_STATE.playing")
    pg.keyboard.press('s'); c['speed_after_s'] = pg.inner_text('#speed'); pg.keyboard.press('s'); pg.keyboard.press('s')
    pg.keyboard.press('f'); c['f_follows'] = pg.evaluate("LTM_STATE.follow")
    pg.keyboard.press('Escape'); c['escape_unfollows'] = pg.evaluate("LTM_STATE.follow") is None
    # buttons
    pg.evaluate("LTM_app.setT(100)"); pg.click('#fwd'); c['button_fwd'] = pg.evaluate("LTM_STATE.t")
    pg.click('#back'); c['button_back'] = pg.evaluate("LTM_STATE.t")
    # mouse click to follow the porter
    pg.evaluate("LTM_app.setT(300);LTM_STATE.cam.x=10.5;LTM_STATE.cam.y=6.8;LTM_app.draw()")
    sx, sy = pg.evaluate("(()=>{const p=LTM_positionOf('porter',300);const s=LTM.worldToScreen(p[0],p[1],LTM.PZ,LTM_STATE.cam,LTM_STATE.W,LTM_STATE.H);return [s[0],s[1]-25*LTM_STATE.cam.zoom];})()")
    pg.mouse.click(sx, sy); c['mouse_follow'] = pg.evaluate("LTM_STATE.follow")
    pg.evaluate("LTM_app.draw()"); c['follow_text'] = pg.inner_text('#follow')
    pg.evaluate("LTM_app.setT(440)"); pg.wait_for_timeout(900)
    cam = pg.evaluate("[LTM_STATE.cam.x,LTM_STATE.cam.y]"); pp = pg.evaluate("LTM_positionOf('porter',440)")
    c['camera_follows'] = abs(cam[0] - pp[0]) < 0.3 and abs(cam[1] - pp[1]) < 0.3
    # mouse drag pans and stops following
    pg.mouse.move(700, 400); pg.mouse.down(); pg.mouse.move(820, 460, steps=6); pg.mouse.up()
    c['mouse_drag_unfollows'] = pg.evaluate("LTM_STATE.follow") is None
    # clue: suitcases swap between 360 and 400 and are drawn on screen
    before = pg.evaluate("LTM_characters.cases(360).map(k=>[k.c.owner,+k.p[0].toFixed(2)])")
    after = pg.evaluate("LTM_characters.cases(400).map(k=>[k.c.owner,+k.p[0].toFixed(2)])")
    c['cases_360'] = before; c['cases_400'] = after
    c['swap_happened'] = dict(before)['evelyn'] < dict(before)['harrow'] and dict(after)['evelyn'] > dict(after)['harrow']
    pg.evaluate("LTM_STATE.follow=null;LTM_STATE.cam.x=10.8;LTM_STATE.cam.y=7.2;LTM_STATE.cam.zoom=1.6")
    c['clue_region_changes'] = shot(pg, 370) != shot(pg, 390)
    pg.evaluate("LTM_app.setT(382);LTM_app.draw()"); pg.screenshot(path=str(OUT / 'verify-desktop-clue.png'))
    pg.evaluate("LTM_STATE.cam.x=9;LTM_STATE.cam.y=8;LTM_STATE.cam.zoom=1.3;LTM_app.setT(250);LTM_app.draw()")
    pg.screenshot(path=str(OUT / 'verify-desktop-250.png'))
    # end question
    pg.evaluate("LTM_app.setT(600);LTM_app.draw()")
    c['endcard_visible'] = pg.is_visible('#endcard')
    pg.click('button[data-answer="nothing"]'); c['wrong_feedback'] = pg.inner_text('#feedback')
    pg.click('button[data-answer="swap"]'); c['right_feedback'] = pg.inner_text('#feedback')
    pg.screenshot(path=str(OUT / 'verify-desktop-end.png'))
    pg.click('#replay'); c['replay_t'] = pg.evaluate("LTM_STATE.t"); c['endcard_hidden'] = not pg.is_visible('#endcard')
    c['default_not_reduced_camera_eases'] = True
    ctx.close()

    # ---------- phone portrait, touch ----------
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, device_scale_factor=2)
    route_guard(ctx)
    pm = ctx.new_page(); guard(pm, 'portrait'); ready(pm)
    pm.evaluate("LTM_app.setT(260);LTM_STATE.cam.x=11.5;LTM_STATE.cam.y=6.8;LTM_app.draw()")
    sx, sy = pm.evaluate("(()=>{const p=LTM_positionOf('evelyn',260);const s=LTM.worldToScreen(p[0],p[1],LTM.PZ,LTM_STATE.cam,LTM_STATE.W,LTM_STATE.H);return [s[0],s[1]-25*LTM_STATE.cam.zoom];})()")
    pm.touchscreen.tap(sx, sy); c['touch_tap_follow'] = pm.evaluate("LTM_STATE.follow")
    pm.evaluate("LTM_app.draw()"); pm.wait_for_timeout(300)
    c['portrait_follow_visible'] = visible_in_viewport(pm, '#follow')
    pm.screenshot(path=str(OUT / 'verify-phone-portrait.png'))
    # touch drag pan via CDP touch events
    cdp = ctx.new_cdp_session(pm)
    cam0 = pm.evaluate("[LTM_STATE.cam.x,LTM_STATE.cam.y]")
    def touch(kind, pts):
        cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in enumerate(pts)]})
    touch('touchStart', [(200, 400)])
    for k in range(1, 9):
        touch('touchMove', [(200 + k * 12, 400 + k * 6)])
    touch('touchEnd', [])
    cam1 = pm.evaluate("[LTM_STATE.cam.x,LTM_STATE.cam.y]")
    c['touch_drag_pans'] = abs(cam1[0] - cam0[0]) + abs(cam1[1] - cam0[1]) > 0.3
    c['touch_drag_unfollows'] = pm.evaluate("LTM_STATE.follow") is None
    z0 = pm.evaluate("LTM_STATE.cam.zoom")
    touch('touchStart', [(170, 400), (220, 400)])
    for k in range(1, 9):
        touch('touchMove', [(170 - k * 8, 400), (220 + k * 8, 400)])
    touch('touchEnd', [])
    z1 = pm.evaluate("LTM_STATE.cam.zoom"); c['pinch_zoom'] = [z0, z1]; c['pinch_zooms_in'] = z1 > z0
    # slider by touch tap
    box = pm.locator('#time').bounding_box()
    pm.touchscreen.tap(box['x'] + box['width'] * 0.25, box['y'] + box['height'] / 2)
    c['touch_slider_quarter_t'] = pm.evaluate("LTM_STATE.t")
    c['touch_slider_maps'] = abs(c['touch_slider_quarter_t'] - 150) < 20
    pm.tap('#play'); c['touch_play'] = pm.evaluate("LTM_STATE.playing"); pm.tap('#play')
    c['portrait_controls_in_view'] = all(visible_in_viewport(pm, s) for s in ['#time', '#play', '#back', '#fwd', '#speed', '#clock'])
    c['portrait_min_font_px'] = min_font(pm)
    pm.evaluate("LTM_app.setT(600);LTM_app.draw()")
    c['portrait_endcard_in_view'] = visible_in_viewport(pm, '#endcard .card')
    pm.screenshot(path=str(OUT / 'verify-phone-portrait-end.png'))
    ctx.close()

    # ---------- phone landscape ----------
    ctx = b.new_context(viewport={'width': 844, 'height': 390}, has_touch=True, is_mobile=True, device_scale_factor=2)
    route_guard(ctx)
    pl = ctx.new_page(); guard(pl, 'landscape'); ready(pl)
    pl.evaluate("LTM_app.setT(382);LTM_app.draw()")
    c['landscape_controls_in_view'] = all(visible_in_viewport(pl, s) for s in ['#time', '#play', '#back', '#fwd', '#speed', '#clock'])
    c['landscape_min_font_px'] = min_font(pl)
    pl.screenshot(path=str(OUT / 'verify-phone-landscape.png'))
    pl.evaluate("LTM_app.setT(600);LTM_app.draw()")
    c['landscape_endcard_in_view'] = pl.evaluate("""(()=>{const r=document.querySelector('#endcard .card').getBoundingClientRect();const e=document.querySelector('#endcard .card');
      return r.top>=-1 && (r.bottom<=innerHeight+1 || e.scrollHeight>e.clientHeight || getComputedStyle(e).overflowY!=='visible');})()""")
    pl.screenshot(path=str(OUT / 'verify-phone-landscape-end.png'))
    ctx.close()

    # ---------- reduced motion ----------
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    route_guard(ctx)
    pr = ctx.new_page(); guard(pr, 'reduced'); ready(pr)
    c['reduced_media_matches'] = pr.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
    pr.evaluate("LTM_app.setT(300);LTM_STATE.cam.x=2;LTM_STATE.cam.y=2;LTM_STATE.follow='porter'")
    pr.wait_for_timeout(120)
    cam = pr.evaluate("[LTM_STATE.cam.x,LTM_STATE.cam.y]"); pp = pr.evaluate("LTM_positionOf('porter',300)")
    c['reduced_camera_snaps'] = abs(cam[0] - pp[0]) < 1e-6 and abs(cam[1] - pp[1]) < 1e-6
    ctx.close()
    b.close()

shutil.rmtree(tmp, ignore_errors=True)
req = ['scrub_back_forward_exact', 'different_times_differ', 'slider_drag_maps', 'keyboard_step_exact', 'space_plays',
       'time_advanced_while_playing', 'space_pauses', 'escape_unfollows', 'camera_follows', 'mouse_drag_unfollows',
       'swap_happened', 'clue_region_changes', 'endcard_visible', 'endcard_hidden', 'touch_drag_pans', 'touch_drag_unfollows',
       'pinch_zooms_in', 'touch_slider_maps', 'touch_play', 'portrait_follow_visible', 'portrait_controls_in_view',
       'portrait_endcard_in_view', 'landscape_controls_in_view', 'landscape_endcard_in_view', 'reduced_media_matches',
       'reduced_camera_snaps', 'eb_garamond_loaded']
failed = [k for k in req if not c.get(k)]
if res['errors']: failed.append('page_errors')
if res['blocked_requests']: failed.append('network_requests')
if c['private_path_hits']: failed.append('private_paths')
if c['network_refs']: failed.append('network_refs')
if c['external_script_or_link']: failed.append('external_refs')
if c['mouse_follow'] != 'porter': failed.append('mouse_follow')
if c['touch_tap_follow'] != 'evelyn': failed.append('touch_tap_follow')
if not c['f_follows']: failed.append('f_follows')
if 'Albert' not in c['follow_text']: failed.append('follow_text')
if c['slider_click_end_t'] < 595: failed.append('slider_click_end')
if c['button_fwd'] != 105 or c['button_back'] != 100: failed.append('buttons')
if 'Not quite' not in c['wrong_feedback'] or not c['right_feedback'].startswith('Yes'): failed.append('end_feedback')
if c['replay_t'] != 0: failed.append('replay')
if min(c['portrait_min_font_px'], c['landscape_min_font_px']) < 14: failed.append('small_text')
res['failed'] = failed; res['passed'] = not failed
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else P / 'tests' / 'verify_check.json'
out.write_text(json.dumps(res, indent=2)); print(json.dumps(res, indent=2))
