import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';
import Mesh from './Mesh';

var ObjMtlLoader = require('obj-mtl-loader') ;
var OBJ = require('webgl-obj-loader') ;
var fs = require('fs') ;



class ParticleMeshes extends Mesh {
  particles : Array<Mesh>;
  xSubs = 5;
  ySubs = 3;
  zSubs = 3;
  m_particle : Mesh;
  loaded : boolean;
  time_scale : number;
  spread : number;
  m_particle_size : number;
  system_center : vec3;



  constructor(filepath: string, center: vec3 = vec3.fromValues(0,0,0), 
  scale:vec3 = vec3.fromValues(1,1,1), rotate:vec3 = vec3.fromValues(0,0,0), col:vec4 = vec4.fromValues(25,86,107,255)) {
    super(filepath); // Call the constructor of the super class. This is required.
    this.getOverallTransformation();
    this.loaded = false;
    this.time_scale = 0.01;
    this.particles = new Array<Mesh>();
    this.spread = 2;
    this.m_particle_size = 1;
    this.system_center = vec3.create();
  }




   loadParticleMeshes() {
    this.particles = new Array<Mesh>();

    for(let x = 0; x < this.xSubs; x++) {
      for(let y = 0; y < this.ySubs; y++) {
        for(let z = 0; z < this.zSubs; z++) {
        let mesh = new ParticleMeshes('/geo/orchid.obj', vec3.fromValues(0,0,0), vec3.fromValues(0.3,0.3,0.3), 
        vec3.fromValues(0,0,0), vec4.fromValues(1,1,1,1))
        this.refreshParticleAt(mesh, x, y, z);
        mesh.m_angle = Math.random() * 180;
        mesh.m_size = vec3.fromValues(this.m_particle_size, this.m_particle_size, this.m_particle_size);
        mesh.fromPrefabMesh(this.m_particle);
        this.particles.push(mesh);
        mesh.loadAndCreate();
      }
    }
  }
  this.loaded = true;
  
}

refreshParticleAt(mesh : Mesh, x : number, y : number, z : number) {
  let randX = (x + Math.random()) * this.spread;
  let randY = (y + Math.random()) * this.spread;
  let randZ = (z + Math.random() - this.zSubs / 2) * this.spread;
  mesh.m_pos = vec3.fromValues(-randX,randY,randZ);
  vec3.add(mesh.m_pos,mesh.m_pos, this.system_center);
  mesh.m_vel = vec3.fromValues(2,0,0);
}

advanceParticles() {
  if(this.loaded) {
    for(let x = 0; x < this.xSubs; x++) {
      for(let y = 0; y < this.ySubs; y++) {
        for(let z = 0; z < this.zSubs; z++) {
          let i = x * this.ySubs * this.zSubs + y * this.zSubs + z;
          // console.log(i);

          let mesh = this.particles[i];

          let dx = vec3.create();
          let dx2 = vec3.fromValues(0,-1 * this.time_scale,0);
      
          vec3.scale(dx, mesh.m_vel, this.time_scale);
          vec3.add(mesh.m_pos, mesh.m_pos, dx);
          vec3.add(mesh.m_vel, mesh.m_vel, dx2);
          let r = mat4.create();
          r = mat4.identity(r);
      
          if(mesh.m_pos[1] < -2.0 + this.system_center[1]) {
            this.refreshParticleAt(mesh, x, y, z);
          }
          mesh.m_angle += 0.001;
      
        }
      }
    }
  }
}

  
};

export default ParticleMeshes;
