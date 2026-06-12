/* =====================================================================
   stl-viewer.js — lightweight Three.js 3D model viewer (ES module).
   Scans the page for `.cad[data-stl-url]` blocks (rendered by render.js
   or placed statically) and mounts an interactive viewer in each.

   Accepts web-friendly model formats exported from CAD tools:
     .stl  .glb  .gltf  .obj  .3mf
   (Native SolidWorks .SLDPRT/.SLDASM are proprietary — export to GLB for
   assemblies, or STL for single parts.)

   Viewers initialize lazily when scrolled into view. Exposes
   window.mountCadViewers() so render.js can call it after injecting markup.
   ===================================================================== */
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// A bright, uniform environment so metallic surfaces reflect light from
// EVERY direction (not just the top). Built from a light vertical gradient
// and pre-filtered with PMREM. This is what actually makes metal parts
// read as bright gray on all sides.
function brightEnvironment(renderer) {
    var c = document.createElement('canvas');
    c.width = 16; c.height = 128;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0.0, '#ffffff');
    g.addColorStop(0.5, '#f1efe9');
    g.addColorStop(1.0, '#d9d5cc');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 128);
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    var pmrem = new THREE.PMREMGenerator(renderer);
    var env = pmrem.fromEquirectangular(tex).texture;
    tex.dispose();
    pmrem.dispose();
    return env;
}

// glTF/GLB exports (incl. SolidWorks) may use Draco or meshopt mesh
// compression — wire up both decoders so those files load.
function makeGltfLoader() {
    var loader = new GLTFLoader();
    var draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(draco);
    loader.setMeshoptDecoder(MeshoptDecoder);
    return loader;
}

var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function mountCadViewers() {
    var nodes = document.querySelectorAll('.cad[data-stl-url]:not([data-cad-init])');
    nodes.forEach(function (el) {
        el.setAttribute('data-cad-init', '1');
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) { io.disconnect(); new Viewer(el); }
                });
            }, { rootMargin: '200px' });
            io.observe(el);
        } else {
            new Viewer(el);
        }
    });
}

