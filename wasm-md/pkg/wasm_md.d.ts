/* tslint:disable */
/* eslint-disable */
/**
*/
export class MolecularDynamics {
  free(): void;
/**
* @param {number} nx
* @param {number} ny
* @param {number} nz
* @param {number} a
* @param {number} b
* @param {number} c
* @param {number} m
* @param {number} temp
* @param {number} delta_t
* @param {number} rcut
* @param {boolean} is_connected
* @returns {MolecularDynamics}
*/
  static new(nx: number, ny: number, nz: number, a: number, b: number, c: number, m: number, temp: number, delta_t: number, rcut: number, is_connected: boolean): MolecularDynamics;
/**
* @returns {number}
*/
  width(): number;
/**
* @returns {number}
*/
  height(): number;
/**
* @returns {number}
*/
  depth(): number;
/**
* @returns {number}
*/
  natom(): number;
/**
* @returns {number}
*/
  num_connected(): number;
/**
* @returns {number}
*/
  positions(): number;
/**
* @returns {number}
*/
  velocities(): number;
/**
* @returns {number}
*/
  forces_before(): number;
/**
* @returns {number}
*/
  forces_after(): number;
/**
* @returns {number}
*/
  line_positions(): number;
/**
* @returns {number}
*/
  line_colors(): number;
/**
*/
  update(): void;
/**
*/
  init_positions_periodic(): void;
/**
*
*     * ボックスミュラー法による速度の初期化
*     
*/
  init_velocities(): void;
}
