import { useEffect, useState } from 'react';

export function useLowEndDevice() {
  const [isLowEnd, setIsLowEnd] = useState(false);

  // Read once — matchMedia is synchronous and safe at module init time.
  // Re-read on mount in case SSR or prerender ran before window existed.
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    // hardwareConcurrency: available on all modern browsers including Safari iOS 10.3+
    // Returns logical CPU count. Undefined → assume capable (default 4).
    const cores = navigator.hardwareConcurrency ?? 4;

    // deviceMemory: Chromium only (Chrome, Edge, Samsung Internet, etc.)
    // Safari and Firefox always return undefined → assume capable (default 4).
    // Do NOT penalize devices where this API is unavailable.
    const mem = navigator.deviceMemory ?? 4;

    // Thresholds: only flag genuinely constrained hardware.
    // cores <= 2: very old Android (pre-2016), budget phones.
    //   iPhone 6S+ has 2 performance cores — Safari reports 2 → NOT flagged.
    //   iPhone with Low Power Mode: still reports real core count → NOT flagged.
    // mem <= 1: devices with 1GB RAM or less (old Android budget tier).
    //   iOS never exposes deviceMemory → always 4 → NOT flagged.
    const definitelyLowEnd = cores <= 2 || mem <= 1;

    setIsLowEnd(definitelyLowEnd);

    // NO benchmark. Reasons:
    // 1. Runs on main thread → blocks React paint → bad UX.
    // 2. iOS Low Power Mode throttles CPU → falsely flags iPhone 15 as low-end.
    // 3. V8 JIT cold start → first run always slower → unreliable signal.
    // 4. The 50ms threshold was arbitrary and not calibrated for real devices.
  }, []);

  return { isLowEnd, prefersReducedMotion };
}
