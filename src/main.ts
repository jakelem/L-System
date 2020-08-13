import {vec3, vec4, mat4, mat3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Mesh from './geometry/Mesh';
import LSystem from './geometry/LSystem';
import Foliage from './geometry/Foliage';

import Orchids from './geometry/Orchids';
import ParticleMeshes from './geometry/ParticleMeshes';

var OBJ = require('webgl-obj-loader') ;

//import Tree from './geometry/Tree';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  iterations: 5,
  'Radius': 0.75,
  'Height': 0.65,
  'Rotational Noise': 20,
  'Length Decay': 0.1,
  'Radial Decay': 1.2,
  'Angle': 5,
  'Offset': -0.01,
  'Leaf Size': 1.2,

  'Smooth Shading' : true,
  'Load Scene': loadScene,
  
  'Export OBJ': saveFile, // A function pointer, essentially
  // A function pointer, essentially
};

let icosphere: Icosphere;
let square: Square;
let m_mesh: Mesh;
let l_system: Foliage;
let background_meshes : ParticleMeshes;
let m_background_mesh : Mesh;
let xSubs = 5;
let ySubs = 3;
let zSubs = 3;
let loadedBackground = false;

function downloadBackgroundMesh() {
  OBJ.downloadMeshes({
    'orchid': './geo/orchid.obj',
  }, (meshes: any) => {
    m_background_mesh = new Mesh('./geo/orchid.obj');
    m_background_mesh.loadMesh(meshes.orchid);
    background_meshes.m_particle = m_background_mesh;
    background_meshes.loadParticleMeshes();
  });
}


function loadScene() {
  background_meshes = new ParticleMeshes('');
  background_meshes.spread = 5;
  background_meshes.m_particle_size = 0.4;
  background_meshes.system_center = vec3.fromValues(10,0,0);

  downloadBackgroundMesh();
  l_system = new Foliage();
  l_system.iterations = controls.iterations;
  l_system.radius = controls["Radius"];
  l_system.orientRand = controls["Rotational Noise"];
  l_system.decay = controls["Radial Decay"] * 0.1;
  l_system.stepDecay = controls["Length Decay"] * 0.1;
  l_system.offset = controls["Offset"] * 0.1;
  l_system.curvature = controls["Angle"];
  l_system.height = controls["Height"];
  l_system.smoothshading = controls["Smooth Shading"];
  l_system.leaf_size = controls["Leaf Size"]
  l_system.refreshSystem();
  //console.log("SETNECE " + l_system.expandedSentence);

  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  //icosphere.create();
  m_mesh = new Mesh('/geo/feather.obj',vec3.fromValues(0, 1, 0), vec3.fromValues(1, 1, 1), vec3.fromValues(98, 0, 0));
  //m_mesh.create();
  //m_mesh.center = vec4.fromValues(0, 1, 2, 1);
  square = new Square(vec3.fromValues(0, 0, 0));

  square.create();
}

function saveFile() {
  let FileSaver = require('file-saver');
  var blob = new Blob([l_system.fullMesh.exportObj()], {type: "text/plain;charset=utf-8"});
  FileSaver.saveAs(blob, "objExport.obj");  
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  //gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'iterations', 1, 8).step(1);
  gui.add(controls, 'Rotational Noise', 0, 40).step(1);
  gui.add(controls, 'Radial Decay', -1, 5).step(0.01);
  gui.add(controls, 'Length Decay', -0.2, 2).step(0.01);
  gui.add(controls, 'Angle', 0, 20).step(0.01);
  gui.add(controls, 'Radius', 0.1, 2).step(0.01);
  gui.add(controls, 'Height', 0.1, 4).step(0.01);
  gui.add(controls, 'Leaf Size', 0.0, 5).step(0.01);

  //gui.add(controls, 'Offset', -10, 10).step(0.01);
  gui.add(controls, 'Smooth Shading');
  gui.add(controls, 'Load Scene');
  gui.add(controls, 'Export OBJ');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 20, 50), vec3.fromValues(0, 20, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(225/255, 240/255, 246/255, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);
  lambert.createTexture();


  const planet = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/planet-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/planet-frag.glsl')),
  ]);

  const background = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/static-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/static-frag.glsl')),
  ]);

  let time = 0.0;
  // This function will be called every frame
  function tick() {

    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, background, [
      square,
    ]);
    renderer.render(camera, lambert, [
      //icosphere,
      m_mesh,
    ]);

    time += 1;
    background.setTime(time);



    // for(let mesh of l_system.meshes) {
    //   renderer.render(camera, planet, [
    //     mesh,
    //   ]
    // );}

    renderer.render(camera, lambert, [
      //icosphere,
      l_system.fullMesh,
    ]);

    let ts = 0.01;
    /*
    background_meshes.advanceParticles();

    
    for(let i = 0; i < background_meshes.particles.length; i++) {
      let mesh : Mesh = background_meshes.particles[i];
      let model = mesh.getModelMatrix();
      renderer.render(camera, planet, [
        mesh,
      ],model);
    }*/
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
