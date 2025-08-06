import throttle from './throttle.js';
export default class Slider {
  constructor(wrapper, rail, config = {}) {
    this.wrapper = document.querySelector(wrapper);
    this.rail = document.querySelector(rail);
    this.distances = { initial: 0, moving: 0, final: 0 };

    this.config = {
      isInfinit: false,
      ...config,
    };

    this.itemsOnRail();
    this.bindingMethods();
  }
  bindingMethods() {
    const methodsToBind = ['onStart', 'onFinal'];
    methodsToBind.forEach((method) => (this[method] = this[method].bind(this)));

    this.onMoving = throttle(this.onMoving.bind(this), 16);
  }
  itemsOnRail() {
    this.arrItems = [...this.rail.children].map((item) => {
      const onLeft = -item.offsetLeft;
      return { item, onLeft };
    });
    return this.arrItems;
  }
  updatePosition(currentX) {
    const calcDist = -Math.round((this.distances.initial - currentX) * 1.6);
    this.distances.moving = calcDist;
    return this.distances.final + calcDist;
  }
  moveSlide(distX) {
    this.distances.moving = distX;
    this.rail.style.transform = `translate3d(${distX}px, 0px, 0px)`;
  }
  changeItemTo(index) {
    const lastItem = this.arrItems.length - 1;
    const isInfinit = this.config.isInfinit;

    const prev = index > 0 ? index - 1 : isInfinit ? lastItem : undefined;
    const next = index < lastItem ? index + 1 : isInfinit ? 0 : undefined;

    if (index < this.arrItems.length) {
      const { onLeft } = this.arrItems[index];
      this.moveSlide(onLeft);
      this.distances.final = onLeft;
    } else console.warn('Index is bigger than array length');

    return (this.direction = {
      prev,
      active: index,
      next,
    });
  }
  goToPrev() {}
  goToNext() {}
  onFinal() {
    this.distances.final = this.distances.moving;
    this.wrapper.removeEventListener('pointermove', this.onMoving);
    this.wrapper.removeEventListener('pointerup', this.onFinal);
  }
  onMoving(e) {
    this.moveSlide(this.updatePosition(e.clientX));
  }
  onStart(e) {
    if (e.pointerType !== 'touch') e.preventDefault();
    if (e.pointerType === 'touch' && e.isPrimary === false) return;

    this.distances.initial = Math.round(e.clientX);
    this.wrapper.addEventListener('pointermove', this.onMoving);
    this.wrapper.addEventListener('pointerup', this.onFinal);
  }
  addStartEvent() {
    this.wrapper.addEventListener('pointerdown', this.onStart);
  }

  init() {
    if (this.wrapper && this.rail) {
      this.addStartEvent();
      this.changeItemTo(5);
    } else console.warn(`No wrapper or rail found.`);
  }
}
