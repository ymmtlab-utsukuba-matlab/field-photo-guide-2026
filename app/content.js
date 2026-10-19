// 手順と写真の指示。元は鋼製模型橋梁実験の手順書・計画書・加振器の使い方・設置表（研究室の現場試験の資料、commit 32b7cfb）。
// 橋の座標は設置表と同じ（x：入口の支承の中心の線から出口へ、y：中心線から G4 の側へ、z：上フランジの上面から上。m）。
// 撮る位置 cam.dir は [橋の向き, G4 の側, 上] の向きで、ねらう所からの距離 dist（m）。
import { GEN } from './generated.js';
import { STEPS, matches } from './procedure.js';

const P = Object.fromEntries(GEN.points.map((p) => [p.id, p]));
const UNIT = Object.fromEntries(GEN.assignment.map((a) => [a.point, a.device]));
export const unitOf = (id) => UNIT[id] ?? '未定';
const BR = GEN.bridge;
const DECK = 0.012;
const LEFT_Y = +(BR.pathY + BR.track / 2).toFixed(2);    // 左の車輪の通り道（目安）
const RIGHT_Y = +(BR.pathY - BR.track / 2).toFixed(2);   // 右の車輪の通り道（目安）
const m3 = (x) => `${x.toFixed(3)} m`;

export const DAYS = [
  { n: 0, date: '〜10/27', state: '', title: '前日までの準備（研究室）', label: '前日まで' },
  { n: 1, date: '10/28（水）', state: '', title: '試験B・橋の掃除・寸法・車両単独の試験・静的載荷・予行' },
  { n: 2, date: '10/29（木）', state: '健全', title: 'センサの設置。加振を1日中くり返す' },
  { n: 3, date: '10/30（金）', state: '健全', title: '午前に加振、午後に走行。夕方に軽度へ' },
  { n: 4, date: '10/31（土）', state: '軽度', title: '午前に加振、午後に走行。夕方に重度へ' },
  { n: 5, date: '11/1（日）', state: '重度', title: '午前に加振、午後に走行。夕方に健全へ' },
  { n: 6, date: '11/2（月）', state: '健全', title: '午前に加振、午後に走行。撤収' },
];

export const DEVICES = {
  spresense: { url: 'models/devices/spresense_stack.glb', name: 'SPRESENSE の本体（橋の IMU・ばね上・ばね下）', note: '基板を重ねた本体。橋とばね上は、これをふた付きの容器に入れる。' },
  temp: { url: 'models/devices/temperature_logger.glb', name: '温度センサ（TEMP_P001・P002）', note: '温度の測定点の板（TMP117）とロガー。' },
  press: { url: 'models/devices/press_logger.glb', name: '感圧センサのロガー（PRESS_P001・P002）', note: 'ロガーの基板。帯（FSR-408）は別の部品。' },
  pressEnd: { url: 'models/devices/press_strip_end.glb', name: '感圧の帯の端（FSR-408）', note: '端子のある端。丸めるときに折らない。' },
  mosaic: { url: 'models/devices/mosaic.glb', name: 'MOSAIC（GNSS の記録の機器）', note: '画面つきの本体。四隅・車載・BM1 で同じ形。' },
  mass: { url: 'models/mass_exploded.glb', name: 'おもりの部品（組む順に分けて並べた形）', note: 'いちばん下は加振器の本体。その上に、おもりの部品を組む順に分けて並べた。' },
};

// ---------- 小さな部品 ----------
const sideOf = (p) => (p.girder === 'G1' ? 'G1' : p.girder === 'G4' ? 'G4' : 'deck');
const surf = (p) => (p.girder === 'G1' ? 0 : DECK);
const kindName = (p) => (p.kind === 'imu' ? '加速度計（IMU）' : '小野橋梁センサ');
const placeText = (p) => (p.girder === 'G1' ? 'G1 の上フランジの上面の幅の中央' : `${p.girder} の真上の床版の上面`);
const whereText = (p, near) => {
  const s = sideOf(p);
  if (s === 'G1') return `橋の外（G1 の側の地面）に立ち、${p.id} の${near ? 'すぐ横' : '真横'}から`;
  if (s === 'G4') return `橋の外（G4 の側の地面）に立ち、${p.id} の${near ? 'すぐ横' : '真横'}から`;
  return `床版の上に立ち、${p.id} の${near ? '横' : '入口の側'}から`;
};
const camTop = (p) => ({ G1: { dir: [0, -0.75, 1], dist: 0.95 }, G4: { dir: [0, 0.75, 1], dist: 0.95 }, deck: { dir: [-0.55, 0, 1], dist: 1.0 } })[sideOf(p)];
const camTape = (p) => ({ G1: { dir: [-0.25, -0.9, 0.45], dist: 0.65 }, G4: { dir: [-0.25, 0.9, 0.45], dist: 0.65 },
  deck: { dir: [-0.25, p.girder === 'G2' ? 0.85 : -0.85, 0.5], dist: 0.6 } })[sideOf(p)];

export const BRIDGE_ORDER = ['E1', 'U11', 'U12', 'U13', 'U14', 'U15', 'E2', 'U25', 'U24', 'U23', 'U22', 'U21',
  'U31', 'U32', 'U33', 'U34', 'U35', 'E8', 'U45', 'U44', 'U43', 'U42', 'U41', 'E7'];
const ORDER_NOTE = 'G1 を入口から出口へ、G2 を出口から入口へ、G3 を入口から出口へ、G4 を出口から入口へ（歩く順）';

function bridgeInstallShots(id) {
  const p = P[id];
  const u = unitOf(id);
  const isE = id.startsWith('E');
  const shots = [{
    id: `${id}-a`, title: `${id} 付けた所（名札と向き）`,
    what: `${id} に付けた${kindName(p)}（${u}）`,
    where: whereText(p), dir: '斜め上から見下ろす。縦長',
    must: [`名札（${id}・${u}）が読める`, '名札の矢印（x の向き）が出口を向いている（z は上、y は G4 の側）', `${placeText(p)}にある`,
      ...(isE ? ['支承の支間側の縁のすぐ内側（支承の真上）にある'] : [])],
    note: isE ? '付けたらすぐ撮る（撮った時刻が、付けた時刻の記録になる。研究側の要件 R7）。その後は計測の終わりまで触れない。触れたら、そのセンサを撮る（R8）。'
      : 'ボルトの頭などと当たるときは、x の向きに 5 cm までずらしてよい（ずらした位置は次の写真の巻尺で残る）。',
    view: { target: id, axes: id, cam: camTop(p), orient: 'tate', labels: [id] },
  }];
  const ref = isE ? [p.x, p.y, surf(p) + 0.003] : [0, p.y, surf(p) + 0.003];
  shots.push({
    id: `${id}-b`, title: `${id} 位置（巻尺）`,
    what: isE ? `支承の中心から ${id} までの距離` : `入口の支承の中心の線から ${id} までの距離`,
    where: whereText(p, true), dir: '横から。横長',
    must: isE ? ['巻尺の 0 が支承の中心にある', `${id} の容器の中心の目盛りが読める`]
      : ['巻尺の 0 が入口の支承の中心の線にある（2人で張る）', `${id} の容器の中心の目盛りが読める（設置表では ${m3(p.x)}）`],
    view: { target: id, cam: camTape(p), orient: 'yoko', labels: [id], tapes: [{ from: ref, to: id, label0: isE ? '支承の中心' : '0（入口の支承の中心の線）', label1: isE ? '読む所' : m3(p.x) }] },
  });
  if (p.girder === 'G3') {
    shots.push({
      id: `${id}-c`, title: `${id} 高さ（覆いを付けた後）`,
      what: `覆い（発泡スチロール）を付けた ${id} の高さ`,
      where: '床版の上で、G2 の側から', dir: '真横から。低い位置で',
      must: ['物差しを床版に立て、覆いのいちばん上の目盛りが読める', `名札（${id}）`],
      note: 'G3 の5点は車の床下（左右の車輪の間）を通る。試験車の最低地上高と比べる（手順書 §4）。',
      view: { target: id, cam: { dir: [0, -1, 0.15], dist: 0.6 }, orient: 'yoko', labels: [id] },
    });
  }
  return shots;
}

function iceShot(id) {
  const p = P[id];
  return {
    id: `${id}-ice`, title: `${id} 保冷剤`,
    what: `${id}（${unitOf(id)}）の発泡スチロールの中`,
    where: whereText(p), dir: 'ふたを開けて、真上から',
    must: ['保冷剤の数と置き方が分かる（毎日同じにする）', '保冷剤が袋に入っていて、板に直接当たっていない', `名札（${id}）`],
    note: '撮ったらすぐふたを閉める。静的載荷と走行の途中では替えない（手順書 §4 の5）。',
    view: { target: id, cam: { ...camTop(p), dir: [camTop(p).dir[0] * 0.3, camTop(p).dir[1] * 0.3, 1] }, orient: 'tate', labels: [id] },
  };
}

function routeShot(g) {
  const y = BR.girderY[+g.slice(1) - 1];
  const outside = g === 'G1' ? -1 : g === 'G4' ? 1 : 0;
  return {
    id: `route-${g}`, title: `${g} の線のアンテナとケーブル`,
    what: `${g} の線のセンサ・アンテナ・ケーブルの並び`,
    where: outside ? `橋の外（${g} の側）の、入口の近くから` : '床版の上の、入口の端から', dir: '出口へ向けて、橋の向きに。横長',
    must: ['アンテナが空の見える所にある', 'ケーブルが車輪の通り道にかかっていない', '人が踏まない所にある'],
    view: { target: [3.5, y, surf({ girder: g }) + 0.05], cam: outside ? { dir: [-1.2, outside * 0.7, 0.55], dist: 4.6 } : { dir: [-1, 0, 0.35], dist: 4.4 }, orient: 'yoko', labels: BRIDGE_ORDER.filter((id) => P[id].girder === g), ring: 0.01 },
  };
}

function pressShots(id, first) {
  const p = P[id];
  const entry = p.x < 1;
  const s = entry ? -1 : 1;
  const name = entry ? '入口' : '出口';
  const thick = first ? [{
    id: `${id}-t`, title: `${name}の帯の厚さ（保護材を含む）`,
    what: `${name}の帯の、ゴムシートを含めた厚さ`,
    where: '帯の端の横にしゃがんで', dir: '真横から。横長',
    must: ['物差しかノギスを帯の端に当て、ゴムシートを含めた厚さの目盛りが読める'],
    view: { target: id, cam: { dir: [s * 0.2, -1, 0.15], dist: 0.5 }, orient: 'yoko', labels: [id], floor: DECK },
  }] : [];
  return [
    {
      id: `${id}-a`, title: `${name}の帯（置いた所）`,
      what: `${name}の支承線の上に置いた感圧の帯（${id}）`,
      where: `${entry ? '入口の手前' : '出口の先'}の路面に立ち、帯の正面から`, dir: '斜め上から。横長',
      must: [`帯が${name}の支承線の上に、横向き（左の車輪の通り道が中心）にある`, 'ゴムシートをかぶせてある', first ? '路面に付けた印（置く位置）' : '前の日の印の位置に置いた'],
      view: { target: id, cam: { dir: [s * 1, 0, 0.8], dist: 1.5 }, orient: 'yoko', labels: [id], floor: DECK, tapes: [{ from: [p.x, LEFT_Y - 0.55, DECK + 0.003], to: [p.x, LEFT_Y + 0.55, DECK + 0.003], label0: '', label1: '支承の中心の線', color: 0x1c7ed6 }] },
    },
    {
      id: `${id}-b`, title: `${name}の帯（支承の中心からの距離）`,
      what: `${name}の支承の中心の線から帯の中心までの距離`,
      where: '帯のすぐ横にしゃがんで', dir: '真上から。縦長',
      must: ['巻尺の 0 を、支承の中心の線（路面の印）に当てている', '帯の中心の目盛りが 5 mm 単位で読める'],
      note: first ? '' : '毎朝、置き直したら測り直す（手順書 §6 の4）。',
      view: { target: id, cam: { dir: [s * 0.3, -0.3, 1], dist: 0.6 }, orient: 'tate', labels: [id], floor: DECK },
    },
    {
      id: `${id}-c`, title: `${name}のロガー（名札）`,
      what: `${id} のロガー`,
      where: 'ロガーの横から', dir: '斜め上から',
      must: [`名札（${id}）`, 'ロガーとケーブルが車輪の通り道から外れている'],
      view: { target: id, cam: { dir: [s * 0.6, 0.7, 1], dist: 0.9 }, orient: 'tate', labels: [id], floor: DECK },
    },
    {
      id: `${id}-d`, title: `${name}の帯を踏んで LED3`,
      what: 'ゴムシートの上から帯を踏んでいる所と、ロガーの LED3',
      where: 'ロガーのすぐ横から', dir: '斜め上から',
      must: ['足が帯を踏んでいる', 'SPRESENSE の LED3 が点いている'],
      note: '足を離したら LED3 が消えることも確かめる（写真は踏んでいる所の1枚）。',
      view: { target: id, cam: { dir: [s * 0.4, 0.8, 0.9], dist: 0.8 }, orient: 'tate', labels: [id], floor: DECK },
    },
  ].flatMap((x, i) => (i === 0 ? [x, ...thick] : [x]));
}

function tempShots(id, first) {
  const name = id === 'T1' ? '日なた側' : '日かげ側';
  const u = unitOf(id);
  const view = (dist, dir) => ({ target: id, cam: { dir, dist }, orient: 'tate', labels: [id], legend: 'T1・T2 を付ける主桁と面は未定（計画書 §10.3 の8）。図は支間中央の線だけを示す' });
  return [
    {
      id: `${id}-a`, title: `${id}（${name}）測定点の板`,
      what: `支間中央の鋼に貼った温度の測定点の板（${u}）`,
      where: '板の正面から', dir: '板に向けて真っすぐ。縦長',
      must: [first ? '貼った位置の印（毎朝ここに貼り直す）' : '前の日の印の位置に貼った', '熱伝導の両面テープ（毎朝新しい物）で貼った', 'どの部材のどの面か分かる（少し引いて撮る）'],
      view: view(0.9, [0, id === 'T1' ? -1 : 1, 0.25]),
    },
    {
      id: `${id}-b`, title: `${id} ロガー（名札）`,
      what: `${id} のロガー（${u}）と日よけ`,
      where: 'ロガーの横から', dir: '斜め上から',
      must: [`名札（${id}・${u}）`, 'Qwiic ケーブル（15 cm）で板とつながっている', '拡張ボードのピンをテープで留めてある', '日よけの発泡スチロール。保冷剤は測定点から離してある'],
      view: view(0.9, [0.4, id === 'T1' ? -1 : 1, 0.6]),
    },
    {
      id: `${id}-c`, title: `${id} アンテナ`,
      what: `${id} のアンテナ（ケーブル 5 m）を置いた所`,
      where: 'アンテナが見える所から', dir: '少し離れて。横長',
      must: ['アンテナが空の開けた所にある', 'アンテナとケーブルが車輪の通り道から外れている'],
      view: view(1.8, [0, id === 'T1' ? -1 : 1, 0.9]),
    },
  ];
}

function cornerShots(id) {
  const p = P[id];
  const out = p.y < 0 ? -1 : 1;
  const ex = p.x < 1 ? -1 : 1;
  const u = unitOf(id);
  const side = `${p.x < 1 ? '入口' : '出口'}・${p.girder}`;
  return [
    {
      id: `${id}-a`, title: `${id}（${side}）本体と名札`,
      what: `支承の四隅の MOSAIC（${u}）`,
      where: `橋の外（${p.girder} の側）から`, dir: '斜め上から',
      must: [`名札（${id}・${u}）`, '画面', 'ケーブルが車輪の通り道と人の通る所にかかっていない'],
      view: { target: id, cam: { dir: [ex * 0.5, out * 1, 0.8], dist: 1.1 }, orient: 'tate', labels: [id] },
    },
    {
      id: `${id}-b`, title: `${id} アンテナの位置（橋の向き）`,
      what: '支承の中心とアンテナの中心の、橋の向きの差',
      where: `橋の外（${p.girder} の側）の真横から`, dir: '横から。横長',
      must: ['巻尺の 0 が支承の中心の線にある', 'アンテナの中心の目盛りが読める'],
      view: { target: id, cam: { dir: [0, out * 1, 0.2], dist: 0.8 }, orient: 'yoko', labels: [id], tapes: [{ from: [p.x, p.y, 0.005], to: id, label0: '支承の中心', label1: 'アンテナの中心', color: 0x1c7ed6 }] },
    },
    {
      id: `${id}-c`, title: `${id} アンテナの位置（横の向き）`,
      what: '支承の中心とアンテナの中心の、橋を横切る向きの差',
      where: `${p.x < 1 ? '入口の手前' : '出口の先'}から、橋の向きに見て`, dir: '横から。横長',
      must: ['巻尺の 0 が主桁の中心の線にある', 'アンテナの中心の目盛りが読める'],
      view: { target: id, cam: { dir: [ex * 1, 0, 0.2], dist: 0.8 }, orient: 'yoko', labels: [id] },
    },
  ];
}

