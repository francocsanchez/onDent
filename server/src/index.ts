import "colors";
import server from "./server";

const port = process.env.PORT || 4000;
const host = "0.0.0.0";

server.listen(Number(port), host, () => {
  console.log("────────────────────────────────────────".gray);
  console.log("🚀 Server started successfully".green.bold);
  console.log(
    `📡 Listening on port: ${port}`.cyan
  );
  console.log(
    `🌐 URL: http://${host}:${port}`.blue.underline
  );
  console.log("────────────────────────────────────────".gray);
});
