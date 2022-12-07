const yaml = require("js-yaml");

const loadYmlFromFile = (file) => {
  try {
    const yml_file = yaml.load(file.data.toString());
    return yml_file;
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getMemoryUnitFactor = (memory_limit) => {
  switch (memory_limit.slice(-1)) {
    case "b":
    case "B":
      return 1 / (1024 * 1024);
    case "k":
    case "K":
      return 1 / 1024;

    case "m":
    case "M":
      return 1;
    case "g":
    case "G":
      return 1024;
  }
};

module.exports = {
  loadYmlFromFile,
  getMemoryUnitFactor,
};
