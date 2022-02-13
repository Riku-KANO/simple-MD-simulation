/** 
 *   @author: Riku-KANO
 *   @license: MIT
 *   @version: beta
*/

import * as THREE from 'three';
import Stats from 'https://cdn.skypack.dev/three@0.137.5/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GUI } from 'https://cdn.skypack.dev/three@0.137.5/examples/jsm/libs/lil-gui.module.min.js';
import {initPositionPeriodic, initPositionRandom, initVelocity, calcKineticEnergy, calcForce, update, calcPotentialEnergy} from './md.js';

var isReady = false;
var isActive = false;
//var SCREEN_WIDTH = document.getElementById("container").clientWidth;
//var SCREEN_HEIGHT = document.getElementById("container").clientHeight;
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
console.log(SCREEN_WIDTH, SCREEN_HEIGHT);
let rotateCamera, cameraHelper;
let group;
let positions, velocities, forcesBefore, forcesAfter, colors, particles, particlePositions, pointCloud;
let linesMesh;

let camera, renderer, light, scene, container;
let config = {
    'rcut': 2,
    'Nx': 10,
    'Ny': 10, 
    'Nz': 10, 
    'a': 1, 
    'b': 1, 
    'c': 1, 
    'm': 1, 
    'T': 200, 
    'delta_t': 0.0002, 
    connected: true,
    showLines: true,
    showParticles: true,
    additiveBlending: true,
};
let Natom;
let data = {'Nstep': 0, 'totT': 0, 'totP': 0, 'totKE': 0, 'totPE': 0};
let arrT = [];
let arrP = [];
let arrKE = [];
let arrPE = [];
let arrE = [];
let avgT = [];
let avgP = [];
let avgKE = [];
let avgPE = [];
let avgE = [];
let stepArray = [0];

var stats = new Stats();
document.body.appendChild(stats.dom);

function initGUI() {

    const gui = new GUI();

    gui.add(config, 'a', 0.01, 5 );
    gui.add(config, 'b', 0.01, 5 );
    gui.add(config, 'c', 0.01, 5 );
    gui.add(config, 'Nx', 1, 12, 1);
    gui.add(config, 'Ny', 1, 12, 1);
    gui.add(config, 'Nz', 1, 12, 1);
    gui.add(config, 'rcut', 0.1, 10);
    gui.add(config, 'T', 1, 1000, 1);
    gui.add(config, 'm', 0.01, 10, 0.01);
    gui.add(config, 'delta_t', 0.0001, 0.01, 0.0001);
    gui.add(config, 'showParticles' ).onChange( function ( value ) {
					pointCloud.visible = value;
				} );
    gui.add(config, 'showLines' ).onChange( function ( value ) {
        linesMesh.visible = value;
    } );
    // gui.add(config, 'additiveBlending').onChange( function ( value ) {
    //     if(value) material.blending = THREE.AdditiveBlending;
    //     else material.blending = null;
    // } );
    
    //gui.add(config, '')
}

