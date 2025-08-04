export const pickWeightedDebuff = (registry) => {
    const entries = Object.entries(registry).filter(([_, v]) => v.weight > 0);
    const total = entries.reduce((acc, [_, v]) => acc + v.weight, 0);
  
    let rand = Math.random() * total;
    for (const [key, { weight }] of entries) {
      rand -= weight;
      if (rand <= 0) return key;
    }
  
    return entries[0]?.[0] ?? null;
  };