#!/usr/bin/env node

const chalk = require('chalk')
const semver = require('semver')
const requireVersion = require('../package.json').engines.node
const path = require('path')
const program = require('commander')
const {dev,build, eject } = require('../lib')

if(!semver.satisfies(process.version, requireVersion)) {
  console.log(chalk.red(
    `\n[ngpress] minimum Node version not met:` +
    `\nYou are using Node ${process.version}, but NgPress ` +
    `requires Node ${requireVersion}.\nPlease upgrade your Node version.\n`
  ))
  process.exit(1)
}

program
  .version(require('../package.json').version)
  .usage('<command> [options]')

program
  .command('dev [targetDir')
  .description('start development server')
  .option('-p, --port <port>', 'use specified port (default: 8080)')
  .option('-h, --host <host>', 'use specified host (default: 0.0.0.0)')
  .action((dir = '.', {host, port}) => {
    wrapCommand(dev)(path.resolve(dir), {host, port})
  })

program
  .command('build [targetDir]')
  .description('build dir as static site')
  .option('-d, --dest <outDir>', 'specify build output dir (default: .ngpress/dist)')
  .action((dir = '.', {debug, dest}) => {
    const outDir = dest ? path.resolve(dest) : null
    wrapCommand(build)(path.resolve(dir), {debug, outDir})
  })

program
  .arguments('<command>')
  .action((cmd) => {
    program.outputHelp()
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.\n`))
  })

program.on('--help', () => {
  console.log(`\n Run ${chalk.cyan(`ngpress <command> --help`)} for detailed usage of given command.\n`)
})

program.commands.forEach(c => c.on('--help', () => console.log()))


const enhanceErrorMessage = (methodName, log) => {
  program.Command.prototype[methodName] = function (...args) {
    if(methodName === 'unknownOption' && this._allowUnknownOption) {
      return
    }
    this.outputHelp()
    console.log(`  ${chalk.red(log(...args))}\n`)
    process.exit(1)
  }
}

enhanceErrorMessage('missingArgument', argName => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

enhanceErrorMessage('unknownOption', optionName => {
  return `Unknown option ${chalk.yellow(optionName)}`
})

enhanceErrorMessage('optionMissingArgument', (option, flag) => {
  return `Missing required argument for option ${chalk.yellow(option.flags)}` +
  (flag ? `, got ${chalk.yellow(flag)}` : ``)
})

program.parse(process.argv)


if(!process.argv.slice(2).length) {
  program.outputHelp()
}

function wrapCommand (fn) {
  return (...args) => {
    return fn(...args).catch(err => {
      console.error(chalk.red(err.stack))
    })
  }
}