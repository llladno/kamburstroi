<script setup lang="ts">
import { computed } from 'vue'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'

type ButtonSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize

  type?: 'button' | 'submit' | 'reset'

  disabled?: boolean
  loading?: boolean

  block?: boolean
  iconOnly?: boolean

  /**
   * Добавляет стандартную стрелку справа.
   */
  arrow?: boolean

  /**
   * Для ссылки.
   */
  href?: string
  target?: '_self' | '_blank' | '_parent' | '_top'

  /**
   * Для NuxtLink.
   */
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',

  disabled: false,
  loading: false,

  block: false,
  iconOnly: false,

  arrow: false,

  href: undefined,
  target: '_self',

  to: undefined,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const component = computed(() => {
  if (props.to) {
    return resolveComponent('NuxtLink')
  }

  if (props.href) {
    return 'a'
  }

  return 'button'
})

const isDisabled = computed(() => {
  return props.disabled || props.loading
})

const classes = computed(() => [
  'ui-button',
  `ui-button--${props.variant}`,
  `ui-button--${props.size}`,
  {
    'ui-button--block': props.block,
    'ui-button--icon-only': props.iconOnly,
    'ui-button--loading': props.loading,
    'ui-button--disabled': props.disabled,
  },
])

const handleClick = (event: MouseEvent) => {
  if (isDisabled.value) {
    event.preventDefault()
    return
  }

  emit('click', event)
}
</script>

<template>
  <component
    :is="component"
    :type="!to && !href ? type : undefined"
    :href="href"
    :target="href ? target : undefined"
    :to="to"
    :aria-busy="loading || undefined"
    :aria-disabled="isDisabled || undefined"
    :tabindex="isDisabled ? -1 : undefined"
    :class="classes"
    @click="handleClick"
  >
    <!--
      Shine:
      один мягкий проход света при hover.
      Не бесконечный, не дерганый, без резкого блика.
    -->
    <span
      class="ui-button__shine"
      aria-hidden="true"
    />

    <span class="ui-button__content">
      <span
        v-if="$slots.start"
        class="ui-button__start"
      >
        <slot name="start" />
      </span>

      <span
        v-if="loading"
        class="ui-button__loader"
        aria-hidden="true"
      />

      <span
        v-else
        class="ui-button__label"
      >
        <slot />
      </span>

      <span
        v-if="arrow && !loading"
        class="ui-button__end"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M3.5 3.5L12.5 12.5"
          />
          <path
            d="M7 12.5H12.5V7"
          />
        </svg>
      </span>

      <span
        v-if="$slots.end && !arrow && !loading"
        class="ui-button__end"
      >
        <slot name="end" />
      </span>
    </span>
  </component>
</template>

<style scoped>
.ui-button {
  /*
   * ========================================
   * BASE
   * ========================================
   */

  --button-height: 52px;
  --button-padding-x: 22px;
  --button-gap: 10px;
  --button-font-size: 14px;

  position: relative;
  isolation: isolate;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: fit-content;
  min-width: 0;
  height: var(--button-height);

  padding: 0 var(--button-padding-x);

  overflow: hidden;

  border: 1px solid transparent;
  border-radius: 999px;

  font-family: inherit;
  font-size: var(--button-font-size);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.02em;

  text-decoration: none;
  white-space: nowrap;

  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  transform: translateZ(0);

  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease,
    color 220ms ease,
    opacity 220ms ease;
}

/*
 * ========================================
 * CONTENT
 * ========================================
 */

.ui-button__content {
  position: relative;
  z-index: 2;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  gap: var(--button-gap);
}

.ui-button__label {
  display: inline-block;

  transition:
    transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.ui-button__start,
.ui-button__end {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  flex: 0 0 auto;
}

/*
 * ========================================
 * SHINE
 * ========================================
 *
 * Главное изменение:
 *
 * - shine всегда невидим
 * - появляется только на hover
 * - проходит один раз слева направо
 * - широкий и размытый
 * - не выглядит как белая полоса
 */

.ui-button__shine {
  position: absolute;
  z-index: 1;

  top: -70%;
  left: -65%;

  width: 42%;
  height: 240%;

  pointer-events: none;

  opacity: 0;

  background: linear-gradient(
    105deg,
    transparent 0%,
    transparent 30%,
    rgba(255, 255, 255, 0.035) 42%,
    rgba(255, 255, 255, 0.16) 50%,
    rgba(255, 255, 255, 0.035) 58%,
    transparent 70%,
    transparent 100%
  );

  filter: blur(3px);

  transform: translateX(0) skewX(-18deg);

  transition:
    opacity 120ms ease,
    transform 650ms cubic-bezier(0.22, 1, 0.36, 1);
}

.ui-button:hover .ui-button__shine {
  opacity: 1;
  transform: translateX(390%) skewX(-18deg);
}

/*
 * После прохода возвращаем элемент
 * мгновенно, чтобы следующий hover
 * снова запускал анимацию.
 */

.ui-button:not(:hover) .ui-button__shine {
  transition:
    opacity 160ms ease,
    transform 0ms linear 180ms;
}

/*
 * ========================================
 * PRIMARY
 * ========================================
 */

.ui-button--primary {
  color: #ffffff;

  background:
    linear-gradient(
      180deg,
      #f68b3c 0%,
      #f47b20 100%
    );

  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 rgba(0, 0, 0, 0.12),
    0 8px 20px rgba(244, 123, 32, 0.22),
    0 2px 6px rgba(244, 123, 32, 0.16);
}

.ui-button--primary:hover {
  transform: scale(1.05);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.14),
    0 14px 30px rgba(244, 123, 32, 0.3),
    0 4px 10px rgba(244, 123, 32, 0.18);
}

