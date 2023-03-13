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
  command;
  subCommand;
  commandOptions;
  globalOptions;
  container;
  subCommandOptions;

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

  //TODO: maybe check if command options is allowed for this command
  withCommandOptions(options) {
    this.commandOptions = { ...this.commandOptions, ...options };
    return this;
  }

  //TODO: maybe check if command options is allowed for this command
  withSubCommandOptions(options) {
    this.subCommandOptions = { ...this.subCommandOptions, ...options };
    return this;
  }

  onTargetContainer(container) {
    this.container = container;
    return this;
  }

  reduceOptions(akk, option) {
    return `${akk} --${option[0]} ${option[1]}`;
  }

  optionsToString(options) {
    return options ? Object.entries(options).reduce(this.reduceOptions, "") : "";
  }

  build() {
    const globalOptions = this.optionsToString(this.globalOptions);
    const commandOptions = this.optionsToString(this.commandOptions);
    const subCommandOptions = this.optionsToString(this.subCommandOptions);

    return `pumba ${globalOptions} ${this.command} ${subCommandOptions} ${this.subCommand} ${commandOptions} ${this.container}`.replace(
      /\s\s+/g,
      " "
    );
  }
}

module.exports = { PumbaCommand, Command, NetemCommand };
