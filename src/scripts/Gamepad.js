let selectedIndex = 0;
const items = document.querySelectorAll('.game-container');
let lastMovetime = 0;
const moveCooldown = 200;


function updateGamepadStatus()
{
    const [gamepad] = navigator.getGamepads();
    if(gamepad )
    {
        console.log(gamepad)
        const currentTime = Date.now();
        if(currentTime - lastMovetime > moveCooldown)
        {
            if(gamepad.axes[1] < -0.5){
            
            selectedIndex = Math.max(0, selectedIndex -1);
            updateSelection();
            lastMovetime = currentTime;
            }
            else if(gamepad.axes[1] > 0.5)
            {
                selectedIndex = Math.min(items.length -1, selectedIndex +1);
                updateSelection();
                lastMovetime = currentTime;
            }
        }

        if(gamepad.buttons[0].pressed)
        {
            items[selectedIndex].click();   
        }
     
    }
    
    requestAnimationFrame(updateGamepadStatus);
}

function updateSelection() {
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