<div align="right">语言:
<a title="中文" href="README_CN.md">:cn:</a>
<a title="英文" href="README.md">:us:</a></div>

# QLCChain Wallet

[![Build Status](https://travis-ci.com/qlcchain/qlcwallet.svg?branch=master)](https://travis-ci.com/qlcchain/qlcwallet)

QLCChain Wallet is a fully client-side signing wallet for sending and receiving [Multidimensional Block Lattice Test coins](https://qlcchain.org) [in your browser](https://wallet.qlcchain.online).

## Development Prerequisites
- Node Package Manager: [Install npm](https://www.npmjs.com/get-npm)
- Angular CLI: `npm i -g @angular/cli`

## Development Guide

### Clone repository and install dependencies
```bash
git clone https://github.com/qlcchain/qlcwallet
cd qlcwallet
npm install
```

## Build Wallet (For Production)

Build a production version of the wallet for web:

```bash
npm run wallet:build
```

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Bugs/Feedback
If you run into any issues, please use the [GitHub Issue Tracker](https://github.com/qlcchain/qlcwallet/issues) 
We are continually improving and adding new features based on the feedback you provide, so please let your opinions be known!

## Acknowledgements
Special thanks to the following!
- [NanoVault](https://github.com/cronoh/nanovault) - Inspired by [Nanovault](https://nanovault.io/) and port some code from it.
- [numtel/nano-webgl-pow](https://github.com/numtel/nano-webgl-pow) - WebGL PoW Implementation
- [jaimehgb/RaiBlocksWebAssemblyPoW](https://github.com/jaimehgb/RaiBlocksWebAssemblyPoW) - CPU PoW Implementation
- [dcposch/blakejs](https://github.com/dcposch/blakejs) - Blake2b Implementation
- [dchest/tweetnacl-js](https://github.com/dchest/tweetnacl-js) - Cryptography Implementation

## Links & Resources

- [QLC Website](https://qlcchain.org)
- [Discord Chat](https://discord.gg/JnCnhjr)
- [Reddit](https://www.reddit.com/r/Qlink/)
- [Medium](https://medium.com/qlc-chain)
- [Twitter](https://twitter.com/QLCchain)
- [Telegram](https://t.me/qlinkmobile)

## License

MIT
