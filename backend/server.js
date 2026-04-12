const express = require("express");

const artistRoutes = require("./routes/artists");
const eventRoutes = require("./routes/events");

const app = express();
const PORT = 3000;

// Parse incoming JSON request bodies
app.use(express.json());

// Root endpoint - just a health check
app.get("/", (req, res) => {
  res.json({
    message: "Nerdcore Community Platform API is running.",
    version: "0.1.0",
    endpoints: ["/artists", "/events"]
  });
});

// Route groups
app.use("/artists", artistRoutes);
app.use("/events", eventRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/artists`);
});
