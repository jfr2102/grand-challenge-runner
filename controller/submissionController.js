const constraintsController = require("../controller/constraintsController");
const constraintsControllerHelper = require("../controller/constraintsControllerHelper");
const experimentController = require("../controller/experimentController");
const short = require("short-uuid");

const postSubmissionFile = async (req, res) => {
  //TODO handle other names?
  file = req.files?.submission_stack;
  if (!file) {
    res.status(500).send("No Submission File found. Please use key 'submission_stack'");
  }
  const submissionUUID = short.generate();
  const fileName = `upload/${submissionUUID}-docker-stack.yml`;
  await file?.mv(fileName);
  const deployFileName = `deploy/${submissionUUID}-docker-stack.yaml`;
  const submission = constraintsController.processConstraints(file, deployFileName);

  // maybe handy later, for now we only care about workers
  // const labels = constraintsController.readLabels(file);

  if (submission.success) {
    const result = await experimentController.runExperiment(deployFileName, submissionUUID);
    console.log("Result: ", result);
    res.status(result ? 500 : 200).send("Deployed " + deployFileName + (result ? result : ""));
  } else {
    res.status(500).send("Invalid Submission: " + submission.message);
  }
};

const removeSubmission = async (req, res) => {
  submisisonId = req.params.id;
  const success = experimentController.removeStack(submisisonId);
  if (success) {
    res.status(200).send("Removed Stack " + submisisonId);
  } else {
    res.status(500).send("Error, cannot remove " + submisisonId);
  }
};

const injectChaos = async (req, res) => {
  submisisonId = req.params.id;
  file = constraintsControllerHelper.loadYmlFromFileSystem(
    `deploy/${submisisonId}-docker-stack.yaml`
  );
  const targetServiceInstances = constraintsController.getTargetServiceInstanceList(
    file,
    req.body.nodeType
  );
  const result = experimentController.injectChaosToOne(
    submisisonId,
    targetServiceInstances,
    req.body.operation
  );
  res.send(result);
};

module.exports = {
  postSubmissionFile,
  removeSubmission,
  injectChaos,
};
