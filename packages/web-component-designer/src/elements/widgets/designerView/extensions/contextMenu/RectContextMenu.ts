import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { DesignItem } from '../../../../item/DesignItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { InsertAction } from '../../../../services/undoService/transactionItems/InsertAction.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';

export class RectContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerView: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    if (designItem?.element instanceof SVGRectElement)
      return true;
    return false;
  }

  public provideContextMenuItems(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      {
        title: 'convert to path', action: () => {
          let rect = <SVGRectElement>designItem.element;
          let pathD: string = "";
          pathD += "M" + rect.x.baseVal.value + " " + rect.y.baseVal.value +
            "L" + (rect.x.baseVal.value + rect.width.baseVal.value) + " " + rect.y.baseVal.value +
            "L" + (rect.x.baseVal.value + rect.width.baseVal.value) + " " + (rect.y.baseVal.value + rect.height.baseVal.value) +
            "L" + rect.x.baseVal.value + " " + (rect.y.baseVal.value + rect.height.baseVal.value) +
            "Z";
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", pathD);
          path.setAttribute("stroke", rect.getAttribute("stroke"));
          path.setAttribute("fill", rect.getAttribute("fill"));
          path.setAttribute("stroke-width", rect.getAttribute("stroke-width"));
          const di = DesignItem.createDesignItemFromInstance(path, designerCanvas.serviceContainer, designerCanvas.instanceServiceContainer);
          designerCanvas.instanceServiceContainer.undoService.execute(new InsertAction(designItem.parent, designItem.childCount, di));
          designerCanvas.serviceContainer.deletionService.removeItems([designItem]);
        }
      }
    ]
  }
}