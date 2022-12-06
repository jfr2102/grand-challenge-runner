const express = require("express");
const app = express();
const cors = require("cors");
const submission = require("./API/submission");
const fileUpload = require("express-fileupload");
const port = 3000;

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

app.use("/submission", submission);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
