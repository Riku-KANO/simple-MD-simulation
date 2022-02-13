/**
 *   @author: Riku-KANO
 *   @license: MIT
 *   @version: beta
*/


function __sign(__x, __y) {
    if(__y >= 0) return Math.abs(__x);
    else return -Math.abs(__x);
}

function initPositionPeriodic(positionArray, params){
    for(let i = 0; i < params.Nx; ++i) {
        for(let j = 0; j < params.Ny; ++j) {
            for(let k = 0; k < params.Nz; ++k) {
                positionArray[3 * k * params.Nx * params.Ny + 3 * j * params.Nx + 3 * i + 0] = params.a * i + params.a / 2;
                positionArray[3 * k * params.Nx * params.Ny + 3 * j * params.Nx + 3 * i + 1] = params.b * j + params.b / 2;
                positionArray[3 * k * params.Nx * params.Ny + 3 * j * params.Nx + 3 * i + 2] = params.c * k + params.c / 2;
            }
        }
    }
}

function initPositionRandom(positionArray, params){
    for(let i = 0; i < params.Nx; ++i) {
        for(let j = 0; j < params.Ny; ++j) {
            for(let k = 0; k < params.Nz; ++k) {
                positionArray[3 * k * params.Nx * params.Ny + 3 * j * params.Nx + 3 * i + 0] = params.a * params.Nx * Math.random();
                positionArray[3 * k * params.Nx * params.Ny + 3 * j * params.Nx + 3 * i + 1] = params.b * params.Ny * Math.random();
                positionArray[3 * k * params.Nx * params.Ny + 3 * j * params.Nx + 3 * i + 2] = params.c * params.Nz * Math.random();
            }
        }
    }
}

function initVelocity(velocityArray, params){
    for(let i = 0; i < params.Nx; ++i) {
        for(let j = 0; j < params.Ny; ++j) {
            for(let k = 0; k < params.Nz; ++k) {
                let R1 = Math.random();
                let R2 = Math.random();
                let R3 = Math.random();
                let R4 = Math.random();
                let R5 = Math.random();
                let R6 = Math.random();
                velocityArray[3 * k * params.Nx * params.Ny + 3 * j * params.Nx + 3 * i + 0] = Math.sqrt(-2*(params.T / params.m) * Math.log(R1)) * Math.cos(2 * Math.PI * R2);
                velocityArray[3 * k * params.Nx * params.Ny + 3 * j * params.Nx + 3 * i + 1] = Math.sqrt(-2*(params.T / params.m) * Math.log(R3)) * Math.cos(2 * Math.PI * R4);
                velocityArray[3 * k * params.Nx * params.Ny + 3 * j * params.Nx + 3 * i + 2] = Math.sqrt(-2*(params.T / params.m) * Math.log(R5)) * Math.cos(2 * Math.PI * R6);
            }
        }
    }
}

