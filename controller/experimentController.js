const { exec } = require("child_process");

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

module.exports = {
  runExperiment,
};
