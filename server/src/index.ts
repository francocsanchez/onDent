import "colors";
import server from "./server";

const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log("────────────────────────────────────────".gray);
  console.log("🚀 Server started successfully".green.bold);
  console.log(
    `📡 Listening on port: ${port}`.cyan
  );
  console.log(
    `🌐 URL: http://localhost:${port}`.blue.underline
  );
  console.log("────────────────────────────────────────".gray);
});
