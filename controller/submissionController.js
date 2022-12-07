const { v4: uuidv4 } = require("uuid");
const constraintsController = require("../controller/constraintsController");
const experimentController = require("../controller/experimentController");

const postSubmissionFile = async (req, res) => {
  file = req.files.myfile;
  const fileUUID = uuidv4();
  const fileName = `upload/${fileUUID}docker-stack.yml`;
  await file.mv(fileName);

  const deployFileName = constraintsController.processConstraints(file, fileName, fileUUID);

  if (deployFileName) {
    experimentController.runExperiment(deployFileName);
    res.status(200).send("ok");
  } else {
    res.status(500).send("Invalid Resource Restrictions");
  }
};

module.exports = {
  postSubmissionFile,
};
