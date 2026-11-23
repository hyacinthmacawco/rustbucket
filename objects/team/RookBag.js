import { Bag } from "./Bag.js";

export class RookBag extends Bag {
  constructor(parent, position) {
    super(parent, position, "Rook", 0x3d6177);
  }
}
