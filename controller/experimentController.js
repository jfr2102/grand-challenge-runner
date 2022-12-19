const { exec } = require("child_process");

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
 * Kill a random worker of a submission stack
 * @param {*} id - submission ID of the stack
 * @param {*} workerServices - service name list of all worker services
 */

function get_random(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 *
 * @param {*} id
 * @param {*} workerServices
 */
const killOneWorker = (id, workerServices) => {
  // pick a random one of the worker services (if there are several)
  const serviceToKill = get_random(workerServices);
  const fullServiceName = `submission_${id}_${serviceToKill}`;
  // we want to find the IP address of one of the swarm nodes the service is running on
  // first list nodes this service is running one
  exec(`docker service ps ${fullServiceName} --format "{{.Node}}"`, (err, output) => {
    if (err) {
      console.error("could not execute command: ", err);
    }
    console.log("Output: \n", output);
  });

  // docker service ps submission_5pqg3bcXmXzkMzKyyvtEYn_someService  --format "{{.Node}}"
  // docker node inspect NODENAME --format '{{ .Status.Addr  }}
  // find out on which workers
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
