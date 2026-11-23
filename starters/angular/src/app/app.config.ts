import {provideHttpClient, withFetch} from "@angular/common/http"
import {ApplicationConfig, provideBrowserGlobalErrorListeners} from "@angular/core"
import {provideClientHydration, withEventReplay} from "@angular/platform-browser"
import {provideRouter, withComponentInputBinding} from "@angular/router"
import {routes} from "./app.routes"

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    // The page the server rendered is reused, and what it fetched isn't fetched again.
    provideClientHydration(withEventReplay())
  ]
}