function Viewer(root) {
    var url = root.getAttribute('data-stl-url');
    var ext = (url.split('?')[0].split('#')[0].split('.').pop() || '').toLowerCase();
    var stage = root.querySelector('.cad-stage');
    var overlay = root.querySelector('.cad-overlay');
    if (!stage) { return; }

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f2ee); // matches the site's light base

    var camera = new THREE.PerspectiveCamera(45, aspect(), 0.1, 5000);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .8;
    stage.appendChild(renderer.domElement);

    // Bright all-around environment so metallic faces reflect light on every
    // side (without this, metalness≈1 parts go black except up top).
    scene.environment = brightEnvironment(renderer);

    // Bright wrap-around lighting so every face is lit from all sides.
    // Ambient + hemisphere lift the shadows; directional lights surround
    // the model on every axis (top/bottom/front/back/L/R).
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcfcabf, 1.2));
    [
        [1.0, 1.5, 1.2, 1.6],   // key — top front-right
        [-1.5, 0.6, -1.0, 1.2], // back-left
        [1.4, -0.6, -1.2, 1.0], // lower right / behind
        [-1.0, -1.4, 0.6, 0.9], // underside fill
        [-0.4, 0.8, 1.6, 1.1],  // front fill
        [0.2, 1.2, -1.6, 0.9],  // rim / back
        [1.6, 0.2, 0.0, 0.8],   // right side
        [-1.6, 0.2, 0.0, 0.8]   // left side
    ].forEach(function (d) {
        var l = new THREE.DirectionalLight(0xffffff, d[3]);
        l.position.set(d[0], d[1], d[2]);
        scene.add(l);
    });
    // headlight that follows the camera so the face you're looking at is
    // always lit — gives even, bright coverage through a full 360° orbit
    var headlight = new THREE.DirectionalLight(0xffffff, 0.7);
    scene.add(headlight);

    var controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 1.6;

    var root3d = null;
    var grid = null;
    var wire = false;
    var homeTarget = new THREE.Vector3();
    var homePos = new THREE.Vector3();
    var running = false;

    var material = new THREE.MeshStandardMaterial({
        color: 0x6f747c, metalness: 0.12, roughness: 0.5
    });

    load();

    function load() {
        try {
            if (ext === 'stl') {
                new STLLoader().load(url, function (geo) {
                    geo.computeVertexNormals();
                    finalize(new THREE.Mesh(geo, material));
                }, null, onError);
            } else if (ext === 'obj') {
                new OBJLoader().load(url, function (obj) {
                    obj.traverse(function (o) { if (o.isMesh) { o.material = material; } });
                    finalize(obj);
                }, null, onError);
            } else if (ext === 'glb' || ext === 'gltf') {
                makeGltfLoader().load(url, function (g) { finalize(g.scene); }, null, onError);
            } else if (ext === '3mf') {
                new ThreeMFLoader().load(url, function (obj) { finalize(obj); }, null, onError);
            } else {
                onError(new Error('Unsupported format: .' + ext));
            }
        } catch (e) { onError(e); }
    }

    function finalize(object) {
        root3d = object;
        scene.add(object);

        // Normalize imported CAD materials so every face lights up:
        //  - cap metalness so the surround lights also illuminate (pure
        //    metal ignores diffuse light and looks dark on the sides)
        //  - keep some roughness so it's matte machined-metal, not a mirror
        //  - double-sided in case any exported faces have flipped normals
        //  - ensure normals exist for correct shading
        object.traverse(function (o) {
            if (!o.isMesh) { return; }
            if (o.geometry && !o.geometry.attributes.normal) { o.geometry.computeVertexNormals(); }
            var mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(function (m) {
                if (!m) { return; }
                if ('metalness' in m && m.metalness > 0.6) { m.metalness = 0.6; }
                if ('roughness' in m) { m.roughness = Math.max(m.roughness == null ? 0.5 : m.roughness, 0.45); }
                if ('envMapIntensity' in m) { m.envMapIntensity = 1.8; }
                m.side = THREE.DoubleSide;
                m.needsUpdate = true;
            });
        });

        var box = new THREE.Box3().setFromObject(object);
        var center = box.getCenter(new THREE.Vector3());
        var size = box.getSize(new THREE.Vector3());
        object.position.sub(center); // recenter at origin
        var radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;

        grid = new THREE.GridHelper(radius * 6, 24, 0xc9c4b8, 0xdedacf);
        grid.position.y = -size.y * 0.5 - radius * 0.05;
        scene.add(grid);

        var dist = radius / Math.sin((camera.fov * Math.PI) / 180 / 2) * 1.25;
        homePos.set(dist * 0.8, dist * 0.55, dist * 0.9);
        camera.position.copy(homePos);
        controls.target.copy(homeTarget);
        camera.near = dist / 100;
        camera.far = dist * 100;
        camera.updateProjectionMatrix();
        controls.update();

        if (overlay) { overlay.classList.add('hidden'); }
        start();
    }

    function onError(err) {
        // Surface the real reason in the console for diagnosis.
        console.error('[cad] failed to load', url, err);
        if (overlay) {
            overlay.classList.remove('hidden');
            var msg = (err && /unsupported/i.test(err.message || ''))
                ? 'Unsupported file type. Use STL, GLB, glTF, OBJ or 3MF.'
                : 'Couldn’t load the 3D model.';
            overlay.innerHTML = '<span>' + msg + '</span>';
        }
    }

    function setWire(on) {
        wire = on;
        if (!root3d) { return; }
        root3d.traverse(function (o) {
            if (!o.isMesh) { return; }
            var mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(function (m) { if (m) { m.wireframe = on; } });
        });
        render();
    }

    function render() {
        headlight.position.copy(camera.position); // shine from the viewer
        renderer.render(scene, camera);
    }
    function tick() { if (!running) { return; } controls.update(); render(); requestAnimationFrame(tick); }
    function start() { if (!running) { running = true; tick(); } }
    function stop() { running = false; }

    function aspect() { return Math.max(stage.clientWidth, 1) / Math.max(stage.clientHeight, 1); }
    function resize() {
        renderer.setSize(stage.clientWidth, stage.clientHeight);
        camera.aspect = aspect();
        camera.updateProjectionMatrix();
        render();
    }
    if ('ResizeObserver' in window) { new ResizeObserver(resize).observe(stage); }
    window.addEventListener('resize', resize);
    document.addEventListener('fullscreenchange', function () { setTimeout(resize, 60); });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!root3d) { return; }
                if (e.isIntersecting) { start(); } else { stop(); }
            });
        }, { threshold: 0.01 }).observe(root);
    }

    root.querySelectorAll('[data-cad]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var action = btn.getAttribute('data-cad');
            if (action === 'rotate') {
                controls.autoRotate = !controls.autoRotate;
                btn.classList.toggle('active', controls.autoRotate);
                btn.setAttribute('aria-pressed', String(controls.autoRotate));
            } else if (action === 'wire') {
                setWire(!wire);
                btn.classList.toggle('active', wire);
            } else if (action === 'reset') {
                camera.position.copy(homePos);
                controls.target.copy(homeTarget);
                controls.update();
                render();
            } else if (action === 'full') {
                if (!document.fullscreenElement) {
                    if (root.requestFullscreen) { root.requestFullscreen(); }
                } else if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });
    });
    var rotBtn = root.querySelector('[data-cad="rotate"]');
    if (rotBtn) { rotBtn.classList.toggle('active', controls.autoRotate); }
}

window.mountCadViewers = mountCadViewers;
document.addEventListener('DOMContentLoaded', mountCadViewers);
