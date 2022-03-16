import { IPoint } from "../../index.js";

let identityMatrix: number[] = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
];

export function combineTransforms(helperElement: HTMLElement, element: HTMLElement, transform1: string, transform2: string) {
  console.log("transform1: " + transform1, "transform2: " + transform2);
  if (transform1 == null || transform1 == '') {
    element.style.transform = transform2;
    return;
  }

  helperElement.style.transform = '';
  helperElement.style.transform = transform1;
  const matrix1 = new DOMMatrix(window.getComputedStyle(helperElement).transform);
  helperElement.style.transform = '';
  helperElement.style.transform = transform2;
  const matrix2 = new DOMMatrix(window.getComputedStyle(helperElement).transform);
  const result = matrix2.multiply(matrix1);
  element.style.transform = result.toString();
}

export function getDomMatrix(element: HTMLElement) {
  return new DOMMatrix(window.getComputedStyle(element).transform);
}

export function convertCoordinates(point: IPoint, matrix: DOMMatrix) {
  let domPoint = new DOMPoint(point.x, point.y);
  return domPoint.matrixTransform(matrix.inverse());
}

export function getRotationMatrix3d(axisOfRotation: 'x'| 'y' | 'z' | 'X'| 'Y' | 'Z', angle: number) {
  const angleInRadians = angle / 180 * Math.PI;
  const sin = Math.sin;
  const cos = Math.cos;
  let rotationMatrix3d = [];

  switch (axisOfRotation.toLowerCase()) {
    case 'x': 
      rotationMatrix3d = [
        1,                    0,                     0,     0,
        0,  cos(angleInRadians),  -sin(angleInRadians),     0,
        0,  sin(angleInRadians),   cos(angleInRadians),     0,
        0,                    0,                     0,     1
      ];
      break;
    case 'y': 
      rotationMatrix3d = [
         cos(angleInRadians),   0, sin(angleInRadians),   0,
                           0,   1,                   0,   0,
        -sin(angleInRadians),   0, cos(angleInRadians),   0,
                           0,   0,                   0,   1
      ];
      break;
    case 'z': 
    rotationMatrix3d = [
        cos(angleInRadians), -sin(angleInRadians),    0,    0,
        sin(angleInRadians),  cos(angleInRadians),    0,    0,
                          0,                    0,    1,    0,
                          0,                    0,    0,    1
      ];
      break;
    default:
      rotationMatrix3d = null;
      break;
  }

  return rotationMatrix3d;
}

export function getTranslationMatrix3d(deltaX: number, deltaY: number, deltaZ: number) {
  const translationMatrix = [
    1,    0,    0,   0,
    0,    1,    0,   0,
    0,    0,    1,   0,
    deltaX,    deltaY,    deltaZ,   1
  ];
  return translationMatrix;
}

export function rotateElementByMatrix3d(element: HTMLElement, matrix: number[]) {
  element.style.transform = matrixArrayToCssMatrix(matrix);
}

export function matrixArrayToCssMatrix(matrixArray: number[]) {
  return "matrix3d(" + matrixArray.join(',') + ")";
}

export function cssMatrixToMatrixArray(cssMatrix: string) {
  if (!cssMatrix.includes('matrix')) {
    console.error('cssMatrixToMatrixArray: no css matrix passed');
    return identityMatrix;
  }
  let matrixArray: number[] = cssMatrix.match(/^matrix.*\((.*)\)/)[1].split(',').map(Number);
  return matrixArray;
}

export function getRotationAngleFromMatrix(matrixArray: number[]) {
  let angle = null;
  const a = matrixArray[0];
  const b = matrixArray[1];
  angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
  
  return angle;
}

export function composeTransforms(element: HTMLElement, cssTranformationMatrix: string) {
  let actualElementTransform = element.style.transform;
  if (actualElementTransform == null || actualElementTransform == '') {
    element.style.transform = cssTranformationMatrix;
    return;
  }

  const actualMatrix = new DOMMatrix(window.getComputedStyle(element).transform);
  const transformationMatrix = new DOMMatrix(cssTranformationMatrix);
  const result = actualMatrix.multiply(transformationMatrix);
  element.style.transform = result.toString();
}