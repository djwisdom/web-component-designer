import { IPropertiesService, RefreshMode } from "../IPropertiesService";
import { IProperty } from '../IProperty';
import { IDesignItem } from '../../../item/IDesignItem';
import { ValueType } from "../ValueType";
import { PropertiesHelper } from './PropertiesHelper';
import { BindingTarget } from "../../../item/BindingTarget";
import { IBinding } from "../../../item/IBinding";
import { PropertyType } from "../PropertyType";
import { NodeType } from "../../../item/NodeType";

export abstract class AbstractPropertiesService implements IPropertiesService {

  abstract getRefreshMode(designItem: IDesignItem): RefreshMode;

  abstract isHandledElement(designItem: IDesignItem): boolean;

  protected _notifyChangedProperty(designItem: IDesignItem, property: IProperty, value: any) {
  }

  getProperty(designItem: IDesignItem, name: string): IProperty {
    return this.getProperties(designItem).find(x => x.name == name);
  }
  
  abstract getProperties(designItem: IDesignItem): IProperty[] ;

  setValue(designItems: IDesignItem[], property: IProperty, value: any) {
    const cg = designItems[0].openGroup("properties changed");
    for (let d of designItems) {
      if (property.propertyType == PropertyType.cssValue) {
        d.styles.set(property.name, value);
        (<HTMLElement>d.element).style[property.name] = value;
        //unkown css property names do not trigger the mutation observer of property grid, 
        //fixed by assinging stle again to the attribute
        (<HTMLElement>d.element).setAttribute('style',(<HTMLElement>d.element).getAttribute('style'));
      } else {
        let attributeName = property.attributeName
        if (!attributeName)
          attributeName = PropertiesHelper.camelToDashCase(property.name);


        if (property.type === 'object') {
          const json = JSON.stringify(value);
          d.attributes.set(attributeName, json);
          d.element.setAttribute(attributeName, json);
        } else if (property.type == 'boolean' && !value) {
          d.attributes.delete(attributeName);
          d.element.removeAttribute(attributeName);
        }
        else if (property.type == 'boolean' && value) {
          d.attributes.set(attributeName, "");
          d.element.setAttribute(attributeName, "");
        }
        else {
          d.attributes.set(attributeName, value);
          d.element.setAttribute(attributeName, value);
        }
      }
      this._notifyChangedProperty(d, property, value);
    }
    cg.commit();
  }

  getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget {
    return BindingTarget.property;
  }

  clearValue(designItems: IDesignItem[], property: IProperty) {
    const cg = designItems[0].openGroup("properties cleared");
    for (let d of designItems) {
      if (property.propertyType == PropertyType.cssValue) {
        d.styles.delete(property.name);
        (<HTMLElement>d.element).style[property.name] = '';

      } else {
        let attributeName = property.attributeName
        if (!attributeName)
          attributeName = PropertiesHelper.camelToDashCase(property.name);

        d.attributes.delete(attributeName);
        d.element.removeAttribute(attributeName);
      }
      d.serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
        return s.clearBinding(d, property.name, this.getPropertyTarget(d, property));
      });
      this._notifyChangedProperty(d, property, undefined);
    }
    cg.commit();
  }

  isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    let all = true;
    let some = false;
    if (designItems != null && designItems.length !== 0) {
      let attributeName = property.attributeName
      if (!attributeName)
        attributeName = PropertiesHelper.camelToDashCase(property.name);

      designItems.forEach((x) => {
        let has = false;
        if (property.propertyType == PropertyType.cssValue)
          has = x.styles.has(property.name);
        else
          has = x.attributes.has(attributeName);
        all = all && has;
        some = some || has;
      });
      //todo: optimize perf, do not call bindings service for each property. 
      const bindings = designItems[0].serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
        return s.getBindings(designItems[0]);
      });
      if (property.propertyType == PropertyType.cssValue) {
        if (bindings && bindings.find(x => x.target == BindingTarget.css && x.targetName == property.name))
          return ValueType.bound;
      } else {
        if (bindings && bindings.find(x => x.target == BindingTarget.property && x.targetName == property.name))
          return ValueType.bound;
      }
    }
    else
      return ValueType.none

    return all ? ValueType.all : some ? ValueType.some : ValueType.none;
  }

  getValue(designItems: IDesignItem[], property: IProperty) {
    if (designItems != null && designItems.length !== 0) {
      if (property.propertyType == PropertyType.cssValue) {
        let lastValue = designItems[0].styles.get(property.name);
        for (const x of designItems) {
          let value = x.styles.get(property.name);
          if (value != lastValue) {
            lastValue = null;
            break;
          }
        }
        return lastValue;
      } else {
        let attributeName = property.attributeName
        if (!attributeName)
          attributeName = PropertiesHelper.camelToDashCase(property.name);

        if (property.type == 'boolean')
          return designItems[0].attributes.has(attributeName);
        let lastValue = designItems[0].attributes.get(attributeName);
        /*
        for (const x of designItems) {
          let value = x.attributes.get(attributeName);
          if (value != lastValue) {
            lastValue = null;
            break;
          }
        }
        */
        return lastValue;
      }
    }
    return null;
  }

  getBinding(designItems: IDesignItem[], property: IProperty): IBinding {
    //TODO: optimize perf, do not call bindings service for each property. 
    const bindings = designItems[0].serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
      return s.getBindings(designItems[0]);
    });
    if (property.propertyType == PropertyType.cssValue) {
      return bindings.find(x => (x.target == BindingTarget.css) && x.targetName == property.name);
    } else {
      return bindings.find(x => (x.target == BindingTarget.property || x.target == BindingTarget.attribute) && x.targetName == property.name);
    }
  }

  //todo: optimize perf, call window.getComputedStyle only once per item, and not per property
  getUnsetValue(designItems: IDesignItem[], property: IProperty) {
    if (property.propertyType == PropertyType.cssValue) {
      if (designItems != null && designItems.length !== 0) {
        if (designItems[0].nodeType == NodeType.Element) {
          let v = window.getComputedStyle(designItems[0].element)[property.name];
          return v;
        }
      }
      return null;
    }
    else
      return property.defaultValue;
  }
}