module.exports = ({appdir}) => {
  const path = require('path');
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
      service.register().forEach(filepath => {
        const file = path.basename(filepath, path.extname(filepath));
        const name = `res.${serviceName}.${camelCase(file)}`;
        console.log(`loading service dependency as "${name}"`);
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
      });
    }
  }

  const entrypoint = process.env.ENTRYPOINT;
  if (entrypoint) {
    container.resolve(entrypoint).run();
  } else {
    console.error(`ENTRYPOINT env variable is required, it must be the name of an existing service`);
  }
};