const S1 = [1.67, -1.8, 0.12];
const TARP = [1.67, -3.4, BR.groundZ];
function shakerMorningShots(first) {
  const shots = [];
  if (first) {
    shots.push({
      id: 'S1-mark', title: 'S1 の印（巻尺）',
      what: 'G1 の上フランジに付けた S1 の印（黄色のテープの十字）',
      where: '橋の外（G1 の側の地面）から', dir: '横から。横長',
      must: ['巻尺の 0 が入口の支承の中心の線にある', '1.67 m の目盛りの所に印がある', '印が上フランジの幅の中央（腹板の真上）にある'],
      view: { target: 'S1', cam: { dir: [-0.2, -1, 0.5], dist: 0.8 }, orient: 'yoko', labels: ['S1'], shaker: false, tapes: [{ from: [0, -1.8, 0.003], to: [1.67, -1.8, 0.003], label0: '0（入口の支承の中心の線）', label1: '1.67 m' }] },
    });
  }
  shots.push(
    {
      id: 'S1-place', title: '加振器を印の上に置いた所',
      what: 'S1 の印の上に置いた加振器（PET-05）',
      where: '橋の外（G1 の側の地面）から', dir: '斜め上から。縦長',
      must: ['底が上フランジにじかに載っている（間に何も挟まない）', '四角い板の辺が桁の向きにそろっている', '白・黄の端子の向き（毎日同じ向きにする）'],
      view: { target: 'S1shaker', cam: { dir: [-0.3, -1, 0.7], dist: 0.9 }, orient: 'tate', shaker: true, shakerParts: ['mark', 'body'], targetLabel: 'S1' },
    },
    {
      id: 'S1-clamps', title: 'クランプ：橋の外の側の2本',
      what: '加振器を留めた L型クランプ（LS-160N）のうち、橋の外の側（G1 の外）の2本',
      where: '橋の外（G1 の側の地面）から、少し低い所', dir: '斜め横から。横長',
      must: ['外の側の2本が両方写っている', '上の爪が四角い板の角に載っている', '爪の先が本体の円筒に当たっていない（2〜3 mm あける）'],
      note: '4本を少しずつ順に、手で締める。スパナで増し締めしない（加振器とハンマーの使い方 §4）。',
      view: { target: 'S1shaker', cam: { dir: [0.25, -1, 0.3], dist: 0.85 }, orient: 'yoko', shaker: true, shakerParts: ['mark', 'body'] },
    },
    {
      id: 'S1-clamps-in', title: 'クランプ：橋の内の側の2本',
      what: 'L型クランプのうち、橋の内の側（G1 と G2 の間）の2本',
      where: '橋の外（G1 の側）から、加振器の上を越えて見下ろす', dir: '斜め上から。横長',
      must: ['内の側の2本が両方写っている', '上の爪が四角い板の角に載っている', '爪の先が本体の円筒に当たっていない'],
      view: { target: 'S1shaker', cam: { dir: [-0.2, -0.45, 1], dist: 0.8 }, orient: 'yoko', shaker: true, shakerParts: ['mark', 'body'] },
    },
    {
      id: 'S1-level', title: '水準器',
      what: '加振器の本体の上面に載せた水準器',
      where: '水準器の真横から', dir: '泡の高さで。横長',
      must: ['泡が真ん中にある', '水準器が本体の上面に載っている（動く台には載せない）'],
      view: { target: 'S1shaker', cam: { dir: [0, -1, 0.35], dist: 0.5 }, orient: 'yoko', shaker: true, shakerParts: ['mark', 'body'] },
    },
  );
  if (first) {
    shots.push(
      {
        id: 'clamp-weigh', title: 'クランプ4本の質量',
        what: 'はかりに載せたクランプ4本',
        where: 'はかりの正面から', dir: '表示が読める向き',
        must: ['はかりの表示が読める', '4本が全部載っている'],
        note: 'クランプは計測の間ずっと橋に載るので、研究側に質量を伝える（計画書 §10.2 の1）。',
        view: { svg: 'scale', svgText: ['L型クランプ 4本'] },
      },
    );
  }
  shots.push(
    {
      id: 'mass-on', title: 'おもりを留めた所',
      what: '加振器の台に留めたおもり（大ワッシャー33枚）と 353B33',
      where: '橋の外（G1 の側の地面）から', dir: '真横から。縦長',
      must: ['大ワッシャー33枚の束', '受けナットが台から約 10 mm の高さにあり、ワッシャーが本体から浮いている', '353B33 がいちばん上のワッシャーにあり、ケーブルがテープで留めてある'],
      view: { target: 'S1shaker', cam: { dir: [0, -1, 0.5], dist: 0.6 }, orient: 'tate', shaker: true, shakerParts: ['mark', 'body', 'rod', 'mass'] },
    },
    {
      id: 'tarp-gear', title: '機器とケーブル（ブルーシートの上）',
      what: 'G1 の側のブルーシートの上の、電力増幅器 PA05・オシロスコープ DHO914S・Mac・信号調整器 480E09',
      where: 'ブルーシートの外から', dir: '少し離れて全体。横長',
      must: ['4つの機器が全部写っている', 'PA05 の前面の外部入力（EXTSIG）に BNC がつながっている', 'ケーブルが通り道にかかっていない'],
      view: { target: TARP, cam: { dir: [-0.6, -1, 0.9], dist: 2.6 }, orient: 'yoko', shaker: true, targetLabel: 'ブルーシート（置き場所の目安）', ring: 0.4 },
    },
  );
  return shots;
}

function damageShots(prefix, stateView, label, mustExtra) {
  const out = [];
  for (let i = 1; i <= 8; i++) {
    const g4 = i <= 4;
    out.push({
      id: `${prefix}-b${i}`, title: `ボルト ${i}（${g4 ? 'G4' : 'G3'} 側の端）`,
      what: `損傷させる横桁（G3–G4 の間、支間中央）の、${g4 ? 'G4' : 'G3'} 側の端のボルト ${i}`,
      where: 'G3 と G4 の間の、橋の下から（ボルトに手が届く所）', dir: 'ボルトの頭に向けて真っすぐ',
      must: [`ボルトの横のテープの番号（${i}）`, ...mustExtra],
      note: 'G4 側の端のボルトは主桁の腹板の内側にあるので、橋の外からは見えない。下から見上げて撮る。',
      view: { target: g4 ? 'bolts:G4' : 'bolts:G3', bolts: g4 ? 'G4' : 'G3', state: stateView, deck: 0.25, cam: { dir: [-0.45, g4 ? -0.55 : 0.55, -0.7], dist: 0.45 }, floor: BR.groundZ, orient: 'yoko', targetLabel: `${g4 ? 'G4' : 'G3'} 側の端（ボルト ${g4 ? '1〜4' : '5〜8'}）`, ring: 0.09, legend: label, over: { dist: 2.8, elev: 45, turn: 20 } },
    });
  }
  return out;
}
const DAMAGE_CAM = { at: [2.95, 1.2, -0.33] };   // G3 と G4 の間の橋の下、入口の側の隣の横桁より支間中央の寄り
const damageOverall = (id, stateView, title, must) => ({
  id, title, what: '損傷させる横桁（G3–G4 の間、支間中央）の全体',
  where: 'G3 と G4 の間の、橋の下から（入口の側から支間中央に向けて）', dir: '横桁の全体と両端が入るように。横長',
  must,
  view: { target: 'node:CG_x4.550_G3G4', state: stateView, deck: 0.25, highlightDamage: true, cam: DAMAGE_CAM, floor: BR.groundZ, orient: 'yoko', targetLabel: '損傷させる横桁', ring: 0.3, over: { dist: 3.4, elev: 45, turn: 20 } },
});

const NUMBERING = 'ボルトの番号：G4 側の端の4本を 1〜4、G3 側の端の4本を 5〜8。端の中の順は2日目の初めに決め、ボルトの横にマスキングテープで番号を書く。';

function vehicleShots(id) {
  const vp = GEN.vehiclePoints.find((v) => v.id === id);
  const u = unitOf(id);
  const unspr = /Z/.test(id);
  const left = vp.at[1] > 0;
  const front = vp.at[0] > -1;
  const nm = { FSL: '前左のばね上', FSR: '前右のばね上', RSL: '後左のばね上', RSR: '後右のばね上', FZL: '前左のばね下', FZR: '前右のばね下', RZL: '後左のばね下', RZR: '後右のばね下', VM1: '車載の MOSAIC のアンテナ' }[id];
  const side = left ? 1 : -1;
  const hub = [0, side * 0.645, GEN.hub];
  const at = vp.at;
  const base = { scene: 'truck', target: id, labels: [id], orient: 'yoko' };
  const tbd = vp.decided ? '' : '置く所は未定（図の印は目安）。決めた所に付けて撮る。';
  const uc = UNSPR_CAM[id];
  const fix = (shot, k) => (uc ? { ...shot, where: uc[k][1], view: { ...shot.view, cam: { at: uc[k][0] }, floor: 0 } } : shot);
  return [
    {
      id: `${id}-a`, title: `${id} 付けた所（名札と向き）`,
      what: `${nm}（${u}）`,
      where: `車の${left ? '左' : '右'}の外から`, dir: '付けた面が分かるように。縦長',
      must: [`名札（${id}・${u}）`, id === 'VM1' ? 'アンテナが水平に置いてある' : '軸の向きと取り付けた面が分かる',
        ...(unspr ? ['脱落防止が二重になっている', 'ケーブルが可動部と排気管から離して固定してある'] : [])],
      note: tbd || (unspr ? '付け方は SPRESENSE の配置のページ（研究室の BRDIGE_SPRESENSE の Tools/Manuals/vehicle_placement）。' : ''),
      view: { ...base, orient: 'tate', axes: id, cam: { dir: [front ? 0.3 : -0.3, side * 1, 0.5], dist: 1.1 } },
    },
  ].map((x) => fix(x, 'a')).concat([
    {
      id: `${id}-x`, title: `${id} 前後（前車軸の中心から）`,
      what: '前車軸の中心から、前後の距離',
      where: `車の${left ? '左' : '右'}の外から`, dir: '真横から。横長',
      must: ['巻尺の 0 が前輪の中心（ハブ）にある', `${id} の中心の目盛りが読める`],
      view: { ...base, cam: { dir: [0, side * 1, 0.15], dist: 1.6 }, tapes: [{ from: hub, to: [at[0], side * 0.645, GEN.hub], label0: '前輪の中心', label1: '前後' }] },
    },
  ].map((x) => fix(x, 'x'))).concat([
    {
      id: `${id}-y`, title: `${id} 左右（車の中心線から）`,
      what: '車の中心線から、左右の距離',
      where: `車の${front ? '前' : '後ろ'}から`, dir: '車の正面（または真後ろ）から。横長',
      must: ['巻尺の 0 が車の中心線（前輪の左右の中央）にある', `${id} の中心の目盛りが読める`],
      view: { ...base, cam: { dir: [front ? 1 : -1, 0, 0.25], dist: 1.5 }, tapes: [{ from: [at[0], 0, at[2]], to: [at[0], at[1], at[2]], label0: '中心線', label1: '左右' }] },
    },
  ].map((x) => fix(x, 'y'))).concat([
    {
      id: `${id}-z`, title: `${id} 高さ（地面から）`,
      what: '地面から、センサの中心までの高さ',
      where: `車の${left ? '左' : '右'}の外から`, dir: '真横から。縦長',
      must: ['巻尺の 0 が地面にある', `${id} の中心の目盛りが読める`],
      view: { ...base, orient: 'tate', cam: { dir: [0, side * 1, 0.1], dist: 1.2 }, tapes: [{ from: [at[0], at[1], 0.002], to: [at[0], at[1], at[2]], label0: '地面', label1: '高さ' }] },
    },
  ].map((x) => fix(x, 'z')));
}

// ばね下の4台は、タイヤ・フェンダー・バンパー・スペアタイヤの枠の陰になる。3D の視線（撮る所から箱まで物に当たらない）で確かめた撮る所
const UNSPR_CAM = {
  FZL: { a: [[-1.08, 0.76, 0.22], '前輪の後ろの、車の左の外から（しゃがんで、前に向けて）'], x: [[0.88, 0.69, 0.12], '前輪の前の、車の左の外から（低く）'],
    y: [[0.72, 0.01, 0.06], '車の前の真ん中から（前のバンパーの下を、地面すれすれに）'], z: [[0.9, 0.45, 0.07], '車の前の左寄りから（地面すれすれに）'] },
  FZR: { a: [[-1.08, -0.76, 0.22], '前輪の後ろの、車の右の外から（しゃがんで、前に向けて）'], x: [[0.88, -0.69, 0.12], '前輪の前の、車の右の外から（低く）'],
    y: [[0.72, -0.01, 0.06], '車の前の真ん中から（前のバンパーの下を、地面すれすれに）'], z: [[0.9, -0.45, 0.07], '車の前の右寄りから（地面すれすれに）'] },
  RZL: { a: [[-2.53, 0.13, 0.56], '車の後ろから（荷台の下をのぞいて）'], x: [[-3.49, 0.31, 0.06], '車の後ろから（地面すれすれに、前に向けて）'],
    y: [[-3.2, 0.15, 0.12], '車の後ろから（地面すれすれに、前に向けて）'], z: [[-2.58, 0.31, 0.09], '車の後ろから（荷台の下、地面すれすれに）'] },
  RZR: { a: [[-2.53, -0.04, 0.56], '車の後ろから（荷台の下をのぞいて）'], x: [[-3.43, -0.63, 0.06], '車の後ろの右寄りから（地面すれすれに、前に向けて）'],
    y: [[-3.43, -0.63, 0.06], '車の後ろの右寄りから（地面すれすれに、前に向けて）'], z: [[-2.58, -0.22, 0.09], '車の後ろから（荷台の下、地面すれすれに）'] },
};
const VEHICLE_ORDER = ['FSL', 'FZL', 'RSL', 'RZL', 'RZR', 'RSR', 'FZR', 'FSR', 'VM1'];
function vehicleInstallTask(day) {
  const shots = [{
    id: 'hub-z', title: '前輪の中心の高さ（地面から）',
    what: '前輪（左）の中心（ハブ）の高さ',
    where: '車の左の外から', dir: '真横から。縦長',
    must: ['巻尺の 0 が地面にある', '前輪の中心の目盛りが読める'],
    note: '前後・左右・高さは、この「前車軸の中心」からの差として使う（手順書 §5 の3）。',
    view: { scene: 'truck', target: [0, 0.645, GEN.hub], targetLabel: '前輪の中心', cam: { dir: [0, 1, 0.1], dist: 1.2 }, orient: 'tate', tapes: [{ from: [0, 0.645, 0.002], to: [0, 0.645, GEN.hub], label0: '地面', label1: '高さ' }] },
  }];
  VEHICLE_ORDER.forEach((id) => shots.push(...vehicleShots(id)));
  shots.push(
    { id: 'mass-driver', title: '運転者の質量', what: '体重計に乗った運転者（顔は写さない）', where: '体重計の正面から', dir: '表示が読めるように', must: ['体重計の表示が読める'], view: { svg: 'bathscale', svgText: ['運転者'] } },
    { id: 'mass-load', title: '載せる機材の質量', what: '試験車に載せる機材（まとめて）', where: '体重計か計量器の正面から', dir: '表示が読めるように', must: ['表示が読める', '載せる物が全部載っている'], view: { svg: 'scale', svgText: ['載せる機材'] } },
  );
  return {
    id: 'vehicle', part: '朝', title: '車両のセンサの取り付け', role: '設置・センサ',
    desc: `ばね上4台・ばね下4台と、車載の MOSAIC（VM1）。付けたとき・付け直したときに撮る（前の日から付けたままなら、この作業はない）。順番：前輪の中心の高さ → 左の前から後ろ → 右の後ろから前 → VM1 → 質量。`,
    ref: '手順書 §5・§7.1', device: 'spresense', shots, onlyIfAttached: true,
  };
}

