// Overall model placement, scale, and camera configurations.
// Individual mesh geometry remains inside each model module.
export const dimensions = {
  ben: { position: [-3, 0, 5], scale: [0.5, 0.5, 0.5] },
  gwen: { position: [-7, 0, -7], scale: [0.69, 0.69, 0.69] },
  kevin: { position: [0, 0, -9], scale: [0.65, 0.65, 0.65] },
  rook: { position: [7, 0, -7], scale: [0.58, 0.58, 0.58] },
  rustbucket: { position: [0, 2, 0], scale: [1, 1, 1] },
  kevinStorageUnit: { position: [0, 0, 0], scale: [1, 1, 1] },
  bellwood: { position: [0, 0, 0], scale: [1, 1, 1] },
  earth: { position: [4.5, 0, 0], radius: 2.05 },
  moon: { position: [6.8, 0.2, -1.5], radius: 0.35 },
  sun: { position: [-50, 0, 0], radius: 30 },

  camera: {
    title: {
      position: [-22.75, 6, 90],
      target: [-22.75, 0, 0],
      fov: 55,
      near: 0.1,
      far: 1000,
      distance: 90,
      minDistance: 45,
      maxDistance: 140,
      yaw: 0,
      pitch: 0.13
    },
    tutorial: {
      position: [0, 5.3, 18.5],
      target: [0, 1.8, 0],
      fov: 43,
      near: 0.1,
      far: 250,
      distance: 18.5,
      minDistance: 8,
      maxDistance: 45,
      yaw: 0,
      pitch: 0.18
    },
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
