use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct MolecularDynamics {
    natom: usize,
    a: f32,
    b: f32,
    c: f32,
    width: f32,
    height: f32,
    depth: f32,
    m: f32,
    delta_t: f32,
    rcut: f32,
    positions: Vec<f32>,
    velocities: Vec<f32>,
    forces_before: Vec<f32>,
    forces_after: Vec<f32>,
    is_connected: bool,
    line_positions: Vec<f32>,
    line_colors: Vec<f32>,
    num_connected: usize,
}

#[wasm_bindgen]
impl MolecularDynamics {
    pub fn new(nx: usize, ny: usize, nz: usize, a: f32, b: f32, c: f32, m: f32, delta_t: f32, rcut: f32, is_connected: bool) -> Self {
        let natom = nx * ny * nz;
        let positions = vec![0.0f32; 3 * natom];
        let velocities = vec![0.0f32; 3 * natom];
        let forces_before = vec![0.0f32; 3 * natom];
        let forces_after = vec![0.0f32; 3 * natom];
        let line_positions = vec![0.0f32; 3 * natom * natom];
        let line_colors = vec![0.0f32; 3 * natom * natom];
        let width = a * nx as f32;
        let height = b * ny as f32;
        let depth = c * nz as f32;

        Self {
            natom,
            a,
            b,
            c,
            width,
            height,
            depth,
            rcut,
            m,
            delta_t,
            positions,
            velocities,
            forces_before,
            forces_after,
            is_connected,
            line_positions,
            line_colors,
            num_connected: 0,
        }
    }

    pub fn width(&self) -> f32 {
        self.width
    }

    pub fn height(&self) -> f32 {
        self.height
    }

    pub fn depth(&self) -> f32 {
        self.depth
    }

    pub fn positions(&self) -> *const f32 {
        self.positions.as_ptr()
    }

    pub fn velocities(&self) -> *const f32 {
        self.velocities.as_ptr()
    }

    pub fn forces_before(&self) -> *const f32 {
        self.forces_before.as_ptr()
    }

    pub fn forces_after(&self) -> *const f32 {
        self.forces_after.as_ptr()
    }

    pub fn line_positions(&self) -> *const f32 {
        self.line_positions.as_ptr()
    }

    pub fn line_colors(&self) -> *const f32 {
        self.line_colors.as_ptr()
    }

    pub fn update(&mut self) {
        self.calc_potential_energy(true);
        self.num_connected = 0;
        let mut vertex_pos_index = 0;
        let mut color_index = 0;

        for i in 0..self.natom {
            self.positions[3 * i] += self.delta_t * (self.velocities[3 * i] + 0.5 * self.forces_before[3 * i] * self.delta_t / self.m);
            self.positions[3 * i + 1] += self.delta_t * (self.velocities[3 * i + 1] + 0.5 * self.forces_before[3 * i + 1] * self.delta_t / self.m);
            self.positions[3 * i + 2] += self.delta_t * (self.velocities[3 * i + 2] + 0.5 * self.forces_before[3 * i + 2] * self.delta_t / self.m);

            if self.positions[3 * i] < 0.0 {
                self.positions[3 * i] += self.width;
            }
            if self.positions[3 * i] >= self.width {
                self.positions[3 * i] -= self.width;
            }
            if self.positions[3 * i + 1] < 0.0 {
                self.positions[3 * i + 1] += self.height;
            }
            if self.positions[3 * i + 1] >= self.height {
                self.positions[3 * i + 1] -= self.height;
            }
            if self.positions[3 * i + 2] < 0.0 {
                self.positions[3 * i + 2] += self.depth;
            }
            if self.positions[3 * i + 2] >= self.depth {
                self.positions[3 * i + 2] -= self.depth;
            }

            if self.is_connected {
                for j in (i + 1)..self.natom {
                    let dx = self.positions[3 * i] - self.positions[3 * j];
                    let dy = self.positions[3 * i + 1] - self.positions[3 * j + 1];
                    let dz = self.positions[3 * i + 2] - self.positions[3 * j + 2];
                    let dist = (dx * dx + dy * dy + dz * dz).sqrt();

                    if dist < self.rcut {
                        let alpha = 1.0 - dist / self.rcut / 1.1;
                        self.line_positions[vertex_pos_index] = self.positions[3 * i];
                        self.line_positions[vertex_pos_index + 1] = self.positions[3 * i + 1];
                        self.line_positions[vertex_pos_index + 2] = self.positions[3 * i + 2];
                        self.line_positions[vertex_pos_index + 3] = self.positions[3 * j];
                        self.line_positions[vertex_pos_index + 4] = self.positions[3 * j + 1];
                        self.line_positions[vertex_pos_index + 5] = self.positions[3 * j + 2];
                        self.line_colors[color_index] = alpha;
                        self.line_colors[color_index + 1] = alpha;
                        self.line_colors[color_index + 2] = alpha;
                        self.line_colors[color_index + 3] = alpha;
                        self.line_colors[color_index + 4] = alpha;
                        self.line_colors[color_index + 5] = alpha;
                        vertex_pos_index += 6;
                        color_index += 6;
                        self.num_connected += 1;
                    }
                }
            }
        }

        self.calc_potential_energy(false);

        for i in 0..self.natom {
            self.velocities[3 * i] += 0.5 * self.delta_t / self.m * (self.forces_before[3 * i] + self.forces_after[3 * i]);
            self.velocities[3 * i + 1] += 0.5 * self.delta_t / self.m * (self.forces_before[3 * i + 1] + self.forces_after[3 * i + 1]);
            self.velocities[3 * i + 2] += 0.5 * self.delta_t / self.m * (self.forces_before[3 * i + 2] + self.forces_after[3 * i + 2]);
        }

        // let pe = self.calc_potential_energy(false);
        // let ke = self.calc_kinetic_energy();
        self.calc_force(false);

        // let temp = ke / self.natom as f32;
        // let density = self.natom as f32 / (self.width * self.height * self.depth);
        // let p = density * (2.0f32 * ke + 1.5 * w) / (3.0f32 * self.natom as f32);

    }

