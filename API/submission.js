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
  file = req.files.myfile;
  const fileUUID = uuidv4();
  const fileName = `upload/${fileUUID}docker-stack.yml`;
  await file.mv(fileName);
  const deployFileName = processConstraints(file, fileName, fileUUID);

  if (deployFileName) {
    runExperiment(deployFileName);
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
const processConstraints = (compose_file, fileName, fileUUID) => {
  var cpu_sum = 0;
  var memory_sum = 0;
  const doc = loadYmlFromFile(compose_file);
  const services = Object.keys(doc.services);
  const missingLimits = new Multimap();
  var missingCPU = 0;
  var missingMemory = 0;

  // read the resource restriction limit from config file
  var limitConfig;
  try {
    limitConfig = yaml.load(fs.readFileSync("config/config.yml", "utf8"));
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
        missingLimits.set(service, "cpus");
        missingCPU += replicas;
      }

      memory_limit = limits.memory;
      if (memory_limit) {
        // console.log(memory_limit);
        var factor = getMemoryUnitFactor(memory_limit);
        memory_sum += memory_limit.slice(0, -1) * factor;
      } else {
        missingLimits.set(service, "memory");
        missingMemory += replicas;
      }
    } else {
      missingLimits.set(service, "cpus", "memory");
      missingCPU++;
      missingMemory++;
    }
  });

  if (cpu_sum > limitConfig.cpu_limit || memory_sum > limitConfig.memory_limit) {
    console.log(`exceeded resources \n CPU sum: ${cpu_sum} Memory sum: ${memory_sum}`);
    return false;
  }

  // console.log(
  //   missingLimits._,
  //   `\n Missing CPU limit: ${missingCPU} Missing memory limit: ${missingMemory}`
  // );

  const deployFileName = treatMissingConstraints(
    doc,
    fileName,
    fileUUID,
    cpu_sum,
    memory_sum,
    limitConfig.cpu_limit,
    limitConfig.memory_limit,
    missingLimits,
    missingCPU,
    missingMemory
  );

  return deployFileName;
};

//move to constraints File
const treatMissingConstraints = (
  yaml_file,
  fileName,
  fileUUID,
  cpu_sum,
  memory_sum,
  cpu_limit,
  memory_limit,
  missingLimits,
  missingCPU,
  missingMemory
) => {
  const cpu_available_total = cpu_limit - cpu_sum;
  const memory_available_total = memory_limit - memory_sum;

  const cpu_available_relative = Math.round((cpu_available_total / missingCPU) * 100) / 100;
  const memory_available_relative = (memory_available_total / missingMemory).toFixed(2) + "M";

  console.log("cpu limit | memory limit");
  console.log("  ", cpu_limit, " | ", memory_limit);
  console.log("cpu used sum | memory used sum");
  console.log("  ", cpu_sum, " | ", memory_sum);
  console.log("- _____________________________");

  console.log("= ", cpu_available_total, " | ", memory_available_total);
  console.log("missing cpu, missing memory");
  console.log("% ", missingCPU, " | ", missingMemory);
  console.log("= ", cpu_available_relative, " | ", memory_available_relative);

  missingLimits.forEach((value, key) => {
    const LIMITS = {
      cpu: cpu_available_relative,
      memory: memory_available_relative,
    };

    const RESOURCES = {
      limits: LIMITS,
    };

    const DEPLOY = {
      resources: RESOURCES,
    };
    //make sure to not overwrite other things:
    if (!yaml_file.services[key].deploy) {
      yaml_file.services[key]["deploy"] = DEPLOY;
    } else if (!yaml_file.services[key].deploy.resources) {
      yaml_file.services[key].deploy["resources"] = RESOURCES;
    } else if (!yaml_file.services[key].deploy.resources.limits) {
      yaml_file.services[key].deploy.resources["limits"] = LIMITS;
    } else {
      if (value === "cpus")
        yaml_file.services[key].deploy.resources.limits[value] = cpu_available_relative;
      else if (value === "memory")
        yaml_file.services[key].deploy.resources.limits[value] = memory_available_relative;
    }
  });
  // write out to file
  const deployFileName = `deploy/${fileUUID}.yaml`;
  const success = true;
  fs.writeFileSync(deployFileName, yaml.dump(yaml_file), (err) => {
    if (err) success = false;
    return;
  });

  return success ? deployFileName : undefined;
};

// const readLabels = (compose_file) => {
//   var map = new Multimap();
//   const doc = loadYmlFromFile(compose_file);
//   const services = Object.keys(doc.services);
//   TODO: handle cases where not available
//   services.map((service) => {
//     const label = doc.services[service].deploy.placement.label;
//     map.set(label, service);
//   });

//   return map;
// };

const runExperiment = async (compose_file) => {
  if (process.env.ENV === "dev") {
    console.log("DEV, dont run command");
    // exec(`docker-compose -f ${compose_file} up`, (err, output) => {
    //   if (err) {
    //     console.error("could not execute command: ", err);
    //     return err;
    //   }
    //   console.log("Output: \n", output);
    // });
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
