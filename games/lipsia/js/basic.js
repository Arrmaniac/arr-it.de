const $fullscreenTrigger = document.querySelector('.heraldic-shield > img');

try {
    screen.orientation.lock('landscape');
} catch(error) {
    console.warn(error);
}

$fullscreenTrigger.addEventListener('click', async event => {
    if(event.target.dataset.fullscreenTriggerStatus === 'off') {
        document.body.requestFullscreen().then(data => {
            event.target.dataset.fullscreenTriggerStatus = 'on';
        });
    } else {
        document.body.exitFullscreen().then(data => {
            event.target.dataset.fullscreenTriggerStatus = 'off';
        });
    }
});