    #[allow(dead_code)]
    fn calc_kinetic_energy(&self) -> f32 {
        let mut ke = 0.0f32;

        for vel in self.velocities.chunks_exact(3) {
            ke += vel[0] * vel[0];
            ke += vel[1] * vel[1];
            ke += vel[2] * vel[2];
        }

        ke * 0.5 * self.m
    }

    fn calc_potential_energy(&mut self, is_pre_force: bool) -> f32 {
        let mut pe = 0.0f32;
        let r2cut = self.rcut * self.rcut;

        for i in 0..self.natom {
            for j in (i+1)..self.natom {
                let dx: f32 = self.positions[3 * i] - self.positions[3 * j];
                let dy: f32 = self.positions[3 * i + 1] - self.positions[3 * j + 1];
                let dz: f32 = self.positions[3 * i + 2] - self.positions[3 * j + 2];

                let r2: f32 = dx * dx + dy * dy + dz * dz;

                if r2 < r2cut {
                    let r2_inv = r2.recip();
                    let r6_inv = r2_inv * r2_inv * r2_inv;
                    
                    let wij = 48.0f32 * (r6_inv - 0.5) * r6_inv;
                    let fijx = wij * r2_inv * dx;
                    let fijy = wij * r2_inv * dy;
                    let fijz = wij * r2_inv * dz;

                    if is_pre_force {
                        self.forces_before[3 * i] += fijx;
                        self.forces_before[3 * i + 1] += fijy;
                        self.forces_before[3 * i + 2] += fijz;
                        self.forces_before[3 * j] -= fijx;
                        self.forces_before[3 * j + 1] -= fijy;
                        self.forces_before[3 * j + 2] -= fijz;
                    } else {
                        self.forces_after[3 * i] += fijx;
                        self.forces_after[3 * i + 1] += fijy;
                        self.forces_after[3 * i + 2] += fijz;
                        self.forces_after[3 * j] -= fijx;
                        self.forces_after[3 * j + 1] -= fijy;
                        self.forces_after[3 * j + 2] -= fijz;
                    }

                    pe += 4.0f32 * r6_inv * (r6_inv - 1.0);
                }
            }
        }

        pe
    } 


    fn calc_force(&mut self, is_pre_force: bool) -> f32 {
        let r2cut = self.rcut * self.rcut;
        let mut w = 0.0f32;

        if is_pre_force {
            self.forces_before.fill(0.0f32);
        } else {
            self.forces_after.fill(0.0f32);
        }

        for i in 0..self.natom {
            for j in (i + 1)..self.natom {
                let mut dx: f32 = self.positions[3 * i] - self.positions[3 * j];
                let mut dy: f32 = self.positions[3 * i + 1] - self.positions[3 * j + 1];
                let mut dz: f32 = self.positions[3 * i + 2] - self.positions[3 * j + 2];

                if dx.abs() > 0.5 * self.width {
                    dx -= self.a * dx.signum();
                }
                if dy.abs() > 0.5 * self.height {
                    dy -= self.b * dy.signum();
                }
                if dz.abs() > 0.5 * self.depth {
                    dz -= self.c * dz.signum();
                }

                let mut r2: f32 = dx * dx + dy * dy + dz * dz;

                if r2 < 1.0e-6 {
                    r2 = 1.0e-6;
                }

                if r2 < r2cut {
                    
                    let r2_inv = r2.recip();
                    let r6_inv = r2_inv * r2_inv * r2_inv;
                    
                    let wij = 48.0f32 * (r6_inv - 0.5) * r6_inv;
                    let fijx = wij * r2_inv * dx;
                    let fijy = wij * r2_inv * dy;
                    let fijz = wij * r2_inv * dz;

                    if is_pre_force {
                        self.forces_before[3 * i] += fijx;
                        self.forces_before[3 * i + 1] += fijy;
                        self.forces_before[3 * i + 2] += fijz;
                        self.forces_before[3 * j] -= fijx;
                        self.forces_before[3 * j + 1] -= fijy;
                        self.forces_before[3 * j + 2] -= fijz;
                    } else {
                        self.forces_after[3 * i] += fijx;
                        self.forces_after[3 * i + 1] += fijy;
                        self.forces_after[3 * i + 2] += fijz;
                        self.forces_after[3 * j] -= fijx;
                        self.forces_after[3 * j + 1] -= fijy;
                        self.forces_after[3 * j + 2] -= fijz;
                    }

                    w += wij;
                }
            }
        }

        w
    }
}
