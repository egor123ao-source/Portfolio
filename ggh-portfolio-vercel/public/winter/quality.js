const MOBILE_QUERY = '(max-width: 760px)';

export function sceneQuality() {
  const mobile = matchMedia(MOBILE_QUERY).matches;
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 8;
  const lowPower = cores <= 4 || memory <= 4;

  if (mobile) {
    return {
      mobile: true,
      pixelRatio: Math.min(devicePixelRatio || 1, 1.35),
      snowflakes: lowPower ? 1500 : 2400,
      trees: 70,
      lampLights: 2,
      fogNear: 12,
      fogFar: 92,
      antialias: false,
    };
  }
  if (lowPower) {
    return {
      mobile: false,
      pixelRatio: Math.min(devicePixelRatio || 1, 1.4),
      snowflakes: 3200,
      trees: 130,
      lampLights: 3,
      fogNear: 16,
      fogFar: 130,
      antialias: true,
    };
  }
  return {
    mobile: false,
    pixelRatio: Math.min(devicePixelRatio || 1, 1.75),
    snowflakes: 6000,
    trees: 190,
    lampLights: 3,
    fogNear: 18,
    fogFar: 150,
    antialias: true,
  };
}
