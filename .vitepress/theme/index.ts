import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import { h } from "vue";
import AIChatWidget from "./components/AIChatWidget.vue";
import KnowledgeGraph from "./components/KnowledgeGraph.vue";
import NoteStudio from "./components/NoteStudio.vue";
import ProjectCard from "./components/ProjectCard.vue";
import SkillRadar from "./components/SkillRadar.vue";
import "./custom.css";

const theme: Theme = {
  extends: DefaultTheme,
  Layout: () =>
    h("div", { class: "atlas-theme-shell" }, [h(DefaultTheme.Layout), h(AIChatWidget)]),
  enhanceApp({ app }) {
    app.component("AIChatWidget", AIChatWidget);
    app.component("KnowledgeGraph", KnowledgeGraph);
    app.component("NoteStudio", NoteStudio);
    app.component("ProjectCard", ProjectCard);
    app.component("SkillRadar", SkillRadar);
  },
};

export default theme;
