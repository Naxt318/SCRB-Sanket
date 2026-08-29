import { app } from "./app.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SCRB Backend] Server running on http://0.0.0.0:${PORT}`);
});
