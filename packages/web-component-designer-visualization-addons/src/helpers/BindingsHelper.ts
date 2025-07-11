import { TypedEvent, cssFromString } from "@node-projects/base-custom-webcomponent";
import { VisualizationBinding } from "../interfaces/VisualizationBinding.js";
import { State, VisualizationHandler } from "../interfaces/VisualizationHandler.js";
import { BindingTarget } from "@node-projects/web-component-designer/dist/elements/item/BindingTarget.js";
import { PropertiesHelper } from "@node-projects/web-component-designer/dist/elements/services/propertiesService/services/PropertiesHelper.js";

//;,[ are not allowed in bindings, so they could be used for a short form...

export type SpecialValueHandler = { valueProvider: (propertyName: string, context: { element: Element, binding: namedBinding, relativeSignalPath: string, root: HTMLElement, [key: string]: any }) => any, valueChangedCallbacks: Map<string, (() => void)[]> }

export const bindingPrefixProperty = 'bind-prop:';
export const bindingPrefixAttribute = 'bind-attr:';
export const bindingPrefixClass = 'bind-class:';
export const bindingPrefixCss = 'bind-css:';
export const bindingPrefixCssVar = 'bind-cssvar:';
export const bindingPrefixContent = 'bind-content:';
export const bindingPrefixVisible = 'bind-visible:';
export const bindingPrefixInsideCss = 'bind(';
export const bindingPrefixInsideCssVarName = '--tmpBinding_';

export const bindingsInCssRegex = /{{(.*)}}/;

export type namedBinding = [name: string, binding: VisualizationBinding];

export function isLit(element: Element) {
  //@ts-ignore
  return element.constructor?.elementProperties != null;
}

export function parseBindingString(id: string) {
  let parts: string[] = [];
  let signals: string[] = [];
  let tx = '';
  for (let n = 0; n < id.length; n++) {
    if (id[n] == '{') {
      parts.push(tx);
      tx = '';
    } else if (id[n] == '}') {
      signals.push(tx);
      tx = '';
    } else {
      tx += id[n];
    }
  }
  parts.push(tx);
  return { parts, signals };
}

export function getNestedProperty(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }

  return current;
}

class IndirectSignal {
  private parts: string[];
  private signals: string[];
  private values: string[];
  private unsubscribeTargetValue: [((id: string, value: any) => void), any];
  private cleanupCalls = [];
  private combinedName: string;
  private disposed: boolean;
  private valueChangedCb: (value: any) => void
  private visualizationHandler: VisualizationHandler;
  private element: Element;
  private relativeSignalPath: string;

  constructor(bindingsHelper: BindingsHelper, visualizationHandler: VisualizationHandler, id: string, valueChangedCb: (value: State) => void, element: Element, relativeSignalPath: string, root: HTMLElement) {
    this.visualizationHandler = visualizationHandler;
    this.valueChangedCb = valueChangedCb;
    this.element = element;
    this.relativeSignalPath = relativeSignalPath;
    this.parseIndirectBinding(id);
    this.values = new Array(this.signals.length);
    for (let i = 0; i < this.signals.length; i++) {
      let nm = this.signals[i];
      if (nm[0] === '?' && nm[1] === '?') {
        const propNm = nm.substring(2);
        if (!propNm.includes('.')) {
        this.handleValueChanged(root[propNm], i);

        const evtCallback = () => this.handleValueChanged(root[propNm], i);
        const evtName = bindingsHelper.getChangedEventName(root, propNm);
        root.addEventListener(evtName, (evtCallback));
        this.cleanupCalls.push(() => root.removeEventListener(evtName, evtCallback));
        } else {
          const val = getNestedProperty(root, propNm);
          this.handleValueChanged(val, i);
        }
        continue;
      } else if (nm[0] === '#' && nm[1] === '#') {
        const propNm = nm.substring(2);
        if (!propNm.includes('.')) {
        this.handleValueChanged(element[propNm], i);

        const evtCallback = () => this.handleValueChanged(element[propNm], i);
        const evtName = bindingsHelper.getChangedEventName(element, propNm);
        element.addEventListener(evtName, (evtCallback));
        this.cleanupCalls.push(() => element.removeEventListener(evtName, evtCallback));
        } else {
          const val = getNestedProperty(element, propNm);
          this.handleValueChanged(val, i);
        }
        continue;
      } else if (nm[0] === '?') {
        //TODO: react to changes of signal name in prop
        if (!nm.includes('.')) {
        nm = root[nm.substring(1)];
        } else {
          nm = getNestedProperty(root, nm.substring(1));
        }
      } else if (nm[0] === '#') {
        //TODO: react to changes of signal name in prop
        if (!nm.includes('.')) {
          nm = root[nm.substring(1)];
        } else {
          nm = getNestedProperty(root, nm.substring(1));
        }
      }

      let cb = (id: string, value: any) => this.handleValueChanged(value.val, i);
      const subscr = this.visualizationHandler.subscribeState(nm, cb);
      this.cleanupCalls.push(() => this.visualizationHandler.unsubscribeState(this.signals[i], cb, subscr));
    }
  }

