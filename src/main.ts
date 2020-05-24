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
import Orchids from './geometry/Orchids';
// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  iterations: 4,
  'Radius': 0.3,
  'Height': 0.3,
  'Rotational Noise': 20,
  'Length Decay': 0.3,
  'Radial Decay': 1.6,
  'Angle': 5,
  'Offset': -0.01,
  'Load Scene': loadScene, // A function pointer, essentially
};

let icosphere: Icosphere;
let square: Square;
let m_mesh: Mesh;
let l_system: Orchids;
let background_meshes : Array<Mesh>;

let orchid : Orchids;
function loadObjs() {
}

function changeIterations(i : number) {
  l_system = new Orchids();
  l_system.iterations = i;

}


let xSubs = 5;
let ySubs = 3;
let zSubs = 3;

function loadScene() {
  background_meshes = new Array<Mesh>();

  for(let x = 0; x < xSubs; x++) {
    for(let y = 0; y < ySubs; y++) {
      for(let z = 0; z < zSubs; z++) {
      let mesh = new Mesh('/geo/orchid.obj', vec3.fromValues(0,0,0), vec3.fromValues(0.3,0.3,0.3), 
      vec3.fromValues(0,0,0), vec4.fromValues(1,1,1,1))
      let randX = (x + Math.random()) * 2;
      let randY = (y + Math.random()) * 2;
      let randZ = (z + Math.random() - zSubs / 2) * 2;
      mesh.m_pos = vec3.fromValues(-randX,randY,randZ);
      mesh.m_vel = vec3.fromValues(1.5,0,0);
      mesh.m_angle = Math.random() * 180;

      background_meshes.push(mesh);
      mesh.load();
    }
  }
}

  l_system = new Orchids();
  l_system.iterations = controls.iterations;
  l_system.radius = controls["Radius"];
  l_system.orientRand = controls["Rotational Noise"];
  l_system.decay = controls["Radial Decay"] * 0.1;
  l_system.stepDecay = controls["Length Decay"] * 0.1;
  l_system.offset = controls["Offset"] * 0.1;
  l_system.curvature = controls["Angle"];
  l_system.height = controls["Height"];

  l_system.expandAxiom();
  l_system.moveTurtle();
  l_system.createAll();
  //console.log("SETNECE " + l_system.expandedSentence);

  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  //icosphere.create();
  m_mesh = new Mesh('/geo/feather.obj',vec3.fromValues(0, 1, 0), vec3.fromValues(1, 1, 1), vec3.fromValues(98, 0, 0));
  //m_mesh.create();
  //m_mesh.center = vec4.fromValues(0, 1, 2, 1);
  square = new Square(vec3.fromValues(0, 0, 0));

  square.create();
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
  gui.add(controls, 'Radial Decay', -1, 3).step(0.01);
  gui.add(controls, 'Length Decay', -0.2, 2).step(0.01);
  gui.add(controls, 'Angle', 0, 20).step(0.01);
  gui.add(controls, 'Radius', 0.1, 4).step(0.01);
  gui.add(controls, 'Height', 0.1, 4).step(0.01);
  //gui.add(controls, 'Offset', -10, 10).step(0.01);
  gui.add(controls, 'Load Scene');

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

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(225/255, 240/255, 246/255, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);


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



    for(let mesh of l_system.meshes) {
      renderer.render(camera, planet, [
        mesh,
      ]
    );}


    let ts = 0.01;



    for(let x = 0; x < xSubs; x++) {
      for(let y = 0; y < ySubs; y++) {
        for(let z = 0; z < zSubs; z++) {
          let i = x * ySubs * zSubs + y * zSubs + z;
         // console.log(i);

          let mesh = background_meshes[i];
          let dx = vec3.create();
          let dx2 = vec3.fromValues(0,-1 * ts,0);
    
          vec3.scale(dx, mesh.m_vel, ts);
    
          vec3.add(mesh.m_pos, mesh.m_pos, dx);
          vec3.add(mesh.m_vel, mesh.m_vel, dx2);
          let r = mat4.create();
          r = mat4.identity(r);
    
          //console.log(mesh.m_pos);
         // mesh.m_vel = vec3.fromValues(0,0,0);
          //console.log(mesh.m_vel);
          if(mesh.m_pos[1] < -2.0) {
            let randX = (x + Math.random()) * 2;
            let randY = (y + Math.random()) * 2;
            let randZ = (z + Math.random() - zSubs / 2) * 2;
            mesh.m_pos = vec3.fromValues(-randX,randY,randZ);
            mesh.m_vel = vec3.fromValues(2,0,0);
           // console.log(mesh.m_pos); 
          }
          let model = mat4.create();
          mat4.identity(model);
          mat4.translate(model, model, mesh.m_pos);
          mesh.m_angle += 0.001;
          mat4.rotateY(model, model, mesh.m_angle * 180 / Math.PI);
         // console.log(model);
    
          renderer.render(camera, planet, [
            mesh,
          ],model
        );
      }
    }
  }
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
