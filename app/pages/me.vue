<script setup lang="ts">
useSeoMeta({
  title: '我的作品',
  description: '提交你的桌面美化作品。'
})

const toast = useToast()
const { user, isLoggedIn } = useAuth()
const { isUpload, isVoting, config } = useContest()
const { myEntry, saveMyText, deleteMyText, addMyPhotos, removeMyPhoto, setMyCover } = useWorks()

const photos = computed(() => myEntry.value?.photos ?? [])
const hasText = computed(() => Boolean(myEntry.value?.work.title || myEntry.value?.work.description))

/* --------------------------- 作品说明 (一份文本) --------------------------- */

const editing = ref(false)
const confirmDelete = ref(false)
const draft = reactive({
  title: '',
  description: '',
  tags: [] as string[]
})

function startEdit() {
  const work = myEntry.value?.work
  draft.title = work?.title ?? ''
  draft.description = work?.description ?? ''
  draft.tags = [...(work?.tags ?? [])]
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

function onSave() {
  const result = saveMyText({ title: draft.title, description: draft.description, tags: draft.tags })
  toast.add({
    title: result.message,
    color: result.ok ? 'success' : 'warning',
    icon: result.ok ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'
  })
  if (result.ok) {
    editing.value = false
  }
}

function onDeleteText() {
  const result = deleteMyText()
  toast.add({
    title: result.message,
    color: result.ok ? 'success' : 'warning',
    icon: result.ok ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'
  })
  confirmDelete.value = false
  editing.value = false
}

/* ---------------------------- 作品截图 (多张) ---------------------------- */

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const dragging = ref(false)

function handleFiles(files: File[]) {
  if (files.length === 0) {
    return
  }
  const result = addMyPhotos(files)
  toast.add({
    title: result.message,
    color: result.ok ? 'success' : 'warning',
    icon: result.ok ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'
  })
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement
  handleFiles(Array.from(input.files ?? []))
  // 清空以便连续选择同一个文件
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  handleFiles(Array.from(event.dataTransfer?.files ?? []))
}

function onRemovePhoto(photoId: string) {
  const result = removeMyPhoto(photoId)
  toast.add({
    title: result.message,
    color: result.ok ? 'success' : 'warning',
    icon: result.ok ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'
  })
}

function onSetCover(photoId: string) {
  const result = setMyCover(photoId)
  toast.add({
    title: result.message,
    color: result.ok ? 'success' : 'warning',
    icon: result.ok ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'
  })
}
</script>

<template>
  <div>
    <UEmpty
      v-if="!isLoggedIn"
      variant="naked"
      icon="i-lucide-log-in"
      title="请先登录"
      description="登录之后就可以提交你的桌面截图和美化过程了。"
      :actions="[{ label: '去登录', to: '/login', icon: 'i-lucide-log-in' }]"
    />

    <template v-else>
      <PageHeading
        title="我的作品"
        description="提交一份简单的美化过程说明, 再配上几张截图展示你的桌面。"
      >
        <template #actions>
          <UButton
            v-if="myEntry"
            :to="`/u/${user?.id}`"
            label="预览主页"
            icon="i-lucide-eye"
            color="neutral"
            variant="outline"
            size="sm"
          />
        </template>
      </PageHeading>

      <div class="flex flex-col gap-8">
        <p
          v-if="isVoting"
          class="m-0 flex items-start gap-2 text-sm text-muted"
        >
          <UIcon
            name="i-lucide-lock"
            class="mt-0.5 size-4 shrink-0"
          />
          <span>已经进入投票阶段, 作品锁定了, 说明和截图都改不了。投票 {{ config.votingDeadline }} 结束。</span>
        </p>

        <!-- 作品说明: 每人只有一份 -->
        <section class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="m-0 text-lg font-bold text-highlighted">
              美化过程说明
            </h2>

            <div
              v-if="isUpload && !editing"
              class="flex gap-2"
            >
              <UButton
                :label="hasText ? '编辑' : '写一份说明'"
                :icon="hasText ? 'i-lucide-pencil' : 'i-lucide-plus'"
                size="sm"
                variant="subtle"
                @click="startEdit()"
              />
              <UButton
                v-if="hasText"
                label="删除"
                icon="i-lucide-trash-2"
                size="sm"
                color="error"
                variant="ghost"
                @click="confirmDelete = true"
              />
            </div>
          </div>

          <form
            v-if="editing"
            class="flex flex-col gap-5 rounded-xl border border-default p-6"
            @submit.prevent="onSave()"
          >
            <UFormField
              label="作品标题"
              name="title"
              required
            >
              <UInput
                v-model="draft.title"
                placeholder="例如: 极光 Aurora · Hyprland 动效全开"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="标签"
              name="tags"
              description="回车确认, 最多 6 个。建议写窗口管理器、配色方案、发行版。"
            >
              <UInputTags
                v-model="draft.tags"
                :max="6"
                placeholder="Hyprland"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="说明正文"
              name="description"
              :hint="`${draft.description.length} / ${config.maxDescriptionLength}`"
            >
              <UTextarea
                v-model="draft.description"
                :rows="10"
                :maxlength="config.maxDescriptionLength"
                placeholder="介绍一下你的配色思路、用到的窗口管理器和插件, 以及最得意的细节。"
                class="w-full"
              />
            </UFormField>

            <div class="flex flex-wrap gap-2">
              <UButton
                type="submit"
                label="保存"
                icon="i-lucide-check"
              />
              <UButton
                label="取消"
                color="neutral"
                variant="outline"
                @click="cancelEdit()"
              />
            </div>
          </form>

          <article
            v-else-if="hasText && myEntry"
            class="flex flex-col gap-3 rounded-xl border border-default p-6"
          >
            <h3 class="m-0 text-xl leading-snug font-bold text-highlighted">
              {{ myEntry.work.title }}
            </h3>

            <div
              v-if="myEntry.work.tags.length"
              class="flex flex-wrap gap-1.5"
            >
              <UBadge
                v-for="tag in myEntry.work.tags"
                :key="tag"
                :label="tag"
                color="primary"
                variant="soft"
                size="sm"
              />
            </div>

            <p class="m-0 leading-loose whitespace-pre-line text-toned">
              {{ myEntry.work.description || '还没有正文。' }}
            </p>

            <p class="m-0 text-xs text-dimmed">
              最后更新于 {{ formatDate(myEntry.work.updatedAt) }}
            </p>
          </article>

          <UEmpty
            v-else
            variant="naked"
            icon="i-lucide-pencil"
            title="还没有写说明"
            description="写一段介绍, 让评委和同学知道你做了什么。"
            :actions="isUpload ? [{ label: '写一份说明', icon: 'i-lucide-plus', onClick: startEdit }] : []"
          />
        </section>

        <!-- 作品截图: 可以有多张 -->
        <section class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="m-0 flex items-center gap-2 text-lg font-bold text-highlighted">
              作品截图
              <UBadge
                :label="`${photos.length} / ${config.maxPhotos}`"
                color="neutral"
                variant="subtle"
                size="sm"
              />
            </h2>
            <p class="m-0 text-sm text-muted">
              第一张会作为作品墙上的封面。
            </p>
          </div>

          <div
            v-if="isUpload && photos.length < config.maxPhotos"
            class="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center transition-colors"
            :class="dragging ? 'border-primary bg-primary/5' : 'border-accented'"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="onDrop"
          >
            <UIcon
              name="i-lucide-image-plus"
              class="size-8 text-dimmed"
            />
            <p class="m-0 text-sm text-toned">
              把截图拖进来, 或者
              <UButton
                label="点击选择文件"
                variant="link"
                class="p-0"
                @click="fileInput?.click()"
              />
            </p>
            <p class="m-0 text-xs text-dimmed">
              支持 PNG / JPG / WebP, 一次可以选多张, 最多 {{ config.maxPhotos }} 张
            </p>

            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="onPick"
            >
          </div>

          <p
            v-else-if="isUpload"
            class="m-0 text-sm text-muted"
          >
            已经传满 {{ config.maxPhotos }} 张了, 想换别的请先删掉一张。
          </p>

          <div
            v-if="photos.length"
            class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-4"
          >
            <figure
              v-for="(photo, index) in photos"
              :key="photo.id"
              class="group relative m-0 overflow-hidden rounded-xl border border-default bg-elevated"
            >
              <img
                :src="photo.url"
                :alt="`我的第 ${index + 1} 张截图`"
                class="aspect-video w-full object-cover"
              >

              <span
                v-if="index === 0"
                class="absolute start-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
              >
                封面
              </span>

              <figcaption
                v-if="isUpload"
                class="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
              >
                <UButton
                  v-if="index !== 0"
                  label="设为封面"
                  icon="i-lucide-star"
                  size="xs"
                  color="neutral"
                  variant="solid"
                  @click="onSetCover(photo.id)"
                />
                <UButton
                  label="删除"
                  icon="i-lucide-trash-2"
                  size="xs"
                  color="error"
                  variant="solid"
                  @click="onRemovePhoto(photo.id)"
                />
              </figcaption>
            </figure>
          </div>

          <UEmpty
            v-else
            variant="naked"
            icon="i-lucide-image-off"
            title="还没有上传截图"
            :description="isUpload ? '至少传一张桌面截图, 作品才会出现在作品墙上。' : '上传阶段已经结束了。'"
          />
        </section>
      </div>

      <UModal
        v-model:open="confirmDelete"
        title="删除这份说明"
        description="删除后标题、标签和正文都会清空, 已上传的截图不受影响。"
      >
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton
              label="取消"
              color="neutral"
              variant="outline"
              @click="confirmDelete = false"
            />
            <UButton
              label="确认删除"
              color="error"
              icon="i-lucide-trash-2"
              @click="onDeleteText()"
            />
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
