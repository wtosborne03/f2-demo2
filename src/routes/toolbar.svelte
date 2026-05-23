<script lang="ts">
  import { onMount } from "svelte";

  function debounce(func: Function, wait: number) {
    let timeout: any;
    return function(this: any, ...args: any[]) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  onMount(() => {
    let fixPosition = 0;
    let lastScrollY = window.pageYOffset;
    const toolbarWrap = document.getElementById("toolbar-wrap");
    const toolbar = document.getElementById("toolbar");
    const editor = document.getElementById("editor");

    const setMargin = () => {
      if (toolbarWrap) {
        const newPosition = toolbarWrap.getBoundingClientRect().top;
        if (newPosition < -1) {
          toolbar?.classList.add("down");
          fixPosition = Math.abs(newPosition);
          if (
            window.innerHeight + window.pageYOffset >=
            document.body.offsetHeight
          ) {
            fixPosition -= 2;
          }
          if (toolbar) toolbar.style.marginTop = fixPosition + "px";
        }
      }
    };

    const debounceMargin = debounce(setMargin, 150);

    const showToolbar = () => {
      if (fixPosition > 0) {
        toolbar?.classList.remove("down");
        fixPosition = 0;
        if (toolbar) toolbar.style.marginTop = "0px";
      }
      debounceMargin();
    };

    window.addEventListener("scroll", showToolbar);
    editor?.addEventListener("blur", showToolbar);

    return () => {
      // Clean up event listeners when component is destroyed
      window.removeEventListener("scroll", showToolbar);
      editor?.removeEventListener("blur", showToolbar);
    };
  });
</script>
