const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const router = express.Router();

const { v4: uuidv4 } = require("uuid");
const { fstat } = require("fs");
var experiments = [];
var busy = false;

router.get("/", async (req, res) => {
  res.send("/submission endpoint");
});

router.post("/upload/", async (req, res) => {
  console.log("START: Experiments: " + experiments.length, ": ", experiments);
  console.log("BUSY: ", busy);

  file = req.files.myfile;
  const fileName = `upload/${uuidv4()}docker-stack.yml`;
  file.mv(fileName);
  res.status(200).send("ok");

  experiments = [...experiments, fileName];

  if (experiments.length == 1) {
    await runExperiment(fileName);
  } else {
    if (!busy) {
      const file = experiments.shift();
      runExperiment(file);
    }
  }
});

const runExperiment = async (compose_file) => {
  console.log("start experiment");
  busy = true;

  var command = `docker stack deploy --compose-file ${compose_file} benchmarkApp`;

  if (process.env.ENV === "dev") {
    // command = `docker-compose -f ${compose_file} up`;
    command = "docker ps -a";
    console.log("dev env: " + command);
  }
  exec(command, (err, output) => {
    if (err) {
      console.error("could not execute command: ", err);
      return err;
    }
    console.log("Output: \n", output);
  });

  setTimeout(() => {
    console.log("finish experiment");
    experiments.shift();
    fs.unlink(compose_file, (err) => {
      if (err) return console.log(err);
    });
    console.log("CALLBACK: Experiments: " + experiments.length, ": ", experiments);
    busy = false;
  }, 10000);
};

module.exports = router;
