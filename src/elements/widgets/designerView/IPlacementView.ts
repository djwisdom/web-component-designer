import { IDesignItem } from "../../item/IDesignItem";
import { Snaplines } from './Snaplines';

export interface IPlacementView {
  alignOnSnap: boolean;
  alignOnGrid: boolean;
  gridSize: number;
  rootDesignItem: IDesignItem;
  overlayLayer: SVGElement;
  snapLines: Snaplines;
}