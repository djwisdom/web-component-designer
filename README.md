# web-component-designer

## Caution - this is a preview Version, a RC is planed for Q3/2021

A HTML WebComponent for Designing Webcomponents and HTML Pages.

Based on PolymerLabs Wizzywid

[![Build Status](https://github.com/node-projects/web-component-designer/workflows/Node%20CI/badge.svg?branch=master)](https://github.com/node-projects/web-component-designer/actions?query=workflow%3A%22Node+CI%22+branch%3Amaster)

This is a Designer Framework wich could easily be included in your own Software..

![image](https://user-images.githubusercontent.com/364896/117482820-358e2d80-af65-11eb-97fd-9d15ebf1966f.png)

## Demo

look at: https://node-projects.github.io/web-component-designer-demo/index.html
repository: https://github.com/node-projects/web-component-designer-demo

or a simple one: https://node-projects.github.io/web-component-designer-simple-demo/index.html
repository: https://github.com/node-projects/web-component-designer-simple-demo

## What is needed

- @node-projects/base-custom-webcomponent
- constructable-stylesheets-polyfill on browser not yet supporting these (for Safari & Firefox)
- optional - ace code editor (workin)
- optional - monaco code editor (if you use code-view-monaco) (workin)
- optional - code mirror code editor (if you use code-view-codemirror) (workin but buggy)
- optional - fancytree (if you use tree-view-extened) (workin)

## Features we are workin on

 - CSS Grid Positioning (planed)
 - look at the issues
 - Much, much more ...

## Developing

  * Install dependencies
```
  $ npm install
```

  * Compile Typescript after doing changes
```
  $ npm run build
```

## Using

at first you have to setup a service container, providing services for History, Properties, Elements, ....

## Configuring

## For some Widgets the Designer needs Additional Dependencies

## Code Editor

You can select to use on of 3 Code Editors Available (ACE, CodeMirrow, Monaco).
If you use one of the Widgets, you need to include the JS lib in you index.html and then use the specific widget.

## TreeView

We have 2 Tree Components. One Dependend Less and one Feature Rich wich uses FancyTree (and cause of this it needs JQuery and JqueryUI)

## DragDrop

If you'd like to use the Designer on Mobile, you need the mobile-drag-drop npm Library and include our polyfill.
Your addition to your index.html should look like this:

    <link rel="stylesheet" href="/node_modules/mobile-drag-drop/default.css">
    <script src="/node_modules/mobile-drag-drop/index.js"></script>
    <script src="/node_modules/@node-projects/web-component-designer/dist/polyfill/mobileDragDrop.js"></script>

Following Text is from Wizzywid, needs to be fixed...

**Disclaimer**: to configure the app to have other elements than the ones it
already has, you should clone it, build it, and make one of the changes below.
I don't want to add a "anyone should add any element to this exact deployed app"
feature because that invites a database and a bunch of XSS opportunities in the
house, and that's not really the point of this project. That being said, I would
like the steps below to be as easy as possible. ❤️

Also, start all of the sentences below with "In theory, ...". 😅

### Adding another native element

Following Text is from Wizzywid, needs to be fixed...

Add another entry to the `elements-native.json` file. If this is a weird
native element, you might have to do some code changes:
  - if it doesn't have a closing tag (like `<input>` or `<img>`), update `dumpElementEndTag`
  in `code-view.html`
  - if it doesn't have a "slot", i.e. you shouldn't be able to drop children
  in it (like `<input>`), you need to make 1 change each in `app-shell.html`.
  `designer-view.html` (just search for `input`, you'll find it.).
  Yes I should probably make this only exist in one place, but you know what,
  communicating between siblings is hard.

### Adding another custom element

Following Text is from Wizzywid, needs to be fixed...

Add the element you want to the `devDependencies` section of this
project's `package.json` file, then run `npm install`. This element needs
to use HTML Imports for it to work. If the import isn't of the form
`element-name/element-name.html`, you'll have to hand craft `dumpImports()` in
`code-view.html`.

### Adding another sample

Following Text is from Wizzywid, needs to be fixed...

Add the name of the sample in `elements-samples.json`, and create a file in the
`samples` directory with the same name. This file should contain a `<template>`,
and in the template the contents of your new sample. Note that this template
obviously has no shadow DOM (unless you add just a custom element), so if in it
you add a `<style> div {color: red}</style>`, this will, of course, style
all the divs in the app, and you'll have a hard time removing that code :(
