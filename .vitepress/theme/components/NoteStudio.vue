<script setup lang="ts">
import { computed, ref } from "vue";
import { marked } from "marked";
import NoteTreeNode from "./NoteTreeNode.vue";

type TreeNode = {
  name: string;
  kind: "file" | "directory";
  path: string;
  children?: TreeNode[];
  handle: FileSystemDirectoryHandle | FileSystemFileHandle;
};

type FrontmatterValue = string | string[];

type ParsedNote = {
  body: string;
  data: Record<string, FrontmatterValue>;
};

const rootHandle = ref<FileSystemDirectoryHandle | null>(null);
const tree = ref<TreeNode[]>([]);
const selectedDirectoryPath = ref("");
const selectedDirectoryHandle = ref<FileSystemDirectoryHandle | null>(null);
const activeFilePath = ref("");
const activeFileHandle = ref<FileSystemFileHandle | null>(null);
const content = ref("");
const savedContent = ref("");
const status = ref("还没有连接到本地 notes 文件夹。");
const saving = ref(false);
const loadingTree = ref(false);

marked.setOptions({
  breaks: true,
  gfm: true,
});

const hasUnsavedChanges = computed(() => content.value !== savedContent.value);

const parsedNote = computed<ParsedNote>(() => parseNote(content.value));

const previewTitle = computed(() => {
  const title = parsedNote.value.data.title;
  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }
  if (activeFilePath.value) {
    return titleFromFileName(activeFilePath.value.split("/").pop() || "untitled");
  }
  return "未命名笔记";
});

const previewSummary = computed(() => {
  const summary = parsedNote.value.data.summary;
  return typeof summary === "string" && summary.trim()
    ? summary.trim()
    : "这篇笔记还没有填写摘要。";
});

const previewCategory = computed(() => {
  const category = parsedNote.value.data.category;
  return typeof category === "string" && category.trim() ? category.trim() : "notes";
});

const previewDate = computed(() => {
  const date = parsedNote.value.data.date;
  return typeof date === "string" && date.trim() ? date.trim() : todayString();
});

const previewTags = computed(() => {
  const tags = parsedNote.value.data.tags;
  if (Array.isArray(tags)) {
    return tags.filter(Boolean);
  }
  if (typeof tags === "string" && tags.trim()) {
    return tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
});

const previewHtml = computed(() => {
  const body = parsedNote.value.body.trim() || "# 开始写作\n\n右侧会实时预览这篇笔记。";
  return marked.parse(body) as string;
});

function parseNote(source: string): ParsedNote {
  if (!source.startsWith("---")) {
    return {
      body: source,
      data: {},
    };
  }

  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return {
      body: source,
      data: {},
    };
  }

  const [, rawFrontmatter, body] = match;
  const data: Record<string, FrontmatterValue> = {};

  for (const line of rawFrontmatter.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes(":")) {
      continue;
    }

    const separator = trimmed.indexOf(":");
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();

    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      data[key] = rawValue
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      continue;
    }

    data[key] = rawValue.replace(/^["']|["']$/g, "");
  }

  return {
    body,
    data,
  };
}

function titleFromFileName(name: string) {
  return name
    .replace(/\.md$/i, "")
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function templateForNewNote(fileName: string, directoryPath: string) {
  const title = titleFromFileName(fileName);
  const topLevel = directoryPath.split("/")[0] || "notes";
  const category =
    topLevel === "courses" || topLevel === "papers" || topLevel === "opensource"
      ? "notes"
      : topLevel;

  return `---
title: ${title}
date: ${todayString()}
tags: []
category: ${category}
summary:
---

# ${title}

## 核心内容

## 我的理解

## 后续延伸
`;
}

async function verifyPermissions(
  handle: FileSystemDirectoryHandle | FileSystemFileHandle,
  mode: FileSystemPermissionMode = "readwrite",
) {
  const current = await handle.queryPermission({ mode });
  if (current === "granted") {
    return true;
  }
  const requested = await handle.requestPermission({ mode });
  return requested === "granted";
}

async function buildTree(
  handle: FileSystemDirectoryHandle,
  parentPath = "",
): Promise<TreeNode[]> {
  const result: TreeNode[] = [];

  for await (const [name, childHandle] of handle.entries()) {
    const nextPath = parentPath ? `${parentPath}/${name}` : name;

    if (childHandle.kind === "directory") {
      result.push({
        name,
        kind: "directory",
        path: nextPath,
        handle: childHandle,
        children: await buildTree(childHandle, nextPath),
      });
      continue;
    }

    if (name.endsWith(".md")) {
      result.push({
        name,
        kind: "file",
        path: nextPath,
        handle: childHandle,
      });
    }
  }

  return result.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "directory" ? -1 : 1;
    }
    return left.name.localeCompare(right.name, "zh-CN");
  });
}

