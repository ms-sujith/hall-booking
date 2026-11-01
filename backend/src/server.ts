import app from "./app";

const PORT = Number(process.env.PORT || 10000);
const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`HallBook backend listening on ${HOST}:${PORT}`);
});

server.on("error", (error) => {
  console.error("HallBook server startup failed:", error);
  process.exit(1);
});