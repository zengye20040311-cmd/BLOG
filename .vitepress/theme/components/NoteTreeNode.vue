<script setup lang="ts">
defineOptions({
  name: "NoteTreeNode",
});

type TreeNode = {
  name: string;
  kind: "file" | "directory";
  path: string;
  children?: TreeNode[];
};

defineProps<{
  node: TreeNode;
  depth?: number;
}>();

const emit = defineEmits<{
  "open-file": [node: TreeNode];
  "select-directory": [node: TreeNode];
}>();
</script>

<template>
  <li :class="node.kind === 'directory' ? 'note-tree__dir' : 'note-tree__file'">
    <button
      v-if="node.kind === 'directory'"
      type="button"
      :class="['note-tree__button', 'note-tree__button--dir']"
      :style="{ paddingLeft: `${0.7 + (depth || 0) * 0.85}rem` }"
      @click="emit('select-directory', node)"
    >
      📁 {{ node.name }}
    </button>
    <button
      v-else
      type="button"
      :class="['note-tree__button', 'note-tree__button--file']"
      :style="{ paddingLeft: `${0.7 + (depth || 0) * 0.85}rem` }"
      @click="emit('open-file', node)"
    >
      📝 {{ node.name }}
    </button>

    <ul v-if="node.kind === 'directory' && node.children?.length">
      <NoteTreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="(depth || 0) + 1"
        @open-file="emit('open-file', $event)"
        @select-directory="emit('select-directory', $event)"
      />
    </ul>
  </li>
</template>
