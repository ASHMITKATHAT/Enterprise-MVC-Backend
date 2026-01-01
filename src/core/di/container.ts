type Lifetime = 'singleton' | 'transient' | 'scoped';

interface Registration<T> {
  implementation: new (...args: any[]) => T;
  lifetime: Lifetime;
  instance?: T;
  dependencies: string[];
}

export class Container {
  private registrations = new Map<string, Registration<any>>();
  private scopedInstances = new Map<string, any>();
  private static globalInstance: Container;

  static getInstance(): Container {
    if (!Container.globalInstance) {
      Container.globalInstance = new Container();
    }
    return Container.globalInstance;
  }

  register<T>(token: string, implementation: new (...args: any[]) => T, lifetime: Lifetime = 'transient'): void {
    const paramTypes = (Reflect as any).getMetadata?.('design:paramtypes', implementation) || [];
    this.registrations.set(token, {
      implementation,
      lifetime,
      dependencies: paramTypes.map((_: any, i: number) => `param_${i}`),
    });
  }

  registerSingleton<T>(token: string, implementation: new (...args: any[]) => T): void {
    this.register(token, implementation, 'singleton');
  }

  resolve<T>(token: string, scope?: Map<string, any>): T {
    const registration = this.registrations.get(token);
    if (!registration) throw new Error(`No registration for token: ${token}`);

    if (registration.lifetime === 'singleton' && registration.instance) {
      return registration.instance as T;
    }

    if (registration.lifetime === 'scoped' && scope?.has(token)) {
      return scope.get(token) as T;
    }

    const instance = new registration.implementation();

    if (registration.lifetime === 'singleton') {
      registration.instance = instance;
    }

    if (registration.lifetime === 'scoped' && scope) {
      scope.set(token, instance);
    }

    return instance;
  }

  createScope(): ContainerScope {
    return new ContainerScope(this);
  }

  clear(): void {
    this.registrations.clear();
    this.scopedInstances.clear();
  }
}

export class ContainerScope {
  private instances = new Map<string, any>();

  constructor(private container: Container) {}

  resolve<T>(token: string): T {
    return this.container.resolve<T>(token, this.instances);
  }

  dispose(): void {
    this.instances.clear();
  }
}
