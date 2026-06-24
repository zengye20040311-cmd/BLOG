import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import KnowledgeGraph from "./components/KnowledgeGraph.vue";
import ProjectCard from "./components/ProjectCard.vue";
import SkillRadar from "./components/SkillRadar.vue";
import "./custom.css";

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("KnowledgeGraph", KnowledgeGraph);
    app.component("ProjectCard", ProjectCard);
    app.component("SkillRadar", SkillRadar);
  },
};

export default theme;
