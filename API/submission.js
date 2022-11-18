const express = require("express");
const { exec } = require("node:child_process");

const router = express.Router();

const { v4: uuidv4 } = require("uuid");
const experiments = [];

router.get("/", async (req, res) => {
  console.log("Get /");
  res.send("You can POST your submission to /submission/upload");
});

router.post("/upload/", function (req, res) {
  console.log("list:", experiments);
  file = req.files.myfile;

  console.log(file); // the uploaded file object

  experiments.push(file.name);

  file.mv("upload/" + uuidv4() + "docker-stack.yml");

  res.status(200).send("ok");
});

const deploySwarm = () => {
  exec("docker ps -a", (err, output) => {
    if (err) {
      console.error("could not execute command: ", err);
      return;
    }
    console.log("Output: \n", output);
  });
};
module.exports = router;
