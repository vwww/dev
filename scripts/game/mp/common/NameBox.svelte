<script lang="ts">
interface Props {
  value: string
  placeholder?: string
  maxlength?: number
}

let { value = $bindable(), placeholder = 'unnamed', maxlength = 20 }: Props = $props()
</script>

<div class="input-group mb-3">
  <span class="input-group-text">Name</span>
  <input bind:value type="text" class="form-control" {placeholder} {maxlength}>
</div>
