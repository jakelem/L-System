import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';
import Mesh from './Mesh';
import LSystem from './LSystem';
import Cylinder from './Cylinder';

import Turtle from './Turtle';

class Foliage extends LSystem  {

  orchidSize : number;
  smoothfactor = 1.0;
  constructor() {
    super();
    this.axiom = "TX";
    this.turtleStack = new Array<Turtle>();
    this.meshes = new Array<Mesh>();
    this.iterations = 3;
    this.charExpansions = new Map();
    this.charToAction = new Map();
    this.expandedSentence = "";
    this.currTurtle = new Turtle();
    this.currTurtle.prevPosition = vec3.fromValues(0,-this.height,0);
    this.currTurtle.orientation = vec3.fromValues(0,1,0);
    this.decay = 0.2;
    this.stepDecay = 0.1;
    this.orchidSize = 1.6;
    this.radius = 0.2;
    this.offset = -0.01;

    this.charExpansions.clear();
    this.charToAction.clear();
    this.fillCharExpansions();
    this.fillCharToAction();

    
  }

  fillCharToAction() {
    this.charToAction.set('F', () => {
      this.advanceTurtleBy(1.0);
    });

    this.charToAction.set('A', () => {
      this.advanceTurtleBy(0.4);
    });

    this.charToAction.set('B', () => {
      this.advanceTurtleBy(0.5);
    });

    this.charToAction.set('>', () => {
      this.rotateTurtleXBy(this.curvature * this.smoothfactor);
    });

    this.charToAction.set('<', () => {
      this.rotateTurtleXBy(-this.curvature * this.smoothfactor);
    });

    this.charToAction.set('-', () => {
      this.rotateTurtleZBy(-this.curvature * this.smoothfactor);
    });
    this.charToAction.set('+', () => {
      this.rotateTurtleZBy(this.curvature * this.smoothfactor);
    });

    this.charToAction.set('1', () => {
      this.rotateTurtleXBy(30);
    });

    this.charToAction.set('2', () => {
      this.rotateTurtleXBy(-30);
    });

    this.charToAction.set('3', () => {
      this.rotateTurtleZBy(-30);
    });

    this.charToAction.set('4', () => {
      this.rotateTurtleZBy(30);
    });

    this.charToAction.set('y', () => {
      this.rotateTurtleYBy(-10);
    });

    this.charToAction.set('u', () => {
      this.rotateTurtleYBy(10);
    });

    this.charToAction.set('d', () => {
      this.addTurtleDepth(1);
    });

    this.charToAction.set('[', () => {
      this.pushTurtle();
    });

    this.charToAction.set(']', () => {
      this.popTurtle();
    });

    this.charToAction.set('s', () => {
      this.sproutBud();
    });

    this.charToAction.set('l', () => {
      this.sproutLeaf();
    });0
  }

