import { WidgetRegistry } from "./WidgetRegistry";
import { ContinueLearningCard } from "@/components/aptitude/ContinueLearningCard";
import { WeakTopicsList } from "@/components/aptitude/WeakTopicsList";
import { RevisionList } from "@/components/aptitude/RevisionList";
import { AITutorWidget } from "@/components/aptitude/AITutorWidget";

export function registerAptitudeWidgets() {
  WidgetRegistry.register({
    id: "continue-learning",
    name: "Continue Learning",
    size: "full",
    component: ContinueLearningCard
  });

  WidgetRegistry.register({
    id: "weak-topics",
    name: "Weak Topics",
    size: "medium",
    component: WeakTopicsList
  });

  WidgetRegistry.register({
    id: "revision-queue",
    name: "Revision Queue",
    size: "medium",
    component: RevisionList
  });

  WidgetRegistry.register({
    id: "ai-tutor",
    name: "AI Tutor",
    size: "small",
    component: AITutorWidget
  });
}
