type ReactScanInternals = (typeof import('./core/index'))['ReactScanInternals'];
type scan = (typeof import('./index'))['scan'];
declare module globalThis {
  var __REACT_DEVTOOLS_GLOBAL_HOOK__: {
    checkDCE: () => void;
    supportsFiber: boolean;
    renderers: Map<number, Renderer>;
    onScheduleFiberRoot: () => void;
    onCommitFiberRoot: (rendererID: number, root: any) => void;
    onCommitFiberUnmount: () => void;
    inject: (renderer: Renderer) => number;
  };
  var __REACT_SCAN__: {
    ReactScanInternals: ReactScanInternals;
  };
  var reactScan: scan;

  function myGlobalFunction(message: string): void;
}

declare function require(path: string): any;