  private parseIndirectBinding(id: string) {
    let { parts, signals } = parseBindingString(id);
    this.parts = parts;
    this.signals = signals;

    for (let n = 0; n < signals.length; n++) {
      if (signals[n][0] == '.')
        signals[n] = this.visualizationHandler.getNormalizedSignalName(signals[n], this.relativeSignalPath, this.element);
    }
  }

  handleValueChanged(value: any, index: number) {
    this.values[index] = value;
    let nm = this.parts[0];
    for (let i = 0; i < this.parts.length - 1; i++) {
      let v = this.values[i];
      if (v == null)
        return;
      nm += v + this.parts[i + 1];
    }
    if (nm[0] == '.')
      nm = this.visualizationHandler.getNormalizedSignalName(nm, this.relativeSignalPath, this.element);
    if (this.combinedName != nm) {
      if (this.unsubscribeTargetValue) {
        this.visualizationHandler.unsubscribeState(this.combinedName, this.unsubscribeTargetValue[0], this.unsubscribeTargetValue[1]);
      }
      if (!this.disposed) {
        this.combinedName = nm;
        let cb = (id: string, value: any) => this.valueChangedCb(value);
        this.unsubscribeTargetValue = [cb, this.visualizationHandler.subscribeState(nm, cb)];
      }
    }
  }

  dispose() {
    this.disposed = true;
    if (this.unsubscribeTargetValue) {
      this.visualizationHandler.unsubscribeState(this.combinedName, this.unsubscribeTargetValue[0], this.unsubscribeTargetValue[1]);
      this.unsubscribeTargetValue = null;
    }
    for (let i = 0; i < this.signals.length; i++) {
      this.cleanupCalls[i]();
    }
  }

  setState(value) {
    if (!this.disposed) {
      this.visualizationHandler.setState(this.combinedName, value);
    }
  }
}

export class BindingsHelper {
  _visualizationHandler: VisualizationHandler;
  namedConverterCallback: (converter: string, value: any, element: Element, binding: namedBinding) => any;

  constructor(visualizationHandler: VisualizationHandler) {
    this._visualizationHandler = visualizationHandler;
  }

  getChangedEventName(element: Element, propertyName: string) {
    const posColon = propertyName.indexOf('::');
    if (posColon >= 0)
      return propertyName.substring(posColon + 2);
    if (element instanceof HTMLInputElement)
      return 'change';
    if (element instanceof HTMLSelectElement)
      return 'change';
    if (isLit(element))
      return PropertiesHelper.camelToDashCase(propertyName);
    return PropertiesHelper.camelToDashCase(propertyName) + '-changed';
  }

  //Not allowed chars in Var Names: |{}(),;:[]

  parseBinding(element: Element, name: string, value: string, bindingTarget: BindingTarget, prefix: string): namedBinding {
    //Loooks like:
    //a:var1;b:var2;expression
    //=varname => two way
    //!varname => inverted
    //{...} => json
    let propname = name.substring(prefix.length);
    if (bindingTarget === BindingTarget.cssvar)
      propname = '--' + propname;
    if (!value.startsWith('{')) {
      let binding: VisualizationBinding = {
        signal: value,
        target: bindingTarget
      }

      if (value[0] === '=') {
        value = value.substring(1);
        binding.signal = value;
        if (value.includes('::')) {
          const parts = value.split('::');
          value = parts[0];
          binding.signal = value;
          binding.events = parts[1].split(',');
        }
        binding.twoWay = true;
        if (!binding.events) {
          if (element instanceof HTMLInputElement)
            binding.events = [this.getChangedEventName(element, propname)];
          else if (element instanceof HTMLSelectElement)
            binding.events = [this.getChangedEventName(element, propname)];
          else {
            if (isLit(element)) {
              binding.events = [this.getChangedEventName(element, propname)];
            } else {
              binding.events = [this.getChangedEventName(element, propname)];
              //Binding could be a lit elemnt but not yet loaded
              binding.maybeLitElement = true;
              binding.litEventNames = [this.getChangedEventName(element, propname)];
            }
          }
        }
      }

      if (value[0] === '!') {
        binding.signal = value.substring(1);
        binding.inverted = true;
      }

      if (binding.signal.includes(';')) {
        const parts = binding.signal.split(';');
        binding.expression = parts.pop();
        binding.signal = parts.join(';');
      }

      if (bindingTarget === BindingTarget.cssvar || bindingTarget === BindingTarget.class)
        return [BindingsHelper.dotToCamelCase(propname), binding];
      if (bindingTarget === BindingTarget.attribute)
        return [propname, binding];
      return [PropertiesHelper.dashToCamelCase(propname), binding];
    }

    let binding: VisualizationBinding = JSON.parse(value);
    binding.target = bindingTarget;

    if (binding.twoWay && (binding.events == null || binding.events.length == 0)) {
      if (element instanceof HTMLInputElement)
        binding.events = ['change'];
      else if (element instanceof HTMLSelectElement)
        binding.events = ['change'];
      else {
        binding.events = [this.getChangedEventName(element, propname)];
      }
    }
    if (bindingTarget === BindingTarget.cssvar || bindingTarget === BindingTarget.class)
      return [BindingsHelper.dotToCamelCase(propname), binding];
    if (bindingTarget === BindingTarget.attribute)
      return [propname, binding];
    return [PropertiesHelper.dashToCamelCase(propname), binding];
  }

