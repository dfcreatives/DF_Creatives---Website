import { createContext, useContext } from "react";
import type { PublicData } from "./types";
import { settings } from "./default-settings";
export const SiteContext = createContext<PublicData>({
  settings,
  records: [],
  page: null,
  demo: true,
});
export const useSite = () => useContext(SiteContext);
