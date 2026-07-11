import { useEffect, useState } from "react";

const MOBILE_MAX_WIDTH = 768;

// 画面幅ベースでモバイル判定する（UA判定には依存しない）
export function useDeviceMode() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_MAX_WIDTH);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_MAX_WIDTH);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { isMobile };
}
