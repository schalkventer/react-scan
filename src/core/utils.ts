import { ReactScanInternals } from '../index';
import type { Render } from './instrumentation/index';

export const NO_OP = () => {
  /**/
};

export const getLabelText = (renders: Render[], env: 'dom' | 'native') => {
  let labelText = '';

  const components = new Map<
    string,
    {
      count: number;
      trigger: boolean;
      forget: boolean;
    }
  >();

  for (let i = 0, len = renders.length; i < len; i++) {
    const render = renders[i];
    const name = render.name;
    if (!name?.trim()) continue;

    const { count, trigger, forget } = components.get(name) ?? {
      count: 0,
      trigger: false,
      forget: false,
    };
    components.set(name, {
      count: count + render.count,
      trigger: trigger || render.trigger,
      forget: forget || render.forget,
    });
  }

  const sortedComponents = Array.from(components.entries()).sort(
    ([, a], [, b]) => b.count - a.count,
  );

  const parts: string[] = [];
  for (const [name, { count, trigger, forget }] of sortedComponents) {
    let text = name;
    if (count > 1) {
      text += ` ×${count}`;
    }
    // skia font doesn't support emojis, maybe we replace with text in native
    if (env === 'dom' && trigger) {
      text = `🔥 ${text}`;
    }
    if (env === 'dom' && forget) {
      text = `${text} ✨`; // no emojis for native
    }
    parts.push(text);
  }

  labelText = parts.join(' ');

  if (!labelText.length) return null;
  if (labelText.length > 20) {
    labelText = `${labelText.slice(0, 20)}…`;
  }
  return labelText;
};
type Listener<T> = (value: T) => void;

export interface StoreMethods<T extends object> {
  subscribe<K extends keyof T>(key: K, listener: Listener<T[K]>): () => void;
  set<K extends keyof T>(key: K, value: T[K]): void;
  setState(state: Partial<T>): void;
  emit<K extends keyof T>(key: K): void;
}

type Store<T extends object> = T & StoreMethods<T>;

export const createStore = <T extends object>(initialData: T): Store<T> => {
  const data: T = { ...initialData };
  const listeners: { [K in keyof T]?: Array<Listener<T[K]>> } = {};

  const emit = <K extends keyof T>(key: K, value: T[K]): void => {
    listeners[key]?.forEach((listener) => listener(value));
  };

  const set = <K extends keyof T>(key: K, value: T[K]): void => {
    if (data[key] !== value) {
      data[key] = value;
      emit(key, value);
    }
  };

  const subscribe = <K extends keyof T>(
    key: K,
    listener: Listener<T[K]>,
  ): (() => void) => {
    if (!listeners[key]) {
      listeners[key] = [];
    }
    listeners[key]!.push(listener);
    listener(data[key]);
    return () => {
      listeners[key] = listeners[key]!.filter((l) => l !== listener);
    };
  };

  const setState = (state: Partial<T>) => {
    for (const key in state) {
      if (state.hasOwnProperty(key)) {
        set(key as keyof T, state[key] as T[keyof T]);
      }
    }
  };

  const proxy = new Proxy(data, {
    get(target, prop, receiver) {
      if (prop === 'subscribe') return subscribe;
      if (prop === 'setState') return setState;
      if (prop === 'emit') return emit;
      if (prop === 'set') return set;

      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if (prop in target) {
        set(prop as keyof T, value as T[keyof T]);
        return true;
      } else {
        throw new Error(`Property "${String(prop)}" does not exist`);
      }
    },
    deleteProperty(_, prop) {
      throw new Error(`Cannot delete property "${String(prop)}" from store`);
    },
  });

  return proxy as Store<T>;
};

export const getCopiedActiveOutlines = () => [
  ...ReactScanInternals.activeOutlines,
];
