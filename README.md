# CIS-566-Project-0
https://github.com/CIS-566-2018/CIS-566-Project-0

## Objective
- Check that the tools and build configuration we will be using for the class works.
- Start learning Typescript and WebGL2

## Running the Code

1. [Install Node.js](https://nodejs.org/en/download/). Node.js is a JavaScript runtime. It basically allows you to run JavaScript when not in a browser. For our purposes, this is not necessary. The important part is that with it comes `npm`, the Node Package Manager. This allows us to easily declare and install external dependencies such as [dat.GUI](https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage), and [glMatrix](http://glmatrix.net/).

2. Using a command terminal, run `npm install` in the root directory of your project. This will download all of those dependencies.

3. Do either of the following (but we highly recommend the first one for reasons we will explain later).

    a. Run `npm start` and then go to `localhost:5660` in your web browser

    b. Run `npm run build` and then go open `index.html` in your web browser

## Module Bundling
One of the most important dependencies of our projects is [Webpack](https://webpack.js.org/concepts/). Webpack is a module bundler which allows us to write code in separate files and use `import`s and `export`s to load classes and functions for other files. It also allows us to preprocess code before compiling to a single file. We will be using [Typescript](https://www.typescriptlang.org/docs/home.html) for this course which is Javascript augmented with type annotations. Webpack will convert Typescript files to Javascript files on compilation and in doing so will also check for proper type-safety and usage. Read more about Javascript modules in the resources section below.

## Developing Your Code
All of the JavaScript code is living inside the `src` directory. The main file that gets executed when you load the page as you may have guessed is `main.ts`. Here, you can make any changes you want, import functions from other files, etc. The reason that we highly suggest you build your project with `npm start` is that doing so will start a process that watches for any changes you make to your code. If it detects anything, it'll automagically rebuild your project and then refresh your browser window for you. Wow. That's cool. If you do it the other way, you'll need to run `npm build` and then refresh your page every time you want to test something.

We would suggest editing your project with Visual Studio Code https://code.visualstudio.com/. Microsoft develops it and Microsoft also develops Typescript so all of the features work nicely together. Sublime Text and installing the Typescript plugins should probably work as well.

## Assignment Details
1. Take some time to go through the existing codebase so you can get an understanding of syntax and how the code is architected. Much of the code is designed to mirror the class structures used in CIS 460's OpenGL assignments, so it should hopefully be somewhat familiar.
2. Take a look at the resources linked in the section below. Definitely read about Javascript modules and Typescript. The other links provide documentation for classes used in the code.
3. Add a `Cube` class that inherits from `Drawable` and at the very least implement a constructor and its `create` function. Then, add a `Cube` instance to the scene to be rendered.
4. Read the documentation for dat.GUI below. Update the existing GUI in `main.ts` with a parameter to alter the color passed to `u_Color` in the Lambert shader.
5. Write a custom shader of your choosing and add a GUI element that allows the user to switch shaders. Your custom shader must use a trig function to modify vertex position or fragment color non-uniformly. If your custom shader is particularly interesting, you'll earn some bonus points.
6. Feel free to update any of the files when writing your code. The implementation of the `OpenGLRenderer` is currently very simple.

## Resources
- Javascript modules https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
- Typescript https://www.typescriptlang.org/docs/home.html
- dat.gui https://workshop.chromeexperiments.com/examples/gui/
- glMatrix http://glmatrix.net/docs/
- WebGL
  - Interfaces https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
  - Types https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Types
  - Constants https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
