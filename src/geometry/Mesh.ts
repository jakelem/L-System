import {vec2, vec3, vec4, mat4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

var ObjMtlLoader = require('obj-mtl-loader') ;
var OBJ = require('webgl-obj-loader') ;
var fs = require('fs') ;


class Mesh extends Drawable {
  static count : number = 0;
  indices: Array<number>;
  positions: Array<number>;
  colors: Array<number>;
  normals: Array<number>;
  uvs : Array<number>;
  center: vec4;
  scale: vec3;
  debug:boolean
  //represents the cell in the grid texture that applies to this mesh
  uv_cell : number;
  uv_scale : number;
  tex_divs : number;
  m_pos:vec3;
  m_vel:vec3;
  m_angle:number;
  m_size : vec3;

  rotate: vec3;
  filepath: string;
  m_color:vec4;
  mesh : any;
  objMtlLoader = new ObjMtlLoader();
  enabled : boolean;
  transform : mat4;

  maxIdx : number;
    
  constructor(filepath: string, center: vec3 = vec3.fromValues(0,0,0), 
  scale:vec3 = vec3.fromValues(1,1,1), rotate:vec3 = vec3.fromValues(0,0,0), col:vec4 = vec4.fromValues(25,86,107,255)) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.filepath = filepath;
    this.scale = scale;
    this.rotate = rotate;
    this.m_color = col;
    this.positions = new Array<number>();
    this.normals = new Array<number>();
    this.colors = new Array<number>();
    this.indices = new Array<number>();
    this.uvs = new Array<number>();
    this.uv_cell = 0;
    this.tex_divs = 10;
    this.uv_scale = 1.0 / this.tex_divs;
    this.debug = false
    this.enabled = true;
    this.maxIdx = -1;
    this.getOverallTransformation();
  }
  
  getOverallTransformation() {
    this.transform = mat4.create();
    mat4.translate(this.transform, this.transform, vec3.fromValues(this.center[0], this.center[1], this.center[2]));
    mat4.rotateX(this.transform, this.transform, this.rotate[0] * Math.PI / 180);
    mat4.rotateY(this.transform, this.transform, this.rotate[1] * Math.PI / 180);
    mat4.rotateZ(this.transform, this.transform, this.rotate[2] * Math.PI / 180);
    mat4.scale(this.transform, this.transform, this.scale);

  }

  getModelMatrix() {
    let model = mat4.create();
    mat4.identity(model);
    mat4.translate(model, model, this.m_pos);
    mat4.rotateY(model, model, this.m_angle * 180 / Math.PI);
    mat4.scale(model, model, this.m_size);

    return model;
  }
  transformUV(uvx : number, uvy : number) {

    uvx *= this.uv_scale;
    uvy *= this.uv_scale;

    let cel_y = this.uv_scale * Math.floor(this.uv_cell / this.tex_divs);
    let cel_x = this.uv_scale * (this.uv_cell % this.tex_divs);
    
    let nextcel_y = this.uv_scale * Math.floor(this.uv_cell / this.tex_divs + 1);
    return vec2.fromValues(uvx + cel_x, Math.min(uvy + cel_y,nextcel_y - 0.007));
  }


  exportObj() {
    let output = '';

    for(let i = 0 ; i < this.positions.length; i += 4) {
      output += 'v ' + this.positions[i] + ' ' + this.positions[i + 1] + ' ' + this.positions[i + 2] + '\n';
    }

    for(let i = 0 ; i < this.normals.length; i += 2) {
      output += 'vt ' + this.uvs[i] + ' ' + (1.0-this.uvs[i + 1]) + '\n';
    }

    for(let i = 0 ; i < this.normals.length; i += 4) {
      output += 'vn ' + this.normals[i] + ' ' + this.normals[i + 1] + ' ' + this.normals[i + 2] + '\n';
    }

    for(let i = 0 ; i < this.indices.length; i += 3) {
      output += 'f';
      for(let j = 0; j < 3; j ++) {
        output += ' ' + (this.indices[i + j] + 1) + '/' + (this.indices[i + j] + 1) + '/' + (this.indices[i + j] + 1);
      }
      output += '\n';

    }

    console.log(output);
    return output;
  }

  loadAndCreate() {
    let f = (meshes: any) => {
      this.loadMesh(meshes.mesh);
      this.create();
    }
    //console.log("FILEPATH " + this.filepath);
    OBJ.downloadMeshes({
      'mesh': this.filepath,
    }, f);
  }

  load() {
    OBJ.downloadMeshes({
      'mesh': this.filepath,
    }, (meshes: any) => {
      this.loadMesh(meshes.mesh);
    });
  }

  transformAndAppend(prefab: Mesh, transformed : Mesh) {
    //console.log(numPos);
    let v = 0;
    for(let i = 0; i < prefab.positions.length; i += 4) {
      let pos = vec4.fromValues(prefab.positions[i], prefab.positions[i+1], prefab.positions[i+2], prefab.positions[i+3]);
      let nor = vec4.fromValues(prefab.normals[i], prefab.normals[i+1], prefab.normals[i+2],  prefab.normals[i+3]);

      vec4.transformMat4(pos, pos, transformed.transform);
      vec4.transformMat4(nor, nor, transformed.transform);
      vec4.normalize(nor, nor);
      
      for(let j = 0; j < 4; j+=1) { 
        this.positions.push(pos[j]);
        this.normals.push(nor[j]);
        this.colors.push(transformed.m_color[j]);

      }
      v += 4;
    }
    for(let i = 0; i < prefab.uvs.length - 1; i += 2) {
     // mesh.uv_cell = 2;
      let v2 = transformed.transformUV(prefab.uvs[i], prefab.uvs[i+1]);
      //console.log("v2 " + v2)

      this.uvs.push(v2[0]);
      this.uvs.push(v2[1]);
    }

    //this.indices = new Array<number>(mesh.indices.length);
    let initIdx = this.maxIdx + 1;
    for(let i = 0; i < prefab.indices.length; i += 1) {
      let idx = prefab.indices[i] + initIdx;
      this.indices.push(idx);
      this.maxIdx = Math.max(idx, this.maxIdx);
    }
  }

  //parents this mesh's transformation to the input mesh's
  addPrefabMeshAsChild(mesh: Mesh) {
    this.transformAndAppend(mesh, this);
  }


  //preserves the transformation of the input mesh
  addPrefabMesh(mesh: Mesh) {
    this.transformAndAppend(mesh, mesh);
  }


  fromPrefabMesh(mesh: Mesh) {
    this.positions = new Array<number>();
    this.normals = new Array<number>();
    this.colors = new Array<number>();
    this.indices = new Array<number>();
    this.addPrefabMeshAsChild(mesh);
  }


  loadMesh(mesh: any) {
    let numPos = mesh.vertices.length / 3 * 4;
    this.positions = new Array<number>(numPos);
    this.normals = new Array<number>(numPos);
    this.colors = new Array<number>(numPos);

    let v = 0;
    let col1 = vec4.fromValues(25,86,107,255);
    vec4.scale(col1,col1,1/255);
    let col2 = vec4.fromValues(176,182,158,255);
    vec4.scale(col2,col2,1/255);

    for(let i = 0; i < mesh.vertices.length; i += 3) {
      let pos = vec4.fromValues(mesh.vertices[i], mesh.vertices[i+1], mesh.vertices[i+2], 1);
      let nor = vec4.fromValues(mesh.vertexNormals[i], mesh.vertexNormals[i+1], mesh.vertexNormals[i+2], 0);
      let col = vec4.fromValues(mesh.textures[i], mesh.textures[i+1], mesh.vertexNormals[i+2], 0);

      for(let j = 0; j < 4; j+=1) { 
        this.positions[v+j] = pos[j];
        this.normals[v+j] = nor[j];
        this.colors[v+j] = col[j];

      }

      v += 4;
    }

    v = 0;

    this.uvs = new Array<number>();
   // console.log("VERT LENGTH " + mesh.vertices.length);
    //console.log("TEX LENGTH " +  mesh.textures.length);

    for(let i = 0; i < mesh.textures.length ; i += 1) {
      //let transuv = this.transformUV(mesh.textures[i], mesh.textures[i+1]);
      //this.uvs.push(transuv[0]);
      //this.uvs.push(transuv[1]);
     // console.log("pushed to uvs" + mesh.textures[i])
      this.uvs.push(mesh.textures[i]);

    }


    this.indices = new Array<number>(mesh.indices.length);

    for(let i = 0; i < mesh.indices.length; i += 1) {
      this.indices[i] = mesh.indices[i];
    }

  }

  appendUntransformed(mesh: Mesh) {
    for(let i = 0; i < mesh.positions.length; i += 1) {
      this.positions.push(mesh.positions[i]);
      this.normals.push(mesh.normals[i]);
      this.colors.push(mesh.colors[i]);
      this.uvs.push(mesh.uvs[i]);

    }

    let initIdx = this.maxIdx + 1;
    for(let i = 0; i < mesh.indices.length; i += 1) {
      let idx = mesh.indices[i] + initIdx;
      this.indices.push(idx);
      this.maxIdx = Math.max(idx, this.maxIdx);
    }
  }


  create() {
    if(this.enabled) {

    //this.load();
    //console.log("MESH VERTS NUM " + this.positions.length);
    //console.log("MESH NORMS NUM " + this.normals.length);
    //console.log("MESH INDICES NUM " + this.indices.length);
    //console.log("MESH positions " + this.indices);
    //console.log("MESH colors " + this.colors);

    let norm : Float32Array = Float32Array.from(this.normals);
    let pos : Float32Array = Float32Array.from(this.positions);
    let col : Float32Array = Float32Array.from(this.colors);
    let uv : Float32Array = Float32Array.from(this.uvs);

    let idx : Uint32Array = Uint32Array.from(this.indices);

    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateCol();
    this.generateUV();

    this.count = this.indices.length;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, norm, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, col, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);


    //console.log(this.indices);


    }

  }
};

export default Mesh;
