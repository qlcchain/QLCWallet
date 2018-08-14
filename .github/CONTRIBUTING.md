# About the code base

QLC Chain Wallet is a fully client-side signing wallet for sending and receiving [Multidimensional Block Lattice Test coins](https://qlcchain.org). It is written in Typescript and we use [Angular](https://angular.io/) help us write efficient cross browser code.

## Development Prerequisites
- Editor: [VSCode](https://code.visualstudio.com/) with [Angular Extension Pack](https://github.com/doggy8088/angular-extension-pack) or any other editor you like.
- Node Package Manager: [Install npm](https://www.npmjs.com/get-npm)
- Angular CLI: `npm i -g @angular/cli`

## Clone repository and install dependencies
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

# GitHub and working with the team

If you have an idea of an improvement or new feature, consider discussing it first with the team by adding an issue. Maybe someone is already working on it, or have suggestions on how to improve on the idea. 

and there are the branch protection rules:

- master
  - Require pull request reviews before merging
  - Require status checks to pass before merging
  - Require signed commits

- develop
  - Require pull request reviews before merging
  - Require status checks to pass before merging

## Fork and do all your work on a branch
We prefers the standard GitHub workflow. You create a fork of the QLCWallet repository, make branches for features/issues, and commit and push to the develop branch. 

## Create pull requests
Before:
* Review your code locally. Have you followed the guidelines in this document?
* Run tests. Did you consider adding a test case for your feature?
* Commit and push your fork
* Create pull request on the upstream repository:
    * Make sure you add a description that clearly describes the purpose of the PR.
    * If the PR solves one or more issues, please reference these in the description.

After:
* Check that CI completes successfully. If not, fix the problem and push an update.
* Respond to comments and reviews in a timely fashion.

## Resolve conflicts

If time passes between your pull request (PR) submission and the team accepting it, merge conflicts may occur due to activity on master, such as merging other PR's before yours. In order for your PR to be accepted, you must resolve these conflicts.

The preferred process is to rebase your changes, resolve any conflicts, and push your changes again. <sup>[1](#git_rebase_conflicts)</sup> <sup>[2](#git_merge_conflicts)</sup>

* Check out your branch
* git fetch upstream
* git rebase upstream/master
* Resolve conflicts in your favorite editor
* git add filename
* git rebase --continue
* Commit and push your branch

## Consider squashing or amending commits
In the review process, you're likely to get feedback. You'll commit and push more changes, get more feedback, etc. 

This can lead to a messy git history, and can make stuff like bisecting harder.

Once your PR is OK'ed, please squash the commits into a one <sup>[3](#git_squash)</sup> if there are many "noisy" commits with minor changes and fixups. 

If the individual commits are clean and logically separate, then no squashing is necessary.

Note that you can also update the last commit with `git commit --amend`. Say your last commit had a typo. Instead of committing and having to squash it later, simply commit with amend and push the branch.

# Code standard

## Formatting

[Prettier](https://prettier.io/) is used to enforce most of the formatting rules, such as:

```json
{
  "printWidth": 120,
  "singleQuote": true,
  "useTabs": false,
  "tabWidth": 2,
  "semi": true,
  "bracketSpacing": true
}
```

## Coding guidelines
* Flow the Angular [Style Guide](https://angular.io/guide/styleguide)

# General tips for contributors

- Read the [Yellow Paper](https://github.com/qlcchain/YellowPaper)
- Peruse the code and don't be shy about asking questions if there are parts you don't understand.
- Make sure you understand the GitHub workflow.
- Participate in the community by reading and replying to GitHub issues, Reddit posts and tweets. This gives you a great insight into the pain points that exists with the software.

[1]: https://help.github.com/articles/resolving-merge-conflicts-after-a-git-rebase/
[2]: https://help.github.com/articles/resolving-a-merge-conflict-using-the-command-line/
[3]: https://github.com/todotxt/todo.txt-android/wiki/Squash-All-Commits-Related-to-a-Single-Issue-into-a-Single-Commit
