module.exports = ({appdir}) => {
  const path = require('path');
  const glob = require('glob');
  const awilix = require('awilix');
  const camelCase = require('camelcase');
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });

  // register appdir
  container.register({
    appdir: awilix.asValue(appdir, { lifetime: awilix.Lifetime.SINGLETON })
  });

  // register services
  require('fs').readdirSync(`${appdir}/services`).forEach(file => {
    if (file.endsWith(".js")) {
      const name = camelCase(file.substr(0, file.length - 3));
      console.log(`loading service from ./services/${file} as "${name}" service`);
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
  });

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
              console.log(`loading ${serviceName} service dependency as "${name}"`);
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