export declare type ScriptCommands = OpenScreen | OpenUrl | OpenDialog | CloseDialog |
  ToggleSignalValue | SetSignalValue | IncrementSignalValue | DecrementSignalValue |
  SetBitInSignal | ClearBitInSignal | ToggleBitInSignal | Console | CalculateSignalValue |
  Javascript | SetElementProperty | Delay | SwitchLanguage |
  Login | Logout;


/* 
TODO:
Indirect Values in Scripts:
 
Indirection Source:
Object Values,
Current Element Property
*/

/*export interface Description {
  type: 'Description';
  description?: string;
}

export interface Label {
  type: 'Label';
  name: string;
}

export interface Condition {
  type: 'Condition';
  value1: any;
  value2?: any;
  comparisonType: '==null' | '!=null' | '==true' | '==false' | '==' | '!=' | '>' | '<' | '>=' | '<=';
  labelTrue?: string;
  labelFalse?: string;
}*/

export interface OpenScreen {
  type: 'OpenScreen';
  /**
   * Name of the Screen
   * @TJS-format screen
   */
  screen: string;
  /**
   * If signals in screen are defined relative (starting with a '.'), this will be prepended
   */
  relativeSignalsPath?: string;
  noHistory?: boolean;
}

export interface OpenDialog {
  type: 'OpenDialog';
  /**
   * Name of the Screen
   * @TJS-format screen
   */
  screen: string;
  title?: string;
  /**
   * If signals in screen are defined relative (starting with a '.'), this will be prepended
   */
  relativeSignalsPath?: string;
  moveable?: boolean;
  closeable?: boolean;

  width?: string;
  height?: string;

  left?: string;
  top?: string;
}

//TODO: dialogId, closeChildDialogs
export interface CloseDialog {
  type: 'CloseDialog';
  /**
   * A dialogId. If empty the parent dialog will be closed
   * @TJS-format signal
   */
  //dialogId: string;
}

export interface OpenUrl {
  type: 'OpenUrl';
  url: string;
  /**
   * defaults to '_blank'
   */
  target: string;
  openInDialog: boolean;
}

export interface SetSignalValue {
  type: 'SetSignalValue';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  value: any;
}

export interface ToggleSignalValue {
  type: 'ToggleSignalValue';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
}

export interface IncrementSignalValue {
  type: 'IncrementSignalValue';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  value: number;
}

export interface CalculateSignalValue {
  type: 'CalculateSignalValue';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  targetSignal: string;
  /**
   * A formula to calculate the new signal value, can contain other signals in angle brackets: {}
   * Example: {adapter.0.level} * 100 + 30
   */
  formula: string;
}

export interface DecrementSignalValue {
  type: 'DecrementSignalValue';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  value: number;
}

export interface SetBitInSignal {
  type: 'SetBitInSignal';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  bitNumber: number;
}
export interface ClearBitInSignal {
  type: 'ClearBitInSignal';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  bitNumber: number;
}
export interface ToggleBitInSignal {
  type: 'ToggleBitInSignal';
  /**
   * Name of the signal
   * @TJS-format signal
   */
  signal: string;
  bitNumber: number;
}

export interface Javascript {
  type: 'Javascript';
  /**
   * Usable objects in Script: 
   * context : {event : Event, element: Element, shadowRoot: ShadowRoot, instance: Element }
   * @TJS-format script
   */
  script: string;
}

export interface SetElementProperty {
  type: 'SetElementProperty';
  /**
   * what of the elements do you want to set
   */
  target: 'property' | 'attribute' | 'css' | 'class';
  /**
   * where to search for the elements
   */
  targetSelectorTarget: 'currentScreen' | 'parentScreen' | 'currentElement' | 'parentElement';
  /**
   * css selector to find elements, if empty the targetSelectorTarget is used
   */
  targetSelector: string;
  /**
   * name of property/attribute or css value you want to set
   */
  name: string;
  /**
 * only for class
 */
  mode: 'add' | 'remove' | 'toggle';
  /**
   * value you want to set
   */
  value: any;
}

export interface Delay {
  type: 'Delay';
  /**
   * miliseconds to delay
   */
  value: number;
}

export interface Console {
  type: 'Console';
  /**
  * target where to log
  */
  target: 'log' | 'info' | 'debug' | 'warn' | 'error';
  /**
   * console message
   */
  message: string;
}

export interface SwitchLanguage {
  type: 'SwitchLanguage';
  language: string;
}

export interface Logout {
  type: 'Logout';
}

export interface Login {
  type: 'Login';
  /**
  * username
  */
  username: 'string';
  /**
   * password
   */
  password: string;
}