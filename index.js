const express = require("express");
const app = express();
const cors = require("cors");
const submission = require("./API/submission");
const fileUpload = require("express-fileupload");
const yaml = require("js-yaml");
const fs = require("fs");
const port = 3000;
console.log("Node version: ", process.version);
let API_KEY;

try {
  config = yaml.load(fs.readFileSync("config/config.yml", "utf8"));
  API_KEY = config.api_key;
} catch (e) {
  console.log(e);
  return;
}

app.use(
  cors({
    origin: ["http://localhost:3000"],
  })
);

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  fileUpload({
    createParentPath: true,
  })
);

app.use((req, res, next) => {
  const apiKey = req.get("API-Key");
  if (!apiKey || apiKey !== API_KEY) {
    res.status(401).send("Unauthorized API KEY");
  } else {
    next();
  }
});

app.use("/submission", submission);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