  advanceTurtleBy(frac: number) {
    let prevSF =  Math.exp(-this.currTurtle.prevDepth * this.decay) * this.radius;
    let sF = Math.exp(-this.currTurtle.depth * this.decay) * this.radius;
    let sStep = 10 * Math.exp(-this.currTurtle.depth * this.stepDecay) * this.height;

    prevSF = Math.min(prevSF, this.radius);
    sF = Math.min(sF, this.radius);
    prevSF = Math.max(prevSF, 0.005);
    sF = Math.max(sF, 0.005);

    //sStep = Math.min(sStep, 1);
    //let mesh = new Mesh('/geo/stem.obj', vec3.clone(this.currTurtle.position), vec3.fromValues(sF,sStep,sF), 
    let mesh = new Cylinder();
    mesh.smoothshade = this.smoothshading;
    mesh.m_color = vec4.fromValues(0.29,0.17,0.11,1);
    mesh.assignFaceCenters(this.currTurtle.prevPosition, this.currTurtle.position);
    mesh.assignFaceScaleUniform(prevSF, sF);
    mesh.assignFaceRotations(this.currTurtle.prevOrientation, this.currTurtle.orientation);
   // mesh.assignFaceRotations(vec3.create(), vec3.create())
    //mesh.assignFaceRotations(prevSF, sF);

    mesh.loadMesh();

    //console.log(mesh);
    mesh.debug = true
    this.fullMesh.transformAndAppend(mesh,mesh);
    let rotMat = mat4.create();
    let ox = (Math.random() - 0.5) * this.orientRand
    let oz = (Math.random() - 0.5) * this.orientRand

    mat4.rotateX(rotMat, rotMat, (this.currTurtle.orientation[0] + ox) * Math.PI / 180)
    mat4.rotateY(rotMat, rotMat, this.currTurtle.orientation[1] * Math.PI / 180)
    mat4.rotateZ(rotMat, rotMat, (this.currTurtle.orientation[2] + oz) * Math.PI / 180)

    let offset = sStep * 0.8;
    let step = vec3.fromValues(0,sStep  - offset,0);
    vec3.transformMat4(step, step, rotMat);
    this.currTurtle.prevDepth = this.currTurtle.depth;
    this.currTurtle.depth += frac; //Math.max(0.2, Math.min(1.0 / (sF * 14), 0.7));
    this.currTurtle.prevPosition = vec3.copy(this.currTurtle.prevPosition, this.currTurtle.position); //Math.max(0.2, Math.min(1.0 / (sF * 14), 0.7));
    this.currTurtle.prevOrientation = vec3.copy(this.currTurtle.prevOrientation, this.currTurtle.orientation); //Math.max(0.2, Math.min(1.0 / (sF * 14), 0.7));

    vec3.scaleAndAdd(this.currTurtle.position, this.currTurtle.position, step, 1);

  }


  advanceTurtleOld(frac : number) {
    //let sF = Math.max(this.radius - Math.exp(0.7 * this.currTurtle.depth * this.decay), 0.01);
    let sF = Math.exp(-this.currTurtle.depth * this.decay) * this.radius;
    //sF = Math.max(this.radius - this.currTurtle.depth * this.decay, 0.01);
    let sStep = Math.exp(-this.currTurtle.depth * this.stepDecay) * this.height;
    //sStep = Math.min(sStep, 1);
    
    let mesh = new Mesh('/geo/stem.obj', vec3.clone(this.currTurtle.position), vec3.fromValues(sF,sStep,sF), 

    vec3.clone(this.currTurtle.orientation), vec4.fromValues(0.29,0.17,0.11,1));

    this.fullMesh.transformAndAppend(this.meshNames.get("stem"), mesh);

    let rotMat = mat4.create();
    mat4.rotateX(rotMat, rotMat, this.currTurtle.orientation[0] * Math.PI / 180)
    mat4.rotateY(rotMat, rotMat, this.currTurtle.orientation[1] * Math.PI / 180)
    mat4.rotateZ(rotMat, rotMat, this.currTurtle.orientation[2] * Math.PI / 180)

    let offset = this.height / 15;
    let step = vec3.fromValues(0,sStep  - offset,0);
    vec3.transformMat4(step, step, rotMat);
    this.currTurtle.depth += frac;
    
    vec3.scaleAndAdd(this.currTurtle.position, this.currTurtle.position, step, 1);

  }