// ---------- 作業の組み立て ----------
// 同時打撃の板の並べ方（このアプリで決めた並び）：1段目 橋の SPRESENSE 12台、2段目 小野橋梁センサ 12台（位置の番号の順）、
// 3段目 感圧と温度のロガー4台。どの段も左から番号の順。手順書 §3 の「全 SPRESENSE と小野橋梁センサ」のうち、橋に付ける台
// 3つ目は、その名札を撮る位置（同時打撃の板の 3D の座標。板の中心が原点、Y が上）
export const SYNC_ROWS = {
  row1L: ['1段目の左半分', ['BRI_P001', 'BRI_P002', 'BRI_P003', 'BRI_P004', 'BRI_P005', 'BRI_P006'], [-0.6, 1.0, -0.1]],
  row1R: ['1段目の右半分', ['BRI_P007', 'BRI_P008', 'BRI_P009', 'BRI_P010', 'BRI_P011', 'BRI_P012'], [0.6, 1.0, -0.1]],
  row2L: ['2段目の左半分', ['E1', 'U11', 'U13', 'U15', 'E2', 'U22'].map(unitOf), [-0.6, 1.0, 0.12]],
  row2R: ['2段目の右半分', ['U24', 'U32', 'U34', 'E7', 'U41', 'E8'].map(unitOf), [0.6, 1.0, 0.12]],
  row3: ['3段目', ['PRESS_P001', 'PRESS_P002', 'TEMP_P001', 'TEMP_P002'], [0, 0.65, 0.34]],
};
function syncTask(day, after) {
  const shots = [{
    id: 'sync-row', title: '板の全体（真上から）',
    what: '板に並べて固定した 28 台の全体',
    where: '板の真上から（脚立か、板を低い所に置く）', dir: '真上から。横長',
    must: ['3段の並びの全体（左右の端まで）', '軸の向き（名札の矢印）がそろっている', '板に固定してある'],
    note: 'この1枚は並び方の記録。名札は次の5枚で、近くから読めるように撮る。',
    view: { scene: 'sync', target: 'all', cam: { at: [0, 1.7, 0.08] }, orient: 'yoko', over: { at: [1.4, 1.1, 1.5] }, legend: '並べ方の模式（実物の形ではない）' },
  }];
  for (const [k, [name, ids, at]] of Object.entries(SYNC_ROWS)) {
    shots.push({
      id: `sync-${k}`, title: `名札：${name}（${ids[0]}〜${ids[ids.length - 1]}）`,
      what: `${name}に並べた ${ids.length} 台の名札`,
      where: `${name}の真上から、近くで`, dir: '真上から。横長',
      must: [`${ids.join('・')} の名札が全部読める`, 'ほかの段の台が入っても良いが、この台の名札が切れていない'],
      view: { scene: 'sync', target: k, cam: { at }, orient: 'yoko', labels: [k], over: { at: [1.4, 1.1, 1.5] } },
    });
  }
  return {
    id: after ? 'sync-after' : 'sync', part: after ? '夕方' : '朝', title: after ? '同時打撃（撤去の後）' : '同時打撃（設置の前）', role: 'データ',
    desc: '橋に付ける 28 台（橋の SPRESENSE 12・小野橋梁センサ 12・感圧と温度のロガー 4）を、1枚の板に3段に並べて固定する。1段目に BRI_P001〜P012、2段目に小野橋梁センサを位置の番号の順、3段目に PRESS_P001・PRESS_P002・TEMP_P001・TEMP_P002（どの段も左から）。軸の向きをそろえ、全台が記録中で GNSS と PPS を受けているのを確かめてから、木槌で5回、間をあけて叩く。叩いた時刻は記録から分かるので、書かない。車両の8台は、付けるたびに叩く（案。手順書 §3）。',
    ref: after ? '手順書 §12' : '手順書 §3', shots,
  };
}

function iceTask(first) {
  return {
    id: 'ice', part: '朝', title: first ? '日よけと保冷剤（初めて）' : '保冷剤の交換', role: '設置',
    desc: `${first ? '取り付けた24台に、発泡スチロールの覆いと、凍らせた保冷剤を入れる' : '24台の保冷剤を、凍らせた物に替える'}。${first ? '入れたら' : '替えたら'}、1台ずつ撮る（撮った時刻が記録になる）。保冷剤は袋に入れ、板に直接当てない。順番：${ORDER_NOTE}。`,
    ref: '手順書 §4 の5', shots: BRIDGE_ORDER.map(iceShot),
  };
}

function shakerMorningTask(first) {
  return {
    id: 'shaker-am', part: '朝', title: first ? '加振器を置く（初めて）' : '加振器を置き直す', role: '加振・打撃',
    desc: `${first ? 'S1（G1、入口の支承から 1.67 m）に印を付け、' : 'S1 の印の上に、'}加振器をじかに置き、L型クランプ4本で留め、水準器で確かめ、おもりを付ける。2人で運ぶ（本体は約 5 kg、PA05 は約 9 kg）。加振器の 3D は作成中で、図の箱は位置の目安。`,
    ref: '手順書 §8、加振器とハンマーの使い方 §3・§4', device: 'mass', shots: shakerMorningShots(first),
  };
}

function pressTask(first) {
  return {
    id: 'press', part: '朝', title: first ? '感圧センサを置く（初めて）' : '感圧センサを置き直す', role: '設置',
    desc: `入口に PRESS_P001、出口に PRESS_P002。${first ? '置く位置の路面に印を付ける。' : '前の日の印の位置に置き直す。'}雨が降り出したら、すぐ外す。`,
    ref: '手順書 §6', device: 'press', device2: 'pressEnd',
    shots: [...pressShots('PRESS_P001', first), ...pressShots('PRESS_P002', first)],
  };
}

function tempTask(first) {
  return {
    id: 'temp', part: '朝', title: first ? '温度センサを付ける（初めて）' : '温度センサを付け直す', role: '設置・センサ',
    desc: `T1（日なた側）に ${unitOf('T1')}、T2（日かげ側）に ${unitOf('T2')}。${first ? '貼った位置に印を付ける。' : '前の日の印の位置に、新しい熱伝導の両面テープで貼り直す。'}モバイルバッテリーをつないで記録を始め、GNSS の測位と PPS を確かめる。雨が降り出したら、すぐ外す。`,
    ref: '手順書 §7.2', device: 'temp', shots: [...tempShots('T1', first), ...tempShots('T2', first)],
  };
}

function mosaicBridgeTask() {
  const bm1 = [
    {
      id: 'BM1-a', title: 'BM1 置いた場所（屋上と周りの空）',
      what: '隣の建物の屋上に固定した BM1 の MOSAIC と、周りの様子',
      where: '屋上の、BM1 から少し離れた所から', dir: '空と周りの建物・木が入るように。横長',
      must: ['MOSAIC とアンテナと、固定した物', '周りに空をさえぎる物がない'],
      note: 'BM1 は隣の建物の屋上（空が開けている。橋から 20 m 以内）。',
      view: { target: [4.16, 0.6, 0.0], ring: 0.01, over: { at: [4.16, -9, 6], look: [4.16, 0.6, 0] }, msg: 'BM1 は隣の建物の屋上（橋から 20 m 以内。図に建物はない）', orient: 'yoko' },
    },
    {
      id: 'BM1-b', title: 'BM1 本体と名札', what: `BM1 の MOSAIC（${unitOf('BM1')}）`, where: '本体の正面から', dir: '斜め上から',
      must: [`名札（BM1・${unitOf('BM1')}）`, '画面'], view: { svg: 'mosaic', svgText: ['BM1', unitOf('BM1')] },
    },
  ];
  return {
    id: 'mosaic', part: '朝', title: 'MOSAIC を置く（支承の四隅・BM1）', role: 'センサ',
    desc: '支承の四隅（C1〜C4）に mosaic-X5、隣の建物の屋上に BM1。試験の間ずっと記録する。',
    ref: '手順書 §7.1', device: 'mosaic', shots: [...['C1', 'C2', 'C4', 'C3'].flatMap(cornerShots), ...bm1],
  };
}

function installTask() {
  const shots = BRIDGE_ORDER.flatMap(bridgeInstallShots);
  ['G1', 'G2', 'G3', 'G4'].forEach((g) => shots.push(routeShot(g)));
  return {
    id: 'install', part: '朝', title: '橋のセンサの設置（24台）', role: '設置・センサ・データ',
    desc: `割り当て表のとおりの台を付ける（G1 は上フランジの上面、G2〜G4 は主桁の真上の床版の上面。磁石で固定し、結束バンドは使わない）。先に巻尺で印を付け、面の汚れを落とす。1台ごとに「付けた所」と「巻尺」を撮る。順番：${ORDER_NOTE}。最後に主桁ごとにアンテナとケーブルを撮る。`,
    ref: '手順書 §4', device: 'spresense', shots,
  };
}

function stateMorningTask(day) {
  const st = { 3: ['intact', '健全'], 4: ['light', '軽度'], 5: ['heavy', '重度'], 6: ['intact', '健全'] }[day];
  const must = st[0] === 'heavy' ? ['横桁が外されて、ない', 'まわりの部材とセンサがそのまま']
    : st[0] === 'light' ? ['横桁がある', '両端のボルトが緩めてある（合いマークがずれている）'] : ['横桁がある', '両端のボルトの合いマークがそろっている'];
  return {
    id: 'state', part: '日中', title: `その日の状態（${st[1]}）を撮る`, role: '加振・打撃・設置',
    desc: '走行に入る前に、損傷させる横桁の状態を撮る。撮った時刻が、その状態の記録になる。',
    ref: '手順書 §10', shots: [damageOverall('state-all', st[0], `横桁の全体（${st[1]}）`, must)],
  };
}

function ambientTask(day) {
  const when = day === 2 ? '加振をしない時間に1回' : '午前の終わりに';
  return {
    id: 'ambient', part: '日中', title: '常時微動・跳躍・打撃', role: '加振・打撃',
    desc: `${when}行う。常時微動は橋の上と下に人がいない状態で5〜10分記録する。跳躍は決めた位置で3回跳ぶ。打撃は H1〜H8 を橋の外から各5回（力は 0.5〜1 kN。1打ごとの力は Mac のアプリが記録するので、写真はない）。${day >= 3 && day <= 5 ? 'このあと S1 の2段階の掃引を行う。' : ''}`,
    ref: '手順書 §9', shots: [
      {
        id: 'ambient-start', title: '常時微動の始め（人がいない）', what: '橋の全体', where: '橋の外の、入口の斜め前から', dir: '橋の全体が入るように。横長',
        must: ['橋の上と下に人がいない'], note: '撮った時刻が常時微動の始めの時刻になる。',
        view: { target: [4.16, 0, 0], ring: 0.01, cam: { at: [-4.5, -4.2, 1.2] }, orient: 'yoko', shaker: true },
      },
      {
        id: 'jump', title: '跳躍の位置', what: '跳ぶ人と、跳ぶ位置', where: '橋の外から', dir: '跳ぶ人の足もとと位置が分かるように',
        must: ['跳ぶ位置（決めた位置）'], note: '跳ぶ位置は未定（計画の担当が決める）。顔は写さなくてよい。',
        view: { target: [4.16, 0.6, DECK], ring: 0.2, targetLabel: '跳ぶ位置（未定）', cam: { dir: [-0.5, -1, 0.5], dist: 3.2 }, orient: 'yoko' },
      },
    ],
  };
}

function massOffTask() {
  return {
    id: 'mass-off', part: '日中', title: '走行の前に、おもりを外す', role: '加振・打撃',
    desc: 'アプリの自動運転を止め、PA05 の出力を切ってから、上のナットを外し、ワッシャーの束を 353B33 ごと持ち上げて外す。加振器の本体とクランプは動かさない。',
    ref: '手順書 §9 の5、加振器とハンマーの使い方 §7', device: 'mass', shots: [{
      id: 'mass-off', title: 'おもりを外した所', what: 'おもりを外した後の加振器の台', where: '橋の外（G1 の側の地面）から', dir: '真横から。縦長',
      must: ['台にボルトと下の2つのナットだけが残っている', '本体とクランプ4本はそのまま'],
      note: '動く部分を固定する部品があれば、外さずにそれで固定する（レックスに問い合わせ中）。',
      view: { target: 'S1shaker', cam: { dir: [0, -1, 0.5], dist: 0.6 }, orient: 'tate', shaker: true, shakerParts: ['mark', 'body', 'rod', 'cables'] },
    }],
  };
}

function passageTask(day) {
  const shots = [{
    id: 'gopro', title: '動画のカメラの置き場所', what: '出口の側に置いた GoPro と三脚', where: 'GoPro の後ろから', dir: 'GoPro の画面と同じ向き。横長',
    must: ['橋の全体と車輪の通り道が入る向き', '車輪が継ぎ目を越える様子が分かる'],
    note: '横の位置のずれを、この動画と床版の目盛りで読む（手順書 §10 の5）。',
    view: { target: [4.16, 0.6, 0], ring: 0.01, cam: { at: [11.5, 2.6, 1.2] }, camLabel: 'GoPro', orient: 'yoko', truckAt: 4.5, floor: BR.groundZ },
  }];
  {
    shots.push(
      {
        id: 'scale-in', title: '床版の目盛り（入口）', what: '入口の側の床版に貼った目盛り（白黒のテープ）', where: '入口の手前から', dir: '真上に近い斜めから',
        must: ['目盛りの全体', '車輪の通り道との位置の関係'],
        view: { target: [0.4, 0.6, DECK], ring: 0.25, targetLabel: '目盛り（入口）', cam: { dir: [-1, 0, 0.9], dist: 1.6 }, orient: 'yoko', floor: DECK },
      },
      {
        id: 'scale-out', title: '床版の目盛り（出口）', what: '出口の側の床版に貼った目盛り', where: '出口の先から', dir: '真上に近い斜めから',
        must: ['目盛りの全体', '車輪の通り道との位置の関係'],
        view: { target: [7.9, 0.6, DECK], ring: 0.25, targetLabel: '目盛り（出口）', cam: { dir: [1, 0, 0.9], dist: 1.6 }, orient: 'yoko', floor: DECK },
      },
    );
  }
  return {
    id: 'passage', part: '日中', title: '走行（午後）', role: '全員',
    desc: '割り付けの表の順に走る（1日30回前後）。床版の端の手前10 m以上から一定の速度で、案内線に沿って走り、橋を出て10 m以上進んで止まる。20 s以上待ってから次へ。その間、橋の上と下に人が入らない。走行の時刻は後処理で取り出すので、書かない。',
    ref: '手順書 §10', shots,
  };
}

function eveningTasks(day) {
  const list = [];
  list.push({
    id: 'press-temp-off', part: '夕方', title: '感圧センサと温度センサを外す', role: '設置', nophoto: true,
    desc: '感圧の帯はゴムシートごと外し、直径 20 cm ほどの輪にゆるく丸めて（端子のある端は折らない）屋内に置く。温度センサは測定点の板を鋼からはがし、ロガーと一緒に屋内に置く。', ref: '手順書 §6 の4・§7.2 の7',
  });
  if (day < 6) {
    list.push({
      id: 'shaker-off', part: '夕方', title: '加振器を外す', role: '加振・打撃',
      desc: 'PA05・DHO914S・Mac の電源を切り、おもり（ワッシャーの束と 353B33）・クランプ4本・加振器の本体を外して屋内に置く。PA05・DHO914S・Mac は、もう1枚のブルーシートで覆う。',
      ref: '手順書 §8 の7', shots: [
        {
          id: 'S1-empty', title: '外した後の S1', what: '加振器を外した後の G1 の上フランジ', where: '橋の外（G1 の側の地面）から', dir: '斜め上から',
          must: ['S1 の印が残っている', '本体・クランプ・おもりが橋に残っていない'],
          view: { target: 'S1', cam: { dir: [-0.2, -1, 0.7], dist: 0.8 }, orient: 'yoko', labels: ['S1'], shaker: false },
        },
        {
          id: 'tarp-cover', title: '機器の覆い', what: 'ブルーシートで覆った PA05・DHO914S・Mac', where: '少し離れた所から', dir: '全体が入るように',
          must: ['機器が全部覆われている', 'ケーブルの中継が地面から浮いている'],
          view: { target: TARP, ring: 0.4, targetLabel: 'ブルーシート（置き場所の目安）', cam: { dir: [-0.4, -1, 0.8], dist: 2.8 }, orient: 'yoko', shaker: false },
        },
      ],
    });
    list.push({
      id: 'night-cover', part: '夕方', title: 'モバイルバッテリーを外し、ブルーシートをかぶせる', role: '設置・データ',
      desc: '記録を止め、モバイルバッテリーだけ外して回収し、充電する（センサは橋に残す）。加速度計24台に1枚ずつブルーシートをかぶせる。夜は記録しない。',
      ref: '手順書 §1.2', shots: [
        {
          id: 'cover-in', title: 'かぶせた全体（入口の側から）', what: 'ブルーシートをかぶせた橋の全体', where: '入口の斜め前の地面から', dir: '橋の全体。横長',
          must: ['24台がすべて覆われている（入口の側の半分）'],
          view: { target: [4.16, 0, 0], ring: 0.01, cam: { at: [-4, -4, 1.3] }, orient: 'yoko', labels: BRIDGE_ORDER },
        },
        {
          id: 'cover-out', title: 'かぶせた全体（出口の側から）', what: 'ブルーシートをかぶせた橋の全体', where: '出口の斜め先の地面から', dir: '橋の全体。横長',
          must: ['24台がすべて覆われている（出口の側の半分）'],
          view: { target: [4.16, 0, 0], ring: 0.01, cam: { at: [12.3, 4, 1.3] }, orient: 'yoko', labels: BRIDGE_ORDER },
        },
      ],
    });
  }
  list.push(collectTask(day));
  return list;
}

