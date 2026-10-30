// Overall placement and scale for objects in the Omniverse.
// Geometry that defines individual model parts stays in each model file.
export const dimensions = {
  ben: { position: [0, 0, 0], scale: [1, 1, 1] },
  gwen: { position: [0, 0, 0], scale: [1, 1.15, 1] },
  kevin: { position: [0, 0, 0], scale: [1, 1.15, 1] },
  rook: { position: [0, 0, 0], scale: [1, 1.05, 1] },
  rustbucket: { position: [0, 2, 0], scale: [1, 1, 1] },
  kevinStorageUnit: { position: [0, 0, 0], scale: [1, 1, 1] },
  earth: { position: [4.5, 0, 0], radius: 2.05 },
  moon: { position: [6.8, 0.2, -1.5], radius: 0.35 },
  sun: { position: [-50, 0, 0], radius: 30 },

  // Shared camera configuration. The target and distance frame the Sun and Earth.
  camera: {
    position: [-22.75, 6, 90],
    target: [-22.75, 0, 0],
    fov: 55,
    near: 0.1,
    far: 1000,
    distance: 90,
    minDistance: 45,
    maxDistance: 140,
    initialYaw: 0,
    initialPitch: 0.13,
    dragSensitivity: 0.006,
    pitchSensitivity: 0.004,
    minPitch: -0.15,
    maxPitch: 1.0
  }
};

// Runtime game state.
export const state = {
  stage: "title"
};
