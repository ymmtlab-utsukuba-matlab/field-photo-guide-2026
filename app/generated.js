// tools/build_data.py が作る。手で直さない。
export const GEN = {
 "sources3d": [
  {
   "name": "鋼製模型橋（2023 年のセンサの箱と圧電の帯を外して使う）",
   "from": "研究室で作った表示用の 3D（2026-09-26）",
   "sha256": "74ea3762886b32d8b733296f5ee5fa541a029074bc2d45d1ce23b183094901ce"
  },
  {
   "name": "試験車（ピクシス トラック）",
   "from": "研究室の SPRESENSE の手順書（車両の配置の図）（commit 28d8e6d）",
   "sha256": "e241b7bbf958104a25e1c38e32ae113c126e99f60ddb279f263105ec50396dac"
  },
  {
   "name": "SPRESENSE の本体",
   "from": "研究室の SPRESENSE の手順書（commit a9e6dc4）",
   "sha256": "114b5a3121e396f58b151b86dd74d74204f92fa42bd236e955b816621ce5e2d7"
  },
  {
   "name": "温度センサ",
   "from": "研究室の温度センサの手順書（commit 4a22286）",
   "sha256": "cd889be6dec91797dd6b1d1b2f4f93f97cd06ec86d07fa82abc19e0e69dac358"
  },
  {
   "name": "感圧センサのロガー",
   "from": "研究室の感圧センサの手順書（commit d330fe4）",
   "sha256": "a4f853432e68dd95fcb92d724eb1972e6fcb88adb9f9b34d07401ac9616b4d76"
  },
  {
   "name": "感圧の帯の端",
   "from": "研究室の感圧センサの手順書（commit a3e54eb）",
   "sha256": "11b6d5067818e4b49c21f7d351903060c0c67bcec016d6e46243f184c2c18a8b"
  },
  {
   "name": "MOSAIC",
   "from": "研究室の MOSAIC の手順書（commit 885c5c2）",
   "sha256": "2720846c86d5f5532f36b11fc9aac62b4996e1dfd14d2030e11cdaa8de03a427"
  },
  {
   "name": "加振器とおもり（クランプは付け方が決まるまで描かない）",
   "from": "研究室の現場試験の資料（commit b132c64fccd6）",
   "sha256": "77d9e29ec0e8fd056fca2b817e37a58caaeecfcc9c98df68dd8f572d5b172888"
  },
  {
   "name": "おもりの部品（分けて並べた形）",
   "from": "研究室の現場試験の資料（commit b132c64fccd6）",
   "sha256": "5757f3d21b96ba0e3ba4d72fe5da20e089cf50c06339d8347c8b952adfdd32a6"
  }
 ],
 "vehiclePoints": [
  {
   "id": "FZL",
   "at": [
    -0.03,
    0.445,
    0.2679
   ],
   "decided": true,
   "kind": "vehicle",
   "note": "SPRESENSE の配置のページ（10-15 の取り付けの写真）の位置"
  },
  {
   "id": "FZR",
   "at": [
    -0.03,
    -0.445,
    0.2679
   ],
   "decided": true,
   "kind": "vehicle",
   "note": "SPRESENSE の配置のページ（10-15 の取り付けの写真）の位置"
  },
  {
   "id": "RZL",
   "at": [
    -1.92,
    0.31,
    0.3415
   ],
   "decided": true,
   "kind": "vehicle",
   "note": "SPRESENSE の配置のページ（10-15 の取り付けの写真）の位置"
  },
  {
   "id": "RZR",
   "at": [
    -1.92,
    -0.22,
    0.3415
   ],
   "decided": true,
   "kind": "vehicle",
   "note": "SPRESENSE の配置のページ（10-15 の取り付けの写真）の位置"
  },
  {
   "id": "FSL",
   "at": [
    0.0,
    0.55,
    0.75
   ],
   "decided": false,
   "kind": "vehicle",
   "note": "位置は未定（図は目安）"
  },
  {
   "id": "FSR",
   "at": [
    0.0,
    -0.55,
    0.75
   ],
   "decided": false,
   "kind": "vehicle",
   "note": "位置は未定（図は目安）"
  },
  {
   "id": "RSL",
   "at": [
    -1.92,
    0.55,
    0.7
   ],
   "decided": false,
   "kind": "vehicle",
   "note": "位置は未定（図は目安）"
  },
  {
   "id": "RSR",
   "at": [
    -1.92,
    -0.55,
    0.7
   ],
   "decided": false,
   "kind": "vehicle",
   "note": "位置は未定（図は目安）"
  },
  {
   "id": "VM1",
   "at": [
    0.0,
    0.0,
    1.8
   ],
   "decided": false,
   "kind": "mosaic",
   "note": "前輪の側に水平に置く。置く所は未定（図は目安）"
  }
 ],
 "hub": 0.2685,
 "models": {
  "bridge": "models/bridge_retest.glb",
  "truck": "models/truck_real.glb",
  "shaker": "models/shaker_on_G1.glb"
 },
 "built": {
  "fieldDocsCommit": "4cead18226e2",
  "sensorPositionsSha256": "da10b3dd86b58c7c2edb0faeb21883bb779862fc87cd2c65e28a8e724ea3c780",
  "dates": {
   "1": "20261028",
   "2": "20261029",
   "3": "20261030",
   "4": "20261031",
   "5": "20261101",
   "6": "20261102"
  }
 },
 "points": [
  {
   "id": "E1",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P01",
   "girder": "G1",
   "x": 0.0,
   "y": -1.8,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U11",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P02",
   "girder": "G1",
   "x": 1.387,
   "y": -1.8,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U12",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P01",
   "girder": "G1",
   "x": 2.773,
   "y": -1.8,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U13",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P03",
   "girder": "G1",
   "x": 4.16,
   "y": -1.8,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U14",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P02",
   "girder": "G1",
   "x": 5.547,
   "y": -1.8,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U15",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P04",
   "girder": "G1",
   "x": 6.933,
   "y": -1.8,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "E2",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P05",
   "girder": "G1",
   "x": 8.32,
   "y": -1.8,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U21",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P03",
   "girder": "G2",
   "x": 1.387,
   "y": -0.6,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U22",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P06",
   "girder": "G2",
   "x": 2.773,
   "y": -0.6,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U23",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P04",
   "girder": "G2",
   "x": 4.16,
   "y": -0.6,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U24",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P07",
   "girder": "G2",
   "x": 5.547,
   "y": -0.6,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U25",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P05",
   "girder": "G2",
   "x": 6.933,
   "y": -0.6,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U31",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P06",
   "girder": "G3",
   "x": 1.387,
   "y": 0.6,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U32",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P08",
   "girder": "G3",
   "x": 2.773,
   "y": 0.6,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U33",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P07",
   "girder": "G3",
   "x": 4.16,
   "y": 0.6,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U34",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P09",
   "girder": "G3",
   "x": 5.547,
   "y": 0.6,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U35",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P08",
   "girder": "G3",
   "x": 6.933,
   "y": 0.6,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "E7",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P10",
   "girder": "G4",
   "x": 0.0,
   "y": 1.8,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U41",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P11",
   "girder": "G4",
   "x": 1.387,
   "y": 1.8,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U42",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P09",
   "girder": "G4",
   "x": 2.773,
   "y": 1.8,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U43",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P10",
   "girder": "G4",
   "x": 4.16,
   "y": 1.8,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U44",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P11",
   "girder": "G4",
   "x": 5.547,
   "y": 1.8,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "U45",
   "side": "BRIDGE",
   "device": "IMU (SPRESENSE)",
   "type": "BRIDGE_SPRESENSE",
   "pos": "P12",
   "girder": "G4",
   "x": 6.933,
   "y": 1.8,
   "kind": "imu",
   "decided": true,
   "notDone": false
  },
  {
   "id": "E8",
   "side": "BRIDGE",
   "device": "小野橋梁センサ（3軸の加速度。角速度は記録しない）",
   "type": "BRIDGE_ONO",
   "pos": "P12",
   "girder": "G4",
   "x": 8.32,
   "y": 1.8,
   "kind": "ono",
   "decided": true,
   "notDone": false
  },
  {
   "id": "FSL",
   "side": "VEHICLE",
   "device": "IMU (SPRESENSE)",
   "type": "VEHICLE_SPRESENSE",
   "pos": "P01",
   "girder": "",
   "x": null,
   "y": null,
   "kind": "vehicle",
   "decided": false,
   "notDone": false
  },
  {
   "id": "FSR",
   "side": "VEHICLE",
   "device": "IMU (SPRESENSE)",
   "type": "VEHICLE_SPRESENSE",
   "pos": "P02",
   "girder": "",
   "x": null,
   "y": null,
   "kind": "vehicle",
   "decided": false,
   "notDone": false
  },
  {
   "id": "RSL",
   "side": "VEHICLE",
   "device": "IMU (SPRESENSE)",
   "type": "VEHICLE_SPRESENSE",
   "pos": "P03",
   "girder": "",
   "x": null,
   "y": null,
   "kind": "vehicle",
   "decided": false,
   "notDone": false
  },
  {
   "id": "RSR",
   "side": "VEHICLE",
   "device": "IMU (SPRESENSE)",
   "type": "VEHICLE_SPRESENSE",
   "pos": "P04",
   "girder": "",
   "x": null,
   "y": null,
   "kind": "vehicle",
   "decided": false,
   "notDone": false
  },
  {
   "id": "FZL",
   "side": "VEHICLE",
   "device": "IMU (SPRESENSE)",
   "type": "VEHICLE_SPRESENSE",
   "pos": "P05",
   "girder": "",
   "x": null,
   "y": null,
   "kind": "vehicle",
   "decided": false,
   "notDone": false
  },
  {
   "id": "FZR",
   "side": "VEHICLE",
   "device": "IMU (SPRESENSE)",
   "type": "VEHICLE_SPRESENSE",
   "pos": "P06",
   "girder": "",
   "x": null,
   "y": null,
   "kind": "vehicle",
   "decided": false,
   "notDone": false
  },
  {
   "id": "RZL",
   "side": "VEHICLE",
   "device": "IMU (SPRESENSE)",
   "type": "VEHICLE_SPRESENSE",
   "pos": "P07",
   "girder": "",
   "x": null,
   "y": null,
   "kind": "vehicle",
   "decided": false,
   "notDone": false
  },
  {
   "id": "RZR",
   "side": "VEHICLE",
   "device": "IMU (SPRESENSE)",
   "type": "VEHICLE_SPRESENSE",
   "pos": "P08",
   "girder": "",
   "x": null,
   "y": null,
   "kind": "vehicle",
   "decided": false,
   "notDone": false
  },
  {
   "id": "PRESS_P001",
   "side": "BRIDGE",
   "device": "感圧センサ（感圧の帯 FSR-408 とロガーが一体）",
   "type": "BRIDGE_PASSAGE",
   "pos": "P03",
   "girder": "",
   "x": 0.0,
   "y": 1.25,
   "kind": "press",
   "decided": false,
   "notDone": false
  },
  {
   "id": "PRESS_P002",
   "side": "BRIDGE",
   "device": "感圧センサ（感圧の帯 FSR-408 とロガーが一体）",
   "type": "BRIDGE_PASSAGE",
   "pos": "P04",
   "girder": "",
   "x": 8.32,
   "y": 1.25,
   "kind": "press",
   "decided": false,
   "notDone": false
  },
  {
   "id": "VM1",
   "side": "VEHICLE",
   "device": "MOSAIC（車載、CLAS）",
   "type": "VEHICLE_MOSAIC",
   "pos": "P01",
   "girder": "",
   "x": null,
   "y": null,
   "kind": "mosaic",
   "decided": true,
   "notDone": false
  },
  {
   "id": "BM1",
   "side": "BRIDGE",
   "device": "MOSAIC（空の開けた固定点）",
   "type": "BRIDGE_MOSAIC",
   "pos": "P01",
   "girder": "",
   "x": null,
   "y": null,
   "kind": "mosaic",
   "decided": false,
   "notDone": false
  },
  {
   "id": "C1",
   "side": "BRIDGE",
   "device": "mosaic-X5（支承の四隅）",
   "type": "BRIDGE_MOSAIC",
   "pos": "P02",
   "girder": "G1",
   "x": 0.0,
   "y": -1.8,
   "kind": "mosaic",
   "decided": true,
   "notDone": false
  },
  {
   "id": "C2",
   "side": "BRIDGE",
   "device": "mosaic-X5（支承の四隅）",
   "type": "BRIDGE_MOSAIC",
   "pos": "P03",
   "girder": "G4",
   "x": 0.0,
   "y": 1.8,
   "kind": "mosaic",
   "decided": true,
   "notDone": false
  },
  {
   "id": "C3",
   "side": "BRIDGE",
   "device": "mosaic-X5（支承の四隅）",
   "type": "BRIDGE_MOSAIC",
   "pos": "P04",
   "girder": "G1",
   "x": 8.32,
   "y": -1.8,
   "kind": "mosaic",
   "decided": true,
   "notDone": false
  },
  {
   "id": "C4",
   "side": "BRIDGE",
   "device": "mosaic-X5（支承の四隅）",
   "type": "BRIDGE_MOSAIC",
   "pos": "P05",
   "girder": "G4",
   "x": 8.32,
   "y": 1.8,
   "kind": "mosaic",
   "decided": true,
   "notDone": false
  },
  {
   "id": "T1",
   "side": "BRIDGE",
   "device": "温度センサ（温度の測定点とロガーが一体）",
   "type": "BRIDGE_TEMP",
   "pos": "P01",
   "girder": "",
   "x": 4.16,
   "y": null,
   "kind": "temp",
   "decided": false,
   "notDone": false
  },
  {
   "id": "T2",
   "side": "BRIDGE",
   "device": "温度センサ（温度の測定点とロガーが一体）",
   "type": "BRIDGE_TEMP",
   "pos": "P02",
   "girder": "",
   "x": 4.16,
   "y": null,
   "kind": "temp",
   "decided": false,
   "notDone": false
  },
  {
   "id": "S1",
   "side": "BRIDGE",
   "device": "加振器（鉛直）",
   "type": "－",
   "pos": "－",
   "girder": "G1",
   "x": 1.67,
   "y": -1.8,
   "kind": "shaker",
   "decided": true,
   "notDone": false
  },
  {
   "id": "R1",
   "side": "BRIDGE",
   "device": "加振器（鉛直）",
   "type": "－",
   "pos": "－",
   "girder": "G1",
   "x": 2.773,
   "y": -1.8,
   "kind": "shaker",
   "decided": false,
   "notDone": true
  },
  {
   "id": "R3",
   "side": "BRIDGE",
   "device": "加振器（水平）",
   "type": "－",
   "pos": "－",
   "girder": "G1",
   "x": 2.773,
   "y": -1.8,
   "kind": "shaker",
   "decided": false,
   "notDone": true
  },
  {
   "id": "R2",
   "side": "BRIDGE",
   "device": "加振器（鉛直）",
   "type": "－",
   "pos": "－",
   "girder": "G4",
   "x": 2.773,
   "y": 1.8,
   "kind": "shaker",
   "decided": false,
   "notDone": true
  },
  {
   "id": "SF1",
   "side": "BRIDGE",
   "device": "加速度計 353B33（ハンマリングキット GK291D50。DHO914S の CH2 で記録）",
   "type": "－",
   "pos": "－",
   "girder": "",
   "x": null,
   "y": null,
   "kind": "shaker_force",
   "decided": true,
   "notDone": false
  },
  {
   "id": "H1",
   "side": "BRIDGE",
   "device": "打撃の点（鉛直）",
   "type": "－",
   "pos": "－",
   "girder": "G1",
   "x": 2.08,
   "y": -1.8,
   "kind": "hammer",
   "decided": true,
   "notDone": false
  },
  {
   "id": "H2",
   "side": "BRIDGE",
   "device": "打撃の点（鉛直）",
   "type": "－",
   "pos": "－",
   "girder": "G1",
   "x": 4.853,
   "y": -1.8,
   "kind": "hammer",
   "decided": true,
   "notDone": false
  },
  {
   "id": "H3",
   "side": "BRIDGE",
   "device": "打撃の点（鉛直）",
   "type": "－",
   "pos": "－",
   "girder": "G1",
   "x": 7.627,
   "y": -1.8,
   "kind": "hammer",
   "decided": true,
   "notDone": false
  },
  {
   "id": "H4",
   "side": "BRIDGE",
   "device": "打撃の点（鉛直）",
   "type": "－",
   "pos": "－",
   "girder": "G4",
   "x": 2.08,
   "y": 1.8,
   "kind": "hammer",
   "decided": true,
   "notDone": false
  },
  {
   "id": "H5",
   "side": "BRIDGE",
   "device": "打撃の点（鉛直）",
   "type": "－",
   "pos": "－",
   "girder": "G4",
   "x": 4.853,
   "y": 1.8,
   "kind": "hammer",
   "decided": true,
   "notDone": false
  },
  {
   "id": "H6",
   "side": "BRIDGE",
   "device": "打撃の点（鉛直）",
   "type": "－",
   "pos": "－",
   "girder": "G4",
   "x": 7.627,
   "y": 1.8,
   "kind": "hammer",
   "decided": true,
   "notDone": false
  },
  {
   "id": "H7",
   "side": "BRIDGE",
   "device": "打撃の点（水平）",
   "type": "－",
   "pos": "－",
   "girder": "G1",
   "x": 3.467,
   "y": -1.8,
   "kind": "hammer",
   "decided": true,
   "notDone": false
  },
  {
   "id": "H8",
   "side": "BRIDGE",
   "device": "打撃の点（水平）",
   "type": "－",
   "pos": "－",
   "girder": "G4",
   "x": 6.24,
   "y": 1.8,
   "kind": "hammer",
   "decided": true,
   "notDone": false
  }
 ],
 "assignment": [
  {
   "point": "U12",
   "device": "BRI_P001",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "橋の IMU：位置の番号（BRIDGE_SPRESENSE の P01〜P12）と台の番号をそろえる"
  },
  {
   "point": "U14",
   "device": "BRI_P002",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U21",
   "device": "BRI_P003",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U23",
   "device": "BRI_P004",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U25",
   "device": "BRI_P005",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U31",
   "device": "BRI_P006",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U33",
   "device": "BRI_P007",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U35",
   "device": "BRI_P008",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U42",
   "device": "BRI_P009",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U43",
   "device": "BRI_P010",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U44",
   "device": "BRI_P011",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U45",
   "device": "BRI_P012",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "E1",
   "device": "ONO_P001",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "小野橋梁センサ：位置の番号（BRIDGE_ONO の P01〜P12）の順に、予備の P009・P014 を除いた台を番号の順に当てる"
  },
  {
   "point": "U11",
   "device": "ONO_P002",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U13",
   "device": "ONO_P003",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U15",
   "device": "ONO_P004",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "E2",
   "device": "ONO_P005",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U22",
   "device": "ONO_P006",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上（P006 は電池の持ちが最短の 10.3 h。記録が10時間を超える日は、この台から電池を替える）"
  },
  {
   "point": "U24",
   "device": "ONO_P007",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U32",
   "device": "ONO_P008",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U34",
   "device": "ONO_P010",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上（P009 は予備）"
  },
  {
   "point": "E7",
   "device": "ONO_P011",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "U41",
   "device": "ONO_P012",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "E8",
   "device": "ONO_P013",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上（P014 は予備）"
  },
  {
   "point": "PRESS_P001",
   "device": "PRESS_P001",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "感圧センサ：入口は PRESS_P001（10-09 決定）"
  },
  {
   "point": "PRESS_P002",
   "device": "PRESS_P002",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "感圧センサ：出口は PRESS_P002（10-09 決定）"
  },
  {
   "point": "T1",
   "device": "TEMP_P001",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "温度センサ：番号の順（T1 に TEMP_P001）"
  },
  {
   "point": "T2",
   "device": "TEMP_P002",
   "days": [
    1,
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "温度センサ：番号の順（T2 に TEMP_P002）"
  },
  {
   "point": "C1",
   "device": "MOSAIC_P002",
   "days": [
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "支承の四隅の mosaic-X5：位置の番号（BRIDGE_MOSAIC の P02〜P05）と台の番号をそろえる（10-15 の一覧で橋は P002〜P005）"
  },
  {
   "point": "C2",
   "device": "MOSAIC_P003",
   "days": [
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "C3",
   "device": "MOSAIC_P004",
   "days": [
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "C4",
   "device": "MOSAIC_P005",
   "days": [
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "BM1",
   "device": "MOSAIC_P006",
   "days": [
    2,
    3,
    4,
    5,
    6
   ],
   "reason": "固定点：10-15 の一覧で基準局は MOSAIC_P006。BM1 の置き場所が見つからず置かない日は、この行を消す"
  },
  {
   "point": "FSL",
   "device": "SPR_P001",
   "days": [
    1,
    3,
    4,
    5,
    6
   ],
   "reason": "車両のばね上：位置の番号（VEHICLE_SPRESENSE の P01〜P04）と台の番号をそろえる"
  },
  {
   "point": "FSR",
   "device": "SPR_P002",
   "days": [
    1,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "RSL",
   "device": "SPR_P003",
   "days": [
    1,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "RSR",
   "device": "SPR_P004",
   "days": [
    1,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "FZL",
   "device": "UNSPR_P001",
   "days": [
    1,
    3,
    4,
    5,
    6
   ],
   "reason": "車両のばね下：位置の番号（P05〜P08）の順に UNSPR_P001〜P004"
  },
  {
   "point": "FZR",
   "device": "UNSPR_P002",
   "days": [
    1,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "RZL",
   "device": "UNSPR_P003",
   "days": [
    1,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "RZR",
   "device": "UNSPR_P004",
   "days": [
    1,
    3,
    4,
    5,
    6
   ],
   "reason": "同上"
  },
  {
   "point": "VM1",
   "device": "MOSAIC_P001",
   "days": [
    1,
    3,
    4,
    5,
    6
   ],
   "reason": "車載の MOSAIC：10-15 の一覧で車両は MOSAIC_P001"
  }
 ],
 "spares": [
  "ONO_P009",
  "ONO_P014"
 ],
 "bridge": {
  "x0": 0.3899999999999997,
  "span": 8.32,
  "length": 9.1,
  "girderY": [
   -1.8,
   -0.6,
   0.6,
   1.8
  ],
  "crossX": [
   0.0,
   1.3867,
   2.7733,
   4.16,
   5.5467,
   6.9333,
   8.32
  ],
  "jointX": [
   0.305,
   1.0,
   1.695,
   2.39,
   3.085,
   3.78,
   4.475,
   5.17,
   5.865,
   6.56,
   7.255,
   7.95
  ],
  "deckY": [
   -0.658,
   1.858
  ],
  "deckX": [
   -0.39,
   8.645
  ],
  "groundZ": -0.42200000000000004,
  "damage": {
   "x": 4.16,
   "between": "G3-G4"
  },
  "track": 1.29,
  "pathY": 0.6
 }
};
