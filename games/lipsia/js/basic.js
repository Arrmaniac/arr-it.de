const $fullscreenTrigger = document.querySelector('.heraldic-shield > img');

try {
    alert(screen.orientation.type);
    screen.orientation.lock('landscape-primary');
} catch(error) {
    console.warn(error);
}

$fullscreenTrigger.addEventListener('click', async event => {
    if(event.target.dataset.fullscreenTriggerStatus === 'off') {
        document.body.requestFullscreen().then(data => {
            event.target.dataset.fullscreenTriggerStatus = 'on';
        });
    } else {
        document.exitFullscreen().then(data => {
            event.target.dataset.fullscreenTriggerStatus = 'off';
        });
    }
});

