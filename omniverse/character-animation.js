export function installCharacterAnimation(root) {
  const parts = root.children.filter(child => child.isMesh || child.isGroup);
  const base = parts.map(part => ({
    part,
    rotation: part.rotation.clone(),
    position: part.position.clone()
  }));
  let mode = "idle";
  let elapsed = 0;
  root.setAnimation = name => { mode = name; };
  root.update = dt => {
    elapsed += Math.min(dt, 0.05);
    const walking = mode === "walk" || mode === "run";
    const swing = walking ? Math.sin(elapsed * (mode === "run" ? 12 : 7)) : 0;
    for (const item of base) {
      const {part, rotation, position} = item;
      part.rotation.copy(rotation);
      part.position.copy(position);
      if (!walking) continue;
      const y = position.y;
      const side = position.x < 0 ? -1 : 1;
      if (y < 1.55) part.rotation.x += swing * 0.22 * side;
      else if (y > 1.7 && y < 2.35) part.rotation.x -= swing * 0.12 * side;
    }
    root.position.y += walking ? Math.abs(Math.sin(elapsed * 14)) * 0.003 : 0;
  };
}
