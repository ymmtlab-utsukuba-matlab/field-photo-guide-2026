// 画面の切り替え・「撮った」の印・時計。写真は受け取らず、保存しない。端末に置くのは「撮った」の印と時刻だけ（localStorage）。
import { GEN } from './generated.js';
import { DAYS, DEVICES, tasksFor, unitOf, svgFigure, BRIDGE_ORDER } from './content.js';

const $main = document.getElementById('main');
const KEY_MARKS = 'fpg2026.marks.v1';
const KEY_DAY = 'fpg2026.day';
let viewer = null;
let viewerFailed = false;

// ---------- 端末の記録（失敗しても動く） ----------
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
}
let marks = load(KEY_MARKS, {});
const markKey = (day, task, shot) => `${day}|${task}|${shot}`;
const hhmmss = (d) => d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

function setMark(day, task, shot, on) {
  const k = markKey(day, task, shot);
  if (on) marks[k] = new Date().toISOString(); else delete marks[k];
  if (!save(KEY_MARKS, marks)) toast('この端末では印を残せません（ブラウザの設定）。');
}

// ---------- 時計 ----------
const $clock = document.getElementById('clock');
function tick() { $clock.textContent = hhmmss(new Date()); }
tick();
setInterval(tick, 1000);

// ---------- 小物 ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function todayDay() {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  for (const [d, v] of Object.entries(GEN.built.dates)) if (v === ymd) return +d;
  return null;
}
const dayInfo = (n) => DAYS.find((d) => d.n === n);
const taskCache = {};
function tasks(n) { return (taskCache[n] ??= tasksFor(n)); }
function progress(n, t) {
  if (!t.shots || t.repeat) return null;
  const done = t.shots.filter((s) => marks[markKey(n, t.id, s.id)]).length;
  return { done, all: t.shots.length };
}
function setTab(name) {
  document.querySelectorAll('.tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === name));
}
async function getViewer() {
  if (viewer || viewerFailed) return viewer;
  try {
    const mod = await import('./viewer.js');
    viewer = new mod.Viewer();
  } catch (e) {
    console.error(e);
    viewerFailed = true;
  }
  return viewer;
}

// ---------- 日の画面 ----------
function dayChips(cur) {
  return `<div class="days" role="tablist">${DAYS.map((d) => `<a class="day${d.n === cur ? ' on' : ''}" href="#/day/${d.n}" role="tab" aria-selected="${d.n === cur}"><b>${d.n}日目</b><span>${esc(d.date)}${d.state ? '・' + esc(d.state) : ''}</span></a>`).join('')}</div>`;
}
function renderDay(n) {
  setTab('steps');
  save(KEY_DAY, n);
  const d = dayInfo(n);
  const list = tasks(n);
  const parts = ['朝', '日中', '夕方'];
  const partName = { 朝: n >= 2 ? '朝（毎朝の作業を含む）' : '朝', 日中: '日中', 夕方: n >= 2 ? '夕方（毎日の終わりの作業を含む）' : '夕方' };
  let html = dayChips(n);
  html += `<h1>${n}日目 ${esc(d.date)}${d.state ? `<span class="state-tag">橋：${esc(d.state)}</span>` : ''}</h1><p class="muted">${esc(d.title)}</p>`;
  if (n >= 2) html += `<p class="note info">雨の日は計測せず、それ以降を1日ずつ延期する（予備日は 11/3）。延期したら、日付ではなく「何日目」で選ぶ。</p>`;
  for (const part of parts) {
    const ts = list.filter((t) => t.part === part);
    if (!ts.length) continue;
    html += `<div class="section-title">${esc(partName[part])}</div><div class="cards">`;
    for (const t of ts) {
      if (t.nophoto) {
        html += `<div class="card nophoto"><div class="card-head"><span class="card-title">${esc(t.title)}</span><span class="card-count">写真なし</span></div><div class="card-desc">${esc(t.desc)}</div><div class="card-desc">${esc(t.ref)}</div></div>`;
        continue;
      }
      const pr = progress(n, t);
      const count = t.repeat ? 'そのつど' : `${pr.done} / ${pr.all} 枚`;
      const done = pr && pr.done === pr.all;
      html += `<a class="card" href="#/day/${n}/t/${t.id}"><div class="card-head"><span class="card-title">${esc(t.title)}</span><span class="card-count">${done ? '<span class="done-tag">済</span> ' : ''}${count}</span></div>`
        + `<div class="card-desc">${esc(t.role ? '担当：' + t.role : '')}${t.onlyIfAttached ? '（付けた日だけ）' : ''}</div>`
        + (pr ? `<div class="bar"><i style="width:${(100 * pr.done / pr.all).toFixed(0)}%"></i></div>` : '') + '</a>';
    }
    html += '</div>';
  }
  $main.innerHTML = html;
  const on = $main.querySelector('.day.on');
  const strip = $main.querySelector('.days');
  if (on && strip) strip.scrollLeft = Math.max(0, on.offsetLeft - strip.clientWidth / 2 + on.clientWidth / 2);
}

// ---------- 作業の画面 ----------
function renderTask(n, id) {
  setTab('steps');
  const t = tasks(n).find((x) => x.id === id);
  if (!t) return renderDay(n);
  const first = t.shots.findIndex((s) => !marks[markKey(n, t.id, s.id)]);
  let html = `<a class="back" href="#/day/${n}">← ${n}日目の一覧</a><h1>${esc(t.title)}</h1>`;
  html += `<p>${esc(t.desc)}</p><p class="small muted">${esc(t.ref)}${t.role ? '　担当：' + esc(t.role) : ''}</p>`;
  if (t.repeat) html += '<p class="note info">この作業の写真は、起きたときにそのつど撮る見本です（「撮った」の印は付けない）。</p>';
  const devs = [t.device, t.device2].filter(Boolean);
  if (devs.length) html += `<p>${devs.map((k) => `<button class="btn" data-dev="${k}">機器を見る：${esc(DEVICES[k].name)}</button>`).join(' ')}</p>`;
  if (!t.repeat) html += `<p><a class="btn primary" href="#/day/${n}/t/${t.id}/s/${(first < 0 ? 0 : first) + 1}">${first < 0 ? 'はじめから見直す' : first === 0 ? '1枚目から撮る' : `${first + 1}枚目から続ける`}</a></p>`;
  html += '<ol class="shots">' + t.shots.map((s, i) => {
    const at = marks[markKey(n, t.id, s.id)];
    return `<li><a class="${at ? 'done' : ''}" href="#/day/${n}/t/${t.id}/s/${i + 1}"><span class="num">${i + 1}</span><span class="t">${esc(s.title)}${at ? `<span class="when">撮った ${hhmmss(new Date(at))}</span>` : ''}</span></a></li>`;
  }).join('') + '</ol>';
  $main.innerHTML = html;
  $main.querySelectorAll('[data-dev]').forEach((b) => b.addEventListener('click', () => openDevice(b.dataset.dev)));
}

// ---------- 写真1枚の画面 ----------
async function renderShot(n, id, idx) {
  setTab('steps');
  const t = tasks(n).find((x) => x.id === id);
  if (!t) return renderDay(n);
  const i = Math.min(Math.max(idx - 1, 0), t.shots.length - 1);
  const s = t.shots[i];
  const k = markKey(n, t.id, s.id);
  const at = marks[k];
  const prev = i > 0 ? `#/day/${n}/t/${t.id}/s/${i}` : `#/day/${n}/t/${t.id}`;
  const next = i < t.shots.length - 1 ? `#/day/${n}/t/${t.id}/s/${i + 2}` : `#/day/${n}/t/${t.id}`;
  let html = `<div class="shot-view"><div class="viewer-wrap" id="vw"></div><div class="info">`;
  html += `<a class="back" href="#/day/${n}/t/${t.id}">← ${esc(t.title)}</a>`;
  html += `<div class="shot-no">${n}日目・${i + 1} / ${t.shots.length} 枚目</div><h1>${esc(s.title)}</h1>`;
  html += `<dl class="kv"><dt>撮る物</dt><dd>${esc(s.what)}</dd><dt>撮る所</dt><dd>${esc(s.where)}</dd><dt>向き</dt><dd>${esc(s.dir)}</dd></dl>`;
  html += `<h3>写っていること</h3><ul class="must">${s.must.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>`;
  if (s.note) html += `<p class="note">${esc(s.note)}</p>`;
  if (s.view && s.view.legend) html += `<p class="small muted">図：${esc(s.view.legend)}</p>`;
  if (!t.repeat) html += `<p class="marked-at" id="markedAt">${at ? '撮った：' + hhmmss(new Date(at)) : ''}</p>`;
  html += `<p class="small muted">図の見方：桃色＝撮る所とカメラの向き、黄色＝撮る物。指で回せる。</p></div></div>`;
  html += `<div class="actionbar"><a class="btn" href="${prev}">← 前</a>`
    + (t.repeat ? `<a class="btn" href="#/day/${n}/t/${t.id}">一覧</a>` : `<button class="btn ${at ? '' : 'ok'}" id="markBtn" type="button">${at ? '撮った ✓（取り消す）' : '撮った'}</button>`)
    + `<a class="btn" href="${next}">次 →</a></div>`;
  $main.innerHTML = html;
  $main.classList.add('with-bar');
  const btn = document.getElementById('markBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const on = !marks[k];
      setMark(n, t.id, s.id, on);
      if (on && i < t.shots.length - 1) { toast(`撮った：${hhmmss(new Date())}`); location.hash = next; }
      else if (on) { toast('この作業の写真は全部撮りました'); location.hash = `#/day/${n}/t/${t.id}`; }
      else renderShot(n, id, idx);
    });
  }
  const wrap = document.getElementById('vw');
  if (s.view && s.view.svg) {
    wrap.innerHTML = `<div class="viewer" style="display:flex;align-items:center;justify-content:center;background:#f4f6f8">${svgFigure(s.view.svg, s.view.svgText)}</div>`;
    return;
  }
  const v = await getViewer();
  if (!v) { wrap.innerHTML = '<div class="viewer"><p class="viewer-msg">3D を読み込めませんでした。文の指示で撮ってください。</p></div>'; return; }
  if (!document.body.contains(wrap)) return;
  v.attach(wrap);
  await v.show(s.view || {});
}

