import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Force dark mode so shadcn components pick up our dark theme variables
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
