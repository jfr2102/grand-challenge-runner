const express = require("express");
const submissionController = require("../controller/submissionController");
const router = express.Router();

router.get("/", async (req, res) => {
  res.send("/submission endpoint");
});

router.post("/upload/", submissionController.postSubmissionFile);
router.post("/:id/chaos", submissionController.injectChaos);
router.delete("/:id/", submissionController.removeSubmission);

module.exports = router;
