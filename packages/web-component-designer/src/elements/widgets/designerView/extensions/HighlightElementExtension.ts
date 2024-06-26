import { getDesignerCanvasNormalizedTransformedCornerDOMPoints } from '../../../helper/TransformHelper.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from './OverlayLayer.js';

const offset = 3;

export class HighlightElementExtension extends AbstractExtension {

  private _rect: SVGPathElement;

  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  override extend() {
    this.refresh();
  }

  override refresh() {
    let transformedCornerPoints = getDesignerCanvasNormalizedTransformedCornerDOMPoints(<HTMLElement>this.extendedItem.element, { x: offset, y: offset }, this.designerCanvas);
    if (!isNaN(transformedCornerPoints[0].x)) {
      this._rect = this._drawTransformedRect(transformedCornerPoints, 'svg-hover', this._rect, OverlayLayer.Background);
      this._rect.style.strokeWidth = (2 / this.designerCanvas.zoomFactor).toString();
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}