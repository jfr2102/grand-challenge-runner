const { v4: uuidv4 } = require("uuid");
const constraintsController = require("../controller/constraintsController");
const experimentController = require("../controller/experimentController");
const short = require("short-uuid");

const postSubmissionFile = async (req, res) => {
  file = req.files.myfile;
  // const submissionUUID = uuidv4();
  const submissionUUID = short.generate();
  const fileName = `upload/${submissionUUID}-docker-stack.yml`;
  await file.mv(fileName);

  const deployFileName = constraintsController.processConstraints(file, fileName, submissionUUID);

  // maybe handy later, for now we only care about workers
  // const labels = constraintsController.readLabels(file);

  if (deployFileName) {
    const result = await experimentController.runExperiment(deployFileName, submissionUUID, labels);
    res.status(200).send("Deployed " + deployFileName + (result ? result : ""));
  } else {
    res.status(500).send("Invalid Resource Restrictions");
  }
};

const removeSubmission = async (req, res) => {
  submisisonId = req.params.id;
  const success = experimentController.removeStack(submisisonId);
  //TOOD: delte file from disk after some time maybe
  if (success) {
    res.status(200).send("Removed Stack " + submisisonId);
  } else {
    res.status(500).send("Error, cannot remove " + submisisonId);
  }
};

const killWorker = async (req, res) => {
  //TODO: what else can we do instead having to resend the compose file? Could store the relevant info in redis,
  // then fetch once we want to kill a worker
  file = req.files.myfile;
  submisisonId = req.params.id;
  const workerServices = constraintsController.getWorkerServiceList(file);
  const result = experimentController.killOneWorker(submisisonId, workerServices);
  res.send(result);
};

module.exports = {
  postSubmissionFile,
  removeSubmission,
  killWorker,
};
