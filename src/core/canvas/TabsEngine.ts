import type { Tab } from "../Tab";

export class TabsEngine {
  private tabs: Tab[] = [];
  private _activeTabId: string | null = null;

  get activeTabId(): string | null {
    return this._activeTabId;
  }

  get activeTab(): Tab | null {
    return this.tabs.find((t) => t.id === this._activeTabId) ?? null;
  }

  getAllTabs(): Tab[] {
    return this.tabs;
  }

  createTab(name: string): Tab {
    const id = crypto.randomUUID();
    const tab: Tab = { id, name };

    this.tabs.push(tab);
    this._activeTabId = id;

    return tab;
  }

  closeTab(id: string): void {
    const index = this.tabs.findIndex((t) => t.id === id);
    if (index === -1) return;

    this.tabs.splice(index, 1);

    if (this._activeTabId === id) {
      const fallback = this.tabs[index] ?? this.tabs[index - 1] ?? null;
      this._activeTabId = fallback ? fallback.id : null;
    }
  }

  setActiveTab(id: string): void {
    const exists = this.tabs.some((t) => t.id === id);
    if (exists) {
      this._activeTabId = id;
    }
  }

  renameTab(id: string, name: string): void {
    const tab = this.tabs.find((t) => t.id === id);
    if (tab) {
      tab.name = name;
    }
  }

  hydrate(tabs: Tab[], activeId: string | null): void {
    this.tabs = tabs.map((t) => ({ id: t.id, name: t.name }));
    this._activeTabId = activeId && this.tabs.some((t) => t.id === activeId) ? activeId : this.tabs[0]?.id ?? null;
  }
}
