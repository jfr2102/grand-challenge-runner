//TODO: undefined limts get the rest of available resources evenly distributed

const express = require("express");
const { exec } = require("child_process");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const experiments = [];
const yaml = require("js-yaml");
var Multimap = require("multimap");
const fs = require("fs");
const { config } = require("process");
router.get("/", async (req, res) => {
  res.send("/submission endpoint");
});

router.post("/upload/", async (req, res) => {
  console.log("list:", experiments);
  file = req.files.myfile;
  experiments.push(file.name);
  const fileName = `upload/${uuidv4()}docker-stack.yml`;
  await file.mv(fileName);
  if (checkConstraints(file, fileName)) {
    runExperiment(fileName);
    res.status(200).send("ok");
  } else {
    res.status(500).send("Invalid Resource Restrictions");
  }
});

const loadYmlFromFile = (file) => {
  try {
    const yml_file = yaml.load(file.data.toString());
    return yml_file;
  } catch (e) {
    console.log(e);
    return null;
  }
};

//TODO move to ConstraintHelper
const getMemoryUnitFactor = (memory_limit) => {
  switch (memory_limit.slice(-1)) {
    case "b":
    case "B":
      return 1 / (1024 * 1024);
    case "k":
    case "K":
      return 1 / 1024;

    case "m":
    case "M":
      return 1;
    case "g":
    case "G":
      return 1024;
  }
};

// TODO move to seperate File for constraints
const checkConstraints = (compose_file, fileName) => {
  var cpu_sum = 0;
  var memory_sum = 0;
  const doc = loadYmlFromFile(compose_file);
  const services = Object.keys(doc.services);
  const missingLimits = new Multimap();
  var missingCPU = 0;
  var missingMemory = 0;

  // read the resource restriction limit from config file
  try {
    const config = yaml.load(fs.readFileSync("config/config.yml", "utf8"));
  } catch (e) {
    console.log(e);
    return;
  }

  // go over all services and sum up resource restrictions * replicas and mark those with mssing ones
  services.map((service) => {
    const limits = doc.services[service].deploy?.resources?.limits;
    if (limits) {
      var replicas = doc.services[service].deploy.replicas;
      replicas ||= 1;

      cpu_limit = limits.cpus;

      if (cpu_limit) {
        cpu_sum += cpu_limit * replicas;
      } else {
        missingLimits.set(service, "CPU");
        missingCPU++;
      }

      memory_limit = limits.memory;
      if (memory_limit) {
        console.log(memory_limit);
        var factor = getMemoryUnitFactor(memory_limit);
        memory_sum += memory_limit.slice(0, -1) * factor;
      } else {
        missingLimits.set(service, "memory");
        missingMemory++;
      }
    } else {
      missingLimits.set(service, "CPU", "Memory");
      missingCPU++;
      missingMemory++;
    }
  });

  if (cpu_sum > config.cpu_limit || memory_sum > config.memory_limit) {
    console.log(`exceeded resources \n CPU sum: ${cpu_sum} Memory sum: ${memory_sum}`);
    return false;
  }

  console.log(
    missingLimits._,
    `\n Missing CPU limit: ${missingCPU} Missing memory limit: ${missingMemory}`
  );

  treatMissingConstraints(
    doc,
    fileName,
    cpu_sum,
    memory_sum,
    config.cpu_limit,
    config.memory_limit,
    missingLimits,
    missingCPU,
    missingMemory
  );
  return true;
};

//move to constraints File
const treatMissingConstraints = (
  yaml_file,
  fileName,
  cpu_sum,
  memory_sum,
  cpu_limit,
  memory_limit,
  missingLimits,
  missingCPU,
  missingMemory
) => {
  //EDIT yaml_file

  fs.writeFile(fileName, yaml.dump(yaml_file), (err) => {
    if (err) return console.log(err);
  });
};

const readLabels = (compose_file) => {
  var map = new Multimap();
  const doc = loadYmlFromFile(compose_file);
  const services = Object.keys(doc.services);

  services.map((service) => {
    const label = doc.services[service].deploy.placement.label;
    map.set(label, service);
  });

  console.log(map);
  return map;
};

const runExperiment = async (compose_file) => {
  if (process.env.ENV === "dev") {
    console.log("dev env");
    exec(`docker-compose -f ${compose_file} up`, (err, output) => {
      if (err) {
        console.error("could not execute command: ", err);
        return err;
      }
      console.log("Output: \n", output);
    });
  } else {
    exec(`docker stack deploy --compose-file ${compose_file} benchmarkApp`, (err, output) => {
      if (err) {
        console.error("could not execute command: ", err);
        return err;
      }
      console.log("Output: \n", output);
    });
  }
};

module.exports = router;