/*
 * ========================================
 * SECONDARY
 * ========================================
 */

.ui-button--secondary {
  color: #222528;

  background: rgba(255, 255, 255, 0.88);

  border-color: rgba(25, 29, 32, 0.06);

  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.8),
    0 7px 20px rgba(20, 24, 27, 0.045);
}

.ui-button--secondary:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.98);

  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 1),
    0 12px 28px rgba(20, 24, 27, 0.075);
}

/*
 * На светлой кнопке делаем shine
 * чуть темнее/мягче.
 */

.ui-button--secondary .ui-button__shine,
.ui-button--outline .ui-button__shine,
.ui-button--ghost .ui-button__shine {
  background: linear-gradient(
    105deg,
    transparent 0%,
    transparent 30%,
    rgba(255, 255, 255, 0.25) 45%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.25) 55%,
    transparent 70%,
    transparent 100%
  );

  filter: blur(5px);
}

/*
 * ========================================
 * OUTLINE
 * ========================================
 */

.ui-button--outline {
  color: #222528;

  background: transparent;

  border-color: rgba(34, 37, 40, 0.12);
}

.ui-button--outline:hover {
  transform: translateY(-2px);

  background: rgba(34, 37, 40, 0.035);

  border-color: rgba(34, 37, 40, 0.18);

  box-shadow:
    0 8px 22px rgba(20, 24, 27, 0.05);
}

/*
 * ========================================
 * GHOST
 * ========================================
 */

.ui-button--ghost {
  color: #45494d;
  background: transparent;
}

.ui-button--ghost:hover {
  background: rgba(34, 37, 40, 0.04);
  color: #17191b;
}

/*
 * ========================================
 * ARROW
 * ========================================
 */

.ui-button__end {
  width: 22px;
  height: 22px;

  border-radius: 50%;

  color: currentColor;

  background: rgba(255, 255, 255, 0.09);

  transition:
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 220ms ease;
}

.ui-button__end svg {
  width: 11px;
  height: 11px;

  stroke: currentColor;
  stroke-width: 1.3;
  stroke-linecap: round;
  stroke-linejoin: round;

  transition:
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.ui-button:hover .ui-button__end {
  transform: translate(2px, 2px);

  background: rgba(255, 255, 255, 0.14);
}

.ui-button:hover .ui-button__end svg {
  transform: translate(1px, 1px);
}

/*
 * ========================================
 * SIZES
 * ========================================
 */

.ui-button--xs {
  --button-height: 36px;
  --button-padding-x: 14px;
  --button-gap: 7px;
  --button-font-size: 12px;
}

.ui-button--sm {
  --button-height: 44px;
  --button-padding-x: 18px;
  --button-gap: 8px;
  --button-font-size: 13px;
}

.ui-button--md {
  --button-height: 52px;
  --button-padding-x: 22px;
  --button-gap: 10px;
  --button-font-size: 14px;
}

.ui-button--lg {
  --button-height: 58px;
  --button-padding-x: 27px;
  --button-gap: 12px;
  --button-font-size: 14px;
}

.ui-button--xl {
  --button-height: 64px;
  --button-padding-x: 30px;
  --button-gap: 13px;
  --button-font-size: 15px;
}

/*
 * ========================================
 * BLOCK
 * ========================================
 */

.ui-button--block {
  width: 100%;
}

/*
 * ========================================
 * ICON ONLY
 * ========================================
 */

.ui-button--icon-only {
  width: var(--button-height);
  padding: 0;
}

.ui-button--icon-only .ui-button__content {
  width: 100%;
  height: 100%;
}

/*
 * ========================================
 * LOADING
 * ========================================
 */

.ui-button--loading {
  cursor: wait;
}

.ui-button__loader {
  width: 15px;
  height: 15px;

  border: 1.5px solid currentColor;
  border-right-color: transparent;

  border-radius: 50%;

  animation:
    button-spinner 700ms linear infinite;
}

@keyframes button-spinner {
  to {
    transform: rotate(360deg);
  }
}

/*
 * ========================================
 * DISABLED
 * ========================================
 */

.ui-button--disabled,
.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  transform: none !important;
  box-shadow: none;
}

/*
 * ========================================
 * FOCUS
 * ========================================
 */

.ui-button:focus-visible {
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.95),
    0 0 0 5px rgba(34, 37, 40, 0.25);
}

/*
 * ========================================
 * PRESS
 * ========================================
 */

.ui-button:active:not(.ui-button--disabled):not(:disabled) {
  transform: scale(0.97);
  transition-duration: 90ms;
}

/*
 * ========================================
 * ACCESSIBILITY
 * ========================================
 */

@media (prefers-reduced-motion: reduce) {
  .ui-button,
  .ui-button *,
  .ui-button__shine {
    animation: none !important;
    transition: none !important;
  }
}
</style>
