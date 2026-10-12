<script setup lang="ts">
interface Props {
  value: string
  label: string
  image?: string
  suffix?: string
}

withDefaults(defineProps<Props>(), {
  image: undefined,
  suffix: undefined,
})
</script>

<template>
  <article
    class="
      group relative
      flex h-[150px] w-full min-w-0 flex-1 shrink
      flex-col justify-end
      md:h-[173px] md:w-[180px] md:flex-none md:shrink-0
      overflow-visible
      rounded-card
      border border-white/70
      bg-card/80
      p-5
      shadow-card
      backdrop-blur-xl
      transition-all duration-300
      ease-[cubic-bezier(.22,1,.36,1)]
      hover:-translate-y-1
      hover:shadow-card-hover
    "
  >
    <!-- Floating image -->
    <div
      v-if="image"
      class="
        absolute left-7 top-0 z-10
        size-10
        -translate-y-1/2
        overflow-hidden
        rounded-full
        border-[3px] border-surface
        bg-surface
        shadow-stat-avatar
        transition-transform duration-300
        ease-[cubic-bezier(.22,1,.36,1)]
        group-hover:-translate-y-[55%]
        group-hover:scale-105
      "
    >
      <img
        :src="image"
        alt=""
        class="size-full object-cover"
        loading="lazy"
      />
    </div>

    <!-- Ambient highlight -->
    <span
      aria-hidden="true"
      class="
        pointer-events-none
        absolute inset-0
        rounded-card
        bg-gradient-to-br
        from-white/40 via-transparent to-transparent
        opacity-70
      "
    />

    <!-- Content -->
    <div class="relative z-10">
      <div
        class="
          flex items-end
          text-text
          text-[32px]
          font-normal
          leading-none
          tracking-[-0.045em]
          md:text-[42px]
        "
      >
        <span>{{ value }}</span>

        <span
          v-if="suffix"
          class="
            mb-[4px] ml-1
            text-[24px]
            font-normal
            leading-none
            tracking-[-0.03em]
            text-text-muted
          "
        >
          {{ suffix }}
        </span>
      </div>

      <p
        class="
          mt-3
          max-w-full
          md:max-w-[118px]
          text-[12px]
          font-normal
          leading-[1.4]
          tracking-[-0.01em]
          text-text-muted
        "
      >
        {{ label }}
      </p>
    </div>
  </article>
</template>
