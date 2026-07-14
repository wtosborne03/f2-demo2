<script lang="ts">
  interface Props {
    label: string;
    value: string;
    disabled?: boolean;
    error?: boolean;
    [key: string]: any;
  }

  let {
    label,
    value = $bindable(),
    disabled = false,
    error = false,
    ...rest
  }: Props = $props();
</script>

<label class="form-control w-full">
  <div class="label py-1">
    <span class="label-text font-medium text-xs text-base-content/80">{label}</span>
  </div>
  <input
    type="text"
    class="input input-bordered bg-base-200/50 w-full"
    class:input-error={error}
    bind:value={value}
    {disabled}
    {...rest}
  />
</label>
