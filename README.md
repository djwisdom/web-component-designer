# web-component-designer

```It's now considered beta. It works, we use it in production, but there are many more features to come```

A HTML web component for designing web components and HTML pages based on PolymerLabs wizzywid which can easily be integrated in your own software.
Meanwhile polymer is not used anymore.

![image](https://user-images.githubusercontent.com/364896/117482820-358e2d80-af65-11eb-97fd-9d15ebf1966f.png)

There is also a Preview VS-Code Addon using the Designer: https://github.com/node-projects/vs-code-designer-addon

## NPM Package

https://www.npmjs.com/package/@node-projects/web-component-designer

     npm i @node-projects/web-component-designer

## Additional NPM Packages

All Modules wich need an external dependency are now extracted to extra NPM packges.
So the designer now should work with bundlers.

| Name                                         | Description |
| -------------------------------------------- | ----------- |
| web-component-designer-codeview-ace          |             |
| web-component-designer-codeview-codemirror   |             |
| web-component-designer-codeview-codemirror5  |             |
| web-component-designer-codeview-monaco       |             |

## Browser support

  - At the moment Chrome, and Firefox Nightly with Experimental Import Assertions enabled.
  But when import Assertions are landing in Safari and Firefox they will work again.
  And you could transpile them away in the meantime.
  
## Projects using it

A ZPL Designer included in a comercial Application:
![image](https://github.com/node-projects/web-component-designer/assets/364896/e1f1e3cc-29a3-4749-a676-389577fab69a)

A Materialflow Layout Editor in a comercial Application:
![image](https://github.com/node-projects/web-component-designer/assets/364896/0062562a-4224-4b11-aaa4-03e31494fcfa)

## Demo

look at: https://node-projects.github.io/web-component-designer-demo/index.html
repository: https://github.com/node-projects/web-component-designer-demo

or a simple one: https://node-projects.github.io/web-component-designer-simple-demo/index.html
repository: https://github.com/node-projects/web-component-designer-simple-demo

## What is needed

- @node-projects/base-custom-webcomponent a very small basic webcomponent library (maybe this will be included directly later, to be dependecy free)
- optional - ace code editor
- optional - monaco code editor (if you use code-view-monaco)
- optional - code mirror code editor (if you use code-view-codemirror) (workin but buggy)
- optional - fancytree (if you use tree-view-extended, palette-tree-view or bindable-objects-browser)

## Features we are workin on

https://github.com/node-projects/web-component-designer/issues

## Developing

  * Install dependencies
```
  $ npm install
```

  * Compile typescript after doing changes
```
  $ npm run build (if you use Visual Studio Code, you can also run the build task via Ctrl + Shift + B > tsc:build - tsconfig.json)
```

  * *Link node module*<br/>
```
  $ npm link 
```

## Using

At first you have to setup a service container providing services for history, properties, elements, ...

## Code Editor

You can select to use one of 3 code editors available (ACE, CodeMirrow, Monaco).
If you use one of the widgets, you need to include the JS lib in your index.html and then use the specific widget.

## TreeView

We have 2 tree components. One independent and one feature rich which uses FancyTree (and cause of this it needs JQuery and JqueryUI).

## DragDrop

If you'd like to use the designer on mobile, you need the mobile-drag-drop npm library.
Your index.html should be extended as follows:

    <link rel="stylesheet" href="/node_modules/mobile-drag-drop/default.css">
    <script src="/node_modules/mobile-drag-drop/index.js"></script>

## Copyright notice

The Library uses Images from the Chrome Dev Tools, see
https://github.com/ChromeDevTools/devtools-frontend/tree/main/front_end/Images/src
and
https://github.com/ChromeDevTools/devtools-frontend/blob/main/LICENSE
