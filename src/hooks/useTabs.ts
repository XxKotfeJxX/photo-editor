import { useCallback, useMemo, useState } from "react";
import { TabsEngine } from "../core/canvas/TabsEngine";
import type { Tab } from "../core/Tab";

export function useTabs() {
  const engine = useMemo(() => new TabsEngine(), []);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const syncFromEngine = useCallback(() => {
    setTabs([...engine.getAllTabs()]);
    setActiveTabId(engine.activeTabId);
  }, [engine]);

  const createTab = useCallback(
    (name: string): Tab => {
      const tab = engine.createTab(name);
      syncFromEngine();
      return tab;
    },
    [engine, syncFromEngine]
  );

  const closeTab = useCallback(
    (id: string): void => {
      engine.closeTab(id);
      syncFromEngine();
    },
    [engine, syncFromEngine]
  );

  const setActive = useCallback(
    (id: string): void => {
      engine.setActiveTab(id);
      syncFromEngine();
    },
    [engine, syncFromEngine]
  );

  const rename = useCallback(
    (id: string, name: string): void => {
      engine.renameTab(id, name);
      syncFromEngine();
    },
    [engine, syncFromEngine]
  );

  const hydrate = useCallback(
    (tabsData: Tab[], activeId: string | null): void => {
      engine.hydrate(tabsData, activeId);
      syncFromEngine();
    },
    [engine, syncFromEngine]
  );

  return {
    tabs,
    activeTabId,
    activeTab: tabs.find((t) => t.id === activeTabId) ?? null,
    createTab,
    closeTab,
    setActive,
    rename,
    hydrate,
  };
}
