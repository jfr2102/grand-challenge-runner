const express = require("express");
const { exec } = require("node:child_process");
const router = express.Router();

const { v4: uuidv4 } = require("uuid");
const experiments = [];

router.get("/", async (req, res) => {
  res.send("/submission endpoint")
});

router.post("/upload/", function (req, res) {
  console.log("list:", experiments);
  file = req.files.myfile;
  console.log(file);
  experiments.push(file.name);
  const fileName = `upload/${uuidv4()}docker-stack.yml`
  file.mv(fileName);
  runExperiment(fileName)
  res.status(200).send("ok");
});

const runExperiment = async (compose_file) => {
  // exec(`docker stack deploy --compose-file ${compose_file} benchmarkApp`, (err, output) => {
    exec(`docker-compose -f ${compose_file} up`, (err, output) => {
      if (err) {
        console.error("could not execute command: ", err);
        return err;
      }
      console.log("Output: \n", output);
    });
}


module.exports = router;
