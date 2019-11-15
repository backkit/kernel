module.exports = ({appdir}) => {
  const fs = require('fs');
  const path = require('path');
  const glob = require('glob');
  const awilix = require('awilix');
  const camelCase = require('camelcase');
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  let logfn = () => {};

  /**
   * Attempts to register single service by filename
   * ex: registerService('logger')
   * The filename is looked up in ./services folder, by suffixing the service name with .js
   *
   * @param {String} service
   */
  const registerService = service => {
    const file = service.endsWith('.js') ? service : `${service}.js`;
    if (fs.existsSync(`${appdir}/services/${file}`) && file.endsWith(".js")) {
      const name = camelCase(file.substr(0, file.length - 3));
      logfn(`loading service from ./services/${file} as "${name}" service`);
      const mod = require(`${appdir}/services/${file}`);
      if (typeof mod === 'function') {
        if (mod.toString().startsWith('function') || mod.toString().startsWith('class')) {
          container.register({
            [name]: awilix.asClass(mod, { lifetime: awilix.Lifetime.SINGLETON })
          });
        } else {
          container.register({
            [name]: awilix.asFunction(mod, { lifetime: awilix.Lifetime.SINGLETON })
          });
        }
      } else {
        container.register({
          [name]: awilix.asValue(mod, { lifetime: awilix.Lifetime.SINGLETON })
        });
      }
    }
  };

  // attempt to register logger if exists, so kernel can log messages in same format as the rest of the app
  // otherwise, fallsback to console.log
  try {
    registerService(`logger`);
    const logger = container.resolve('logger'); 
    if (logger) {
      logfn = logger.info;
    } else {
      logfn = console.log;
    }
  } catch (ex) {}

  // register appdir
  container.register({
    appdir: awilix.asValue(appdir, { lifetime: awilix.Lifetime.SINGLETON })
  });

  // register services
  fs.readdirSync(`${appdir}/services`).forEach(registerService);


  // register service dependencies
  for (let i in container.registrations) {
    const serviceName = i;
    const service = container.resolve(serviceName);
    if (service.register) {
      const ret = service.register();
      (Array.isArray(ret) ? ret : [ret])
        .forEach(pattern => {
          glob
          .sync(pattern, {})
          .forEach(filepath => {
            if (filepath.startsWith(appdir)) {
              const extname = path.extname(filepath);
              // relative resource path
              const respath = filepath
                .slice(appdir.length) // remove appdir
                .slice(0, -extname.length) // remove file extension
                .slice(1); // remove first '/'
              // service name
              const name = camelCase(respath).replace(/\//g, '.');
              logfn(`loading ${serviceName} service dependency as "${name}"`);
              const mod = require(filepath);
              if (typeof mod === 'function') {
                if (mod.toString().startsWith('function') || mod.toString().startsWith('class')) {
                  container.register({
                    [name]: awilix.asClass(mod, { lifetime: awilix.Lifetime.SINGLETON })
                  });
                } else {
                  container.register({
                    [name]: awilix.asFunction(mod, { lifetime: awilix.Lifetime.SINGLETON })
                  });
                }
              } else {
                container.register({
                  [name]: awilix.asValue(mod, { lifetime: awilix.Lifetime.SINGLETON })
                });
              }
              container.resolve(name); 
            }
          });
        });
    }
  }

  const entrypoint = process.env.ENTRYPOINT;
  if (entrypoint) {
    const runnable = container.resolve(entrypoint);
    if (runnable.run) {
      runnable.run();
    } else {
      console.error(`ENTRYPOINT must be a runnable service`);  
    }
  } else {
    console.error(`ENTRYPOINT env variable is required, it must be the name of an existing service`);
  }
};