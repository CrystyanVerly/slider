export default class Slider {
  constructor(wrapper, rail) {
    this.wrapper = document.querySelector(wrapper);
    this.rail = document.querySelector(rail);
    this.distances = { initial: 0, moving: 0, final: 0 };
  }
  addSlideEvents() {
    this.rail.addEventListener('mousedown', this.onInitial);
  }

  onInitial(e) {
    e.preventDefault();
    this.rail.addEventListener('mousemove', this.onMoving);
  }

  onMoving() {
    this.rail.addEventListener('mouseup', this.onFinal);
  }

  onFinal() {
    this.rail.removeEventListener('mousemove', this.onMoving);
    this.rail.removeEventListener('mouseup', this.onFinal);
  }

  bindingMethods() {
    this.onInitial = this.onInitial.bind(this);
    this.onMoving = this.onMoving.bind(this);
    this.onFinal = this.onFinal.bind(this);
  }

  init() {
    if (this.rail) {
      this.bindingMethods();
      this.addSlideEvents();
    }
    return this;
  }
}
