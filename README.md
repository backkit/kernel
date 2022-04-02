# Backkit Kernel

The kernel is the only required dependency for a project based on backkit

Usualy installed when starting new project, it will install the module, create an entrypoint script (index.js), and precreate services folder if doesn't exist

## install

```sh
# init your project
npm init

# install the kernel
npm install @backkit/kernel --save
```

## runnable service example

services/hello.js

```js
class Hello {
  run() {
    console.log(`hello`) 
  }
}

module.exports = Hello;
```

then start backit app, using `hello` service as entry point

```sh
ENTRYPOINT=hello node index.js
```

## dependency injection example

first let's create a Friend service

services/friend.js

```js
class Friend {
  sayHello() {
    console.log("Hello friend")
  }
}

module.exports = Friend;
```

now let's use Friend service from existing, runnable Hello service

```js
class Hello {
  constructor({friend}) {
    this.friend = friend;
  }

  run() {
    console.log(this.friend.sayHello()); 
  }
}

module.exports = Hello;
```

run it again

```sh
ENTRYPOINT=hello node index.js
```
