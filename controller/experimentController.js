const { exec, execSync } = require("child_process");
const { NodeSSH } = require("node-ssh");
const { hostname } = require("os");

const runExperiment = async (compose_file, id, labels) => {
  console.log(id);
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

/**
 *
 */
const logIfError = (err) => {
  if (err) console.error("could not execute command: ", err);
};
/**
 * Kill a random worker of a submission stack
 * @param {*} id - submission ID of the stack
 * @param {*} workerServices - service name list of all worker services
 */

const get_random = (list) => {
  return list[Math.floor(Math.random() * list.length)];
};

/**
 * Generate cmdline command to stop a container with given container ID or name
 * @param {*} container The container's id or name to stop
 */
const buildDockerStopCommand = (container) => {
  return `docker stop ${container}`;
};

//TODO generalize to execute any pumba command on a container later
/**
 * execute docker stop command for container ID on local machine
 */
const localKillCommand = (containerId) => {
  console.log("Node is myself -> execute command locally:");
  exec(buildDockerStopCommand(containerId), (err, output) => {
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
      const fullContainerName = `${serviceInstance.name}.${serviceInstance.id}`;
      ssh.execCommand(buildDockerStopCommand(fullContainerName)).then((result) => {
        console.log("STDOUT: ", result.stdout);
        console.log("STDERROR: ", result.stderr);
      });
    });
};

/**
 * get swarm name of the machine this app is running on to decide when to execute command locally and when to send via ssh
 */
const isSelf = (nodeName) => {
  const LOCALHOST = "localhost";
  var hostName;
  try {
    hostName = execSync("docker node inspect self --format '{{.Description.Hostname}}'").toString();
  } catch (e) {
    // console.log(e.error);
    hostName = LOCALHOST;
  }
  return hostName === nodeName || hostName === LOCALHOST;
};

/**
 * Transform multi row output of docker service ps to a list of (containerId, swarmnode) pairs
 * @param {*} output output from docker service ps command with --format {{.Name}};{{.Id}};{{.Node}} --no-trunc options
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
 *
 * @param {*} id
 * @param {*} workerServices
 */
const killOneWorker = (id, workerServices) => {
  // pick a random one of the worker services (if there are several)
  console.log("Worker services: ", workerServices);
  const serviceToKill = get_random(workerServices);
  const fullServiceName = `submission_${id}_${serviceToKill}`;
  console.log("Chosen service: ", fullServiceName);

  // find the IP address of one of the swarm nodes the service is running on
  // first list nodes this service is running one and their container IDs
  exec(
    `docker service ps ${fullServiceName} --format "{{.Name}};{{.Id}};{{.Node}}" --no-trunc`,
    (err, output) => {
      logIfError(err);
      const swarmNodes = getServiceInstanceNodeMappingFromOutput(output);
      swarmNodes = console.log("Nodes to choose from: ", swarmNodes);

      //choose random swarm worker node that runs an instance of this service:
      var serviceInstance = get_random(swarmNodes);
      console.log("Chosen service instance and node: ", serviceInstance);

      if (isSelf(serviceInstance.node)) {
        // execute locally
        localKillCommand(serviceInstance.id);
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