  serializeBinding(element: Element, targetName: string, binding: VisualizationBinding): [name: string, value: string] {
    let bindingCopy = { ...binding };
    delete bindingCopy.type;
    if (!binding.twoWay) {
      delete bindingCopy.events;
      delete bindingCopy.expressionTwoWay;
    } else if ((binding.events != null && binding.events.length == 1)) {
      if (element instanceof HTMLInputElement && binding.events?.[0] == "change")
        delete bindingCopy.events;
      else if (element instanceof HTMLSelectElement && binding.events?.[0] == "change")
        delete bindingCopy.events;
      else if (isLit(element) && binding.events?.[0] == targetName)
        delete bindingCopy.events;
      else if (!isLit(element) && binding.events?.[0] == targetName + '-changed')
        delete bindingCopy.events;
    }

    const eventsString = bindingCopy.twoWay && bindingCopy.events?.length > 0 ? '::' + bindingCopy.events.join(',') : '';

    let needsJson = false;
    if (eventsString && binding.expression?.includes('::') || binding.expressionTwoWay?.includes('::'))
      needsJson = true;
    if (binding.signal.trim()[0] == '{')
      needsJson = true;

    if (!needsJson && binding.target == BindingTarget.property &&
      !binding.expression && !binding.expressionTwoWay &&
      binding.converter == null &&
      //!binding.type &&
      !binding.historic &&
      !binding.writeBackSignal) {
      if (targetName == 'textContent')
        return [bindingPrefixContent + 'text', (binding.twoWay ? '=' : '') + (binding.inverted ? '!' : '') + binding.signal + (!binding.twoWay && binding.signal.includes(';') ? ';' : '') + eventsString];
      if (targetName == 'innerHTML')
        return [bindingPrefixContent + 'html', (binding.twoWay ? '=' : '') + (binding.inverted ? '!' : '') + binding.signal + (!binding.twoWay && binding.signal.includes(';') ? ';' : '') + eventsString];
      return [bindingPrefixProperty + PropertiesHelper.camelToDashCase(targetName), (binding.twoWay ? '=' : '') + (binding.inverted ? '!' : '') + binding.signal + (!binding.twoWay && binding.signal.includes(';') ? ';' : '') + eventsString];
    }

    //Multi Var Expressions
    if (!needsJson && binding.target == BindingTarget.property &&
      binding.expression && !binding.expression.includes("\n") && !binding.expression.includes(";") &&
      !binding.expressionTwoWay &&
      binding.converter == null &&
      //!binding.type &&
      !binding.historic &&
      !binding.writeBackSignal) {
      if (targetName == 'textContent')
        return [bindingPrefixContent + 'text', (binding.inverted ? '!' : '') + binding.signal + ';' + binding.expression + eventsString];
      if (targetName == 'innerHTML')
        return [bindingPrefixContent + 'html', (binding.inverted ? '!' : '') + binding.signal + ';' + binding.expression + eventsString];
      return [bindingPrefixProperty + PropertiesHelper.camelToDashCase(targetName), (binding.twoWay ? '=' : '') + (binding.inverted ? '!' : '') + binding.signal + ';' + binding.expression + eventsString];
    }

    if (!needsJson && binding.target == BindingTarget.attribute &&
      !binding.expression && !binding.expressionTwoWay &&
      binding.converter == null &&
      //!binding.type &&
      !binding.historic &&
      !binding.writeBackSignal) {
      return [bindingPrefixAttribute + PropertiesHelper.camelToDashCase(targetName), (binding.twoWay ? '=' : '') + (binding.inverted ? '!' : '') + binding.signal + (!binding.twoWay && binding.signal.includes(';') ? ';' : '') + eventsString];
    }

    //Multi Var Expressions
    if (!needsJson && binding.target == BindingTarget.attribute &&
      binding.expression && !binding.expression.includes("\n") && !binding.expression.includes(";") &&
      !binding.expressionTwoWay &&
      binding.converter == null &&
      //!binding.type &&
      !binding.historic &&
      !binding.writeBackSignal) {
      return [bindingPrefixAttribute + PropertiesHelper.camelToDashCase(targetName), (binding.twoWay ? '=' : '') + (binding.inverted ? '!' : '') + binding.signal + ';' + binding.expression + eventsString];
    }

    if (!needsJson && binding.target == BindingTarget.class &&
      !binding.expression && !binding.expressionTwoWay &&
      binding.converter == null &&
      //!binding.type &&
      !binding.historic &&
      !binding.writeBackSignal) {
      return [bindingPrefixClass + PropertiesHelper.camelToDashCase(targetName), (binding.inverted ? '!' : '') + binding.signal + (!binding.twoWay && binding.signal.includes(';') ? ';' : '') + eventsString];
    }

    //Multi Var Expressions
    if (!needsJson && binding.target == BindingTarget.class &&
      binding.expression && !binding.expression.includes("\n") && !binding.expression.includes(";") &&
      !binding.expressionTwoWay &&
      binding.converter == null &&
      //!binding.type &&
      !binding.historic &&
      !binding.writeBackSignal) {
      return [bindingPrefixClass + PropertiesHelper.camelToDashCase(targetName), (binding.inverted ? '!' : '') + binding.signal + ';' + binding.expression + eventsString];
    }

    if (!needsJson && binding.target == BindingTarget.css &&
      !binding.expression && !binding.expressionTwoWay &&
      binding.converter == null &&
      //!binding.type &&
      !binding.historic &&
      !binding.writeBackSignal) {
      return [bindingPrefixCss + PropertiesHelper.camelToDashCase(targetName), (binding.inverted ? '!' : '') + binding.signal + (!binding.twoWay && binding.signal.includes(';') ? ';' : '') + eventsString];
    }


    //Multi Var Expressions
    if (!needsJson && binding.target == BindingTarget.css &&
      binding.expression && !binding.expression.includes("\n") && !binding.expression.includes(";") &&
      !binding.expressionTwoWay &&
      binding.converter == null &&
      //!binding.type &&
      !binding.historic &&
      !binding.writeBackSignal) {
      return [bindingPrefixCss + PropertiesHelper.camelToDashCase(targetName), (binding.inverted ? '!' : '') + binding.signal + ';' + binding.expression + eventsString];
    }

    if (!needsJson && binding.target == BindingTarget.cssvar &&
      !binding.expression && !binding.expressionTwoWay &&
      binding.converter == null &&
      //!binding.type &&
      !binding.historic &&
      !binding.writeBackSignal) {
      return [bindingPrefixCssVar + BindingsHelper.camelToDotCase(targetName.substring(2)), (binding.inverted ? '!' : '') + binding.signal + (!binding.twoWay && binding.signal.includes(';') ? ';' : '') + eventsString];
    }

    //Multi Var Expressions
    if (!needsJson && binding.target == BindingTarget.cssvar &&
      binding.expression && !binding.expression.includes("\n") && !binding.expression.includes(";") &&
      !binding.expressionTwoWay &&
      binding.converter == null &&
      //!binding.type &&
      !binding.historic &&
      !binding.writeBackSignal) {
      return [bindingPrefixCssVar + PropertiesHelper.camelToDashCase(targetName), (binding.inverted ? '!' : '') + binding.signal + ';' + binding.expression + eventsString];
    }

    if (binding.inverted === null || binding.inverted === false) {
      delete bindingCopy.inverted;
    }
    if (binding.expression === null || binding.expression === '') {
      delete bindingCopy.expression;
    }
    if (binding.expressionTwoWay === null || binding.expressionTwoWay === '') {
      delete bindingCopy.expressionTwoWay;
    }
    if (binding.twoWay === null || binding.twoWay === false) {
      delete bindingCopy.twoWay;
    }
    /*if (binding.type === null || binding.type === '') {
      delete bindingCopy.type;
    }*/
    delete bindingCopy.target;

    if (!binding.historic) {
      delete bindingCopy.historic;
    }

    if (binding.target == BindingTarget.content)
      return [bindingPrefixContent + 'html', JSON.stringify(bindingCopy)];
    if (binding.target == BindingTarget.attribute)
      return [bindingPrefixAttribute + PropertiesHelper.camelToDashCase(targetName), JSON.stringify(bindingCopy)];
    if (binding.target == BindingTarget.class)
      return [bindingPrefixClass + BindingsHelper.camelToDotCase(targetName), JSON.stringify(bindingCopy)];
    if (binding.target == BindingTarget.css)
      return [bindingPrefixCss + PropertiesHelper.camelToDashCase(targetName), JSON.stringify(bindingCopy)];
    if (binding.target == BindingTarget.cssvar)
      return [bindingPrefixCssVar + BindingsHelper.camelToDotCase(targetName.substring(2)), JSON.stringify(bindingCopy)];
    if (binding.target == BindingTarget.property && targetName == 'innerHTML')
      return [bindingPrefixContent + 'html', JSON.stringify(bindingCopy)];
    if (binding.target == BindingTarget.property && targetName == 'textContent')
      return [bindingPrefixContent + 'text', JSON.stringify(bindingCopy)];
    return [bindingPrefixProperty + PropertiesHelper.camelToDashCase(targetName), JSON.stringify(bindingCopy)];
  }

