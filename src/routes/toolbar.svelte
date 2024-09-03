<script lang="ts">
  import { onMount } from "svelte";

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
          if (toolbar) toolbar.style["margin-top"] = fixPosition + "px";
        }
      }
    };

    const debounceMargin = _.debounce(setMargin, 150);

    const showToolbar = () => {
      if (fixPosition > 0) {
        toolbar?.classList.remove("down");
        fixPosition = 0;
        if (toolbar) toolbar.style["margin-top"] = "0px";
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
