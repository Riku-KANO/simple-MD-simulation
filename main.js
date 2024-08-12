/** 
 *   @author: Riku-KANO
 *   @license: MIT
 *   @version: beta
*/

import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { initPositionPeriodic, initPositionRandom, initVelocity, calcKineticEnergy, calcForce, update, calcPotentialEnergy } from './md.js';
import { MolecularDynamics } from 'wasm-md/wasm_md.js';
import { memory } from 'wasm-md/wasm_md_bg.wasm';
var isReady = false;
var isActive = false;

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

let group;

// particle data
let velocities, forcesBefore, forcesAfter, particles, particlePositions, pointCloud;

// line data
let linesMesh, positions, colors;
let camera, renderer, scene, container;

let md = null;

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
    'delta_t': 0.00002,
    connected: true,
    showLines: true,
    showParticles: true,
    additiveBlending: true,
};
let Natom;
let stepArray = [0];

// append stats dom
var stats = new Stats();
document.body.appendChild(stats.dom);

function initGUI() {

    const gui = new GUI();

    gui.add(config, 'a', 0.01, 5);
    gui.add(config, 'b', 0.01, 5);
    gui.add(config, 'c', 0.01, 5);
    gui.add(config, 'Nx', 1, 12, 1);
    gui.add(config, 'Ny', 1, 12, 1);
    gui.add(config, 'Nz', 1, 12, 1);
    gui.add(config, 'rcut', 0.1, 10);
    gui.add(config, 'T', 1, 1000, 1);
    gui.add(config, 'm', 0.01, 10, 0.01);
    gui.add(config, 'delta_t', 0.00001, 0.01, 0.00001);
    gui.add(config, 'showParticles').onChange(function (value) {
        pointCloud.visible = value;
    });
    gui.add(config, 'showLines').onChange(function (value) {
        linesMesh.visible = value;
    });
    // gui.add(config, 'additiveBlending').onChange( function ( value ) {
    //     if(value) material.blending = THREE.AdditiveBlending;
    //     else material.blending = null;
    // } );
}

async function init() {
    Natom = config.Nx * config.Ny * config.Nz;

    container = document.getElementById("container");

    //scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    md = MolecularDynamics.new(
        config.Nx, 
        config.Ny, 
        config.Nz, 
        config.a, 
        config.b, 
        config.c, 
        config.m, 
        config.T, 
        config.delta_t, 
        config.rcut, 
        config.showLines
    );
    md.init_positions_periodic();
    // init velocity
    md.init_velocities();

    //camera
    camera = new THREE.PerspectiveCamera(50, SCREEN_WIDTH / SCREEN_HEIGHT, 0.1, 500);
    camera.position.set(config.a * config.Nx * 1.4, config.b * config.Ny * 1.1, config.c * config.Nz * 1.5);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    //render
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container.appendChild(renderer.domElement);
    renderer.autoClear = false;

    //addEventListner
    window.addEventListener('resize', onWindowResize);

    //particle groups
    group = new THREE.Group();
    scene.add(group);

    // boxhelper
    let helperMesh = new THREE.Mesh(new THREE.BoxGeometry(config.a * config.Nx, config.b * config.Ny, config.c * config.Nz));
    helperMesh.position.set(config.a * config.Nx / 2, config.b * config.Ny / 2, config.c * config.Nz / 2);
    let helper = new THREE.BoxHelper(helperMesh);
    helper.material.color.setHex(0x444444);
    helper.material.blending = THREE.AdditiveBlending;
    helper.material.transparent = true;
    group.add(helper);

    // line data
    const linePositionsPtr = md.line_positions();
    const lineColorsPtr = md.line_colors();

    positions = new Float32Array(memory.buffer, linePositionsPtr, Natom * Natom * 3);
    colors = new Float32Array(memory.buffer, lineColorsPtr, Natom * Natom * 3);

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));

    geometry.computeBoundingSphere();

    geometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial({
        color: 0xdddddd,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
    });

    linesMesh = new THREE.LineSegments(geometry, material);
    group.add(linesMesh);
    // particle material
    const pMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 5,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    });

    const positionsPtr = md.positions();
    const velocitiesPtr = md.velocities();
    const forcesBeforePtr = md.forces_before();
    const forcesAfterPtr = md.forces_after();
    const natom = md.natom();


    particles = new THREE.BufferGeometry();
    particlePositions = new Float32Array(memory.buffer, positionsPtr, natom * 3);
    velocities = new Float32Array(memory.buffer, velocitiesPtr, natom * 3);
    forcesBefore = new Float32Array(memory.buffer, forcesBeforePtr, natom * 3);
    forcesAfter = new Float32Array(memory.buffer, forcesAfterPtr, natom * 3);

    particles.setDrawRange(0, Natom);
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));


    // particle cloud
    pointCloud = new THREE.Points(particles, pMaterial);
    group.add(pointCloud);

    // orbit control
    var controls = new OrbitControls(camera, renderer.domElement);
    controls.target = new THREE.Vector3(config.Nx * config.a / 2, config.Ny * config.b / 2, config.Nz * config.c / 2);

    console.log(velocities);

    return 'Initialization completed';
}


function animate() {
    Natom = config.Nx * config.Ny * config.Nz;
    requestAnimationFrame(animate);
    render();
    md.update();
    linesMesh.geometry.setDrawRange(0, 2 * md.num_connected());
    linesMesh.geometry.attributes.position.needsUpdate = true;
    linesMesh.geometry.attributes.color.needsUpdate = true;

    pointCloud.geometry.attributes.position.needsUpdate = true;

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

function main() {
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