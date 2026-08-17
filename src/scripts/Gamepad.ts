(() => {
  let selectedIndex: number = 0;
  let lastMovetime: number = 0;
  const moveCooldown: number = 200;

  function updateGamepadStatus(): void {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gamepad = gamepads[0];
    const items = document.querySelectorAll('.game-container');

    if (gamepad && items.length > 0) {
      const currentTime = Date.now();
      if (currentTime - lastMovetime > moveCooldown) {
        if (gamepad.axes[1] < -0.5) {
          selectedIndex = Math.max(0, selectedIndex - 1);
          updateSelection(items);
          lastMovetime = currentTime;
        } else if (gamepad.axes[1] > 0.5) {
          selectedIndex = Math.min(items.length - 1, selectedIndex + 1);
          updateSelection(items);
          lastMovetime = currentTime;
        }
      }

      if (gamepad.buttons[0]?.pressed && items[selectedIndex]) {
        (items[selectedIndex] as HTMLElement).click();
      }
    }

    requestAnimationFrame(updateGamepadStatus);
  }

  function updateSelection(items: NodeListOf<Element>): void {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === selectedIndex);
      if (index === selectedIndex) {
        item.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    });
  }

  updateGamepadStatus();
})();
