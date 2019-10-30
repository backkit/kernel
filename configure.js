const fs = require('fs');
const path = require('path');

const skipPrompt = process.env.NO_INTERACTIVE || process.env.NO_PROMPT ? true : false;
const skipAutoconf = process.env.NO_AUTOCONF ? true : false;

const generate = () => {
  const indexPath = `${__dirname}/../../index.js`;
  const servicesPath = `${__dirname}/../../services`;
  // creating entrypoint
  console.log(`creating entry point (index.js)`);
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, 'require("backkit-kernel")({appdir: __dirname})');
  }

  // creating service dir
  console.log(`creating services folder`);
  if (!fs.existsSync(servicesPath)) {
    fs.mkdirSync(servicesPath, {recursive: true});
    fs.writeFileSync(`${servicesPath}/.gitkeep`, '');
  }
};

if (!skipAutoconf) {
  generate();
}