function collectTask(day) {
  return {
    id: 'collect', part: '夕方', title: 'データの回収', role: 'データ',
    desc: `その日の設置の記録（sensor_install_record_${GEN.built.dates[day] ?? 'YYYYMMDD'}.csv。台を替えた日は直した物）を Raw_Data/<実験名>/SENSOR_SETUP/ に入れてから回収する。SPRESENSE（感圧・温度を含む）の SD は Collect_SD.command、小野橋梁センサの SD は 01_Collect_SD.command、MOSAIC は USB で回収する${day === 6 ? '（屋上に残す BM1 も、データはこの日に回収する。本体は残す）' : ''}。SD からは何も消さない。翌朝、SD を同じ台に戻す。`,
    ref: '手順書 §13', shots: [
      {
        id: 'collect-spr', title: 'Collect_SD の最後の画面', what: 'SPRESENSE の SD をすべて写し終えた後の、データ保管用の Mac の画面', where: '画面の正面から', dir: '画面の文字が読めるように',
        must: ['「まだ回収していない台」の表示（全台を写し終えた後）'],
        view: { svg: 'laptop', svgText: ['Collect_SD.command', '最後に、まだ回収していない台が出る'] },
      },
      {
        id: 'collect-ono', title: '小野の回収の最後の画面', what: '小野橋梁センサの SD をすべて写し終えた後の画面', where: '画面の正面から', dir: '画面の文字が読めるように',
        must: ['写した台の一覧と SHA-256 の確かめの結果'],
        view: { svg: 'laptop', svgText: ['01_Collect_SD.command', '小野橋梁センサ'] },
      },
    ],
  };
}

function swapTask() {
  return {
    id: 'swap', part: '日中', title: '台を替えた・異常があったとき', role: '全員', repeat: true,
    desc: '起きたときに撮る。台を替えたら、替えた台1台につき「替えた台」を1枚。異常があったら、1か所につき「異常のある所」を1枚。支承の4点（E1・E2・E7・E8）のセンサに触れたときは、そのセンサを「替えた台」と同じ撮り方で1枚。台を替えたら、夕方にその日の設置の記録の CSV を直す。',
    ref: '手順書 §4 の3・6・8', shots: [
      {
        id: 'swap-unit', title: '替えた台（名札と巻尺）', what: '替えて付けた台', where: 'その位置の撮り方（設置の写真）と同じ所から', dir: '縦長',
        must: ['新しい台の名札（位置と台の名前）', '巻尺で位置が読める'], view: { target: 'U13', cam: camTape(P.U13), labels: ['U13'], orient: 'yoko', legend: '例：U13 を予備の台に替えたとき' },
      },
      {
        id: 'trouble', title: '異常のある所', what: '止まった台・外れた物・壊れた所', where: 'その所の近くから', dir: '名札と異常の両方が入るように',
        must: ['名札（位置と台の名前）', '異常の様子（ランプ・外れた所など）'], view: { svg: 'trouble' },
      },
    ],
  };
}

// ---------- 1日目（10/28）だけの作業 ----------
function cleaningTask(after) {
  const views = [
    ['in', '入口の側から', [-4.2, -3.6, 1.4]], ['out', '出口の側から', [12.4, 3.6, 1.4]],
    ['g1', 'G1 の側（橋の外）から', [4.16, -6, 1.6]], ['g4', 'G4 の側（橋の外）から', [4.16, 6, 1.6]],
  ];
  const shots = views.map(([k, w, at]) => ({
    id: `clean-${after ? 'after' : 'before'}-${k}`, title: `${after ? '掃除の後' : '掃除の前'}：${w}`, what: '橋の全体', where: `${w}、少し離れて`, dir: '橋の全体が入るように。横長',
    must: ['橋の全体', after ? '掃除の前と同じ所から、同じ向きで' : '汚れと錆の様子'],
    view: { target: [4.16, 0, 0], ring: 0.01, cam: { at }, orient: 'yoko' },
  }));
  if (!after) {
    // 錆の様子は、外から見える主桁の面を6つに分けて撮る（場所ごとに1枚）
    [['G1', -1.8, -1], ['G4', 1.8, 1]].forEach(([g, y, out]) => {
      [['in', '入口の側', 1.4], ['mid', '中央', 4.16], ['out', '出口の側', 6.9]].forEach(([k, nm, x]) => {
        shots.push({
          id: `rust-${g}-${k}`, title: `錆の様子：${g} の外の面（${nm}）`, what: `${g} の外の面の、${nm}の 3 m ほど（腹板・下フランジ・添接板）`,
          where: `橋の外（${g} の側の地面）から、少し離れて`, dir: '面に向けて真っすぐ。横長',
          must: ['錆と汚れの様子', '主桁の腹板と下フランジ'],
          view: { target: [x, y, -0.1], ring: 0.2, targetLabel: `${g}・${nm}`, cam: { dir: [0, out, 0.35], dist: 1.6 }, orient: 'yoko' },
        });
      });
    });
  }
  return {
    id: after ? 'clean-after' : 'clean-before', part: after ? '日中' : '朝', title: after ? '橋の掃除（後）' : '橋の掃除（前）', role: '設置',
    desc: after ? '軽い掃除の後、前と同じ4か所から撮る。' : '軽い掃除にとどめる。掃除の前に、全体を4か所から、錆の様子を G1・G4 の外の面の6か所から撮る。', ref: '手順書 §14', shots,
  };
}

function dimensionsTask() {
  const shots = [];
  const bearings = [];
  ['入口', '出口'].forEach((end, ei) => {
    ['G1', 'G2', 'G3', 'G4'].forEach((g, gi) => {
      const y = BR.girderY[gi];
      const x = ei === 0 ? 0 : BR.span;
      const node = `bearing_x${ei === 0 ? '0.39' : '8.71'}_${g}`;
      const outside = g === 'G1' ? -1 : g === 'G4' ? 1 : 0;
      bearings.push({
        id: `bearing-${ei}-${g}`, title: `支承（${end}・${g}）`, what: `${end}の ${g} の支承`,
        where: outside ? `橋の外（${g} の側）から` : `${end}の端から、${g === 'G2' ? 'G2 と G3' : 'G3 と G2'} の間の床版の下に手を入れて、支承を横から`, dir: '支承の全体が入るように',
        must: ['固定か可動か分かる（支承の全体）', '物差しを当て、回転の中心の高さが読める'],
        note: outside ? '' : '主桁と台座のすき間が狭く、橋の端からは見えない（3D で確かめた）。主桁の間から横に撮る。',
        view: { target: `node:${node}`, cam: outside ? { dir: [ei === 0 ? -0.4 : 0.4, outside, 0.25], dist: 0.9 } : { at: [x, y + (g === 'G2' ? 1.0 : -1.0), -0.27] }, floor: BR.groundZ, orient: 'yoko', targetLabel: `${end}・${g}`, ring: 0.18 },
      });
      void x; void y;
    });
  });
  shots.push(...bearings);
  ['入口', '出口'].forEach((end, ei) => {
    const x = ei === 0 ? 0 : BR.span;
    [[0, 1], [1, 2], [2, 3]].forEach(([a, b]) => {
      shots.push({
        id: `spacing-${ei}-${a}`, title: `主桁の間隔（${end}・G${a + 1}–G${b + 1}）`, what: `${end}の支承の線で、G${a + 1} と G${b + 1} の中心の間`,
        where: `${end}の${ei === 0 ? '手前' : '先'}から`, dir: '巻尺の目盛りが読めるように',
        must: [`巻尺の 0 が G${a + 1} の中心にある`, `G${b + 1} の中心の目盛りが読める`],
        view: { target: [x, BR.girderY[b], 0.02], ring: 0.08, cam: { dir: [ei === 0 ? -1 : 1, 0, 0.6], dist: 1.4 }, orient: 'yoko', floor: DECK, tapes: [{ from: [x, BR.girderY[a], 0.02], to: [x, BR.girderY[b], 0.02], label0: `G${a + 1}`, label1: `G${b + 1}` }] },
      });
    });
  });
  [['in', '入口', 0, BR.deckX[0]], ['out', '出口', BR.span, BR.deckX[1]]].forEach(([k, end, x, xe]) => {
    shots.push({
      id: `deck-end-${k}`, title: `床版の端（${end}）`, what: `${end}の支承の中心の線から床版の端まで`, where: '床版の端の横から', dir: '横から',
      must: ['巻尺の 0 が支承の中心の線にある', '床版の端の目盛りが読める'],
      view: { target: [xe, 1.2, DECK], ring: 0.08, cam: { dir: [0, 1, 0.5], dist: 1.0 }, orient: 'yoko', tapes: [{ from: [x, 1.2, DECK + 0.003], to: [xe, 1.2, DECK + 0.003], label0: '支承の中心の線', label1: '床版の端' }] },
    });
  });
  [['g4', 'G4 の側', 3, BR.deckY[1]], ['g2', 'G2 の外の側', 1, BR.deckY[0]]].forEach(([k, side, gi, ye]) => {
    const y = BR.girderY[gi];
    shots.push({
      id: `deck-edge-${k}`, title: `床版の縁（${side}）`, what: `G${gi + 1} の中心の線から床版の縁まで`, where: '縁の真上から', dir: '真上から',
      must: [`巻尺の 0 が G${gi + 1} の中心の線にある`, '床版の縁の目盛りが読める'],
      view: { target: [4.16, ye, DECK], ring: 0.06, cam: { dir: [-0.3, ye > 0 ? 1 : -1, 1], dist: 0.8 }, orient: 'tate', tapes: [{ from: [4.16, y, DECK + 0.003], to: [4.16, ye, DECK + 0.003], label0: `G${gi + 1}`, label1: '縁' }] },
    });
  });
  BR.crossX.forEach((x, i) => {
    shots.push({
      id: `cross-${i + 1}`, title: `横桁の位置（${i + 1}列目）`, what: `入口の支承の中心の線から、${i + 1}列目の横桁の中心まで（G1 に沿って）`, where: '橋の外（G1 の側）から', dir: '横から',
      must: ['巻尺の 0 が入口の支承の中心の線にある', `${i + 1}列目の横桁の中心の目盛りが読める`],
      view: { target: [x, -1.8, -0.1], ring: 0.1, cam: { dir: [0, -1, 0.3], dist: 0.9 }, orient: 'yoko', tapes: [{ from: [0, -1.8, 0.003], to: [x, -1.8, 0.003], label1: `${i + 1}列目` }] },
    });
  });
  BR.jointX.forEach((x, i) => {
    shots.push({
      id: `joint-x-${i + 1}`, title: `継ぎ目 J${i + 1} の位置`, what: `入口の支承の中心の線から、継ぎ目 J${i + 1} まで（床版の G4 の側の縁に沿って）`, where: '橋の外（G4 の側）から', dir: '横から',
      must: ['巻尺の 0 が入口の支承の中心の線にある', `J${i + 1} の目盛りが読める`],
      view: { target: [x, 1.75, DECK], ring: 0.07, joints: true, cam: { dir: [0, 1, 0.6], dist: 0.8 }, orient: 'yoko', tapes: [{ from: [0, 1.75, DECK + 0.003], to: [x, 1.75, DECK + 0.003], label1: `J${i + 1}` }] },
    });
  });
  return {
    id: 'dims', part: '日中', title: '橋の寸法', role: '設置',
    desc: '支承8か所（形式と回転の中心の高さ）、主桁の間隔、床版の端と縁、横桁、継ぎ目12か所の位置。数は書かず、巻尺の目盛りが読める写真で残す。図の継ぎ目と横桁の位置は表示用の模型の値で、実物で測る。',
    ref: '手順書 §14', shots,
  };
}

function jointStepTask() {
  const shots = [];
  BR.jointX.forEach((x, i) => {
    [['L', '左', LEFT_Y], ['R', '右', RIGHT_Y]].forEach(([k, nm, y]) => {
      shots.push({
        id: `j${i + 1}${k}-step`, title: `J${i + 1}・${nm}の通り道：段差`, what: `継ぎ目 J${i + 1} の、${nm}の車輪の通り道の段差`, where: '床版の上にしゃがんで、真横から', dir: '直定規とすきまゲージの高さで',
        must: ['直定規が継ぎ目をまたいでいる', 'すきまゲージの番号（厚さ）が読める'],
        view: { target: [x, y, DECK], ring: 0.06, joints: true, cam: { dir: [0, -1, 0.25], dist: 0.6 }, orient: 'yoko', targetLabel: `J${i + 1}・${nm}`, floor: DECK },
      });
      shots.push({
        id: `j${i + 1}${k}-gap`, title: `J${i + 1}・${nm}の通り道：すき間`, what: `継ぎ目 J${i + 1} の、${nm}の車輪の通り道のすき間`, where: '床版の上にしゃがんで、真上から', dir: '真上から',
        must: ['すき間に差したすきまゲージ', 'ゲージの番号（厚さ）が読める'],
        view: { target: [x, y, DECK], ring: 0.06, joints: true, cam: { dir: [-0.2, -0.2, 1], dist: 0.5 }, orient: 'tate', targetLabel: `J${i + 1}・${nm}`, floor: DECK },
      });
    });
  });
  return {
    id: 'joints', part: '日中', title: '継ぎ目の段差とすき間', role: '設置',
    desc: `12か所の継ぎ目で、左右の車輪の通り道（目安：左は y ≈ ${LEFT_Y} m、右は y ≈ ${RIGHT_Y} m）の段差とすき間を、直定規とすきまゲージで測る。継ぎ目は入口から順に J1〜J12。`,
    ref: '手順書 §14', shots,
  };
}

function hammerMarkTask() {
  const shots = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8'].map((id) => {
    const p = P[id];
    const out = p.y < 0 ? -1 : 1;
    const lateral = p.device.includes('水平');
    return {
      id: `${id}-mark`, title: `${id} の印`, what: `${id}（${p.girder}、x = ${m3(p.x)}、${lateral ? '横から' : '上から'}叩く点）の印と番号`,
      where: `橋の外（${p.girder} の側の地面）から`, dir: lateral ? '腹板に向けて真っすぐ' : '斜め上から',
      must: [`チョークかマスキングテープの印と番号（${id}）`, `巻尺で、入口の支承の中心の線から ${m3(p.x)} の目盛りが読める`],
      view: { target: id, labels: [id], cam: { dir: [-0.2, out * 1, lateral ? 0.2 : 0.7], dist: 0.8 }, orient: 'yoko', tapes: [{ from: [0, p.y, (p.girder === 'G1' ? 0 : DECK) + 0.003], to: [p.x, p.y, (p.girder === 'G1' ? 0 : DECK) + 0.003], label1: m3(p.x) }] },
    };
  });
  return { id: 'hammer-marks', part: '日中', title: '打撃の点の印（H1〜H8）', role: '加振・打撃', desc: 'G1・G4 の8点に、チョークかマスキングテープで印を付け、番号を書く。位置の正本は設置表。', ref: '手順書 §14・§9', shots };
}