async function refreshTree() {
  if (!rootHandle.value) {
    return;
  }

  loadingTree.value = true;
  tree.value = await buildTree(rootHandle.value);
  loadingTree.value = false;
}

async function pickNotesFolder() {
  if (!("showDirectoryPicker" in window)) {
    status.value =
      "当前浏览器不支持本地目录访问。建议用 Chromium 内核浏览器，并通过 localhost 或 https 打开页面。";
    return;
  }

  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    const allowed = await verifyPermissions(handle);

    if (!allowed) {
      status.value = "没有获得读写权限，无法创建和保存笔记。";
      return;
    }

    rootHandle.value = handle;
    selectedDirectoryHandle.value = handle;
    selectedDirectoryPath.value = "";
    status.value = `已连接到本地文件夹：${handle.name}`;
    await refreshTree();
  } catch (error) {
    status.value = "你取消了文件夹选择。";
    console.error(error);
  }
}

async function resolveDirectoryHandle(path: string) {
  if (!rootHandle.value || !path) {
    return rootHandle.value;
  }

  const parts = path.split("/").filter(Boolean);
  let current = rootHandle.value;

  for (const part of parts) {
    current = await current.getDirectoryHandle(part);
  }

  return current;
}

async function selectDirectory(node: TreeNode) {
  if (node.kind !== "directory") {
    return;
  }

  selectedDirectoryHandle.value = node.handle as FileSystemDirectoryHandle;
  selectedDirectoryPath.value = node.path;
  status.value = `当前目录：${node.path}`;
}

async function openFile(node: TreeNode) {
  if (node.kind !== "file") {
    return;
  }

  const handle = node.handle as FileSystemFileHandle;
  const file = await handle.getFile();
  activeFileHandle.value = handle;
  activeFilePath.value = node.path;
  content.value = await file.text();
  savedContent.value = content.value;

  const parentPath = node.path.includes("/") ? node.path.slice(0, node.path.lastIndexOf("/")) : "";
  selectedDirectoryPath.value = parentPath;
  selectedDirectoryHandle.value = await resolveDirectoryHandle(parentPath);
  status.value = `已打开：${node.path}`;
}

async function createFolder() {
  if (!selectedDirectoryHandle.value) {
    status.value = "请先连接 notes 文件夹，或在左侧树里选中一个目录。";
    return;
  }

  const name = window.prompt("新文件夹名称");
  if (!name) {
    return;
  }

  await selectedDirectoryHandle.value.getDirectoryHandle(name.trim(), { create: true });
  status.value = `已创建文件夹：${name.trim()}`;
  await refreshTree();
}

async function createNote() {
  if (!selectedDirectoryHandle.value) {
    status.value = "请先连接 notes 文件夹，或在左侧树里选中一个目录。";
    return;
  }

  const input = window.prompt("新 Markdown 文件名（例如 ppo-notes.md）");
  if (!input) {
    return;
  }

  const fileName = input.trim().endsWith(".md") ? input.trim() : `${input.trim()}.md`;
  const fileHandle = await selectedDirectoryHandle.value.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  const initialContent = templateForNewNote(fileName, selectedDirectoryPath.value);
  await writable.write(initialContent);
  await writable.close();

  await refreshTree();
  await openFile({
    name: fileName,
    kind: "file",
    path: selectedDirectoryPath.value ? `${selectedDirectoryPath.value}/${fileName}` : fileName,
    handle: fileHandle,
  });
}

