const { exec, execSync } = require("child_process");
const { NodeSSH } = require("node-ssh");

const runExperiment = async (compose_file, id, labels) => {
  console.log(id);
  if (process.env.ENV === "dev") {
    console.log("DEV, dont run command");
  } else {
    var error;
    console.log("Deploy " + compose_file + "with id: " + id + "\n");
    exec(`docker stack deploy --compose-file ${compose_file} submission_${id}`, (err, output) => {
      if (err) {
        console.error("could not execute command: ", err);
        error = err;
      }
      console.log("Output: \n", output);
    });
    return error;
  }
};

// @TODO move to helper
/**
 * logs if error is not undefined
 */
const logIfError = (err) => {
  if (err) console.error("could not execute command: ", err);
};
/**
 * Kill a random worker of a submission stack
 * @param {*} id - submission ID of the stack
 * @param {*} workerServices - service name list of all worker services
 */

// @TODO move to helper
/**
 * get random element of an array
 */
const get_random = (list) => {
  return list[Math.floor(Math.random() * list.length)];
};

/**
 * Generate cmdline command to stop a container with given container ID or name
 * @param {*} container The container's id or name to stop
 */
const buildDockerStopCommand = (serviceInstance) => {
  const fullContainerName = `${serviceInstance.name}.${serviceInstance.id}`;
  return `docker stop ${fullContainerName}`;
};

//TODO generalize to execute any pumba command on a container later
/**
 * execute docker stop command for container on local machine
 */
const localKillCommand = (serviceInstance) => {
  console.log("Node is myself -> execute command locally:");
  exec(buildDockerStopCommand(serviceInstance), (err, output) => {
    logIfError(err);
    console.log("Output: \n", output);
  });
};

//TODO generalize to execute any pumba command on remote host
/**
 * execute command on remote host given a service instance
 * @param {*} serviceInstance - {name: name, id: id, host: host}
 */
const remoteKillCommand = (serviceInstance) => {
  console.log("Remote Host. Trying to get nodes IP:");
  //get the worker ip and execute on it via ssh
  exec(`docker node inspect ${serviceInstance.node} --format '{{.Status.Addr}}'`, (err, output) => {
    logIfError(err);
    const hostIP = output.replace(/\s/g, "");
    console.log("chosen host's IP: ", hostIP);

    // now we need to send this host a message to kill one of the service instances that he is running
    sendKillCommand(hostIP, serviceInstance);
  });
};

//TODO generalize to execute any pumba command on a container on a given host later
/**
 * send a docker stop command to a containerID on given host (IP)
 * @param {*} hostIP - IP address of the host the container is running on
 * @param {*} containerId - container ID of the container to stop
 */
const sendKillCommand = (hostIP, serviceInstance) => {
  // TODO make username, private key path env file variables
  const ssh = new NodeSSH();
  ssh
    .connect({
      host: hostIP,
      username: "ubuntu",
      privateKeyPath: "/home/ubuntu/.ssh/id_rsa",
    })
    .then(() => {
      // later can send more advanced pumba commands here, we can use container ID or later service name etc. to do some filtering
      // because of swarm the container cant be killed with just the id or name but we need the combination
      ssh.execCommand(buildDockerStopCommand(serviceInstance)).then((result) => {
        console.log("STDOUT: ", result.stdout);
        console.log("STDERROR: ", result.stderr);
      });
    });
};

/**
 * get swarm name of the machine this app is running on to decide when to execute command locally and when to send via ssh
 */
const isSelf = (nodeName) => {
  var hostName;
  try {
    hostName = execSync("docker node inspect self --format '{{.Description.Hostname}}'").toString();
    console.log("HOSTNAME: ", hostName, "; ", hostName.length());
    console.log("VS. NODE NAME: ", nodeName, "; ", nodeName.length());
  } catch (e) {
    // console.log(e.error);
    return true;
  }
  return hostName === nodeName;
};

/**
 * Transform multi row output of docker service ps to a list of (containerId, swarmnode) pairs
 * @param {*} output output from docker service ps command with --format {{.Name}};{{.ID}};{{.Node}} --no-trunc options
 */
const getServiceInstanceNodeMappingFromOutput = (output) => {
  var mapping = [];
  output.split("\n").forEach((line) => {
    const cleanedLine = line.replace(/\s/g, "");
    if (cleanedLine.length > 0) {
      const splitLine = cleanedLine.split(";");
      mapping.push({ name: splitLine[0], id: splitLine[1], node: splitLine[2] });
    }
  });
  return mapping;
};

/**
 * Kill / stop a single random worker container of a given stack
 * @param {*} id submisison / stack id
 * @param {*} workerServices list of worker services with duplicates to weight replica count
 */
const killOneWorker = (id, workerServices) => {
  console.log("Worker services: ", workerServices);
  const serviceToKill = get_random(workerServices);
  const fullServiceName = `submission_${id}_${serviceToKill}`;
  console.log("Chosen service: ", fullServiceName);

  // find the IP address of one of the swarm nodes the service is running on
  // first list nodes this service is running one and their container IDs
  exec(
    `docker service ps ${fullServiceName} --format "{{.Name}};{{.ID}};{{.Node}}" --no-trunc --filter desired-state=running`,
    (err, output) => {
      logIfError(err);
      const swarmNodes = getServiceInstanceNodeMappingFromOutput(output);
      console.log("Containers of this service to choose from: ", swarmNodes);

      //choose random swarm worker node that runs an instance of this service:
      var serviceInstance = get_random(swarmNodes);
      console.log("Chosen service instance and node: ", serviceInstance);

      if (isSelf(serviceInstance.node)) {
        // execute locally
        localKillCommand(serviceInstance);
      } else {
        remoteKillCommand(serviceInstance);
      }
    }
  );
};

const removeStack = (id) => {
  console.log(`removing stack: submission_${id}`);
  var error;
  exec(`docker stack rm submission_${id}`, (err, output) => {
    if (err) {
      console.error("could not execute command: ", err);
      error = err;
    }
    console.log("Output: \n", output);
  });
  return error ? true : false;
};

module.exports = {
  runExperiment,
  killOneWorker,
  removeStack,
};
