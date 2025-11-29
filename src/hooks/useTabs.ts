import { useMemo, useState } from "react";
import { TabsEngine } from "../core/canvas/TabsEngine";
import type { Tab } from "../core/Tab";

export function useTabs() {
  const engine = useMemo(() => new TabsEngine(), []);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const syncFromEngine = () => {
    setTabs([...engine.getAllTabs()]);
    setActiveTabId(engine.activeTabId);
  };

  const createTab = (name: string): Tab => {
    const tab = engine.createTab(name);
    syncFromEngine();
    return tab;
  };

  const closeTab = (id: string): void => {
    engine.closeTab(id);
    syncFromEngine();
  };

  const setActive = (id: string): void => {
    engine.setActiveTab(id);
    syncFromEngine();
  };

  const rename = (id: string, name: string): void => {
    engine.renameTab(id, name);
    syncFromEngine();
  };

  const hydrate = (tabsData: Tab[], activeId: string | null): void => {
    engine.hydrate(tabsData, activeId);
    syncFromEngine();
  };

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