function update(positionArray, velocityArray, forceArray, forceArray2, params, data, positions, colors){
    let PE = calcPotentialEnergy(positionArray, forceArray, params);
    const Natom = params.Nx * params.Ny * params.Nz;
    let numConnected = 0;
    let vertexpos = 0;
    let colorpos = 0;

    for(let i = 0; i < Natom; ++i) {
        positionArray[3 * i + 0] += params.delta_t * (velocityArray[3 * i + 0] + forceArray[3 * i + 0] / 2);
        positionArray[3 * i + 1] += params.delta_t * (velocityArray[3 * i + 1] + forceArray[3 * i + 1] / 2);
        positionArray[3 * i + 2] += params.delta_t * (velocityArray[3 * i + 2] + forceArray[3 * i + 2] / 2);
        
        if(positionArray[3 * i + 0] <= 0) positionArray[3 * i + 0] += params.a * params.Nx;
        if(positionArray[3 * i + 0] >= params.a * params.Nx) positionArray[3 * i + 0] -= params.a * params.Nx;
        if(positionArray[3 * i + 1] <= 0) positionArray[3 * i + 1] += params.b * params.Ny;
        if(positionArray[3 * i + 1] >= params.b * params.Ny) positionArray[3 * i + 1] -= params.b * params.Ny;
        if(positionArray[3 * i + 2] <= 0) positionArray[3 * i + 2] += params.c * params.Nz;
        if(positionArray[3 * i + 2] >= params.c * params.Nz) positionArray[3 * i + 2] -= params.c * params.Nz;

        if(params.connected) {


            for ( let j = i + 1; j < Natom; j ++ ) {
                const dx = positionArray[ i * 3 ] - positionArray[ j * 3 ];
                const dy = positionArray[ i * 3 + 1 ] - positionArray[ j * 3 + 1 ];
                const dz = positionArray[ i * 3 + 2 ] - positionArray[ j * 3 + 2 ];
                const dist = Math.sqrt( dx * dx + dy * dy + dz * dz );

                if ( dist < params.rcut ) {
                    const alpha = 1.0 - dist / params.rcut / 1.1;

                    positions[ vertexpos ++ ] = positionArray[ i * 3 ];
                    positions[ vertexpos ++ ] = positionArray[ i * 3 + 1 ];
                    positions[ vertexpos ++ ] = positionArray[ i * 3 + 2 ];

                    positions[ vertexpos ++ ] = positionArray[ j * 3 ];
                    positions[ vertexpos ++ ] = positionArray[ j * 3 + 1 ];
                    positions[ vertexpos ++ ] = positionArray[ j * 3 + 2 ];

                    colors[ colorpos ++ ] = alpha;
                    colors[ colorpos ++ ] = alpha;
                    colors[ colorpos ++ ] = alpha;

                    colors[ colorpos ++ ] = alpha;
                    colors[ colorpos ++ ] = alpha;
                    colors[ colorpos ++ ] = alpha;

                    numConnected++;
                }
            }
        }
    }

    PE = calcPotentialEnergy(positionArray, forceArray2, params);

    let KE, w;

    for(let i = 0; i < Natom; ++i) {
        velocityArray[3 * i + 0] += params.delta_t * (forceArray[3 * i + 0] + forceArray2[3 * i + 0]) / 2;
        velocityArray[3 * i + 1] += params.delta_t * (forceArray[3 * i + 1] + forceArray2[3 * i + 1]) / 2;
        velocityArray[3 * i + 2] += params.delta_t * (forceArray[3 * i + 2] + forceArray2[3 * i + 2]) / 2;
    }
    KE = calcKineticEnergy(velocityArray, forceArray, params);
    w = calcForce(w, positionArray, forceArray2, params);
    let T = KE / Natom;
    const density = Natom / (params.a * params.Nx + params.b * params.Ny + params.c * params.Nz);
    let P = density * (2 * KE + 3/2 * w) / (3 * Natom);
    data.totT += T;
    data.totP += P;
    data.totKE += KE;
    data.totPE += PE;
    data.Nstep += 1;
    let result = {n: numConnected, T: T, P: P, KE: KE, PE: PE};
    return result;
}




function calcKineticEnergy(velocityArray, params){
    const Natom = params.Nx * params.Ny * params.Nz;
    let retKE = 0;
    for(let i = 0; i < Natom; ++i) {
        retKE += params.m * (velocityArray[3 + i + 0] ** 2 + velocityArray[3 + i + 1] ** 2 + velocityArray[3 * i + 2] ** 2) / 2;
    }
    return retKE;
}

