const { v4: uuidv4 } = require("uuid");
const constraintsController = require("../controller/constraintsController");
const experimentController = require("../controller/experimentController");

const postSubmissionFile = async (req, res) => {
  file = req.files.myfile;
  const submissionUUID = uuidv4();
  const fileName = `upload/${submissionUUID}docker-stack.yml`;
  await file.mv(fileName);

  const deployFileName = constraintsController.processConstraints(file, fileName, submissionUUID);
  const labels = constraintsController.readLabels(file);

  if (deployFileName) {
    const result = await experimentController.runExperiment(deployFileName, submissionUUID, labels);
    res.status(200).send("Deployed " + deployFileName + (result ? result : ""));
  } else {
    res.status(500).send("Invalid Resource Restrictions");
  }
};

const removeSubmission = async (req, res) => {
  submisisonId = req.params.id;
  experimentController.removeStack(submisisonId);
  //TOOD: delte file from disk after some time maybe
  res.status(200).send("Removed: " + submisisonId);
};

module.exports = {
  postSubmissionFile,
  removeSubmission,
};
