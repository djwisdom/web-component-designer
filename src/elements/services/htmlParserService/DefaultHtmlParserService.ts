import { IDesignItem } from "../../..";
import { InstanceServiceContainer } from "../InstanceServiceContainer";
import { ServiceContainer } from "../ServiceContainer";
import { IHtmlParserService } from "./IHtmlParserService";
import { DesignItem } from '../../item/DesignItem';

export class DefaultHtmlParserService implements IHtmlParserService {
  async parse(html: string, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer): Promise<IDesignItem[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let res: IDesignItem[] = [];
    for (let el of doc.body.children) { //todo, use childNodes or textnodes will not work
      res.push(this._createDesignItemsRecursive(el, serviceContainer, instanceServiceContainer))
    }

    return res;
  }

  private _createDesignItemsRecursive(element: Element, serviceContainer: ServiceContainer, instanceServiceContainer: InstanceServiceContainer) {
    let di = DesignItem.createDesignItemFromInstance(element, serviceContainer, instanceServiceContainer);
    for (let e of element.children) { //todo, use childNodes or textnodes will not work
      this._createDesignItemsRecursive(e, serviceContainer, instanceServiceContainer);
    }
    return di;
  }
}