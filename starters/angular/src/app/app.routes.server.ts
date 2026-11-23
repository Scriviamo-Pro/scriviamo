import {RenderMode, ServerRoute} from "@angular/ssr"

// Documents change as people save them, so every page is rendered for each request.
export const serverRoutes: ServerRoute[] = [{path: "**", renderMode: RenderMode.Server}]
