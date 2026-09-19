<script setup lang="ts">
const { isUpload, phaseLabel, phaseDescription } = useContest()
const { isLoggedIn, isJudge } = useAuth()
const { remainingVotes } = useWorks()
</script>

<template>
  <section class="flex flex-col gap-2 border-b border-default pb-6 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
    <p class="m-0 text-muted">
      <span class="font-bold text-highlighted">{{ phaseLabel }}</span>
      · {{ phaseDescription }}
    </p>

    <NuxtLink
      v-if="isUpload"
      to="/me"
      class="shrink-0 text-primary hover:underline"
    >
      去上传作品 →
    </NuxtLink>

    <NuxtLink
      v-else-if="isJudge"
      to="/rank"
      class="shrink-0 text-primary hover:underline"
    >
      查看评分排名 →
    </NuxtLink>

    <p
      v-else-if="isLoggedIn"
      class="m-0 shrink-0 text-muted"
    >
      你还剩 <span class="font-bold text-primary">{{ remainingVotes }}</span> 票
    </p>

    <NuxtLink
      v-else
      to="/login"
      class="shrink-0 text-primary hover:underline"
    >
      登录后投票 →
    </NuxtLink>
  </section>
</template>
