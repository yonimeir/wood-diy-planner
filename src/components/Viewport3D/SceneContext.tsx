import { createContext, useContext } from 'react';

interface SceneCtxValue {
  disableOrbit: () => void;
  enableOrbit: () => void;
  snapEnabled: boolean;
}

export const SceneContext = createContext<SceneCtxValue>({
  disableOrbit: () => {},
  enableOrbit: () => {},
  snapEnabled: true,
});

export const useSceneCtx = () => useContext(SceneContext);
