//TODO: undefined limts get the rest of available resources evenly distributed

const express = require("express");
const submissionController = require("../controller/submissionController");
const router = express.Router();

router.get("/", async (req, res) => {
  res.send("/submission endpoint");
});

router.post("/upload/", submissionController.postSubmissionFile);
router.delete("/:id/", submissionController.removeSubmission);

module.exports = router;
