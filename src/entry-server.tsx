import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App, { resolvePage } from "./App";
import type { PublicData } from "./types";
export function render(url: string, data: PublicData) {
  const pathname = url.split("?")[0];
  if (pathname.startsWith("/admin"))
    return {
      html: "",
      status: 200,
      title: "Studio Dashboard — DF Creatives",
      description: "DF Creatives content studio",
      image: "",
    };
  const resolved = resolvePage(data, pathname);
  const page = resolved?.page.published;
  return {
    html: renderToString(
      <StaticRouter location={url}>
        <App initialData={data} />
      </StaticRouter>,
    ),
    status: resolved ? 200 : 404,
    title: page?.title || "Page not found — DF Creatives",
    description: page?.description || "Creative minds. Meaningful impact.",
    image:
      page?.image ||
      page?.blocks?.content?.find((b: any) => b.type === "Hero")?.props.image ||
      "",
  };
}
