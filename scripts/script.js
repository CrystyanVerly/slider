import Slider from './modules/slider.js';

const banner = new Slider('#slider-wrapper', '#slider-track', {
  initialItem: 5,
  looping: true,
  prevControl: "[data-control='prev']",
  nextControl: "[data-control='next']",
});
banner.init();