function deckBoltTask() {
  const shots = [];
  const n = 13;
  const pitch = 0.695;
  for (let k = 1; k <= n; k++) {
    const x0 = BR.deckX[0] + pitch * (k - 1);
    const xc = x0 + pitch / 2;
    ['G2', 'G3', 'G4'].forEach((g) => {
      const y = BR.girderY[+g.slice(1) - 1];
      shots.push({
        id: `deckbolt-${k}-${g}`, title: `床版 ${k} 枚目・${g} の線のボルト`, what: `入口から ${k} 枚目の床版を、${g} に留めるボルト`, where: '床版の上から', dir: '真上から。縦長',
        must: ['ボルトの本数と並びが分かる', '巻尺で、板の入口の側の端からの x が読める', '物差しで、主桁の線からの y が読める', 'ナットがゆるんでいたら、その印'],
        view: { target: [xc, y, DECK], ring: 0.18, cam: { dir: [-0.25, -0.2, 1], dist: 1.0 }, orient: 'tate', targetLabel: `${k} 枚目・${g}`, floor: DECK, tapes: [{ from: [x0, y + 0.18, DECK + 0.003], to: [xc, y + 0.18, DECK + 0.003], label0: '板の端', label1: 'x' }] },
      });
    });
  }
  ['G2', 'G3', 'G4'].forEach((g) => {
    shots.push({
      id: `deckbolt-dia-${g}`, title: `床版のボルトの径（${g}）`, what: `${g} の線のボルト1本の径`, where: 'ボルトの真横から', dir: 'ノギスの目盛りが読めるように',
      must: ['ノギスがボルトの軸（ねじの外径）を挟んでいる', '目盛りが読める'], view: { svg: 'caliper', svgText: [g] },
    });
  });
  return {
    id: 'deck-bolts', part: '日中', title: '床版を主桁に留めるボルト', role: '設置',
    desc: '13枚の床版（入口の側から 1〜13）ごとに、G2・G3・G4 の線のボルトの位置・本数を撮り、各線で1本ずつ径を測る。ナットのゆるみも手で確かめる。床版と主桁の付け方のモデルに使う。',
    ref: '手順書 §14', shots,
  };
}

function vehicleAloneTask() {
  const wheels = [['FL', '前左', 0, 0.645], ['FR', '前右', 0, -0.645], ['RL', '後左', -1.9, 0.64], ['RR', '後右', -1.9, -0.64]];
  const shots = [];
  wheels.forEach(([k, nm, x, y]) => shots.push({
    id: `wheel-${k}`, title: `輪重（${nm}）`, what: `${nm}の車輪を載せた台はかりの表示`, where: '台はかりの正面から', dir: '表示が読めるように',
    must: ['台はかりの表示', '車輪がはかりの真ん中に載っている'],
    view: { scene: 'truck', target: [x, y, 0.05], ring: 0.2, targetLabel: nm, cam: { dir: [0.4, Math.sign(y), 0.6], dist: 1.2 }, orient: 'yoko' },
  }));
  [['push-f', '押して離す（前）', [0.9, 0, 0.9]], ['push-r', '押して離す（後）', [-2.9, 0, 0.9]], ['push-l', '押して離す（左）', [-0.9, 0.8, 0.9]], ['push-rr', '押して離す（右）', [-0.9, -0.8, 0.9]]].forEach(([id, t, at]) => shots.push({
    id, title: t, what: '押す人の手の位置（始める前）', where: '車の外から', dir: '押す所と車の全体が入るように',
    must: ['押す所', '輪止め'], note: '5回押して離す。この写真の時刻が、その向きの5回の始め。',
    view: { scene: 'truck', target: at, ring: 0.15, targetLabel: '押す所', cam: { dir: [at[0] > 0 ? 1 : at[0] < -2 ? -1 : 0.3, at[1] === 0 ? 0.6 : Math.sign(at[1]), 0.5], dist: 2.6 }, orient: 'yoko' },
  }));
  shots.push(
    { id: 'step-h', title: '段差の高さ', what: '段差（2〜3 cm）の板', where: '板の横から', dir: '真横から', must: ['物差しで段差の高さが読める'], view: { svg: 'step', svgText: ['段差の板', '2〜3 cm'] } },
    { id: 'step-f', title: '段差を落ちる（前輪）の前', what: '段差の上に載った前輪', where: '車の横から', dir: '前輪と段差が入るように', must: ['前輪と段差の位置'], note: '5回。この写真の時刻が5回の始め。', view: { scene: 'truck', target: [0, 0.645, 0.15], ring: 0.3, targetLabel: '前輪', cam: { dir: [0.3, 1, 0.4], dist: 1.6 }, orient: 'yoko' } },
    { id: 'step-r', title: '段差を落ちる（後輪）の前', what: '段差の上に載った後輪', where: '車の横から', dir: '後輪と段差が入るように', must: ['後輪と段差の位置'], note: '5回。この写真の時刻が5回の始め。', view: { scene: 'truck', target: [-1.9, 0.64, 0.15], ring: 0.3, targetLabel: '後輪', cam: { dir: [-0.3, 1, 0.4], dist: 1.6 }, orient: 'yoko' } },
    { id: 'board-t', title: '越える板の厚さ', what: '越える板（約 1 cm）', where: '板の横から', dir: 'ノギスの目盛りが読めるように', must: ['ノギスで板の厚さが読める'], view: { svg: 'caliper', svgText: ['越える板'] } },
    { id: 'board', title: '板を越える（始める前）', what: '板と、板に向かう前輪', where: '車の横から', dir: '板と前輪が入るように', must: ['板の位置', '前輪'], note: '5回。この写真の時刻が5回の始め。', view: { scene: 'truck', target: [0.6, 0.645, 0.02], ring: 0.25, targetLabel: '板', cam: { dir: [0.4, 1, 0.5], dist: 1.8 }, orient: 'yoko' } },
    { id: 'wb-l', title: 'ホイールベース（左）', what: '前輪と後輪の中心の間（左）', where: '車の左の外から', dir: '巻尺の目盛りが読めるように', must: ['巻尺の 0 が前輪の中心', '後輪の中心の目盛り'], view: { scene: 'truck', target: [-1.9, 0.645, GEN.hub], ring: 0.12, cam: { dir: [0.2, 1, 0.2], dist: 1.4 }, orient: 'yoko', tapes: [{ from: [0, 0.645, GEN.hub], to: [-1.9, 0.645, GEN.hub], label0: '前輪の中心', label1: '後輪の中心' }] } },
    { id: 'wb-r', title: 'ホイールベース（右）', what: '前輪と後輪の中心の間（右）', where: '車の右の外から', dir: '巻尺の目盛りが読めるように', must: ['巻尺の 0 が前輪の中心', '後輪の中心の目盛り'], view: { scene: 'truck', target: [-1.9, -0.645, GEN.hub], ring: 0.12, cam: { dir: [0.2, -1, 0.2], dist: 1.4 }, orient: 'yoko', tapes: [{ from: [0, -0.645, GEN.hub], to: [-1.9, -0.645, GEN.hub], label0: '前輪の中心', label1: '後輪の中心' }] } },
    { id: 'tread-f', title: 'トレッド（前）', what: '左右の前輪の中心の間', where: '車の前の真ん中から（前のバンパーの下を、地面すれすれに）', dir: '巻尺の目盛りが読めるように', must: ['巻尺の 0 が左の前輪の中心', '右の前輪の中心の目盛り'], view: { scene: 'truck', target: [0.05, -0.645, 0.02], ring: 0.1, cam: { at: [1.6, 0, 0.1] }, floor: 0, orient: 'yoko', tapes: [{ from: [0.05, 0.645, 0.02], to: [0.05, -0.645, 0.02], label0: '左', label1: '右' }] } },
    { id: 'tread-r', title: 'トレッド（後）', what: '左右の後輪の中心の間', where: '車の後ろから', dir: '巻尺の目盛りが読めるように', must: ['巻尺の 0 が左の後輪の中心', '右の後輪の中心の目盛り'], view: { scene: 'truck', target: [-1.9, -0.64, 0.02], ring: 0.1, cam: { dir: [-1, 0, 0.4], dist: 1.6 }, orient: 'yoko', tapes: [{ from: [-1.95, 0.64, 0.02], to: [-1.95, -0.64, 0.02], label0: '左', label1: '右' }] } },
  );
  wheels.forEach(([k, nm, x, y]) => shots.push({
    id: `tire-${k}`, title: `タイヤの空気圧（${nm}）`, what: `${nm}のタイヤに当てた空気圧計`, where: 'タイヤの横から', dir: '空気圧計の表示が読めるように',
    must: ['空気圧計の表示', 'どのタイヤか分かる'], view: { scene: 'truck', target: [x, y, GEN.hub], ring: 0.2, targetLabel: nm, cam: { dir: [0.3, Math.sign(y), 0.3], dist: 1.0 }, orient: 'tate' },
  }));
  return {
    id: 'vehicle-alone', part: '日中', title: '車両単独の試験', role: '設置・運転',
    desc: '輪重、押して離す（前・後・左・右、各5回）、段差（2〜3 cm）を落ちる（前輪・後輪、各5回）、板（約 1 cm）を越える（5回）、寸法、タイヤの空気圧。輪止めをする。車のセンサは記録中にしておく。',
    ref: '手順書 §14', shots,
  };
}

function staticLoadTask() {
  const pos = [['q1', '支間の1/4', 2.08], ['q2', '支間の1/2', 4.16], ['q3', '支間の3/4', 6.24]];
  const shots = [];
  pos.forEach(([k, nm, x]) => {
    shots.push(
      { id: `${k}-before`, title: `${nm}：始めの無載荷`, what: '橋の全体（何も載っていない）', where: '橋の外の、入口の斜め前から', dir: '橋の全体', must: ['橋の上と下に人も車もない'], note: '撮った時刻から1分以上待つ。', view: { target: [4.16, 0, 0], ring: 0.01, cam: { at: [-4.2, -4, 1.3] }, orient: 'yoko' } },
      { id: `${k}-on`, title: `${nm}：車を止めた所`, what: '止めた試験車の前輪と巻尺', where: '橋の外（G4 の側）から', dir: '前輪と巻尺の目盛りが入るように', must: ['巻尺の 0 が入口の支承の中心の線にある', '前輪の中心の目盛りが読める', '運転者が降りて、橋の上と下に人がいない'], note: '止めたら1分以上待つ。', view: { target: [x, LEFT_Y, DECK], ring: 0.2, truckAt: x, cam: { dir: [0, 1, 0.5], dist: 1.4 }, orient: 'yoko', tapes: [{ from: [0, 1.75, DECK + 0.003], to: [x, 1.75, DECK + 0.003], label1: '前輪の中心' }] } },
      { id: `${k}-after`, title: `${nm}：後の無載荷`, what: '車が出た後の橋の全体', where: '橋の外の、入口の斜め前から', dir: '橋の全体', must: ['橋の上と下に人も車もない'], note: '撮った時刻から1分以上待つ。', view: { target: [4.16, 0, 0], ring: 0.01, cam: { at: [-4.2, -4, 1.3] }, orient: 'yoko' } },
    );
  });
  return {
    id: 'static', part: '日中', title: '静的載荷', role: '全員',
    desc: '止める位置は例（支間の1/4・1/2・3/4）で、未定（計画の担当が決める）。位置ごとに「無載荷 → 車を止める → 無載荷」を、各1分以上。小野橋梁センサの温度が落ち着いてから始める。直前と直後の無載荷の差が載荷の 10% を超えたら、その位置をやり直す（研究側の要件 R9）。',
    ref: '手順書 §14', shots,
  };
}


