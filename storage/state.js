// Overall placement and scale for objects in the Omniverse.
// Character part geometry and vehicle/building construction stay in their model files.
export const dimensions = {
  ben: { position: [0, 0, 0], scale: [1, 1, 1] },
  gwen: { position: [0, 0, 0], scale: [1, 1.15, 1] },
  kevin: { position: [0, 0, 0], scale: [1, 1.15, 1] },
  rook: { position: [0, 0, 0], scale: [1, 1.05, 1] },
  rustbucket: { position: [0, 2, 0], scale: [1, 1, 1] },
  kevinStorageUnit: { position: [0, 0, 0], scale: [1, 1, 1] },
  earth: { position: [4.5, 0, 0], radius: 2.05 },
  moon: { position: [6.8, 0.2, -1.5], radius: 0.35 },
  sun: { position: [-50, 0, 0], radius: 30 }
};

// Runtime state, separate from static model dimensions.
export const state = {};
