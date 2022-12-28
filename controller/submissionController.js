const { v4: uuidv4 } = require("uuid");
const constraintsController = require("../controller/constraintsController");
const constraintsControllerHelper = require("../controller/constraintsControllerHelper");
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
    const result = await experimentController.runExperiment(deployFileName, submissionUUID);
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

const injectChaos = async (req, res) => {
  submisisonId = req.params.id;
  file = constraintsControllerHelper.loadYmlFromFileSystem(
    `deploy/${submisisonId}-docker-stack.yaml`
  );
  console.log(file);

  const targetServiceInstances = constraintsController.getTargetServiceInstanceList(
    file,
    req.body.nodeType
  );
  const result = experimentController.injectChaosToOne(
    submisisonId,
    targetServiceInstances,
    req.body.operation
  );
  //
  res.send(result);
};

module.exports = {
  postSubmissionFile,
  removeSubmission,
  injectChaos,
};