async function init() {
    Natom = config.Nx * config.Ny * config.Nz;
    arrT = [];
    arrP = [];
    arrKE = [];
    arrPE = [];
    arrE = [];
    avgT = [];
    avgP = [];
    avgKE = [];
    avgPE = [];
    avgE = [];
    container = document.getElementById("container");

    //scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    

    //camera
    camera = new THREE.PerspectiveCamera(60, SCREEN_WIDTH/ SCREEN_HEIGHT, 0.1, 500);

    camera.position.set(config.a * config.Nx * 1.4, config.b * config.Ny * 1.1, config.c * config.Nz * 1.5);    
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    // var axeshelper = new THREE.AxesHelper( 2000 );
    // scene.add( axeshelper );

    //render
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);  
    container.appendChild(renderer.domElement);
    renderer.autoClear = false;

    window.addEventListener( 'resize', onWindowResize );

    group = new THREE.Group();
    scene.add( group );

    let helperMesh = new THREE.Mesh( new THREE.BoxGeometry( config.a * config.Nx, config.b * config.Ny, config.c * config.Nz ));
    helperMesh.position.set( config.a * config.Nx / 2, config.b * config.Ny / 2, config.c * config.Nz / 2);
    let helper = new THREE.BoxHelper(helperMesh);
    helper.material.color.setHex( 0x101010 );
    // helper.material.blending = THREE.AdditiveBlending;
    helper.material.transparent = true;
    group.add(helper);

    positions = new Float32Array(Natom * Natom * 3);
    colors = new Float32Array(Natom * Natom * 3);

    const pMaterial = new THREE.PointsMaterial( {
        color: 0xFFFFFF,
        size: 6,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    } );

    particles = new THREE.BufferGeometry();
	particlePositions = new Float32Array(Natom * 3);
    velocities = new Float32Array(Natom * 3);
    forcesBefore = new Float32Array(Natom * 3);
    forcesAfter = new Float32Array(Natom * 3);
    
    initPositionPeriodic(particlePositions, config);

    particles.setDrawRange(0, Natom);
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));

    // particle cloud
    pointCloud = new THREE.Points(particles, pMaterial);
    group.add(pointCloud);

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));

    geometry.computeBoundingSphere();

    geometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial( {
        color: 0xdddddd,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
    } );

    linesMesh = new THREE.LineSegments(geometry, material);
    group.add(linesMesh);

    var controls = new OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(config.Nx * config.a / 2, config.Ny * config.b / 2, config.Nz * config.c / 2);
    initVelocity(velocities, config);

    let T = 0;
    let KE = 0;
    let PE = 0;
    let P = 0;
    let w = 0;
    let density = 1 / (config.a*config.b*config.c);
    for(let i = 0; i < Natom; ++i) {
        KE += config.m * (velocities[3 * i] ** 1 + velocities[3 * i + 1] ** 2 + velocities[3 * i + 2] ** 2) / 2;
    }
    T = KE / Natom;
    P = density * (2 * KE + 1.5 * w) / (3 * Natom);
    PE = calcPotentialEnergy(particlePositions, forcesAfter, config);
    arrT.push(T * 119);
    arrP.push(P * 2.382*1e-8);
    arrKE.push(KE/Natom);
    arrPE.push(PE/Natom);
    arrE.push((KE+PE)/2/Natom);
    return 'Initialization completed';
}

let Nstep = 0;

function animate() {
    Natom = config.Nx * config.Ny * config.Nz;
    Nstep++;
    requestAnimationFrame(animate);
    render();
    var res = update(particlePositions, velocities, forcesBefore, forcesAfter, config, data, positions, colors);

    linesMesh.geometry.setDrawRange(0, 2 * res.n);
    linesMesh.geometry.attributes.position.needsUpdate = true;
    linesMesh.geometry.attributes.color.needsUpdate = true;

    pointCloud.geometry.attributes.position.needsUpdate = true;

    arrT.push(res.T * 119);
    arrP.push(res.P * 2.382*1e-8);
    arrKE.push(res.KE/Natom);
    arrPE.push(res.PE/Natom);
    arrE.push((res.PE + res.KE)/Natom);
    avgT.push(data.totT/Nstep * 119);
    avgP.push(data.totP/Nstep*2.382*1e-8);
    avgKE.push(data.totKE/Nstep/Natom);
    avgPE.push(data.totPE/Nstep/Natom);
    avgE.push((data.PE + data.KE)/Nstep/Natom);

    stepArray.push(Nstep);
    if(arrT.length > 500) {
        arrT.shift();
        arrP.shift();
        arrKE.shift();
        arrPE.shift();
        arrE.shift();
        avgT.shift();
        avgP.shift();
        avgKE.shift();
        avgPE.shift();
        avgE.shift();
        stepArray.shift();
    }
    stats.update();
}


function render() {
    renderer.render(scene, camera);
}

function onWindowResize() {
    SCREEN_WIDTH = document.getElementById("container").clientWidth;
    SCREEN_HEIGHT = document.getElementById("container").clientHeight;
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
}

function main(){
    initGUI();
    document.querySelector('.start').addEventListener('click', () => {
        document.getElementsByClassName('start')[0].style.display = "none";
        window.addEventListener('resize', onWindowResize, false);
        init().then(value => {
            console.log(value);
            console.log('Animation start');
            animate();
         });
        console.log('start');
    })
}

main();