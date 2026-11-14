import React from "react";
import ReactDOM from "react-dom/client";
import bridge from "@vkontakte/vk-bridge";
import App from "./App";
import "./style.css";

bridge.send("VKWebAppInit").catch(() => {
  // The app can also be previewed in a regular browser.
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
