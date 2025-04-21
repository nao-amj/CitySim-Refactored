// Application - central bootstrap for services, controllers, and components
export default class Application {
  constructor() {
    this.services = {};
    this.controllers = {};
    this.components = {};
  }

  // register a service
  registerService(key, instance) {
    this.services[key] = instance;
  }

  // register a controller
  registerController(key, instance) {
    this.controllers[key] = instance;
  }

  // register a component
  registerComponent(key, instance) {
    this.components[key] = instance;
  }

  // initialize all modules: services, controllers, components
  init() {
    Object.values(this.services).forEach(svc => {
      if (typeof svc.init === 'function') svc.init(this);
    });
    Object.values(this.controllers).forEach(ctrl => {
      if (typeof ctrl.init === 'function') ctrl.init(this);
    });
    Object.values(this.components).forEach(cmp => {
      if (typeof cmp.initialize === 'function') cmp.initialize(this);
    });
  }

  // start controllers and show components
  start() {
    Object.values(this.controllers).forEach(ctrl => {
      if (typeof ctrl.start === 'function') ctrl.start(this);
    });
    Object.values(this.components).forEach(cmp => {
      if (typeof cmp.show === 'function') cmp.show(this);
    });
  }
}