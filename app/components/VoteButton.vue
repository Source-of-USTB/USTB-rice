<script setup lang="ts">
import type { WorkEntry } from '~/types/contest'

const props = withDefaults(defineProps<{
  entry: WorkEntry
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>(), {
  size: 'sm'
})

const toast = useToast()
const { user } = useAuth()
const { toggleUserVote } = useWorks()

const isMine = computed(() => props.entry.work.authorId === user.value?.id)

function onVote() {
  const result = toggleUserVote(props.entry.work.id)
  toast.add({
    title: result.message,
    color: result.ok ? 'success' : 'warning',
    icon: result.ok ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'
  })
}
</script>

<template>
  <UButton
    :size="size"
    :color="entry.votedByMe ? 'primary' : 'neutral'"
    :variant="entry.votedByMe ? 'solid' : 'outline'"
    :disabled="isMine"
    icon="i-lucide-heart"
    :label="String(entry.userVotes)"
    :title="isMine ? '不能给自己的作品投票' : entry.votedByMe ? '再次点击取消投票' : '投出一票'"
    @click="onVote"
  />
</template>