function calcPotentialEnergy(positionArray, forceArray, params){

    const Natom = params.Nx * params.Ny * params.Nz;
    
    let PE = 0;

    const r2cut = params.rcut ** 2;
    for(let i = 0; i < Natom; ++i) {
        forceArray[3 * i + 0] = 0;
        forceArray[3 * i + 1] = 0;
        forceArray[3 * i + 2] = 0;
    }

    for(let i = 0; i < Natom - 1; ++i) {
        for(let j = i + 1; j < Natom; ++j) {
            let dx = positionArray[3 * i + 0] - positionArray[3 * j + 0];
            let dy = positionArray[3 * i + 1] - positionArray[3 * j + 1];
            let dz = positionArray[3 * i + 2] - positionArray[3 * j + 2];
            
            if(Math.abs(dx) > 0.5 * params.a * params.Nx) {
                dx = dx - __sign(params.a * params.Nx, dx);
            }
            if(Math.abs(dy) > 0.5 * params.b * params.Ny) {
                dy = dy - __sign(params.b * params.Ny, dy);
            }
            if(Math.abs(dz) > 0.5 * params.c * params.Nz) {
                dz = dz - __sign(params.c * params.Nz, dz);
            }

            let r2 = dx ** 2 + dy ** 2 + dz ** 2;

            if(r2 < r2cut) {
                if(r2 == 0) r2 = 1e-6;
                let invr2 = 1 / r2;

                let wij = 48 * (invr2 ** 3 - 0.5) * (invr2 ** 3);
                let fijx = wij * invr2 * dx;
                let fijy = wij * invr2 * dy;
                let fijz = wij * invr2 * dz;

                forceArray[3 * i + 0] += fijx;
                forceArray[3 * i + 1] += fijy;
                forceArray[3 * i + 2] += fijz;
                forceArray[3 * j + 0] -= fijx;
                forceArray[3 * j + 1] -= fijy;
                forceArray[3 * j + 2] -= fijz;

                PE += 4 * (invr2 ** 3) * ((invr2 ** 3) - 1);
            }
        }
    }
    return PE;
}

function calcForce(w, positionArray, forceArray, params) {
    
    const Natom = params.Nx * params.Ny * params.Nz;

    const r2cut = params.rcut ** 2;
    for(let i = 0; i < Natom; ++i) {
        forceArray[3 * i + 0] = 0;
        forceArray[3 * i + 1] = 0;
        forceArray[3 * i + 2] = 0;
    }

    for(let i = 0; i < Natom - 1; ++i) {
        for(let j = i + 1; j < Natom; ++j) {
            let dx = positionArray[3 * i + 0] - positionArray[3 * j + 0];
            let dy = positionArray[3 * i + 1] - positionArray[3 * j + 1];
            let dz = positionArray[3 * i + 2] - positionArray[3 * j + 2];
            
            if(Math.abs(dx) > 0.5 * params.a * params.Nx) {
                dx = dx - __sign(params.a * params.Nx, dx);
            }
            if(Math.abs(dy) > 0.5 * params.b * params.Ny) {
                dy = dy - __sign(params.b * params.Ny, dy);
            }
            if(Math.abs(dz) > 0.5 * params.c * params.Nz) {
                dz = dz - __sign(params.c * params.Nz, dz);
            }

            let r2 = dx ** 2 + dy ** 2 + dz ** 2;

            if(r2 < r2cut) {
                if(r2 == 0) r2 = 1e-6;
                let invr2 = 1 / r2;

                let wij = 48 * (invr2 ** 3 - 0.5) * (invr2 ** 3);
                let fijx = wij * invr2 * dx;
                let fijy = wij * invr2 * dy;
                let fijz = wij * invr2 * dz;

                forceArray[3 * i + 0] += fijx;
                forceArray[3 * i + 1] += fijy;
                forceArray[3 * i + 2] += fijz;
                forceArray[3 * j + 0] -= fijx;
                forceArray[3 * j + 1] -= fijy;
                forceArray[3 * j + 2] -= fijz;

                w += wij;
            }
        }
    }
    return w;
}


export {initPositionPeriodic, initPositionRandom, initVelocity, update, calcForce, calcPotentialEnergy, calcKineticEnergy};