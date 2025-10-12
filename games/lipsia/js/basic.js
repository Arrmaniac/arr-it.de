const $fullscreenTrigger = document.querySelector('.heraldic-shield > img');

function actuateSlider($sliderButton) {
    let $slider = $sliderButton.closest('.slider');
    let status = $slider.dataset.sliderStatus;
    
    if(status === 'out') {
        $sliderButton.classList.replace('slider-position-out', 'slider-position-in');
        $slider.classList.add('slider-in');
        $slider.dataset.sliderStatus = 'in';
    } else {
        $sliderButton.classList.replace('slider-position-in', 'slider-position-out');
        $slider.classList.remove('slider-in');
        $slider.dataset.sliderStatus = 'out';
    }
}

$fullscreenTrigger.addEventListener('click', async event => {
    if(event.target.dataset.fullscreenTriggerStatus === 'off') {
        document.body.requestFullscreen().then(data => {
            event.target.dataset.fullscreenTriggerStatus = 'on';
            return screen.orientation.lock('landscape-primary').catch(error => {console.warn(error);});
        });
    } else {
        document.exitFullscreen().then(data => {
            event.target.dataset.fullscreenTriggerStatus = 'off';
            screen.orientation.unlock();
        });
    }
});

document.body.addEventListener('click', event => {
    if(event.target.matches('.slider-button')) return actuateSlider(event.target);
});

