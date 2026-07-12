import React from "react";

export interface IWidget {
  id: string;
  name: string;
  description?: string;
  size: "small" | "medium" | "large" | "full";
  component: React.ComponentType<any>;
}

class WidgetRegistryService {
  private widgets = new Map<string, IWidget>();

  public register(widget: IWidget) {
    this.widgets.set(widget.id, widget);
  }

  public getWidget(id: string): IWidget | undefined {
    return this.widgets.get(id);
  }

  public getAllWidgets(): IWidget[] {
    return Array.from(this.widgets.values());
  }

  public getWidgetsByIds(ids: string[]): IWidget[] {
    return ids.map(id => this.widgets.get(id)).filter((w): w is IWidget => w !== undefined);
  }
}

export const WidgetRegistry = new WidgetRegistryService();