  getBindingAttributeName(element: Element, propertyName: string, propertyTarget: BindingTarget) {
    if (propertyTarget == BindingTarget.attribute) {
      return bindingPrefixAttribute + PropertiesHelper.camelToDashCase(propertyName);
    }
    if (propertyTarget == BindingTarget.class) {
      return bindingPrefixClass + BindingsHelper.camelToDotCase(propertyName);
    }
    if (propertyTarget == BindingTarget.css) {
      return bindingPrefixCss + PropertiesHelper.camelToDashCase(propertyName);
    }
    if (propertyTarget == BindingTarget.visible) {
      return bindingPrefixVisible;
    }
    if (propertyTarget == BindingTarget.cssvar) {
      return bindingPrefixCssVar + BindingsHelper.camelToDotCase(propertyName);
    }
    if (propertyTarget == BindingTarget.property && propertyName == 'innerHTML') {
      return bindingPrefixContent + 'html';
    }
    if (propertyTarget == BindingTarget.property && propertyName == 'textContent') {
      return bindingPrefixContent + 'text';
    }
    return bindingPrefixProperty + PropertiesHelper.camelToDashCase(propertyName);
  }

  *getBindings(element: Element) {
    if (element.attributes) {
      for (let a of element.attributes) {
        if (a.name.startsWith(bindingPrefixProperty)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.property, bindingPrefixProperty);
        }
        else if (a.name.startsWith(bindingPrefixContent)) {
          yield this.parseBinding(element, a.name === 'bind-content:html' ? 'bind-prop:inner-h-t-m-l' : 'bind-prop:text-content', a.value, BindingTarget.property, bindingPrefixProperty);
        }
        else if (a.name.startsWith(bindingPrefixAttribute)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.attribute, bindingPrefixAttribute);
        }
        else if (a.name.startsWith(bindingPrefixClass)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.class, bindingPrefixClass);
        }
        else if (a.name.startsWith(bindingPrefixCss)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.css, bindingPrefixCss);
        }
        else if (a.name.startsWith(bindingPrefixCssVar)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.cssvar, bindingPrefixCssVar);
        }
        else if (a.name.startsWith(bindingPrefixVisible)) {
          yield this.parseBinding(element, a.name, a.value, BindingTarget.visible, bindingPrefixVisible);
        }
      }
    }
  }

  applyAllBindings(rootElement: ParentNode, relativeSignalPath: string, root: HTMLElement, specialValueHandler?: SpecialValueHandler): (() => void)[] {
    let retVal: (() => void)[] = [];
    const tw = document.createTreeWalker(rootElement, NodeFilter.SHOW_ELEMENT);
    let e: Element;
    while (e = <Element>tw.nextNode()) {
      const bindings = this.getBindings(e);
      for (let b of bindings) {
        try {
          let applied = this.applyBinding(e, b, relativeSignalPath, root, specialValueHandler);
          retVal.push(applied);

          if (b[1].maybeLitElement && e.localName.includes('-') && !customElements.get(e.localName)) {
            const el = e;
            const bnd = b;
            customElements.whenDefined(e.localName).then(() => {
              if (isLit(el)) {
                applied();
                bnd[1].events = bnd[1].litEventNames;
                retVal.push(this.applyBinding(el, bnd, relativeSignalPath, root, specialValueHandler));
              }
            })
          }
        } catch (err) {
          console.warn("error applying binding", e, b, err)
        }
      }
    }
    return retVal;
  }

  static #cssBindingsVarId = 0;

  async parseCssBindings(sheet: string, element: Element, relativeSignalPath: string, root: HTMLElement): Promise<[stylesheet: CSSStyleSheet, unsub: (() => void)[]]> {
    const parser = (await import("@adobe/css-tools"));
    const ast = parser.parse(sheet);

    let unsub: (() => void)[];
    for (let r of ast.stylesheet.rules) {
      if (r.type === parser.CssTypes.rule) {
        for (const d of r.declarations) {
          if (d.type === parser.CssTypes.declaration) {
            if (d.value.includes(bindingPrefixInsideCss)) {
              const newValue = this.parseCssBinding(d.value, element, relativeSignalPath, root);
              d.value = newValue[0];
              if (unsub) {
                unsub.push(...newValue[1])
              } else {
                unsub = newValue[1];
              }
            }
          }
        }
      }
    }

    const newStyle = parser.stringify(ast, { indent: '', compress: true });
    return [cssFromString(newStyle), unsub];
  }

  parseCssBinding(value: string, element: Element, relativeSignalPath: string, root: HTMLElement, specialValueHandler?: SpecialValueHandler): [name: string, unsub: (() => void)[]] {
    value = value.trim();
    let res = '';
    let tmp = '';
    let inBind = false;
    let binding = '';
    let escape = false;
    let quote = null;
    let unsub: (() => void)[] = [];
    for (let n = 0; n < value.length; n++) {
      const c = value[n];
      if (inBind) {
        if (escape)
          binding += c;
        else if (quote && c === '\\')
          escape = true;
        else if (c === quote)
          quote = null;
        else if (quote === null && c === ')') {
          const id = BindingsHelper.#cssBindingsVarId++;
          const varName = bindingPrefixInsideCssVarName + id;
          let bnd: namedBinding = [varName, { signal: binding, target: BindingTarget.cssvar }];
          if (binding.startsWith('{')) {
            bnd = JSON.parse(binding);
          }
          unsub.push(this.applyBinding(element, bnd, relativeSignalPath, root, specialValueHandler));
          res += 'var(' + varName + ')';
          inBind = false;
          binding = '';
        } else
          binding += c;
      } else if (c === '(') {
        if (tmp !== 'bind') {
          res += tmp;
          res += c;
        } else {
          inBind = true;
          if (value[n + 1] === '\'' || value[n + 1] === '"') {
            n++;
            quote = value[n];
          } else {
            quote = null;
          }
        }
        tmp = '';
      } else if (c === ' ' || c === ',' || c === '(' || c === '+' || c === '-' || c === '*' || c === '/') {
        res += tmp + c;
        tmp = '';
      } else {
        tmp += c;
      }
    }
    return [res + tmp, unsub];
  }

  /**
   * ? = bind to signals in properties
   * ?? = binding to a property
   * $ = bind to a signal configuration
   * § = bind to a special value 
   * @param element 
   * @param binding 
   * @param relativeSignalPath 
   * @param root 
   * @returns 
   */
  applyBinding(element: Element, binding: namedBinding, relativeSignalPath: string, root: HTMLElement, specialValueHandler?: SpecialValueHandler): () => void {
    let unsubscribeList: [id: string, ((id: string, value: any) => void), any][] = [];
    let cleanupCalls: (() => void)[];
    const cleanUp = () => {
      for (const u of unsubscribeList) {
        this._visualizationHandler.unsubscribeState(u[0], u[1], u[2]);
      }
      if (cleanupCalls) {
        for (let e of cleanupCalls) {
          e();
        }
      }
    };

    const signals = binding[1].signal.split(';');
    const signalVars: string[] = new Array(signals.length);
    for (let i = 0; i < signals.length; i++) {
      let sng = signals[i];
      signalVars[i] = '__' + i;
      if (sng.includes(':')) {
        const spl = sng.split(':');
        signalVars[i] = spl[0];
        sng = spl[1];
        signals[i] = sng;
      }
      if (sng[0] === '?') { //access object path in property in custom control, todo: bind direct to property value in local property
        if (root) { //root is null when opened in designer, then do not apply property bindings
          let s = sng.substring(1);
          if (s[0] == '?') {
            signals[i] = s;
          } else {
            signals[i] = root[s];
            if (s[0] === '$') {
              s = s.substring(1);
              signals[i] = '$' + root[s];
            }
            let evtCallback = () => {
              cleanUp();
              this.applyBinding(element, binding, relativeSignalPath, root, specialValueHandler);
            };
            const evtNm = this.getChangedEventName(root, s);
            root.addEventListener(evtNm, evtCallback);
            if (!cleanupCalls)
              cleanupCalls = [];
            cleanupCalls.push(() => root.removeEventListener(evtNm, evtCallback));
          }
        }
      }
      else if (sng[0] === '#') { //access object path in target element        
        let s = sng.substring(1);
        if (s[0] == '#') {
          signals[i] = s;
        } else {
          signals[i] = root[s];
          if (s[0] === '$') {
            s = s.substring(1);
            signals[i] = '$' + root[s];
          }
          let evtCallback = () => {
            cleanUp();
            this.applyBinding(element, binding, relativeSignalPath, root, specialValueHandler);
          };
          const evtNm = this.getChangedEventName(element, s);
          root.addEventListener(evtNm, evtCallback);
          if (!cleanupCalls)
            cleanupCalls = [];
          cleanupCalls.push(() => root.removeEventListener(evtNm, evtCallback));
        }
      }
      if (sng[0] === '.') {
        signals[i] = this._visualizationHandler.getNormalizedSignalName(sng, relativeSignalPath, element);
      }
    }

    let valuesObject = new Array(signals.length);
    for (let i = 0; i < signals.length; i++) {
      const s = signals[i];
      if (s[0] === '?') {
        if (root) {
          const nm = s.substring(1);
          let evtCallback = () => {
            let disableValueChanged = false;
            if (!disableValueChanged) {
              disableValueChanged = true;
              this.handleValueChanged(element, binding, root[nm], valuesObject, i, signalVars, false, relativeSignalPath);
              disableValueChanged = false;
            }
          };
          root.addEventListener(PropertiesHelper.camelToDashCase(nm) + '-changed', evtCallback);
          if (!cleanupCalls)
            cleanupCalls = [];
          cleanupCalls.push(() => root.removeEventListener(PropertiesHelper.camelToDashCase(nm) + '-changed', evtCallback));
          try {
            this.handleValueChanged(element, binding, root[nm], valuesObject, i, signalVars, false, relativeSignalPath);
          } catch (err) {
            console.error(err);
          }
          if (binding[1].twoWay && i == 0) {
            this.addTwoWayBinding(binding, element, v => root[nm] = v);
          }
        }
      } else if (s[0] === '#') { //Binding to element properties
        const nm = s.substring(1);
        let evtCallback = () => {
          let disableValueChanged = false;
          if (!disableValueChanged) {
            disableValueChanged = true;
            this.handleValueChanged(element, binding, element[nm], valuesObject, i, signalVars, false, relativeSignalPath);
            disableValueChanged = false;
          }
        };
        element.addEventListener(PropertiesHelper.camelToDashCase(nm) + '-changed', evtCallback);
        if (!cleanupCalls)
          cleanupCalls = [];
        cleanupCalls.push(() => element.removeEventListener(PropertiesHelper.camelToDashCase(nm) + '-changed', evtCallback));
        try {
          this.handleValueChanged(element, binding, element[nm], valuesObject, i, signalVars, false, relativeSignalPath);
        } catch (err) {
          console.error(err);
        }
        if (binding[1].twoWay && i == 0) {
          this.addTwoWayBinding(binding, element, v => element[nm] = v);
        }
      } else if (s[0] === '$') {
        let mS = s.substring(1);
        if (mS[0] === '.') {
          mS = this._visualizationHandler.getNormalizedSignalName(mS, relativeSignalPath, element);
        }
        this._visualizationHandler.getObject(mS).then(x => {
          this.handleValueChanged(element, binding, x, valuesObject, i, signalVars, true, relativeSignalPath);
        });
      } else if (s[0] === '§') {
        const mS = s.substring(1);
        const value = specialValueHandler.valueProvider(mS, { element, binding, relativeSignalPath, root })
        this.handleValueChanged(element, binding, value, valuesObject, i, signalVars, true, relativeSignalPath);
        if (!specialValueHandler.valueChangedCallbacks)
          specialValueHandler.valueChangedCallbacks = new Map();
        let changeList = specialValueHandler.valueChangedCallbacks.get(mS);
        if (changeList == null) {
          changeList = [];
          specialValueHandler.valueChangedCallbacks.set(mS, changeList);
        }
        changeList.push(() => {
          const value = specialValueHandler.valueProvider(mS, { element, binding, relativeSignalPath, root })
          this.handleValueChanged(element, binding, value, valuesObject, i, signalVars, true, relativeSignalPath);
        });
      } else {
        if (s.includes('{')) {
          let indirectSignal = new IndirectSignal(this, this._visualizationHandler, s, (value) => this.handleValueChanged(element, binding, value.val, valuesObject, i, signalVars, false, relativeSignalPath), element, relativeSignalPath, root);
          if (!cleanupCalls)
            cleanupCalls = [];
          cleanupCalls.push(() => indirectSignal.dispose());
          if (binding[1].twoWay && i == 0) {
            this.addTwoWayBinding(binding, element, v => indirectSignal.setState(v));
          }
        } else {
          if (binding[1].historic) {
            if (binding[1].historic.reloadInterval) {
              let myTimer = { timerId: <any>-1 };
              const loadHistoric = async () => {
                const res = await this._visualizationHandler.getHistoricData(s, binding[1].historic);
                this.handleValueChanged(element, binding, res?.values, valuesObject, i, signalVars, true, relativeSignalPath);
                if (myTimer.timerId !== null)
                  myTimer.timerId = setTimeout(loadHistoric, binding[1].historic.reloadInterval);
              }
              loadHistoric();
              if (!cleanupCalls)
                cleanupCalls = [];
              cleanupCalls.push(() => {
                if (myTimer.timerId > 0)
                  clearTimeout(myTimer.timerId);
                myTimer.timerId = null;
              });
            } else
              this._visualizationHandler.getHistoricData(s, binding[1].historic).then(x => this.handleValueChanged(element, binding, x?.values, valuesObject, i, signalVars, true, relativeSignalPath))
          } else {
            const cb = (id: string, value: State) => this.handleValueChanged(element, binding, value.val, valuesObject, i, signalVars, false, relativeSignalPath);
            unsubscribeList.push([s, cb, this._visualizationHandler.subscribeState(s, cb)]);
            this._visualizationHandler.getState(s).then(x => this.handleValueChanged(element, binding, x?.val, valuesObject, i, signalVars, false, relativeSignalPath));
            if (binding[1].twoWay && i == 0) {
              this.addTwoWayBinding(binding, element, v => this._visualizationHandler.setState(s, v));
            }
          }
        }
      }
    }

    return cleanUp;
  }

  private addTwoWayBinding(binding: namedBinding, element: Element, setter: (value) => void) {
    if (binding[1].expressionTwoWay) {
      if (!binding[1].compiledExpressionTwoWay) {
        if (binding[1].expressionTwoWay.includes('return '))
          binding[1].compiledExpressionTwoWay = new Function(<any>['value'], binding[1].expressionTwoWay);
        else
          binding[1].compiledExpressionTwoWay = new Function(<any>['value'], 'return ' + binding[1].expressionTwoWay);
      }
    }

    for (let e of binding[1].events) {
      const evt = element[e];
      if (evt instanceof TypedEvent) {
        evt.on(() => {
          let v;
          if (binding[1].target == BindingTarget.attribute)
            v = element.getAttribute(binding[0]);
          else
            v = element[binding[0]];
          v = BindingsHelper.parseValueWithType(v, binding);
          if (binding[1].compiledExpressionTwoWay)
            v = binding[1].compiledExpressionTwoWay(v);
          setter(v);
        })
      } else {
        element.addEventListener(e, (evt) => {
          let v;
          if (binding[1].target == BindingTarget.attribute)
            v = element.getAttribute(binding[0]);
          else
            v = element[binding[0]];
          v = BindingsHelper.parseValueWithType(v, binding);
          if (binding[1].compiledExpressionTwoWay)
            v = binding[1].compiledExpressionTwoWay(v);
          setter(v);
        });
      }
    }
  }

  private static parseValueWithType(value, binding: namedBinding) {
    if (binding[1].type) {
      switch (binding[1].type) {
        case 'number':
          return parseFloat(<any>value);
        case 'boolean':
          return value === true || value === 'true' || !!parseInt(<any>value);
        case 'string':
          return value?.toString();
        case 'integer':
          return parseInt(<any>value);
        //case 'bitOfNumber':
        //  return parseInt(<any>value);
      }
    }
    return value;
  }

  handleValueChanged(element: Element, binding: namedBinding, value: any, valuesObject: any[], index: number, signalVarNames: string[], noParse: boolean, relativeSignalPath: string) {
    let v: (number | boolean | string) = value;
    //should this be done??
    if (!noParse && index == 0)
      v = BindingsHelper.parseValueWithType(v, binding);
    valuesObject[index] = v;
    if (binding[1].expression) {
      if (!binding[1].compiledExpression) {
        signalVarNames.push('__res')
        if (binding[1].expression.includes('return '))
          binding[1].compiledExpression = new Function(<any>signalVarNames, binding[1].expression);
        else
          binding[1].compiledExpression = new Function(<any>signalVarNames, 'return ' + binding[1].expression);
      }
      v = binding[1].compiledExpression(...valuesObject);
      valuesObject[signalVarNames.length - 1] = v;
    }
    if (binding[1].converter) {
      if (typeof binding[1].converter === 'string') {
        v = this.namedConverterCallback(<string><never>binding[1].converter, v, element, binding);
      } else {
      const stringValue = <string>(v != null ? v.toString() : v);
      if (stringValue in binding[1].converter) {
        v = new Function(<any>signalVarNames, 'return `' + binding[1].converter[stringValue] + '`')(...valuesObject);
      } else {
        //@ts-ignore
        const nr = parseFloat(v);
        for (let c in binding[1].converter) {
          if (c.length > 2 && c[0] === '>' && c[1] === '=') {
            const wr = parseFloat(c.substring(2));
            if (nr >= wr) {
              v = new Function(<any>signalVarNames, 'return `' + binding[1].converter[c] + '`')(...valuesObject);
              break;
            }
          } else if (c.length > 2 && c[0] === '<' && c[1] === '=') {
            const wr = parseFloat(c.substring(2));
            if (nr <= wr) {
              v = new Function(<any>signalVarNames, 'return `' + binding[1].converter[c] + '`')(...valuesObject);
              break;
            }
          } else if (c.length > 1 && c[0] === '>') {
            const wr = parseFloat(c.substring(1));
            if (nr > wr) {
              v = new Function(<any>signalVarNames, 'return `' + binding[1].converter[c] + '`')(...valuesObject);
              break;
            }
          } else if (c.length > 1 && c[0] === '<') {
            const wr = parseFloat(c.substring(1));
            if (nr < wr) {
              v = new Function(<any>signalVarNames, 'return `' + binding[1].converter[c] + '`')(...valuesObject);
              break;
            }
          } else {
            const sp = c.split('-');
            if (sp.length > 1) {
              if ((sp[0] === '' || nr >= parseFloat(sp[0])) && (sp[1] === '' || parseFloat(sp[1]) >= nr)) {
                v = new Function(<any>signalVarNames, 'return `' + binding[1].converter[c] + '`')(...valuesObject);
                break;
                }
              }
            }
          }
        }
      }
    }
    if (binding[1].inverted)
      v = !v;

    if (binding[1].writeBackSignal) {
      let wb = binding[1].writeBackSignal;
      if (wb[0] === '.') {
        wb = relativeSignalPath + wb;
      }
      this._visualizationHandler.setState(wb, v, true);
    }

    if (binding[1].target == BindingTarget.property)
      element[binding[0]] = v;
    else if (binding[1].target == BindingTarget.attribute)
      element.setAttribute(binding[0], <string>v);
    else if (binding[1].target == BindingTarget.css)
      (<HTMLElement>element).style[binding[0]] = v;
    else if (binding[1].target == BindingTarget.cssvar)
      (<HTMLElement>element).style.setProperty(binding[0], <string>v);
    else if (binding[1].target == BindingTarget.class) {
      if (v)
        (<HTMLElement>element).classList.add(binding[0]);
      else
        (<HTMLElement>element).classList.remove(binding[0]);
    }
    else if (binding[1].target == BindingTarget.visible)
      (<HTMLElement>element).style.visibility = v ? '' : 'collapse';
  }

  public static camelToDotCase(text: string) {
    return text.replace(/([A-Z])/g, (g) => `.${g[0].toLowerCase()}`);
  }

  public static dotToCamelCase(text: string) {
    return text.replace(/\.([a-z])/g, (i) => i[1].toUpperCase());
  }
}