async function saveNote() {
  if (!activeFileHandle.value) {
    status.value = "请先打开一个 Markdown 文件。";
    return;
  }

  saving.value = true;
  const writable = await activeFileHandle.value.createWritable();
  await writable.write(content.value);
  await writable.close();
  savedContent.value = content.value;
  saving.value = false;
  status.value = `已保存：${activeFilePath.value}`;
  await refreshTree();
}
</script>

<template>
  <section class="note-studio">
    <div class="note-studio__hero">
      <div>
        <p class="note-studio__eyebrow">Writing Studio</p>
        <h2>网页内笔记工作台</h2>
        <p>
          这个页面会直接连接你本机的 <code>notes/</code> 文件夹。连接后可以在网页里新建目录、新建 Markdown、
          编辑正文，并在右侧实时预览，不需要本地编辑器和额外命令。
        </p>
      </div>
      <div class="note-studio__actions">
        <button type="button" @click="pickNotesFolder">连接 notes 文件夹</button>
        <button type="button" @click="refreshTree" :disabled="!rootHandle || loadingTree">
          {{ loadingTree ? "刷新中..." : "刷新目录树" }}
        </button>
      </div>
    </div>

    <p class="note-studio__status">{{ status }}</p>

    <div class="note-studio__layout">
      <aside class="note-studio__sidebar">
        <div class="note-studio__toolbar">
          <button type="button" @click="createFolder" :disabled="!selectedDirectoryHandle">新建文件夹</button>
          <button type="button" @click="createNote" :disabled="!selectedDirectoryHandle">新建笔记</button>
        </div>

        <div class="note-studio__hint">
          当前目录：
          <strong>{{ selectedDirectoryPath || "(notes 根目录)" }}</strong>
        </div>

        <ul class="note-tree">
          <NoteTreeNode
            v-for="node in tree"
            :key="node.path"
            :node="node"
            @open-file="openFile"
            @select-directory="selectDirectory"
          />
        </ul>
      </aside>

      <section class="note-studio__workspace">
        <section class="note-studio__editor">
          <div class="note-studio__editor-head">
            <div>
              <p class="note-studio__path">{{ activeFilePath || "还没有打开文件" }}</p>
              <p class="note-studio__unsaved" v-if="hasUnsavedChanges">有未保存修改</p>
            </div>
            <div class="note-studio__editor-actions">
              <button type="button" @click="saveNote" :disabled="!activeFileHandle || saving">
                {{ saving ? "保存中..." : "保存笔记" }}
              </button>
            </div>
          </div>

          <textarea
            v-model="content"
            class="note-studio__textarea"
            placeholder="选中一个 Markdown 文件后，就可以直接在这里编写。"
          />
        </section>

        <section class="note-studio__preview">
          <div class="note-studio__preview-head">
            <p class="note-studio__eyebrow">Live Preview</p>
            <h3>{{ previewTitle }}</h3>
            <p>{{ previewSummary }}</p>
          </div>

          <div class="note-studio__meta">
            <span>{{ previewCategory }}</span>
            <span>{{ previewDate }}</span>
            <span v-if="previewTags.length">{{ previewTags.join(" / ") }}</span>
            <span v-else>未填写 tags</span>
          </div>

          <article class="note-studio__preview-body vp-doc" v-html="previewHtml" />
        </section>
      </section>
    </div>
  </section>
</template>

<style scoped>
.note-studio {
  display: grid;
  gap: 1.4rem;
  margin: 2rem 0;
  padding: 1.5rem;
  border-radius: 28px;
  background: rgba(255, 251, 244, 0.84);
  border: 1px solid rgba(31, 42, 55, 0.08);
  box-shadow: 0 18px 56px rgba(31, 42, 55, 0.08);
}

