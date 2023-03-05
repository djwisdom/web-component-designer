import { TypedEvent } from "@node-projects/base-custom-webcomponent";
import { IDesignItem } from "../../item/IDesignItem.js";

export interface IStyleRule {
    selector: string;
    declarations: IStyleDeclaration[];
    specificity: number;
    stylesheetName?: string;
}

export interface IStyleDeclaration {
    name: string;
    value: string;
    important: boolean;
    parent: IStyleRule;
}

export interface IStylesheet {
    content: string;
    name: string;
}

export interface IDocumentStylesheet {
    content: string;
    name: string;
    designItem: IDesignItem;
}

export interface IStylesheetService {
    setStylesheets(stylesheets: IStylesheet[]): Promise<void>;
    getStylesheets(): IStylesheet[];

    setDocumentStylesheets(stylesheets: IDocumentStylesheet[]): Promise<void>;

    getAppliedRules(designItem: IDesignItem): IStyleRule[];
    getDeclarations(designItem: IDesignItem, styleName: string): IStyleDeclaration[];
    updateDeclarationValue(declaration: IStyleDeclaration, value: string, important: boolean): boolean;
    insertDeclarationIntoRule(rule: IStyleRule, property: string, value: string, important: boolean): boolean;
    removeDeclarationFromRule(rule: IStyleRule, property: string): boolean;
    updateCompleteStylesheet(name: string, newStyle: string): void;

    stylesheetChanged: TypedEvent<{ name: string, newStyle: string, oldStyle: string, changeSource: 'extern' | 'styleupdate' }>;
    stylesheetsChanged: TypedEvent<void>;
}