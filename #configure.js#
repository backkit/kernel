const fs = require('fs');
const path = require('path');

const skipPrompt = process.env.NO_INTERACTIVE || process.env.NO_PROMPT ? true : false;
const skipAutoconf = process.env.NO_AUTOCONF ? true : false;

const generate = () => {
  console.log(`writing index.js`);

  if (!fs.existsSync(`${__dirname}/../../index.js`)) {
    fs.writeFileSync(`${__dirname}/../../index.js`, 'require("backkit-kernel")({appdir: __dirname})');
  }
};

if (!skipAutoconf) {
  generate();
}
