import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';
var ObjMtlLoader = require('obj-mtl-loader') ;
var OBJ = require('webgl-obj-loader') ;

class Mesh extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  colors: Float32Array;
  normals: Float32Array;
  center: vec4;
  scale: vec3;
  rotate: vec3;
  filepath: string;
  m_color:vec4;
  mesh : any;
  objMtlLoader = new ObjMtlLoader();
  m_pos:vec3;
  m_vel:vec3;
  m_angle:number;

    
  constructor(filepath: string, center: vec3, scale:vec3 = vec3.fromValues(1,1,1), rotate:vec3 = vec3.fromValues(0,0,0), col:vec4 = vec4.fromValues(25,86,107,255)) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.filepath = filepath;
    this.scale = scale;
    this.rotate = rotate;
    this.m_color = col;
  }
  
  load() {
    let f = (meshes: any) => {
      this.loadMesh(meshes.mesh);
      //console.log()
      this.create();
    }
    //console.log("FILEPATH " + this.filepath);
    OBJ.downloadMeshes({
      'mesh': this.filepath,
    }, f);
  }

  loadMesh(mesh: any) {
    let numPos = mesh.vertices.length / 3 * 4;
    this.positions = new Float32Array(numPos);
    this.normals = new Float32Array(numPos);
    this.colors = new Float32Array(numPos);

    //console.log(numPos);
    let v = 0;
    let col1 = vec4.fromValues(25,86,107,255);
    vec4.scale(col1,col1,1/255);
    let col2 = vec4.fromValues(176,182,158,255);
    vec4.scale(col2,col2,1/255);

    for(let i = 0; i < mesh.vertices.length; i += 3) {
      let pos = vec4.fromValues(mesh.vertices[i], mesh.vertices[i+1], mesh.vertices[i+2], 1);
      let nor = vec4.fromValues(mesh.vertexNormals[i], mesh.vertexNormals[i+1], mesh.vertexNormals[i+2], 0);

      let col = this.m_color;
      //console.log(pos[1]);
      let scaleMat = mat4.create();
      mat4.scale(scaleMat, scaleMat, this.scale);
      vec4.transformMat4(pos,pos, scaleMat);

      let rotMat = mat4.create();
      mat4.rotateX(rotMat, rotMat, this.rotate[0] * Math.PI / 180)
      mat4.rotateY(rotMat, rotMat, this.rotate[1] * Math.PI / 180)
      mat4.rotateZ(rotMat, rotMat, this.rotate[2] * Math.PI / 180)

      vec4.transformMat4(pos,pos, rotMat);
      vec4.transformMat4(nor,nor, rotMat);
      vec4.add(pos, this.center, pos);

      for(let j = 0; j < 4; j+=1) { 
        this.positions[v+j] = pos[j];
        this.normals[v+j] = nor[j];
        this.colors[v+j] = col[j];

      }

      v += 4;
    }

    this.indices = new Uint32Array(mesh.indices.length);

    for(let i = 0; i < mesh.indices.length; i += 1) {
      this.indices[i] = mesh.indices[i];
    }
   // console.log("MESH VERTS NUM " + this.positions.length);

  }

  create() {
    //this.load();
    //console.log("MESH VERTS NUM " + this.positions.length);
    //console.log("MESH NORMS NUM " + this.normals.length);
    //console.log("MESH INDICES NUM " + this.indices.length);
    //console.log("MESH positions " + this.indices);
    //console.log("MESH colors " + this.colors);

    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateCol();

    this.count = this.indices.length;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

    //console.log(`Created mesh`);
  }
};

export default Mesh;
