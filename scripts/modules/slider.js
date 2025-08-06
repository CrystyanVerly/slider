import throttle from './throttle.js';

export default class Slider {
  constructor(wrapper, rail, config = {}) {
    this.wrapper = document.querySelector(wrapper);
    this.rail = document.querySelector(rail);
    this.distances = { initial: 0, moving: 0, final: 0 };
    this.index = { prev: null, active: 0, next: null };

    this.config = {
      isInfinit: false,
      initialItem: 0,
      prevControl: null,
      nextControl: null,
      ...config,
    };

    if (typeof this.config.prevControl === 'string') {
      this.config.prevControl = document.querySelector(this.config.prevControl);
    }
    if (typeof this.config.nextControl === 'string') {
      this.config.nextControl = document.querySelector(this.config.nextControl);
    }

    this.itemsOnRail();
    this.bindingMethods();
  }

  // ==== PUBLIC ====
  init() {
    if (this.wrapper && this.rail) {
      this.addStartEvent();
      this.changeItemTo(this.config.initialItem);
    } else {
      console.warn(`No wrapper or rail found.`);
    }
  }

  // ==== SETUP ====
  bindingMethods() {
    const methodsToBind = ['onStart', 'onFinal', 'prevItem', 'nextItem'];
    methodsToBind.forEach((method) => {
      this[method] = this[method].bind(this);
    });

    this.onMoving = throttle(this.onMoving.bind(this), 16);
  }

  addStartEvent() {
    this.wrapper.addEventListener('pointerdown', this.onStart, {
      passive: false,
    });

    const controlEvent = ['click', 'touchstart'];
    if (this.config.prevControl && this.config.nextControl) {
      controlEvent.forEach((event) => {
        this.config.prevControl.addEventListener(event, this.prevItem);
        this.config.nextControl.addEventListener(event, this.nextItem);
      });
    }
  }

  itemsOnRail() {
    this.arrItems = [...this.rail.children].map((item) => {
      const onLeft = -item.offsetLeft;
      return { item, onLeft };
    });
    return this.arrItems;
  }

  // ==== MOVIMENT ====
  updatePosition(currentX) {
    const calcDist = Math.round((currentX - this.distances.initial) * 1.6);
    this.distances.moving = calcDist;
    return this.distances.final + calcDist;
  }

  moveSlide(distX, transition = true) {
    this.rail.style.transform = `translate3d(${distX}px, 0px, 0px)`;
    this.rail.style.transition = transition
      ? 'transform .3s ease-in-out'
      : 'none';
  }

  changeItemTo(index) {
    if (index < this.arrItems.length) {
      const { onLeft } = this.arrItems[index];
      this.moveSlide(onLeft);
      this.distances.final = onLeft;
      this.index = this.directionLogic(index);
    } else {
      console.warn('Index is bigger than array length');
    }
  }

  // ==== DIRECTION LOGIC ====
  directionLogic(index) {
    const lastItem = this.arrItems.length - 1;
    const isInfinit = this.config.isInfinit;

    const prev = index > 0 ? index - 1 : isInfinit ? lastItem : undefined;
    const next = index < lastItem ? index + 1 : isInfinit ? 0 : undefined;

    return (this.index = { prev, active: index, next });
  }

  prevItem(e) {
    e.preventDefault();
    if (this.index.prev !== undefined) {
      this.changeItemTo(this.index.prev);
    }
  }

  nextItem(e) {
    e.preventDefault();
    if (this.index.next !== undefined) {
      this.changeItemTo(this.index.next);
    }
  }

  // ==== EVENTS (DRAG) ====
  onStart(e) {
    e.preventDefault();
    this.distances.initial = Math.round(e.clientX);
    this.wrapper.addEventListener('pointermove', this.onMoving);
    this.wrapper.addEventListener('pointerup', this.onFinal);
  }

  onMoving(e) {
    this.moveSlide(this.updatePosition(e.clientX), false);
  }

  onFinal(e) {
    this.wrapper.removeEventListener('pointermove', this.onMoving);
    this.wrapper.removeEventListener('pointerup', this.onFinal);
    this.changeOnMoving(e);
    this.distances.moving = 0;
  }

  changeOnMoving(e) {
    const minMove = this.wrapper.offsetWidth * 0.07;

    if (this.distances.moving < -minMove && this.index.next !== undefined) {
      this.nextItem(e);
    } else if (
      this.distances.moving > minMove &&
      this.index.prev !== undefined
    ) {
      this.prevItem(e);
    } else {
      this.changeItemTo(this.index.active);
    }
  }
}
