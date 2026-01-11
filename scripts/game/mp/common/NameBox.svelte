<script lang="ts">
interface Props {
  value: string
  onchange?: () => void
  placeholder?: string
  maxlength?: number
}

let { value = $bindable(), onchange, placeholder = 'unnamed', maxlength = 20 }: Props = $props()
</script>

<div class="input-group mb-3">
  <span class="input-group-text">Name</span>
  <input bind:value type="text" class="form-control" {placeholder} {maxlength} {onchange}>
</div>