.note-studio__hero,
.note-studio__layout,
.note-studio__actions,
.note-studio__toolbar,
.note-studio__editor-head,
.note-studio__editor-actions,
.note-studio__workspace {
  display: grid;
  gap: 1rem;
}

.note-studio__hero {
  grid-template-columns: minmax(0, 1.8fr) minmax(260px, 0.8fr);
  align-items: start;
}

.note-studio__eyebrow {
  margin: 0 0 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  color: #14756c;
  font-weight: 700;
}

.note-studio__hero h2,
.note-studio__preview-head h3 {
  margin: 0 0 0.75rem;
}

.note-studio__hero p,
.note-studio__preview-head p {
  margin: 0;
  line-height: 1.7;
}

.note-studio__actions {
  grid-auto-rows: min-content;
}

.note-studio__actions button,
.note-studio__toolbar button,
.note-studio__editor-actions button {
  border: 0;
  border-radius: 999px;
  padding: 0.8rem 1rem;
  background: #1f2a37;
  color: #f8f4ed;
  font-weight: 700;
  cursor: pointer;
}

.note-studio__actions button:nth-child(2),
.note-studio__toolbar button:nth-child(1) {
  background: rgba(20, 117, 108, 0.12);
  color: #14756c;
}

.note-studio__actions button:disabled,
.note-studio__toolbar button:disabled,
.note-studio__editor-actions button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.note-studio__status,
.note-studio__hint,
.note-studio__path,
.note-studio__unsaved {
  margin: 0;
  color: #526173;
}

.note-studio__layout {
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  align-items: start;
}

.note-studio__workspace {
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  align-items: start;
}

.note-studio__sidebar,
.note-studio__editor,
.note-studio__preview {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(31, 42, 55, 0.08);
}

.note-studio__sidebar {
  padding: 1rem;
}

.note-studio__toolbar {
  grid-template-columns: 1fr 1fr;
}

.note-tree,
.note-tree ul {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
}

.note-tree ul {
  margin-left: 0.85rem;
}

.note-tree :deep(.note-tree__button) {
  width: 100%;
  text-align: left;
  border: 0;
  padding: 0.55rem 0.7rem;
  border-radius: 14px;
  background: transparent;
  color: #1f2a37;
  cursor: pointer;
}

.note-tree :deep(.note-tree__button:hover) {
  background: rgba(20, 117, 108, 0.08);
}

.note-studio__editor,
.note-studio__preview {
  padding: 1rem;
}

.note-studio__editor-head {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  margin-bottom: 1rem;
}

.note-studio__editor-actions {
  grid-auto-flow: column;
  align-items: center;
}

.note-studio__unsaved {
  color: #cc6b2c;
}

.note-studio__textarea {
  width: 100%;
  min-height: 640px;
  border: 1px solid rgba(31, 42, 55, 0.12);
  border-radius: 20px;
  padding: 1rem 1.1rem;
  font: 400 0.98rem/1.75 ui-monospace, SFMono-Regular, Consolas, monospace;
  background: rgba(255, 255, 255, 0.96);
  resize: vertical;
}

.note-studio__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin: 1rem 0 1.1rem;
}

.note-studio__meta span {
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: rgba(20, 117, 108, 0.1);
  color: #14756c;
  font-size: 0.9rem;
  font-weight: 600;
}

.note-studio__preview-body {
  padding: 1rem 1.15rem;
  border-radius: 18px;
  background: rgba(248, 244, 237, 0.8);
  min-height: 640px;
}

.note-studio__preview-body :deep(h1:first-child) {
  margin-top: 0;
}

@media (max-width: 1200px) {
  .note-studio__workspace {
    grid-template-columns: 1fr;
  }

  .note-studio__textarea,
  .note-studio__preview-body {
    min-height: 520px;
  }
}

@media (max-width: 960px) {
  .note-studio__hero,
  .note-studio__layout,
  .note-studio__editor-head {
    grid-template-columns: 1fr;
  }

  .note-studio__editor-actions {
    grid-auto-flow: row;
  }

  .note-studio__textarea,
  .note-studio__preview-body {
    min-height: 420px;
  }
}
</style>
