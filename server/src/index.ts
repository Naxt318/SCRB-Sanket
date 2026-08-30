import { app } from "./app.js";

const platformPort = process.env.X_ZOHO_CATALYST_LISTEN_PORT ?? process.env.PORT;
const PORT = platformPort ? parseInt(platformPort, 10) : 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SCRB Backend] Server running on http://0.0.0.0:${PORT}`);
});
