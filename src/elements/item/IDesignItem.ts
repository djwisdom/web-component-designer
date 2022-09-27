import { ServiceContainer } from "../services/ServiceContainer";
import { InstanceServiceContainer } from '../services/InstanceServiceContainer';
import { ChangeGroup } from "../services/undoService/ChangeGroup";
import { NodeType } from './NodeType';
import { ExtensionType } from "../widgets/designerView/extensions/ExtensionType";
import { IDesignerExtension } from "../widgets/designerView/extensions/IDesignerExtension";
import { ISize } from "../../interfaces/ISize.js";

export interface IDesignItem {

  lastContainerSize: ISize;
  
  replaceNode(newNode: Node);

  readonly nodeType: NodeType

  readonly name: string;
  id: string;
  readonly isRootItem: boolean;

  readonly hasAttributes: boolean;
  readonly attributes: Map<string, string>

  readonly hasStyles: boolean;
  readonly styles: Map<string, string>

  readonly hasChildren: boolean;
  children(): IterableIterator<IDesignItem>
  readonly childCount: number;
  readonly firstChild: IDesignItem;
  readonly parent: IDesignItem;

  _insertChildInternal(designItem: IDesignItem, index?: number);
  _removeChildInternal(designItem: IDesignItem);

  indexOf(designItem: IDesignItem): number;
  insertAdjacentElement(designItem: IDesignItem, where: InsertPosition);
  insertChild(designItem: IDesignItem, index?: number);
  removeChild(designItem: IDesignItem);
  remove();
  clearChildren();
  updateChildrenFromNodesChildren();

  readonly hasContent: boolean;
  content: string;
  innerHTML?: string;

  readonly node: Node;
  readonly element: Element;

  serviceContainer: ServiceContainer;
  instanceServiceContainer: InstanceServiceContainer;
  appliedDesignerExtensions: Map<ExtensionType, IDesignerExtension[]>

  getOrCreateDesignItem(node: Node);

  openGroup(title: string): ChangeGroup

  setStyle(name: string, value?: string | null);
  removeStyle(name: string);

  setAttribute(name: string, value?: string | null);
  removeAttribute(name: string);

  hideAtDesignTime: boolean;
  hideAtRunTime: boolean;
  lockAtDesignTime: boolean;
}