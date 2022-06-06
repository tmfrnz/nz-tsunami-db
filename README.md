## The GNS New Zealand Tsunami Database - Under Development

Based on the Web interface for NIWA's "The New Zealand Palaeo-tsunami Database"

Site: https://ptdb.niwa.co.nz
Code: https://github.com/niwa/tsunami-db

--

### Deploy
#### Optimise and bundle
Optimisation and bundling is done using requirejs optimizer (see http://requirejs.org/docs/optimization.html for installing requirejs). Once installed, run from the repository root (branch master or whatever branch/tag you are seeking to deploy)
`r.js -o app/app.build.js`
This will generate all files inside a `/build` folder within the repository (you can changet the target directory here: https://github.com/dumparkltd/tsunami-db/blob/master/app/app.build.js#L4)

The content of the build folder can now be deployed to any webhost or commited to gh-pages (see below)

#### Commit to gh-pages branch
Unfortunately there is no automated deploy script in place to deploy to GitHub pages.
To do so manually, follow these steps

Option A (recommended):
_assuming you have cloned the repository twice, once for the source branch (master, etc) and once for the target branch (gh-pages)_
1. delete content of target branch
2. copy content of build folder to target branch
3. commit changes (`git add --all`, `git commit -m 'update message'`)
4. publish changes to target/gh-pages branch (`git push origin gh-pages` or to force `git push -f origin gh-pages:gh-pages`)

Option B
_assuming you have cloned the repository only once_
1. copy content of build folder to a folder outside the repository
2. switch to target branch (`git checkout gh-pages`)
3. delete content of target branch
4. copy content of folder outside repository to target branch
5. commit changes (`git add --all`, `git commit -m 'update message'`)
6. publish changes to target/gh-pages branch (`git push origin gh-pages` or to force `git push -f origin gh-pages:gh-pages`)
