// import { StrictMode } from "react";

import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import Provider from "./Provider";
import "./posthog";
import { router } from "./router";
import "./tailwind.css";

async function bootstrap() {
  if (import.meta.env.VITE_E2E === "true") {
    const { worker } = await import("./test/msw-browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }

  // biome-ignore lint/style/noNonNullAssertion: root element guaranteed to exist
  const rootElement = document.getElementById("root")!;
  if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      // Gosling is incompatible with StrictMode.
      <Provider>
        <RouterProvider router={router} />
      </Provider>,
    );
  }
}

bootstrap();
