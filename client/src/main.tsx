import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet } from "react-helmet";

createRoot(document.getElementById("root")!).render(
  <>
    <Helmet>
      <title>SportSync - Your Live Sports Hub</title>
      <meta name="description" content="Real-time scores, match updates, and personalized notifications for all your favorite sports in one place." />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet" />
    </Helmet>
    <App />
  </>
);