  sproutBud() {
    let mesh = new Mesh('/geo/petal.obj', vec3.clone(this.currTurtle.prevPosition), vec3.fromValues(this.orchidSize * 1.5, this.orchidSize, this.orchidSize), 
    vec3.clone(this.currTurtle.orientation),
    vec4.fromValues(1,1,1,1));
    
    let stoch = vec3.create()
    vec3.random(stoch)
    vec3.scale(stoch,stoch, 20)
    mesh.rotate[0] = this.currTurtle.prevOrientation[0] + stoch[0]
    mesh.rotate[1] = 0
    mesh.rotate[2] = this.currTurtle.prevOrientation[2] + stoch[2] + 90

    let randOff = Math.random() * 3 - 2

    randOff = Math.min(randOff, 0)
    
    mesh.scale[0] = this.leaf_size * (Math.random() + 2.0)
    mesh.scale[2] = this.leaf_size * (Math.random() + 1.2)

    mesh.uv_cell = 2

    let rotMat = mat4.create();
    let ox = (Math.random() - 0.5) * 360
    let oz = 90

    mat4.rotateX(rotMat, rotMat, ox + this.currTurtle.prevOrientation[0] * Math.PI / 180)
    mat4.rotateY(rotMat, rotMat, this.currTurtle.prevOrientation[1] * Math.PI / 180)
    mat4.rotateZ(rotMat, rotMat, oz + this.currTurtle.prevOrientation[2] * Math.PI / 180)

    let step = vec3.fromValues(0,1,0);
    vec3.transformMat4(step, step, rotMat);

    vec4.scaleAndAdd(mesh.center, mesh.center, vec4.fromValues(step[0],step[1],step[2],0), 0)

    mesh.getOverallTransformation()

    this.fullMesh.transformAndAppend(this.meshNames.get("plane"), mesh);
  }

  sproutLeaf() {
    let sF = Math.exp(-this.currTurtle.depth);

    let mesh = new Mesh('/geo/leaf.obj', vec3.clone(this.currTurtle.position), vec3.fromValues(sF,1,sF), vec3.clone(this.currTurtle.orientation),
    vec4.fromValues(0.38,0.51,0.33,1));

    this.fullMesh.transformAndAppend(this.meshNames.get("plane"), mesh);
  }

  addTurtleDepth(d : number) {
    this.currTurtle.depth += d;
  }

  rotateTurtleX() {
    this.currTurtle.orientation[0] += 30;
  }

  rotateTurtleY() {
    this.currTurtle.orientation[1] += 30;
  }

  rotateTurtleZ() {
    this.currTurtle.orientation[2] += 30;
  }

  setAxiom() {
    this.axiom = 'AAAAAAAAAXY';
  }

  fillCharExpansions() {
    console.log("orchids EXPANSION");
    this.charExpansions.set('X', '[ddd>>AsAsX]AA[+ddd<<<AsAsX]A[ddd---AsAsX]AAAs');
    this.charExpansions.set('Y', '[dd+dAsAsX][ddd-dAsAsX][dd>>dAsAsX]');

    this.charExpansions.set('T', 'AA[>>>>>>>AAAT]T');

    this.charExpansions.set('G', 'A[<<<<<<<<<<<<A]');

   // this.charExpansions.set('F', 'F');
    //this.charExpansions.set('A', '-B>');
    //this.charExpansions.set('B', '<F');
    this.charExpansions.set('s', '33s44');
    this.charExpansions.set('s', '11s22');

    //this.charExpansions.set('+', '+F');
    //this.charExpansions.set('-', '-F');
    //this.charExpansions.set('Y', '[yylyyyylyyy>>>ylY]');
    
    //this.charExpansions.set('T', 'F<<<<++F--');
  
  }

  pushTurtle() {
    this.turtleStack.push(this.currTurtle);
    let prevTurtle = this.currTurtle;
    this.currTurtle = new Turtle();
    this.currTurtle.copyshallow(prevTurtle);

  }

  popTurtle() {
    this.currTurtle = this.turtleStack.pop();
    //console.log(this.currTurtle);

  }

  expandAxiom() {
    let prevAxiom = this.axiom;
    for(let i = 0; i < this.iterations;i++) {
      let sentence :string = "";
      for(let c of prevAxiom) {
        if(this.charExpansions.get(c) == undefined) {
          sentence = sentence.concat(c);

        } else {
          sentence = sentence.concat(this.charExpansions.get(c).toString());

        }
      }
      prevAxiom = sentence;

    }

    this.expandedSentence = prevAxiom;
  }

  moveTurtle() {
    for(let c of this.expandedSentence) {
      if(this.charToAction.get(c) == undefined) {
        continue;
      }
      this.charToAction.get(c)();
    }
  }

};

export default Foliage;
