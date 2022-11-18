const express = require("express");

const router = express.Router();

const { v4: uuidv4 } = require("uuid");

router.get("/", async (req, res) => {
  console.log(req.body);

  res.send("You can POST your submission to /submission/upload");
});

router.post("/upload/", function (req, res) {
  file = req.files.myfile;

  console.log(file); // the uploaded file object

  console.log;

  file.mv("upload/" + uuidv4() + "docker-stack.yml");

  res.status(200).send("ok");
});

module.exports = router;