// ---------- 機器を見る ----------
async function openDevice(key) {
  const d = DEVICES[key];
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="sheet" role="dialog" aria-label="${esc(d.name)}"><div class="sheet-head"><h2 style="margin:4px 0">${esc(d.name)}</h2><button class="btn" type="button" data-close>閉じる</button></div><div id="devwrap"></div><p class="small muted">${esc(d.note)} 出典はこのアプリの「使い方」の 3D の出典。</p></div>`;
  document.body.appendChild(ov);
  const close = () => { ov.remove(); route(); };
  ov.querySelector('[data-close]').addEventListener('click', close);
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  const v = await getViewer();
  if (!v) return;
  v.attach(ov.querySelector('#devwrap'));
  await v.showDevice(d.url, d.name);
}

// ---------- 割り当て ----------
function renderAssign() {
  setTab('assign');
  const byPoint = Object.fromEntries(GEN.assignment.map((a) => [a.point, a]));
  const pt = Object.fromEntries(GEN.points.map((p) => [p.id, p]));
  const row = (id) => {
    const p = pt[id]; const a = byPoint[id];
    return `<tr><td class="code">${esc(id)}</td><td class="code">${esc(a ? a.device : '未定')}</td><td>${esc(p.girder || '')}</td><td class="code">${p.x != null ? p.x.toFixed(3) : ''}</td><td class="code">${esc(p.type)}/${esc(p.pos)}</td></tr>`;
  };
  const head = '<tr><th>位置</th><th>台（SD 名）</th><th>主桁</th><th>x（m）</th><th>前処理のフォルダ</th></tr>';
  const dates = Object.entries(GEN.built.dates);
  let html = '<h1>割り当て表</h1>';
  html += '<p>どの台をどの位置に付けるか（2026-10-19 にユーザーが確定）。規則：設置表の位置の番号（position_code）と台の番号をそろえる。小野橋梁センサは予備の P009・P014 を除いて番号の順。</p>';
  html += `<h2>橋の24台（歩く順）</h2><div class="table-wrap"><table>${head}${BRIDGE_ORDER.map(row).join('')}</table></div>`;
  html += `<h2>感圧・温度・MOSAIC</h2><div class="table-wrap"><table>${head}${['PRESS_P001', 'PRESS_P002', 'T1', 'T2', 'C1', 'C2', 'C3', 'C4', 'BM1'].map(row).join('')}</table></div>`;
  html += `<h2>試験車（1日目と3〜6日目）</h2><div class="table-wrap"><table>${head}${['FSL', 'FSR', 'RSL', 'RSR', 'FZL', 'FZR', 'RZL', 'RZR', 'VM1'].map(row).join('')}</table></div>`;
  html += `<p>予備：${GEN.spares.map(esc).join('・')}</p>`;
  html += '<h2>設置の記録の CSV（前処理が読む）</h2><p class="small">その日の回収の前に、データ保管用の PC の <code>Raw_Data/&lt;実験名&gt;/SENSOR_SETUP/</code> に入れる。列は記録の項目（forms/sensor_install_record.csv）と同じ。測る値の列は空（写真で残す）。</p><div class="dl">';
  html += dates.map(([d, v]) => `<a href="install_records/sensor_install_record_${v}.csv" download>${d}日目（${v.slice(4, 6)}/${v.slice(6)}）：sensor_install_record_${v}.csv</a>`).join('');
  html += '</div>';
  html += '<h2>台を替えたとき</h2><ol><li>替えた台を、名札と巻尺が写るように撮る（手順の「台を替えた・異常があったとき」）。</li><li>夕方、その日の CSV の device_id と sd_name を、替えた台の名前に直す。</li><li>直した CSV を SENSOR_SETUP/ に入れてから回収する（前処理が、位置と台が合わないと止まるため）。</li></ol>';
  html += '<p class="small muted">雨で日がずれたら、データ保管用の PC で <code>python3 tools/build_data.py --dates 3=20261031,…</code> と日付を渡して CSV を作り直す（README）。</p>';
  $main.innerHTML = html;
}

// ---------- 使い方 ----------
function renderHelp() {
  setTab('help');
  const src = GEN.sources3d || [];
  let html = '<h1>使い方</h1>';
  html += '<ol><li>上の「手順」で、その日（何日目）を選ぶ。</li><li>作業を選び、1枚目から順に撮る。3D の図の<b style="color:var(--cam)">桃色</b>が撮る所とカメラの向き、<b>黄色</b>が撮る物。「撮る位置から」を押すと、その位置から見た形になる。</li><li>撮ったら「撮った」を押す。次の写真に進む。</li></ol>';
  html += '<h2>撮る前に</h2><ul><li><b>スマートフォンの時刻を「自動」にする。</b>写真は撮った時刻で、計測の記録と照らし合わせる。</li><li>写真は、撮った時刻が残る形で集める（AirDrop か、ケーブルで元のファイルのまま）。LINE などのアプリで送ると、撮った時刻の情報が消えることがあるので使わない。集める場所は未定。</li><li>前日までに、各台の上面（SPRESENSE は容器のふた）に、マスキングテープで名札を貼っておく。書くのは位置と台の名前（例「U12 BRI_P001」）と、x の向き（出口へ）の矢印。写真で台と向きを見分けるため。</li><li>人の顔はなるべく写さない。</li></ul>';
  html += '<h2>このアプリが残す物</h2><p>写真は受け取らず、保存しない。この端末に残すのは「撮った」の印と押した時刻だけ（ブラウザの中。ほかの人には見えない）。</p><p><button class="btn" id="resetMarks" type="button">この端末の「撮った」の印を全部消す</button></p>';
  html += '<h2>電波の弱い所で使う</h2><p>先に下を押すと、3D をこの端末に読み込んでおく（合わせて約 9 MB）。</p><p><button class="btn" id="prefetch" type="button">3D を全部読み込む</button> <span id="prefetchMsg" class="small muted"></span></p>';
  html += '<h2>図の見方</h2><ul><li>塗りつぶしの印は位置が決まった物、白抜き（点線の札）は案か未定の物。</li><li>橋の 3D は研究側が作った表示用の模型で、寸法の正本ではない。支承・継ぎ目・横桁・路面の形は目安。</li><li>加振器の 3D は作成中。いまは位置の目安の箱を描いている。</li></ul>';
  html += '<h2>決まっていないこと（図と文では「未定」）</h2><ul><li>温度センサ T1・T2 を付ける主桁と面</li><li>ばね上4台と車載の MOSAIC（VM1）を置く所</li><li>BM1 の置き場所（見つからなければ置かない）</li><li>跳躍の位置、静的載荷で止める位置</li><li>横桁のボルトの、端の中の番号の順（2日目の初めに決める）</li><li>撮った写真を集める場所</li></ul>';
  html += `<h2>元の資料と出典</h2><p class="small">手順は、再試験の手順書・計画書・加振器とハンマーの使い方・設置表（研究室の現場試験の資料、commit ${esc(GEN.built.fieldDocsCommit)}）から作った。設置表の SHA-256：<code>${esc(GEN.built.sensorPositionsSha256.slice(0, 16))}…</code></p>`;
  if (src.length) html += `<div class="table-wrap"><table><tr><th>3D</th><th>元</th><th>元の SHA-256</th></tr>${src.map((x) => `<tr><td>${esc(x.name)}</td><td class="small">${esc(x.from)}</td><td class="code">${esc(x.sha256.slice(0, 12))}…</td></tr>`).join('')}</table></div>`;
  html += '<p class="small muted">表示に three.js 0.160.0（MIT ライセンス）を jsDelivr から読み込む。</p>';
  $main.innerHTML = html;
  document.getElementById('resetMarks').addEventListener('click', () => {
    if (confirm('この端末の「撮った」の印を全部消します。よいですか？')) { marks = {}; save(KEY_MARKS, marks); toast('消しました'); }
  });
  document.getElementById('prefetch').addEventListener('click', async () => {
    const msg = document.getElementById('prefetchMsg');
    const urls = [GEN.models.bridge, GEN.models.truck, ...Object.values(DEVICES).map((d) => d.url)];
    if (GEN.models.shaker) urls.push(GEN.models.shaker);
    let ok = 0;
    for (const u of urls) {
      msg.textContent = `読み込み中 ${ok} / ${urls.length}`;
      try { const r = await fetch(u, { cache: 'reload' }); if (r.ok) { await r.arrayBuffer(); ok++; } } catch (e) { /* 続ける */ }
    }
    await getViewer();
    msg.textContent = ok === urls.length ? '読み込みました' : `${urls.length - ok} 個を読み込めませんでした`;
  });
}

// ---------- 道順 ----------
function route() {
  $main.classList.remove('with-bar');
  const h = location.hash.replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  window.scrollTo(0, 0);
  if (parts[0] === 'assign') return renderAssign();
  if (parts[0] === 'help') return renderHelp();
  if (parts[0] === 'day') {
    const n = +parts[1];
    if (!dayInfo(n)) return renderDay(1);
    if (parts[2] === 't' && parts[4] === 's') return renderShot(n, parts[3], +parts[5]);
    if (parts[2] === 't') return renderTask(n, parts[3]);
    return renderDay(n);
  }
  return renderDay(todayDay() ?? load(KEY_DAY, 1));
}
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
