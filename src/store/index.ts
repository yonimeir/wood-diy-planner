import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoardType } from '../data/boards';

export interface PlacedBoard {
  id: string;
  boardTypeId: string;
  boardType: BoardType;
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  pivotX: number;
  pivotY: number;
  pivotZ: number;
  length: number;
  label?: string;
}

export interface PlacedConnector {
  id: string;
  connectorTypeId: string;
  x: number;
  y: number;
  z: number;
  label?: string;
}

export type TransformMode = 'translate' | 'rotate';
type ActiveTab = 'boards' | 'connectors' | 'properties';
type ViewMode = '3d' | '2d' | 'split';

interface ProjectStore {
  boards: PlacedBoard[];
  pastBoards: PlacedBoard[][];
  futureBoards: PlacedBoard[][];
  undo: () => void;
  redo: () => void;

  connectors: PlacedConnector[];
  selectedBoardId: string | null;
  activeTab: ActiveTab;
  viewMode: ViewMode;
  showGrid: boolean;
  transformMode: TransformMode;
  snapEnabled: boolean;
  saveHistory: () => void;
  addBoard: (board: Omit<PlacedBoard, 'id'>) => string;
  updateBoard: (id: string, changes: Partial<PlacedBoard>, saveHistory?: boolean) => void;
  removeBoard: (id: string) => void;
  selectBoard: (id: string | null) => void;
  duplicateBoard: (id: string) => void;

  addConnector: (connector: Omit<PlacedConnector, 'id'>) => void;
  removeConnector: (id: string) => void;

  setActiveTab: (tab: ActiveTab) => void;
  setViewMode: (mode: ViewMode) => void;
  setTransformMode: (mode: TransformMode) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleBoardSnap: () => void;
  setBoardSnapGap: (gap: number) => void;
  activeSnapGuides: { x?: number; z?: number };
  setSnapGuides: (guides: { x?: number; z?: number }) => void;
  clearSnapGuides: () => void;
  clearAll: () => void;
}

const generateId = () => `item-${Date.now()}-${Math.floor(Math.random()*1000)}`;

const defaultRotation = { rotationX: 0, rotationY: 0, rotationZ: 0, pivotX: 0, pivotY: 0, pivotZ: 0 };

const withHistory = (state: any, newBoards: PlacedBoard[]) => ({
  pastBoards: [...state.pastBoards, state.boards].slice(-50),
  futureBoards: [],
  boards: newBoards
});

export const useStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      boards: [],
      pastBoards: [],
      futureBoards: [],
      
      saveHistory: () => set(state => ({
        pastBoards: [...state.pastBoards, state.boards].slice(-50),
        futureBoards: []
      })),

      undo: () => set(state => {
        if (state.pastBoards.length === 0) return {};
        const previous = state.pastBoards[state.pastBoards.length - 1];
        const newPast = state.pastBoards.slice(0, -1);
        return {
          pastBoards: newPast,
          futureBoards: [state.boards, ...state.futureBoards],
          boards: previous,
          selectedBoardId: null,
        };
      }),

      redo: () => set(state => {
        if (state.futureBoards.length === 0) return {};
        const next = state.futureBoards[0];
        const newFuture = state.futureBoards.slice(1);
        return {
          pastBoards: [...state.pastBoards, state.boards],
          futureBoards: newFuture,
          boards: next,
          selectedBoardId: null,
        };
      }),

      connectors: [],
      selectedBoardId: null,
      activeTab: 'boards',
      viewMode: 'split',
      showGrid: true,
      transformMode: 'translate',
      snapEnabled: true,
      boardSnapEnabled: true,
      boardSnapGap: 0,
      activeSnapGuides: {},

      addBoard: (board) => {
        const id = generateId();
        set(state => {
          const newBoards = [...state.boards, { ...defaultRotation, ...board, id }];
          return withHistory(state, newBoards);
        });
        return id;
      },

      updateBoard: (id, changes, saveHistory = true) => {
        set(state => {
          const newBoards = state.boards.map(b => b.id === id ? { ...b, ...changes } : b);
          return saveHistory ? withHistory(state, newBoards) : { boards: newBoards };
        });
      },

      removeBoard: (id) => {
        set(state => {
          const newBoards = state.boards.filter(b => b.id !== id);
          return {
            ...withHistory(state, newBoards),
            selectedBoardId: state.selectedBoardId === id ? null : state.selectedBoardId,
          };
        });
      },

      selectBoard: (id) => {
        set({ selectedBoardId: id, activeTab: id ? 'properties' : 'boards' });
      },

      duplicateBoard: (id) => {
        const board = get().boards.find(b => b.id === id);
        if (!board) return;
        const newId = generateId();
        const newBoard: PlacedBoard = {
          ...board,
          id: newId,
          x: board.x + board.boardType.width + 10,
          z: board.z + 10,
          pivotX: board.pivotX ?? 0,
          pivotY: board.pivotY ?? 0,
          pivotZ: board.pivotZ ?? 0,
          label: board.label ? `${board.label} (עותק)` : undefined,
        };
        set(state => {
          return {
            ...withHistory(state, [...state.boards, newBoard]),
            selectedBoardId: newId,
            activeTab: 'properties'
          };
        });
      },

      addConnector: (connector) => {
        const id = generateId();
        set(state => ({ connectors: [...state.connectors, { ...connector, id }] }));
      },

      removeConnector: (id) => {
        set(state => ({ connectors: state.connectors.filter(c => c.id !== id) }));
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setTransformMode: (mode) => set({ transformMode: mode }),
      toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),
      toggleSnap: () => set(state => ({ snapEnabled: !state.snapEnabled })),
      toggleBoardSnap: () => set(state => ({ boardSnapEnabled: !state.boardSnapEnabled })),
      setBoardSnapGap: (gap) => set({ boardSnapGap: Math.max(0, gap) }),
      setSnapGuides: (guides) => set({ activeSnapGuides: guides }),
      clearSnapGuides: () => set({ activeSnapGuides: {} }),
      clearAll: () => set(state => ({
        ...withHistory(state, []),
        connectors: [],
        selectedBoardId: null
      })),
    }),
    {
      name: 'wood-planner-storage',
      partialize: (state) => ({ boards: state.boards, connectors: state.connectors }), // Only save essential data
    }
  )
);