// ---------- 論文用の写真 ----------
// 記録の写真とは別に、論文の図に使える質の写真を撮る。後で撮れない物（状態ごと・取り付けの前・撤去の前・1日目だけの試験）は、
// 撮れる日 days と最後の日 last を持たせ、最後の日に撮っていなければ日の画面で知らせる。印は日によらず1つ（paper|id）。
// 根拠：データセットの論文の図の計画（橋とセンサ・試験車とセンサ・取り付けは種類ごとの代表の写真）、計測装置の論文の原稿の空き（装置の図・運用）、
// 論文誌の画像の規定（加工は全体に均一な明るさとコントラストまで、写り込みを消す加工は不可、元の画像を残す）と、人の写った画像の同意の規定。出典は SOURCES.md。
export const PAPER_RULES = [
  '横長で撮る（「縦長」とある物を除く）。ズームはしない（1倍のまま近づく）。撮る前にレンズを拭く。',
  '撮る前に、写したくない物（工具・袋・余ったケーブル・ブルーシートの端・飲み物）をフレームの外へ出す。論文の写真は、後で物を消す加工ができない。',
  '人の顔と車のナンバープレートを写さない。人が要る写真（打撃・跳躍・押して離す）は、後ろか横から撮る。',
  '1つの指示に1枚。撮ったら画面で拡大してピントを見る。ぼけていたら撮り直し、ぼけた方は消す。',
  '近くを撮る写真には、大きさの分かる物（物差しか巻尺）を入れる。',
  '太陽を背にして撮る（逆光を避ける）。',
  '撮った写真は加工しない。元のファイルのまま集める。',
];
const PAPER_BRIDGE_VIEWS = [
  ['g1', 'G1 の側の斜め前から', { at: [-3.0, -6.5, 1.3] }],
  ['side', 'G1 の側の真横から（橋の全長が入る）', { at: [4.16, -8.5, 1.1] }],
  ['out', '出口の側の斜め（G4 の側）から', { at: [11.5, 6.5, 1.5] }],
  ['deck', '床版の上を、入口から出口へ', { at: [-1.6, 0.6, 1.4] }],
];
const pv = (extra) => ({ orient: 'yoko', ...extra });
const P_ = (o) => ({ ...o, paper: true });
export const PAPER = [
  // 橋（1日目だけ：センサを付ける前）
  ...PAPER_BRIDGE_VIEWS.map(([k, w, cam], i) => P_({
    id: `bare-${k}`, order: 10 + i, days: [1], last: 1, group: '橋',
    title: `センサを付ける前の橋：${w}`, use: 'データセットの論文の方法（橋の説明、図1）',
    what: '掃除の後の、何も付けていない橋の全体', where: w, dir: '横長。橋の全体が入るように',
    must: ['橋の全体（両端の支承まで）', '橋の上と周りに人・工具・機材がない'], note: '掃除が終わってから撮る。2日目にセンサを付けると、もう撮れない。',
    view: pv({ target: k === 'deck' ? [5, 0.6, DECK] : [4.16, 0, -0.1], ring: 0.01, cam }),
  })),
  P_({ id: 'bare-under', order: 13.5, days: [1, 2, 3, 4, 5, 6], last: 6, group: '橋', title: '床版の下（横桁と横構、G3–G4 の間）', use: 'データセットの論文の方法（橋の部材の説明）',
    what: '床版の下の横桁・横構・主桁', where: '入口の端の、G3 と G4 の間から、床版の下をのぞいて（低く、少し見上げる）', dir: '出口へ向けて、橋の向きに。横長',
    must: ['横桁と横構', '主桁 G3・G4 の腹板'], note: '1日目（何も付けていない時）が最適。入口の端の横桁の下から見上げる（横桁が並ぶので、見えるのは手前の区間）。',
    view: pv({ target: [0.7, 1.2, -0.1], ring: 0.01, deck: 0.25, cam: { at: [-0.7, 1.2, -0.3] }, floor: BR.groundZ }) }),
  P_({ id: 'bearing-in', order: 14, days: [1, 2, 3, 4, 5, 6], last: 6, group: '橋', title: '支承（入口・G1）', use: 'データセットの論文の方法（境界の説明）',
    what: '入口の G1 の支承と台座', where: '橋の外（G1 の側）から', dir: '支承の高さで。横長', must: ['支承の全体と、固定か可動かが分かる形', '物差し（大きさの基準）'],
    view: pv({ target: 'node:bearing_x0.39_G1', targetLabel: '入口・G1 の支承', ring: 0.18, cam: { dir: [-0.4, -1, 0.15], dist: 0.9 } }) }),
  P_({ id: 'bearing-out', order: 15, days: [1, 2, 3, 4, 5, 6], last: 6, group: '橋', title: '支承（出口・G1）', use: 'データセットの論文の方法（境界の説明）',
    what: '出口の G1 の支承と台座', where: '橋の外（G1 の側）から', dir: '支承の高さで。横長', must: ['支承の全体と、固定か可動かが分かる形', '物差し（大きさの基準）'],
    view: pv({ target: 'node:bearing_x8.71_G1', targetLabel: '出口・G1 の支承', ring: 0.18, cam: { dir: [0.4, -1, 0.15], dist: 0.9 } }) }),
  P_({ id: 'joint', order: 16, days: [1, 2, 3, 4, 5, 6], last: 6, group: '橋', title: '床版の継ぎ目（J1、左の車輪の通り道）', use: 'データセットの論文の方法（継ぎ目の実測の説明）',
    what: '継ぎ目 J1 と、左の車輪の通り道', where: '床版の上から', dir: '斜め上から。横長', must: ['継ぎ目の段差とすき間が分かる', '物差し（大きさの基準）'],
    view: pv({ target: [BR.jointX[0], LEFT_Y, DECK], ring: 0.08, joints: true, targetLabel: 'J1', cam: { dir: [-0.6, 0.3, 0.8], dist: 0.8 }, floor: DECK }) }),
  // 橋（全部の機器を付けた後）
  ...PAPER_BRIDGE_VIEWS.map(([k, w, cam], i) => P_({
    id: `inst-${k}`, order: 20 + i, days: [2, 3, 4, 5, 6], last: 6, group: '橋',
    title: `機器を付けた後の橋：${w}`, use: 'データセットの論文の方法（図1：橋とセンサ）、計測装置の論文（装置の全体）',
    what: 'センサ・アンテナ・感圧の帯・温度センサ・四隅の MOSAIC・加振器を付けた橋の全体', where: w, dir: '横長。橋の全体が入るように',
    must: ['付けた機器が見える', '橋の上と周りに人がいない', 'ブルーシート・保冷剤の箱・工具が写っていない'], note: '2日目に付け終わったときが最適（覆いをかぶせる前）。6日目の撤去の前が最後。',
    view: pv({ target: k === 'deck' ? [5, 0.6, DECK] : [4.16, 0, -0.1], ring: 0.01, cam, shaker: true }),
  })),
  // 損傷させる横桁（状態ごと。日を過ぎると撮れない）
  P_({ id: 'cg-intact', order: 30, days: [2, 3], last: 3, group: '状態', title: '損傷させる横桁：健全', use: 'データセットの論文の方法（状態の説明、表2）',
    what: '損傷させる横桁（G3–G4 の間、支間中央）の全体', where: 'G3 と G4 の間の、橋の下から（入口の側から支間中央に向けて）', dir: '横桁の全体と両端が入るように。横長',
    must: ['横桁の全体', '両端のボルトと合いマーク'], note: '3日目の夕方にボルトを緩めると、もう撮れない。',
    view: pv({ target: 'node:CG_x4.550_G3G4', state: 'intact', deck: 0.25, highlightDamage: true, cam: DAMAGE_CAM, floor: BR.groundZ, targetLabel: '損傷させる横桁', ring: 0.3, over: { dist: 3.4, elev: 45, turn: 20 } }) }),
  P_({ id: 'cg-intact-bolts', order: 31, days: [2, 3], last: 3, group: '状態', title: '横桁の端のボルト：健全（G4 側）', use: 'データセットの論文の方法（状態の説明）',
    what: 'G4 側の端のボルト4本と合いマーク', where: 'G3 と G4 の間の、橋の下から', dir: 'ボルトに向けて真っすぐ。横長',
    must: ['4本のボルトと合いマーク', '物差し（大きさの基準）'], note: '3日目の夕方にボルトを緩めると、もう撮れない。',
    view: pv({ target: 'bolts:G4', bolts: 'G4', state: 'intact', deck: 0.25, cam: { dir: [-0.45, -0.55, -0.7], dist: 0.45 }, floor: BR.groundZ, targetLabel: 'G4 側の端', ring: 0.09, over: { dist: 2.8, elev: 45, turn: 20 } }) }),
  P_({ id: 'cg-light-bolts', order: 32, days: [3, 4], last: 4, group: '状態', title: '横桁の端のボルト：軽度（緩めた後、G4 側）', use: 'データセットの論文の方法（軽度の説明）',
    what: '緩めた後のボルト4本と、ずれた合いマーク', where: 'G3 と G4 の間の、橋の下から', dir: 'ボルトに向けて真っすぐ。横長',
    must: ['合いマークのずれ（回った量）が分かる', '物差し（大きさの基準）'], note: '3日目の夕方に緩めた後から、4日目の夕方に外すまで。',
    view: pv({ target: 'bolts:G4', bolts: 'G4', state: 'light', deck: 0.25, cam: { dir: [-0.45, -0.55, -0.7], dist: 0.45 }, floor: BR.groundZ, targetLabel: 'G4 側の端（緩めた）', ring: 0.09, over: { dist: 2.8, elev: 45, turn: 20 } }) }),
  P_({ id: 'cg-heavy', order: 33, days: [4, 5], last: 5, group: '状態', title: '横桁を外した所：重度', use: 'データセットの論文の方法（重度の説明、表2）',
    what: '横桁を外した後の G3–G4 の間（支間中央）', where: 'G3 と G4 の間の、橋の下から（入口の側から支間中央に向けて）', dir: '空いた所と両側の主桁が入るように。横長',
    must: ['横桁がない', '両側の主桁の、横桁を留めていた所'], note: '4日目の夕方に外した後から、5日目の夕方に付け直すまで。',
    view: pv({ target: 'node:CG_x4.550_G3G4', state: 'heavy', deck: 0.25, cam: DAMAGE_CAM, floor: BR.groundZ, targetLabel: '外した横桁のあった所', ring: 0.3, over: { dist: 3.4, elev: 45, turn: 20 } }) }),
  P_({ id: 'cg-removed', order: 34, days: [4], last: 4, group: '状態', title: '外した横桁（全体）', use: 'データセットの論文の方法（外した部材の説明）',
    what: '外して仮置きの台に置いた横桁と、ボルト・添接板', where: '台の横から、少し離れて', dir: '部材の全体が入るように。横長',
    must: ['横桁の全体', 'ボルト・ナット・添接板', '物差しか巻尺（大きさの基準）'], note: '4日目の夕方、外した後。',
    view: { svg: 'member', svgText: ['外した横桁'] } }),
  P_({ id: 'cg-restored', order: 35, days: [5, 6], last: 6, group: '状態', title: '損傷させる横桁：健全に戻した後', use: 'データセットの論文の方法（状態の説明）',
    what: '付け直した横桁の全体', where: 'G3 と G4 の間の、橋の下から（入口の側から支間中央に向けて）', dir: '横桁の全体と両端が入るように。横長',
    must: ['横桁の全体', '両端のボルトと新しい合いマーク'],
    view: pv({ target: 'node:CG_x4.550_G3G4', state: 'intact', deck: 0.25, highlightDamage: true, cam: DAMAGE_CAM, floor: BR.groundZ, targetLabel: '付け直した横桁', ring: 0.3, over: { dist: 3.4, elev: 45, turn: 20 } }) }),
  // 橋のセンサ（種類ごとの代表）
  P_({ id: 'rep-imu-g1', order: 40, days: [2, 3, 4, 5, 6], last: 6, group: 'センサ', title: '加速度計（IMU）の代表：G1 の上フランジ（U12）', use: 'データセットの論文の方法（取り付けの代表の写真）、計測装置の論文（運用）',
    what: `U12 に付けた加速度計（${unitOf('U12')}）とアンテナ`, where: '橋の外（G1 の側）から', dir: '斜め上から。横長',
    must: ['容器・磁石の台・アンテナと、上フランジ', '物差し（大きさの基準）'], note: '2日目の取り付けの時、覆いをかぶせる前が最適。後の日は覆いを外して撮り、すぐ戻す。',
    view: pv({ target: 'U12', labels: ['U12'], cam: { dir: [-0.35, -0.8, 0.8], dist: 0.65 } }) }),
  P_({ id: 'rep-imu-deck', order: 41, days: [2, 3, 4, 5, 6], last: 6, group: 'センサ', title: '加速度計（IMU）の代表：床版の上（U23）', use: 'データセットの論文の方法（取り付けの代表の写真）、計測装置の論文（運用）',
    what: `U23 に付けた加速度計（${unitOf('U23')}）とアンテナ`, where: '床版の上から', dir: '斜め上から。横長',
    must: ['容器・磁石の台・アンテナと、床版', '物差し（大きさの基準）'], note: '2日目の取り付けの時、覆いをかぶせる前が最適。',
    view: pv({ target: 'U23', labels: ['U23'], cam: { dir: [-0.5, 0.4, 0.9], dist: 0.65 } }) }),
  P_({ id: 'rep-ono', order: 42, days: [2, 3, 4, 5, 6], last: 6, group: 'センサ', title: '小野橋梁センサの代表：G1 の上フランジ（U13）', use: 'データセットの論文の方法（取り付けの代表の写真）',
    what: `U13 に付けた小野橋梁センサ（${unitOf('U13')}）とアンテナ`, where: '橋の外（G1 の側）から', dir: '斜め上から。横長',
    must: ['本体・磁石の台・アンテナと、上フランジ', '物差し（大きさの基準）'], note: '2日目の取り付けの時、覆いをかぶせる前が最適。',
    view: pv({ target: 'U13', labels: ['U13'], cam: { dir: [-0.35, -0.8, 0.8], dist: 0.65 } }) }),
  P_({ id: 'rep-bearing-pt', order: 43, days: [2, 3, 4, 5, 6], last: 6, group: 'センサ', title: '支承の点のセンサ（E1）', use: 'データセットの論文の方法（支承の傾きを測る点）',
    what: `E1 のセンサ（${unitOf('E1')}）と、その下の支承`, where: '橋の外（G1 の側）から', dir: 'センサと支承が両方入るように。横長',
    must: ['センサと支承の位置の関係', '物差し（大きさの基準）'], note: 'E1 には触れない（離れて撮る）。',
    view: pv({ target: 'E1', labels: ['E1'], cam: { dir: [-0.6, -1, 0.35], dist: 1.0 } }) }),
  P_({ id: 'rep-cover', order: 44, days: [2, 3, 4, 5, 6], last: 6, group: 'センサ', title: '日よけの覆い（U13、ふたを閉めた所）', use: 'データセットの論文の方法（熱への対策の説明）',
    what: 'U13 にかぶせた発泡スチロールの覆い', where: '橋の外（G1 の側）から', dir: '斜め上から。横長', must: ['覆いの全体と、上フランジの上での置き方'],
    view: pv({ target: 'U13', labels: ['U13'], cam: { dir: [-0.35, -0.8, 0.9], dist: 0.7 } }) }),
  P_({ id: 'rep-cover-in', order: 44.5, days: [2, 3, 4, 5, 6], last: 6, group: 'センサ', title: '日よけの中（U13、ふたを開けた所）', use: 'データセットの論文の方法（熱への対策の説明）',
    what: 'U13 の覆いのふたを開けた中の、センサと保冷剤', where: '橋の外（G1 の側）から', dir: '真上に近い斜めから。横長', must: ['センサと保冷剤の置き方', '保冷剤がセンサに直接当たっていない'],
    note: '撮ったらすぐふたを閉める。',
    view: pv({ target: 'U13', labels: ['U13'], cam: { dir: [-0.15, -0.35, 1], dist: 0.6 } }) }),
  P_({ id: 'rep-press', order: 45, days: [2, 3, 4, 5, 6], last: 6, group: 'センサ', title: '感圧センサ（入口）', use: 'データセットの論文の方法（進入・退出の記録）',
    what: '入口の支承線の上の感圧の帯と、ロガー', where: '入口の手前の路面から', dir: '斜め上から。横長', must: ['帯の全体（ゴムシートをかぶせた形）と、左の車輪の通り道', 'ロガー', '物差しか巻尺（大きさの基準）'],
    view: pv({ target: 'PRESS_P001', labels: ['PRESS_P001'], cam: { dir: [-1, 0.25, 0.8], dist: 1.6 }, floor: DECK }) }),
  P_({ id: 'rep-temp', order: 46, days: [2, 3, 4, 5, 6], last: 6, group: 'センサ', title: '温度センサ（T1）', use: 'データセットの論文の方法（鋼の温度の記録）',
    what: '鋼に貼った温度の測定点の板と、ロガー・アンテナ', where: '板の正面から', dir: '横長', must: ['測定点の板と、貼った部材', 'ロガーとケーブル', '物差し（大きさの基準）'], note: '付ける主桁と面は未定。',
    view: pv({ target: 'T1', labels: ['T1'], cam: { dir: [0, -1, 0.3], dist: 1.0 }, legend: 'T1・T2 を付ける主桁と面は未定' }) }),
  P_({ id: 'rep-mosaic', order: 47, days: [2, 3, 4, 5, 6], last: 6, group: 'センサ', title: '支承の四隅の MOSAIC（C1）', use: 'データセットの論文の方法（四隅の GNSS）、計測装置の論文（GNSS の記録の機器）',
    what: `C1 の MOSAIC（${unitOf('C1')}）とアンテナ、支承`, where: '橋の外（G1 の側）から', dir: 'アンテナと支承が入るように。横長', must: ['アンテナと支承の位置の関係', '本体と画面'],
    view: pv({ target: 'C1', labels: ['C1'], cam: { dir: [-0.6, -1, 0.6], dist: 1.3 } }) }),
  P_({ id: 'rep-bm1', order: 48, days: [2, 3, 4, 5, 6], last: 6, group: 'センサ', title: '基準の MOSAIC（BM1、隣の建物の屋上）と周りの空', use: 'データセットの論文の方法（基準局）',
    what: '隣の建物の屋上の BM1 の MOSAIC と、周りの空', where: '屋上の、BM1 から少し離れた所から', dir: '空と周りの建物・木が入るように。横長', must: ['MOSAIC とアンテナ', '周りに空をさえぎる物がない様子'],
    view: pv({ target: [4.16, 0.6, 0], ring: 0.01, over: { at: [4.16, -9, 6], look: [4.16, 0.6, 0] }, msg: 'BM1 は隣の建物の屋上（橋から 20 m 以内。図に建物はない）' }) }),
  // 加振と打撃
  P_({ id: 'rep-shaker', order: 50, days: [2, 3, 4, 5, 6], last: 6, group: '加振・打撃', title: '加振器（S1、クランプとおもり）', use: 'データセットの論文の方法（加振の試験、図1）',
    what: 'G1 に留めた加振器（PET-05）・L型クランプ4本・おもり・加速度計 353B33', where: '橋の外（G1 の側）から', dir: '斜め上から。横長', must: ['加振器・クランプ4本・おもり・353B33 の全部', '物差し（大きさの基準）'], note: 'おもりを付けた後、走行の前に外す前に撮る。',
    view: pv({ target: 'S1shaker', shaker: true, targetLabel: 'S1', cam: { dir: [-0.35, -1, 0.6], dist: 0.75 } }) }),
  P_({ id: 'rep-mass-parts', order: 49, days: [0, 2, 3, 4, 5, 6], last: 6, group: '加振・打撃', title: 'おもりの部品（組み立ての前、並べて）', use: 'データセットの論文の方法（加振の力：動く部分の質量）',
    what: '寸切りボルト・ナット3個・大ワッシャー33枚・加速度計 353B33 を並べた所', where: '真上から（白い紙か板の上に並べる）', dir: '真上から。横長',
    must: ['部品の全部', '物差し（大きさの基準）', '背景に余計な物がない'], note: '組み立てる前に撮る（前日までの研究室で、部品を量るときが最適）。',
    view: { svg: 'scale', svgText: ['寸切りボルト', 'ナット 3', '大ワッシャー 33', '353B33'] } }),
  P_({ id: 'rep-clamp', order: 50.5, days: [2, 3, 4, 5, 6], last: 6, group: '加振・打撃', title: 'クランプの掴み方（1本の近く）', use: 'データセットの論文の方法（加振器の留め方）',
    what: 'L型クランプ1本の上の爪が四角い板の角に載り、下のねじがフランジを押し上げる所', where: '橋の外（G1 の側）から、低く', dir: '真横から。横長',
    must: ['上の爪と四角い板の角', '下のねじとフランジの下面', '物差し（大きさの基準）'],
    view: pv({ target: 'S1shaker', shaker: true, targetLabel: 'S1', cam: { dir: [0.2, -1, 0.05], dist: 0.55 } }) }),
  P_({ id: 'rep-shaker-wide', order: 51, days: [2, 3, 4, 5, 6], last: 6, group: '加振・打撃', title: '加振器と橋（引いて）', use: 'データセットの論文の方法（加振の位置）',
    what: '加振器と、橋の入口の側の全体', where: '橋の外（G1 の側）から、離れて', dir: '横長', must: ['加振器と、橋の中での位置が分かる'],
    view: pv({ target: 'S1shaker', shaker: true, targetLabel: 'S1', cam: { dir: [-0.5, -1, 0.45], dist: 2.6 } }) }),
  P_({ id: 'rep-daq', order: 52, days: [2, 3, 4, 5, 6], last: 6, group: '加振・打撃', title: '加振と打撃の記録の機器', use: 'データセットの論文の方法（加振の力の記録）',
    what: '電力増幅器 PA05・オシロスコープ DHO914S・Mac・信号調整器 480E09 と、つないだケーブル', where: 'ブルーシートの外から', dir: '横長', must: ['4つの機器とケーブルのつながり', '機器の名前が読める'],
    view: pv({ target: TARP, ring: 0.4, targetLabel: 'ブルーシート（置き場所の目安）', shaker: true, cam: { dir: [-0.5, -1, 0.9], dist: 2.4 } }) }),
  P_({ id: 'rep-hammer', order: 53, days: [2, 3, 4, 5, 6], last: 6, group: '加振・打撃', title: '打撃の様子（H2）', use: 'データセットの論文の方法（打撃の試験）',
    what: 'インパクトハンマー 086D50 の先を H2 に当てて止めた所（叩かない）', where: '打つ人の後ろの斜めから', dir: 'ハンマーと叩く点が入るように。横長', must: ['ハンマーの先が H2 の印に当たっている', '打つ人の顔が写っていない'], note: '叩いている所ではなく、構えて止めた所を撮る。',
    view: pv({ target: 'H2', labels: ['H2'], cam: { dir: [0.8, -1, 0.45], dist: 2.0 } }) }),
  P_({ id: 'rep-sync', order: 54, days: [2, 6], last: 6, group: '加振・打撃', title: '同時打撃（板に並べた全台）', use: 'データセットの論文の技術的な確認（時刻の確認）、計測装置の論文（時刻の確認）',
    what: '板に並べて固定した全台と、木槌', where: '板の斜め上から', dir: '横長', must: ['全台が並んだ様子', '木槌', '人の顔が写っていない'], note: '2日目の設置の前か、6日目の撤去の後。',
    view: { scene: 'sync', target: 'all', cam: { at: [0.9, 0.6, 1.0] }, orient: 'yoko', over: { at: [1.4, 1.1, 1.5] }, legend: '並べ方は模式' } }),
  // 試験車
  P_({ id: 'car-left', order: 60, days: [1, 3, 4, 5, 6], last: 6, group: '試験車', title: '試験車の真横（左）', use: 'データセットの論文の方法（図2：試験車とセンサ）',
    what: 'センサを付けた試験車の全体', where: '車の左の、真横から離れて', dir: '車の全体が入るように。横長', must: ['車の全体', 'ナンバープレートが写っていない（真横から）', '人が乗っていない・周りにいない'],
    view: pv({ scene: 'truck', target: [-0.95, 0, 0.8], ring: 0.01, cam: { at: [-0.95, 5.2, 0.9] } }) }),
  P_({ id: 'car-right', order: 61, days: [1, 3, 4, 5, 6], last: 6, group: '試験車', title: '試験車の真横（右）', use: 'データセットの論文の方法（図2：試験車とセンサ）',
    what: 'センサを付けた試験車の全体', where: '車の右の、真横から離れて', dir: '車の全体が入るように。横長', must: ['車の全体', 'ナンバープレートが写っていない（真横から）', '人が乗っていない・周りにいない'],
    view: pv({ scene: 'truck', target: [-0.95, 0, 0.8], ring: 0.01, cam: { at: [-0.95, -5.2, 0.9] } }) }),
  P_({ id: 'car-sprung', order: 62, days: [1, 3, 4, 5, 6], last: 6, group: '試験車', title: 'ばね上の代表（FSL）', use: 'データセットの論文の方法（取り付けの代表の写真）、計測装置の論文（運用）',
    what: `FSL の加速度計（${unitOf('FSL')}）と、付けた所`, where: '車の左の外から', dir: '斜めから。横長', must: ['本体と、付けた面', '物差し（大きさの基準）'],
    view: pv({ scene: 'truck', target: 'FSL', labels: ['FSL'], cam: { dir: [0.3, 1, 0.5], dist: 0.9 } }) }),
  P_({ id: 'car-unspr-f', order: 63, days: [1, 3, 4, 5, 6], last: 6, group: '試験車', title: 'ばね下の代表（前、FZL）', use: 'データセットの論文の方法（取り付けの代表の写真）、計測装置の論文（運用：二重の脱落防止）',
    what: `FZL の加速度計（${unitOf('FZL')}）と、留め方`, where: '前輪の後ろの、車の左の外から（しゃがんで、前に向けて）', dir: '横長', must: ['本体・留め具・二重の脱落防止', 'ケーブルの通し方', '物差し（大きさの基準）'],
    view: pv({ scene: 'truck', target: 'FZL', labels: ['FZL'], cam: { at: [-1.08, 0.76, 0.22] }, floor: 0 }) }),
  P_({ id: 'car-unspr-r', order: 64, days: [1, 3, 4, 5, 6], last: 6, group: '試験車', title: 'ばね下の代表（後、RZL）', use: 'データセットの論文の方法（取り付けの代表の写真）、計測装置の論文（運用）',
    what: `RZL の加速度計（${unitOf('RZL')}）と、留め方`, where: '後輪の前の、車の左の外から（地面すれすれに、後ろに向けて）', dir: '横長', must: ['本体・留め具・二重の脱落防止', 'ケーブルの通し方', '物差し（大きさの基準）'],
    view: pv({ scene: 'truck', target: 'RZL', labels: ['RZL'], cam: { at: [-1.24, 0.48, 0.1] }, floor: 0 }) }),
  P_({ id: 'car-vm1', order: 65, days: [1, 3, 4, 5, 6], last: 6, group: '試験車', title: '車載の MOSAIC（VM1）のアンテナ', use: 'データセットの論文の方法（車両の GNSS）、計測装置の論文（GNSS の記録の機器）',
    what: `VM1 のアンテナと本体（${unitOf('VM1')}）`, where: '車の斜め前の上から（脚立）', dir: '横長', must: ['アンテナと、付けた所', '本体とケーブル'], note: '置く所は未定。ナンバープレートを写さない。',
    view: pv({ scene: 'truck', target: 'VM1', labels: ['VM1'], cam: { dir: [0.4, 1, 0.7], dist: 1.3 } }) }),
  // 1日目だけの試験
  P_({ id: 'test-wheel', order: 70, days: [1], last: 1, group: '1日目の試験', title: '輪重の測定（台はかり）', use: 'データセットの論文の方法（車両のパラメータ）',
    what: '台はかりに載った車輪', where: '車の横から', dir: '横長', must: ['車輪と台はかり', 'ナンバープレートが写っていない'],
    view: pv({ scene: 'truck', target: [0, 0.645, 0.05], ring: 0.2, targetLabel: '前左', cam: { dir: [0.3, 1, 0.45], dist: 1.5 } }) }),
  P_({ id: 'test-step', order: 71, days: [1], last: 1, group: '1日目の試験', title: '段差を落ちる試験', use: 'データセットの論文の方法（車両単独の試験）',
    what: '段差の板の上に止めた前輪（落ちる前）', where: '車の左の横から', dir: '横長', must: ['段差の板と前輪', 'ナンバープレートが写っていない'], note: '車を止めた状態で撮る（落ちている所は撮らない）。',
    view: pv({ scene: 'truck', target: [0, 0.645, 0.15], ring: 0.3, targetLabel: '前輪', cam: { dir: [0.15, 1, 0.3], dist: 2.2 } }) }),
  P_({ id: 'test-board', order: 72, days: [1], last: 1, group: '1日目の試験', title: '板を越える試験', use: 'データセットの論文の方法（車両単独の試験）',
    what: '板の手前に止めた前輪と、板', where: '車の左の横から', dir: '横長', must: ['板と前輪', 'ナンバープレートが写っていない'], note: '車を止めた状態で撮る。',
    view: pv({ scene: 'truck', target: [0.6, 0.645, 0.02], ring: 0.25, targetLabel: '板', cam: { dir: [0.3, 1, 0.35], dist: 2.2 } }) }),
  P_({ id: 'test-push', order: 73, days: [1], last: 1, group: '1日目の試験', title: '押して離す試験', use: 'データセットの論文の方法（車両単独の試験）',
    what: '車の後ろを押す手と、車', where: '押す人の横から', dir: '横長', must: ['押す所と手', '押す人の顔が写っていない', 'ナンバープレートが写っていない'],
    view: pv({ scene: 'truck', target: [-2.9, 0, 0.9], ring: 0.15, targetLabel: '押す所', cam: { dir: [-0.6, 1, 0.4], dist: 2.4 } }) }),
  P_({ id: 'test-static', order: 74, days: [1], last: 1, group: '1日目の試験', title: '静的載荷（車を止めた所）', use: 'データセットの論文の方法（静的載荷）',
    what: '支間に止めた試験車と橋の全体', where: '橋の外（G1 の側）の真横から、離れて', dir: '橋と車の全体が入るように。横長', must: ['車と橋の全体', '橋の上と下に人がいない', 'ナンバープレートが写っていない（真横から）'],
    view: pv({ target: [4.16, 0, 0], ring: 0.01, truckAt: 4.16, cam: { at: [4.16, -8.5, 1.1] } }) }),
  // 走行と試験の様子
  P_({ id: 'run-g1', order: 80, days: [3, 4, 5, 6], last: 6, group: '走行・全体', title: '走行中（G1 の側の真横から）', use: 'データセットの論文の方法（走行の説明）',
    what: '橋の上を走る試験車と、橋の全体', where: '橋の外（G1 の側）の真横から、離れて', dir: '橋の全体が入るように。横長', must: ['車が支間の中ほどにいる', 'ナンバープレートが写っていない（真横から）', '橋の上と下に人がいない'], note: '走行の1回で、前輪が支間の中央を越えた時にシャッターを1回押す。撮る人は決めた所から動かない。ぶれていたら、次の走行でもう一度。',
    view: pv({ target: [4.16, 0, 0], ring: 0.01, truckAt: 5.1, cam: { at: [4.16, -8.5, 1.1] } }) }),
  P_({ id: 'run-press', order: 81, days: [3, 4, 5, 6], last: 6, group: '走行・全体', title: '前輪が入口の感圧の帯を踏む所', use: 'データセットの論文の方法（進入の記録）',
    what: '入口の帯の上に止めた左の前輪', where: '橋の外（G4 の側）の、入口の横から低く', dir: '横長', must: ['帯の上の前輪', 'ナンバープレートが写っていない（横から）'], note: '走行の前に、運転者が前輪を帯の上に止めて撮る（走っている所は撮らない）。',
    view: pv({ target: [0, LEFT_Y, DECK], ring: 0.25, truckAt: 0.0, targetLabel: '入口の帯', cam: { at: [0.0, 3.3, 0.35] } }) }),
  P_({ id: 'run-shake', order: 82, days: [2, 3, 4, 5, 6], last: 6, group: '走行・全体', title: '加振の試験中（人のいない橋）', use: 'データセットの論文の方法（加振の試験）',
    what: '加振している加振器と、人のいない橋', where: '橋の外（G1 の側）から、離れて', dir: '横長', must: ['加振器と橋', '橋の上と下に人がいない'], note: '加振の間は近づかない（離れた所から撮る）。',
    view: pv({ target: 'S1shaker', shaker: true, targetLabel: 'S1', cam: { dir: [-0.7, -1, 0.5], dist: 3.0 } }) }),
  P_({ id: 'rep-collect', order: 84, days: [1, 2, 3, 4, 5, 6], last: 6, group: '走行・全体', title: 'データの回収（SD を PC に写す所）', use: '計測装置の論文（運用：回収と照合）',
    what: 'データ保管用の Mac・SD の読み取り機・外付けの SSD と、回収の画面', where: '机の斜め上から', dir: '横長', must: ['Mac・読み取り機・SSD', '画面（回収の途中）', '人の顔が写っていない'],
    view: { svg: 'laptop', svgText: ['Collect_SD.command', '回収の途中の画面'] } }),
  P_({ id: 'site', order: 83, days: [2, 3, 4, 5, 6], last: 6, group: '走行・全体', title: '現場の全体（周りと空）', use: 'データセットの論文の方法（現場の説明）、計測装置の論文（運用）',
    what: '橋・機材の置き場・車の通り道と、周りの空', where: '橋から離れた所（入口の斜め）から', dir: '横長', must: ['橋と機材の全体', '空の開け具合', '人の顔が写っていない'],
    view: pv({ target: [4.16, 0, 0], ring: 0.01, cam: { at: [-12, -10, 3] } }) }),
].sort((a, b) => a.order - b.order);

