# simple-MD-simulation
 レナード・ジョーンズポテンシャルを相互作用とした速度ベルレ法によるシンプルなMDシミュレーション。JavaSciptライブラリ[Three.js](https://github.com/mrdoob/three.js)によってブラウザ上で分子シミュレーションをリアルタイムに3Dレンダリングします。
 
## Demo
以下のリンクからデモを見ることができます。(WebGLがサポートされているブラウザにのみ対応。PC環境で確認してください。)  
[Demo on my github page](https://riku-kano.github.io/simple-MD-simulation)

![demo img](https://github.com/Riku-KANO/simple-MD-simulation/blob/main/asset/demo_shot.png)

## 原理
### 速度ベルレ法
以下の式に従って粒子に働く力、位置、速度を更新します。
$$x_{n+1} = x_n +v_n dt +F(x_n,t_n)\  dt^2/2M$$
$$ v_{n+1} = v_n+  (\ F(x_n, t_n) + F(x_{n+1}, t_{n+1})\ )dt /2M $$
### ボックスミュラー法
under construction

## 使い方
1. 右上のGUIで初期値を決定。 
- `a` 格子定数a
- `b` 格子定数b
- `c` 格子定数c
- `Nx` x軸方向の粒子の数
- `Ny` y軸方向の粒子の数
- `Nz` z軸方向の粒子の数 
- `rcut` カットオフ半径。粒子間距離がこの半径以内であれば相互作用が働く。
- `T` 初期温度
- `m` 粒子の質量
- `delta_t` ステップ間の時間。
- `showParticles` 粒子を表示するかしないか。
- `showLines` 粒子間の線を描写するかしないか。
2. 中央のSTARTボタンを押す。開始してからは初期パラメーターは変更しないでください。
## バージョン
### β版 (2022/02/13)　リリース
### 修正β版(2022/02/14)
コードの一部を修正してシンプレクティク性の問題を解消。

## 参考
under construction
