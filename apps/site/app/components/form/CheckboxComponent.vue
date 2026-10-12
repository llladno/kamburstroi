<script setup lang="ts">
const model = defineModel<boolean>({ default: false });
</script>

<template>
  <label class="ui-checkbox">
    <input v-model="model" type="checkbox" class="ui-checkbox__input" />
    <span class="ui-checkbox__box" aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
      </svg>
    </span>
    <span class="ui-checkbox__label"><slot /></span>
  </label>
</template>

<style scoped>
.ui-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.ui-checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  opacity: 0;
}

.ui-checkbox__box {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  color: #ffffff;
  background: #ffffff;
  border: 1.5px solid #c9cdd1;
  border-radius: 7px;
  transition:
    background-color 200ms ease,
    border-color 200ms ease,
    box-shadow 200ms ease,
    transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.ui-checkbox__box svg {
  width: 12px;
  height: 12px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 16;
  stroke-dashoffset: 16;
  transition: stroke-dashoffset 260ms cubic-bezier(0.22, 1, 0.36, 1) 60ms;
}

.ui-checkbox:hover .ui-checkbox__box {
  border-color: var(--color-accent);
  transform: scale(1.08);
}

.ui-checkbox:active .ui-checkbox__box {
  transform: scale(0.92);
}

.ui-checkbox__input:checked + .ui-checkbox__box {
  background: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: 0 4px 12px rgba(244, 123, 32, 0.3);
}

.ui-checkbox__input:checked + .ui-checkbox__box svg {
  stroke-dashoffset: 0;
}

.ui-checkbox__input:focus-visible + .ui-checkbox__box {
  box-shadow: 0 0 0 3px rgba(244, 123, 32, 0.35);
}

@media (prefers-reduced-motion: reduce) {
  .ui-checkbox__box,
  .ui-checkbox__box svg {
    transition: none;
  }
}
</style>
