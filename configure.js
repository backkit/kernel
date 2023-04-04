const path = require('path');
const autoconf = require("@backkit/autoconf");

autoconf('kernel')
.generator(self => ([
  {
    putFileOnce: `${self.rootServiceDir}${path.sep}..${path.sep}index.js`,
    content: 'require("@backkit/kernel")({appdir: `${__dirname}`});'
  },
  {
    putFileOnce: `${self.rootServiceDir}${path.sep}.gitkeep`
  }
]))
.default(self => ({}))
.prompt(self => ([]))
.run()
