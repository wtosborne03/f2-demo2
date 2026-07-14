<script lang="ts">
  interface Props {
    label: string;
    value: string;
    disabled?: boolean;
    error?: boolean;
    rows?: number;
    [key: string]: any;
  }

  let {
    label,
    value = $bindable(),
    disabled = false,
    error = false,
    rows = 3,
    ...rest
  }: Props = $props();
</script>

<label class="form-control w-full">
  <div class="label py-1">
    <span class="label-text font-medium text-xs text-base-content/80">{label}</span>
  </div>
  <textarea
    class="textarea textarea-bordered w-full"
    class:textarea-error={error}
    bind:value={value}
    {disabled}
    {rows}
    {...rest}
  ></textarea>
</label>
