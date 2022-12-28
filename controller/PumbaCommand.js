function InvalidCommandException(message) {
  this.message = message;
  this.name = "InvalidCommandException";
}

const Command = {
  stop: "stop",
  kill: "kill",
  netem: "netem",
};

const NetemCommand = {
  delay: "delay",
  loss: "loss",
  duplicate: "duplicate",
  corrupt: "corrupt",
  rate: "rate",
};

class PumbaCommand {
  constructor() {}
  command = "";
  subCommand = "";
  commandOptions;
  globalOptions;
  container = "";

  withCommand(command) {
    if (!Object.values(Command).includes(command)) {
      throw new InvalidCommandException(command + " is not a valid pumba command");
    }
    this.command = command;
    return this;
  }

  withSubCommand(command) {
    if (command === undefined || command == "") {
      return this;
    }
    if (!Object.values(NetemCommand).includes(command)) {
      throw new InvalidCommandException(command + "is not a valid sub command");
    }
    this.subCommand = command;
    return this;
  }

  //TODO: maybe check if valid global options
  withGlobalOptions(options) {
    this.globalOptions = { ...this.globalOptions, ...options };
    return this;
  }

  //TODO: maybe check if command options is allowedfor this command
  withCommandOptions(options) {
    this.commandOptions = { ...this.commandOptions, ...options };
    return this;
  }

  onTargetContainer(container) {
    this.container = container;
    return this;
  }

  reduceOptions(akk, option) {
    return `${akk} --${option[0]} ${option[1]}`;
  }

  build() {
    const globalOptions = this.globalOptions
      ? Object.entries(this.globalOptions).reduce(this.reduceOptions, "")
      : "";
    const commandOptions = this.commandOptions
      ? Object.entries(this.commandOptions).reduce(this.reduceOptions, "")
      : "";
    return `pumba ${globalOptions} ${this.command} ${this.subCommand} ${commandOptions} ${this.container}`.replace(/\s\s+/g, ' ');
  }
}

module.exports = { PumbaCommand, Command, NetemCommand };