// 撮る日の目安（due）：遅くともこの日に撮る。最後の日（last）まで待たない。取り付けの日（2日目）は覆いをかぶせる前、1日目は何も付けていない橋と車両単独の試験
const DUE = {
  'rep-mass-parts': 0, 'bearing-in': 1, 'bearing-out': 1, joint: 1, 'bare-under': 1, 'rep-collect': 2, 'car-left': 1, 'car-right': 1, 'car-sprung': 1, 'car-unspr-f': 1, 'car-unspr-r': 1, 'car-vm1': 1,
  'cg-intact': 2, 'cg-intact-bolts': 2, 'cg-light-bolts': 4, 'cg-removed': 4, 'cg-heavy': 5, 'cg-restored': 6,
  'run-g1': 3, 'run-press': 3,
};
PAPER.forEach((p) => { p.due = DUE[p.id] ?? (p.days[0] === 1 && p.last === 1 ? 1 : p.days[0]); });

// 記録の写真を撮るその場で、論文用の写真も撮るように案内する（作業の id/写真の id → 論文用の id）
export const PAPER_HINTS = {
  'clean-after/clean-after-g1': ['bare-g1'], 'clean-after/clean-after-g4': ['bare-out'], 'clean-after/clean-after-in': ['bare-deck', 'bare-side'],
  'dims/bearing-0-G1': ['bearing-in'], 'dims/bearing-1-G1': ['bearing-out'], 'joints/j1L-step': ['joint'],
  'install/U12-a': ['rep-imu-g1'], 'install/U23-a': ['rep-imu-deck'], 'install/U13-a': ['rep-ono'], 'install/E1-a': ['rep-bearing-pt'],
  'install/route-G4': ['inst-g1', 'inst-side', 'inst-out', 'inst-deck'],
  'ice/U13-ice': ['rep-cover'], 'press/PRESS_P001-a': ['rep-press'], 'temp/T1-b': ['rep-temp'], 'mosaic/C1-a': ['rep-mosaic'], 'mosaic/BM1-a': ['rep-bm1'],
  'shaker-am/mass-on': ['rep-shaker', 'rep-shaker-wide'], 'shaker-am/tarp-gear': ['rep-daq'], 'sync/sync-row': ['rep-sync'], 'sync-after/sync-row': ['rep-sync'],
  'bolts-intact/bolts-all': ['cg-intact', 'cg-intact-bolts'], 'state/state-all': ['cg-intact', 'cg-intact-bolts', 'cg-light-bolts', 'cg-heavy', 'cg-restored'],
  'to-light/light-all': ['cg-light-bolts'], 'to-heavy/heavy-empty': ['cg-heavy'], 'to-heavy/heavy-mass': ['cg-removed'], 'to-intact/back-all': ['cg-restored'],
  'vehicle/FSL-a': ['car-sprung'], 'vehicle/FZL-a': ['car-unspr-f'], 'vehicle/RZL-a': ['car-unspr-r'], 'vehicle/VM1-a': ['car-vm1'], 'vehicle/mass-load': ['car-left', 'car-right'],
  'vehicle-alone/wheel-FL': ['test-wheel'], 'vehicle-alone/step-f': ['test-step'], 'vehicle-alone/board': ['test-board'], 'vehicle-alone/push-r': ['test-push'],
  'static/q2-on': ['test-static'], 'passage/gopro': ['run-g1', 'run-press'], 'ambient/ambient-start': ['run-shake', 'site', 'rep-hammer'],
  'prep-mass/mass-weigh': ['rep-mass-parts'], 'shaker-am/S1-clamps': ['rep-clamp'], 'dims/cross-4': ['bare-under'], 'collect/collect-spr': ['rep-collect'],
};

export function paperTask(day) {
  const shots = PAPER.filter((p) => p.days.includes(day)).sort((a, b) => a.due - b.due || a.last - b.last || a.order - b.order);
  return {
    id: 'paper', part: day === 0 ? '準備' : '日中', title: '論文用の写真', role: '撮る人', paper: true, shots,
    desc: `記録の写真とは別に、論文の図に使える写真を撮る。この日に撮れる物（${shots.length}か所）を、撮る日の目安が早い順に並べた（目安の日に撮る。最後の日まで待たない）。どの日に撮っても、撮った印は共通。`,
    ref: 'このアプリの「論文用」',
  };
}

// ---------- 日ごとの並び ----------
const noPhoto = (id, part, title, desc, ref, role = '') => ({ id, part, title, desc, ref, role, nophoto: true });

