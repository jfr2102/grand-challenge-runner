const FormData = require("form-data");
const headers = { "API-Key": "74aXtBuGzrDl6Qfuy2cfXUi42M8BTI8J" };
const fs = require("fs");
const axios = require("axios");

const uploadSubmission = async () => {
  // Creating a new form data
  var bodyFormData = new FormData();
  await bodyFormData.append(
    "submission_stack",
    fs.createReadStream("Docker/compose.yml"),
    "submission_stack"
  );

  const url = "http://172.24.33.88:3000/submission/upload";
  let results = axios.post(url, bodyFormData, { headers });
};
console.log("Start:", Date.now());
[...Array(32)].forEach((_) => uploadSubmission());
