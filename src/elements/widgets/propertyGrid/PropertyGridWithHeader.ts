import { ServiceContainer } from '../../services/ServiceContainer.js';
import { BaseCustomWebComponentLazyAppend, css, Disposable, html } from '@node-projects/base-custom-webcomponent';
import { PropertyGrid } from './PropertyGrid.js';
import { InstanceServiceContainer } from '../../services/InstanceServiceContainer.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { sleep } from '../../helper/Helper.js';
import { NodeType } from '../../item/NodeType.js';
import { PropertyGridPropertyList } from './PropertyGridPropertyList.js';
import { ContentAndIdPropertiesService } from '../../services/propertiesService/services/ContentAndIdPropertiesService.js';

export class PropertyGridWithHeader extends BaseCustomWebComponentLazyAppend {

  static override readonly style = css`
    :host {
      display: block;
      height: 100%;
      user-select: none;
      -webkit-user-select: none;
      background: var(--medium-grey, #2f3545);
      color: white;
    }
    div.root {
      display: grid;
      grid-template-columns: 15px auto 1fr;
      padding: 3px 6px;
      font-family: monospace; 
      align-items: center;
    }
    .desc {
      font-weight: 700;
      font-size: 10px;
      margin-right: 5px;
    }
    input {
      background: var(--medium-grey, #2f3545);
      border: solid 1px gray;
      color: white;
      width: calc(100% - 6px);
    }
    #type {
      color: wheat;
      white-space: nowrap;
      overflow: hidden;
      font-size: 12px;
      height: 20px;
    }
    #pg {
      height: calc(100% - 64px);
    }
    `;

  static override readonly template = html`
  <div class="root">
    <span style="grid-column: span 2;" class="desc">Type:</span><span id="type"></span>
    <div id="idRect" style="width: 7px; height: 7px; border: 1px solid white;"></div>
    <span class="desc">Id:</span><input type="text" id="id">
    <div id="contentRect" style="width: 7px; height: 7px; border: 1px solid white;"></div>
    <span class="desc">Content:</span><input type="text" id="content">
  </div>
  <node-projects-property-grid id="pg"></node-projects-property-grid>
  `
  private _type: HTMLSpanElement;
  private _id: HTMLInputElement;
  private _content: HTMLInputElement;
  private _pg: PropertyGrid;
  private _selectionChangedHandler: Disposable;
  private _instanceServiceContainer: InstanceServiceContainer;
  private _idRect: HTMLDivElement;
  private _contentRect: HTMLDivElement;
  private _propertiesService: ContentAndIdPropertiesService;


  constructor() {
    super();
    this._restoreCachedInititalValues();

    this._type = this._getDomElement<HTMLSpanElement>('type');
    this._id = this._getDomElement<HTMLInputElement>('id');
    this._content = this._getDomElement<HTMLInputElement>('content');
    this._pg = this._getDomElement<PropertyGrid>('pg');
    this._idRect = this._getDomElement<HTMLDivElement>('idRect');
    this._contentRect = this._getDomElement<HTMLDivElement>('contentRect');

    this._propertiesService = new ContentAndIdPropertiesService();
    this._idRect.oncontextmenu = (event) => {
      event.preventDefault();
      PropertyGridPropertyList.openContextMenu(event, this._instanceServiceContainer.selectionService.selectedElements, this._propertiesService.idProperty);
    };
    this._contentRect.oncontextmenu = (event) => {
      event.preventDefault();
      PropertyGridPropertyList.openContextMenu(event, this._instanceServiceContainer.selectionService.selectedElements, this._propertiesService.contentProperty);
    };

    this._id.onkeydown = e => {
      if (e.key == 'Enter')
        this._instanceServiceContainer.selectionService.primarySelection.id = this._id.value;
      else if (e.key == 'Escape') {
        this._id.value = this._instanceServiceContainer.selectionService.primarySelection?.id ?? '';
        e.preventDefault();
        e.stopPropagation();
      }
    }
    this._content.onkeydown = e => {
      if (e.key == 'Enter') {
        this._instanceServiceContainer.selectionService.primarySelection.content = this._content.value;
        this._content.title = this._content.value;
      } else if (e.key == 'Escape') {
        this._content.value = this._instanceServiceContainer.selectionService.primarySelection?.element?.textContent ?? '';
        e.preventDefault();
        e.stopPropagation();
      }
    }

    let pSel: IDesignItem
    this._id.onfocus = e => {
      pSel = this._instanceServiceContainer.selectionService.primarySelection;
    }
    this._id.onblur = e => {
      pSel.id = this._id.value;
    }
  }

  public set serviceContainer(value: ServiceContainer) {
    this._waitForChildrenReady().then(() => this._pg.serviceContainer = value);
  }

  public set instanceServiceContainer(value: InstanceServiceContainer) {
    this._instanceServiceContainer = value;
    this._selectionChangedHandler?.dispose()
    this._selectionChangedHandler = this._instanceServiceContainer.selectionService.onSelectionChanged.on(async e => {
      this._pg.instanceServiceContainer = value;
      await sleep(20); // delay assignment a little bit, so onblur above could still set the value.
      if (this._instanceServiceContainer.selectionService.primarySelection?.nodeType == NodeType.Element)
        this._type.innerText = this._instanceServiceContainer.selectionService.primarySelection?.name ?? '';
      else
        this._type.innerText = this._instanceServiceContainer.selectionService.primarySelection?.node?.nodeName ?? '';
      this._id.value = this._instanceServiceContainer.selectionService.primarySelection?.id ?? '';
      if (this._instanceServiceContainer.selectionService.primarySelection?.element?.nodeType != NodeType.Element) {
        this._content.value = this._instanceServiceContainer.selectionService.primarySelection?.content ?? '';
      } else if (this._instanceServiceContainer.selectionService.primarySelection?.element?.children?.length <= 0)
        this._content.value = this._instanceServiceContainer.selectionService.primarySelection?.content ?? '';
      else
        this._content.value = ''
      this._content.title = this._content.value;

      PropertyGridPropertyList.refreshIsSetElementAndEditorForDesignItems(this._idRect, this._propertiesService.idProperty, this._instanceServiceContainer.selectionService.selectedElements, this._propertiesService);
      PropertyGridPropertyList.refreshIsSetElementAndEditorForDesignItems(this._contentRect, this._propertiesService.contentProperty, this._instanceServiceContainer.selectionService.selectedElements, this._propertiesService);
    });
  }
}

customElements.define('node-projects-property-grid-with-header', PropertyGridWithHeader);