function prepMassTask() {
  return {
    id: 'prep-mass', part: '準備', title: 'おもりの準備（キットが届いた日、研究室）', role: '加振・打撃',
    desc: '加振器のおもりの、組み立ての前の準備。353B33 の接着用ベースを大ワッシャー1枚に貼り、動く部品を全部量る。組み立てた後は、ボルトを外さないと量れない。',
    ref: '手順書 §0、加振器とハンマーの使い方 §3.2', device: 'mass', shots: [
      {
        id: 'mass-base', title: 'ベースを貼った大ワッシャー', what: '353B33 の接着用ベースを貼った大ワッシャー1枚', where: 'ワッシャーの真上から', dir: '真上から',
        must: ['ベースの位置（中心から 15.8 mm、平らな辺の1つが中心を向く）', '物差し（ワッシャーの中心からベースの中心まで）'],
        view: { svg: 'washer' },
      },
      {
        id: 'mass-weigh', title: '動く部品の全部の質量', what: 'はかりに載せた、動く部品の全部',
        where: 'はかりの正面から', dir: '表示が読める向き',
        must: ['はかりの表示が読める', '寸切りボルト1本・ナット3個・大ワッシャー33枚（ベースを貼った1枚を含む）・353B33（スタッド付き）が全部載っている'],
        note: 'この質量が、力の計算の「動く部分の質量」になる（台の 0.15 kg は別に足す）。',
        view: { svg: 'scale', svgText: ['寸切りボルト 1', 'ナット 3', '大ワッシャー 33', '353B33'] },
      },
    ],
  };
}

function withSteps(T, day) {
  for (const t of T) {
    const fn = STEPS[t.id];
    t.steps = fn ? fn(day) : [];
    for (const s of t.shots || []) {
      const i = t.steps.findIndex((st) => (st.photos || []).some((pt) => matches(pt, s.id)));
      if (i >= 0) s.step = i + 1;
    }
  }
  return T;
}

export function tasksFor(day) {
  return withSteps(tasksForDay(day), day);
}

function tasksForDay(day) {
  const T = [];
  if (day === 0) {
    T.push(noPhoto('prep', '準備', '前日までの準備', '全台の動作・SD・充電、試験A・B の準備、割り当て表、名札、アプリの確認など。', '手順書 §0', '全員'));
    T.push(prepMassTask(), paperTask(0));
    return T;
  }
  if (day === 1) {
    T.push(noPhoto('testAB', '朝', '試験A の終了・試験B', 'センサの試験A（前の晩から）を終え、試験B を行う。手順はセンサの性能評価の手順書（このアプリには写さない）。', '手順書 §1.1', 'センサ・データ'));
    T.push(cleaningTask(false), cleaningTask(true));
    T.push(dimensionsTask(), jointStepTask(), hammerMarkTask(), deckBoltTask());
    T.push(vehicleInstallTask(1), vehicleAloneTask(), staticLoadTask());
    T.push(noPhoto('rehearsal', '日中', '全機器の通し確認と予行の走行', '全機器を現地で動かし、数回走らせ、前処理を最後まで通す。モバイルバッテリーの持ちと GNSS の受信も確かめる。', '手順書 §14', '全員'));
    T.push(paperTask(1), swapTask(), collectTask(1));
    T.push(noPhoto('charge', '夕方', 'モバイルバッテリーを充電する', '試験A と予行で使ったモバイルバッテリーを、10/29 の設置までに充電する。', '計画書 §9 の13', 'センサ'));
    return T;
  }
  const first = day === 2;
  T.push(noPhoto('meet', '朝', '集合・全体確認・安全確認', 'その日の範囲、天気、役割、連絡の方法。橋の上・下、作業場所、周りの人。', '手順書 §2', '全員'));
  if (first) {
    T.push(syncTask(day, false));
    T.push(installTask());
  } else {
    T.push(noPhoto('battery', '朝', 'モバイルバッテリーをつなぐ', '橋の24台にモバイルバッテリーをつなぐ。小野橋梁センサは、つなぐ前に SW1・SW2 が off（±2 g）か見る。つないだら、ランプが点きっぱなし（記録中）になるのを確かめる。点滅は GPS の時刻待ち。', '手順書 §4 の5', '設置・センサ'));
  }
  T.push(iceTask(first));
  T.push(pressTask(first), tempTask(first));
  if (first) T.push(mosaicBridgeTask());
  T.push(shakerMorningTask(first));
  if (first) {
    T.push({
      id: 'bolts-intact', part: '朝', title: '横桁のボルトの合いマーク（健全）', role: '加振・打撃・設置',
      desc: `損傷させる横桁（G3–G4 の間、支間中央）の8本を、規定のトルクで締めて確かめ（値は書かない）、ボルト・ナット・板にまたがる合いマークをペイントマーカーで引く。${NUMBERING}`,
      ref: '手順書 §11', shots: [damageOverall('bolts-all', 'intact', '横桁の全体（健全）', ['横桁の全体', '両端のボルト']), ...damageShots('intact', 'intact', '健全', ['合いマークの線が、ボルト・ナット・板にまたがっている'])],
    });
  }
  if (day >= 3) T.push(vehicleInstallTask(day));
  T.push(noPhoto('shake', '日中', day === 2 ? '加振の試験（1日中）' : '加振の試験（午前）', `Mac のアプリで、3〜70 Hz の掃引を決めた間隔（例：30分ごと）で自動でくり返す。加振の間は橋の上と下に人を入れない。決めた時刻ごとに、全台が記録中か（小野橋梁センサのランプ、熱で止まっていないか）を見る。開始と終了の時刻・強さ・ファイル名はアプリが記録する。`, '手順書 §9', '加振・打撃'));
  T.push(ambientTask(day));
  if (day >= 3) {
    T.push(massOffTask(), stateMorningTask(day), passageTask(day));
  }
  T.push(swapTask());
  if (day === 3) T.push(changeTask('light'));
  if (day === 4) T.push(changeTask('heavy'));
  if (day === 5) T.push(changeTask('intact'));
  if (day === 6) T.push(removalTask(), syncTask(day, true));
  T.push(paperTask(day));
  T.push(...eveningTasks(day));
  return T;
}

function changeTask(to) {
  if (to === 'light') {
    return {
      id: 'to-light', part: '夕方', title: '状態の変更：健全 → 軽度', role: '加振・打撃・設置',
      desc: `損傷させる横桁の両端の8本を、ナットが手で回る程度まで緩める。センサは外さない。下に人を入れない。${NUMBERING}`,
      ref: '手順書 §11', shots: [...damageShots('light', 'light', '軽度（緩めた後）', ['合いマークのずれ（緩めて回った量）が分かる']), damageOverall('light-all', 'light', '横桁の全体（軽度）', ['横桁の全体', '両端のボルト'])],
    };
  }
  if (to === 'heavy') {
    const v = (extra) => ({ target: 'node:CG_x4.550_G3G4', state: 'heavy', deck: 0.25, cam: DAMAGE_CAM, floor: BR.groundZ, orient: 'yoko', ring: 0.3, over: { dist: 3.4, elev: 45, turn: 20 }, ...extra });
    return {
      id: 'to-heavy', part: '夕方', title: '状態の変更：軽度 → 重度', role: '加振・打撃・設置',
      desc: '同じ横桁（約 36.8 kg）を、ボルトを抜く前にベルトスリングで主桁から吊って支えてから外す。複数人で行い、下に人を入れない。外したボルトは袋に分け、番号を付ける。ほかの物（加振器、センサ、ケーブル、覆い）は動かさない。',
      ref: '手順書 §11、計画書 §10.2 の5', shots: [
        { id: 'heavy-empty', title: '外した後の空いた所', what: '横桁を外した後の G3–G4 の間（支間中央）', where: 'G3 と G4 の間の、橋の下から（入口の側から支間中央に向けて）', dir: '空いた所の全体。横長', must: ['横桁がない', 'まわりの部材とセンサがそのまま'], view: v({ targetLabel: '外した横桁のあった所' }) },
        { id: 'heavy-mass', title: '外した横桁の質量', what: 'はかりに載せた（吊った）横桁', where: 'はかりの正面から', dir: '表示が読めるように', must: ['はかりの表示', '横桁の全体'], view: { svg: 'scale', svgText: ['外した横桁（約 36.8 kg）'] } },
        { id: 'heavy-parts-mass', title: '外したボルト・添接板の質量', what: 'はかりに載せた、外したボルト・ナット・添接板', where: 'はかりの正面から', dir: '表示が読めるように', must: ['はかりの表示', '載せた物が全部写っている'], view: { svg: 'scale', svgText: ['ボルト・ナット', '添接板'] } },
        { id: 'heavy-bags', title: '外したボルトの袋と番号', what: '袋に分けたボルト・ナット・座金', where: '真上から', dir: '番号が読めるように', must: ['袋ごとの番号（1〜8）'], view: { svg: 'bags' } },
      ],
    };
  }
  return {
    id: 'to-intact', part: '夕方', title: '状態の変更：重度 → 健全', role: '加振・打撃・設置',
    desc: `横桁を取り付け直し、8本を規定のトルクで、トルクレンチで締める（値は書かない）。締めたら、新しい合いマークを引く。${NUMBERING}`,
    ref: '手順書 §11', shots: [damageOverall('back-all', 'intact', '取り付け直した横桁', ['横桁の全体', '両端のボルト']), ...damageShots('back', 'intact', '健全（締め直した後）', ['締めた後に引いた新しい合いマーク'])],
  };
}

function removalTask() {
  const shots = ['G1', 'G2', 'G3', 'G4'].map((g) => {
    const y = BR.girderY[+g.slice(1) - 1];
    const outside = g === 'G1' ? -1 : g === 'G4' ? 1 : 0;
    return {
      id: `removed-${g}`, title: `外した後（${g} の線）`, what: `${g} の線の、センサとアンテナを外した後`, where: outside ? `橋の外（${g} の側）の入口の近くから` : '床版の上の、入口の端から', dir: '出口へ向けて。横長',
      must: ['センサ・アンテナ・ケーブル・磁石の台が残っていない'],
      view: { target: [3.5, y, 0.05], ring: 0.01, cam: outside ? { dir: [-1.2, outside * 0.7, 0.55], dist: 4.6 } : { dir: [-1, 0, 0.35], dist: 4.4 }, orient: 'yoko' },
    };
  });
  return {
    id: 'removal', part: '夕方', title: '撤去', role: '全員',
    desc: '走行の後、橋のセンサ・四隅の MOSAIC（C1〜C4）・感圧・温度・加振器を外す。固定点 BM1 の MOSAIC は外さず、隣の建物の屋上に残す（11/4 の別の橋の計測で PPK の基準局に使い、その後に回収する。データはこの日に回収し、残すのは本体だけ）。外した台は同時打撃に使う。取り忘れがないかを主桁の線ごとに撮る。',
    ref: '手順書 §12', shots,
  };
}

// ---------- 使い方の図（3D のない写真） ----------
export function svgFigure(kind, text = []) {
  const t = (s, x, y, size = 15, w = 400) => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" fill="currentColor" text-anchor="middle">${s}</text>`;
  const wrap = (body, caption) => `<svg viewBox="0 0 360 220" role="img" aria-label="${caption}" style="width:100%;height:100%;color:#16202a">${body}${t(caption, 180, 210, 13)}</svg>`;
  if (kind === 'scale' || kind === 'bathscale') {
    const one = text.length === 1;
    const items = text.map((s, i) => {
      const x = one ? 90 : 72 + (i % 2) * 112;
      const w = one ? 180 : 104;
      const y = 50 + Math.floor(i / 2) * 32;
      return `<rect x="${x}" y="${y}" width="${w}" height="26" rx="5" fill="#d9e2ec" stroke="#5a6b7b"/>${t(s, x + w / 2, y + 18, 12)}`;
    }).join('');
    return wrap(`<rect x="70" y="118" width="220" height="50" rx="8" fill="#eef2f6" stroke="#5a6b7b" stroke-width="2"/><rect x="140" y="130" width="80" height="26" rx="4" fill="#1d2b36"/>${t('表示', 180, 148, 13, 700).replace('currentColor', '#7CFC9A')}${items}`, kind === 'bathscale' ? '体重計の表示が読めるように撮る（顔は写さない）' : 'はかりの表示と、載せた物の全部が入るように撮る');
  }
  if (kind === 'laptop') {
    return wrap(`<rect x="70" y="30" width="220" height="130" rx="8" fill="#1d2b36"/><rect x="80" y="40" width="200" height="110" fill="#f4f6f8"/>${t(text[0] || '', 180, 62, 12, 700)}${t(text[1] || '', 180, 100, 11)}<rect x="50" y="160" width="260" height="14" rx="4" fill="#5a6b7b"/>`, '画面の文字が読めるように、正面から撮る');
  }
  if (kind === 'mosaic') {
    return wrap(`<rect x="110" y="40" width="140" height="100" rx="10" fill="#e9edf1" stroke="#5a6b7b" stroke-width="2"/><rect x="125" y="55" width="80" height="50" fill="#1d2b36"/>${t('画面', 165, 85, 12).replace('currentColor', '#fff')}<rect x="150" y="115" width="90" height="20" rx="4" fill="#fffbe6" stroke="#c79a00"/>${t(`${text[0] || ''} ${text[1] || ''}`, 195, 130, 11, 700)}`, '名札と画面が入るように撮る');
  }
  if (kind === 'caliper') {
    return wrap(`<rect x="60" y="80" width="240" height="18" fill="#c9d3dd" stroke="#5a6b7b"/><rect x="60" y="60" width="16" height="60" fill="#9aa8b6"/><rect x="170" y="60" width="16" height="60" fill="#9aa8b6"/><rect x="120" y="96" width="60" height="44" fill="#d9a066"/>${t(text[0] || '', 150, 160, 13, 700)}`, 'ノギスの目盛りが読めるように撮る');
  }
  if (kind === 'step') {
    return wrap(`<rect x="40" y="130" width="280" height="20" fill="#9aa8b6"/><rect x="180" y="104" width="140" height="26" fill="#d9a066"/><rect x="170" y="70" width="6" height="80" fill="#fff" stroke="#5a6b7b"/>${t(text[0] || '', 250, 96, 13)}${t(text[1] || '', 120, 120, 13)}`, '物差しを段差の横に立て、高さが読めるように撮る');
  }
  if (kind === 'bags') {
    return wrap([1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${30 + ((i - 1) % 4) * 78}" y="${40 + Math.floor((i - 1) / 4) * 70}" width="64" height="56" rx="8" fill="#eef2f6" stroke="#5a6b7b"/>${t(String(i), 62 + ((i - 1) % 4) * 78, 74 + Math.floor((i - 1) / 4) * 70, 18, 700)}`).join(''), '袋ごとの番号が読めるように、真上から撮る');
  }
  if (kind === 'washer') {
    return wrap(`<circle cx="180" cy="100" r="70" fill="#d9e2ec" stroke="#5a6b7b" stroke-width="2"/><circle cx="180" cy="100" r="9" fill="#f4f6f8" stroke="#5a6b7b"/><rect x="211" y="88" width="24" height="24" rx="3" fill="#c98a5b" stroke="#5a6b7b"/><line x1="180" y1="100" x2="223" y2="100" stroke="#d6336c" stroke-width="2"/>${t('15.8 mm', 202, 92, 11, 700)}${t('ベース', 223, 132, 12)}${t('大ワッシャー（外径 50 mm）', 180, 186, 12)}`, 'ベースの位置と物差しが入るように、真上から撮る');
  }
  if (kind === 'member') {
    return wrap(`<rect x="40" y="150" width="60" height="22" fill="#9aa8b6"/><rect x="260" y="150" width="60" height="22" fill="#9aa8b6"/><rect x="50" y="110" width="260" height="40" rx="3" fill="#c98a5b" stroke="#5a6b7b"/><circle cx="66" cy="122" r="5" fill="#5a6b7b"/><circle cx="66" cy="138" r="5" fill="#5a6b7b"/><circle cx="294" cy="122" r="5" fill="#5a6b7b"/><circle cx="294" cy="138" r="5" fill="#5a6b7b"/><rect x="120" y="60" width="120" height="8" fill="#fff" stroke="#5a6b7b"/>${t('巻尺か物差し', 180, 52, 12)}${t(text[0] || '外した横桁', 180, 136, 13, 700)}`, '部材の全体と大きさの基準が入るように撮る');
  }
  if (kind === 'trouble') {
    return wrap(`<rect x="110" y="50" width="140" height="90" rx="10" fill="#e9edf1" stroke="#cc1a4d" stroke-width="3"/><circle cx="230" cy="66" r="7" fill="#cc1a4d"/><rect x="130" y="110" width="100" height="20" rx="4" fill="#fffbe6" stroke="#c79a00"/>${t('名札', 180, 125, 11, 700)}`, '名札と、異常の様子が両方入るように撮る');
  }
  return '';
}
