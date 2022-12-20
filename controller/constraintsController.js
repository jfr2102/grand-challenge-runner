const yaml = require("js-yaml");
var Multimap = require("multimap");
const fs = require("fs");
const constraintsControllerHelper = require("../controller/constraintsControllerHelper");

const processConstraints = (compose_file, fileName, fileUUID) => {
  var cpu_sum = 0;
  var memory_sum = 0;
  const doc = constraintsControllerHelper.loadYmlFromFile(compose_file);
  const services = Object.keys(doc.services);
  const missingLimits = new Multimap();
  var missingCPU = 0;
  var missingMemory = 0;
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
        var factor = constraintsControllerHelper.getMemoryUnitFactor(memory_limit);
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
    return;
  }

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
  // const cpu_available_relative = Math.round((cpu_available_total / missingCPU) * 100) / 100;
  const cpu_available_relative = (cpu_available_total / missingCPU).toFixed(2);
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
      cpus: cpu_available_relative,
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
  const deployFileName = `deploy/${fileUUID}-docker-stack.yaml`;
  const success = true;
  fs.writeFileSync(deployFileName, yaml.dump(yaml_file), (err) => {
    if (err) success = false;
    return;
  });

  return success ? deployFileName : undefined;
};
/**
 * Get worker service list for a compose file
 * Nodes without "nodetype" labels are defaulting to worker type
 * @param {*} compose_file compose file to read from
 * @returns List containing service names of all worker labeled services replica times.
 */
const getWorkerServiceList = (compose_file) => {
  var map = new Multimap();
  var workerList = [];
  const doc = constraintsControllerHelper.loadYmlFromFile(compose_file);
  const services = Object.keys(doc.services);
  //TODO: handle cases where not available
  services.map((service) => {
    const label = doc.services[service].deploy?.labels?.nodetype ?? "worker";
    map.set(label, service);

    if (label === "worker") {
      const replicas = doc.services[service].deploy?.replicas ?? 1;
      for (var i = 0; i < replicas; i++) {
        workerList.push(service);
      }
    }
  });
  return workerList;
};

const readLabels = (compose_file) => {
  var map = new Multimap();
  const doc = constraintsControllerHelper.loadYmlFromFile(compose_file);
  const services = Object.keys(doc.services);
  //TODO handle cases where not available
  services?.map((service) => {
    const label = doc.services[service].deploy?.labels?.nodetype ?? "worker";
    map.set(label, service);
  });
  return map;
};

module.exports = {
  processConstraints,
  treatMissingConstraints,
  getWorkerServiceList,
  readLabels,
};
