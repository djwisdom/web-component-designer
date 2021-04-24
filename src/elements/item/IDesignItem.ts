import { ServiceContainer } from "../services/ServiceContainer";
import { InstanceServiceContainer } from '../services/InstanceServiceContainer';
import { ChangeGroup } from "../services/undoService/ChangeGroup";

export interface IDesignItem {

  readonly name: string
  readonly id: string

  readonly hasAttributes: boolean;
  readonly attributes: Map<string, string>

  readonly hasStyles: boolean;
  readonly styles: Map<string, string>

  readonly hasChildren: boolean;
  children(): IterableIterator<IDesignItem>
  readonly parent: IDesignItem;

  readonly hasContent: boolean;
  content: string

  readonly node: Node;
  readonly element: Element;

  serviceContainer: ServiceContainer;
  instanceServiceContainer: InstanceServiceContainer;

  getOrCreateDesignItem(node: Node);

  openGroup(title: string, affectedItems?: IDesignItem[]): ChangeGroup
  
  setStyle(name: keyof CSSStyleDeclaration, value?: string | null);
  removeStyle(name: keyof CSSStyleDeclaration);

  setAttribute(name: string, value?: string | null);
  removeAttribute(name: string);

  hideAtDesignTime: boolean;
  hideAtRunTime: boolean;
  lockAtDesignTime: boolean;
}