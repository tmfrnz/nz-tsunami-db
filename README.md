## The GNS New Zealand Tsunami Database

Based on the Web interface for NIWA's "The New Zealand Palaeo-tsunami Database"

Site: https://ptdb.niwa.co.nz
Code: https://github.com/niwa/tsunami-db

--

### Deploy

This assumes that GitHub Pages is enabled for this repository and is configured to built the site from the '/docs' folder of the gh-pages branch

#### 1. Bring in changes into gh-pages branch
To bring in your changes from the 'main' branch into your 'gh-pages' branch run
`git merge --no-ff main`

Alternatively you can use merge the changes online by

1. creating a Pull Request: see https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request
2. merge the Pull Request: see https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request

#### 2. Optimise and bundle
Optimisation and bundling is done using requirejs optimizer (see http://requirejs.org/docs/optimization.html for installing requirejs). Once installed, run from the repository root (branch 'gh-pages')
`r.js -o app/app.build.js`
This will generate all files inside a `/docs` folder within the repository (the target directory is set here: https://github.com/dumparkltd/nz-tsunami-db/blob/master/app/app.build.js#L4)

The content of the build folder can now be deployed to any webhost or commited to gh-pages (see below)

#### Deploy to gh-pages

1. commit your generated files: `git add --all`, then `git commit -m 'update message'`
2. publish changes to online gh-pages branch: `git push origin gh-pages`
