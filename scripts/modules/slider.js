import throttle from './throttle.js';

export default class Slider {
  constructor({ wrapper, rail, config = {} }) {
    this.wrapper = document.querySelector(wrapper);
    this.rail = document.querySelector(rail);
    if (!this.wrapper || !this.rail)
      throw new Error(`Invalid querySelector at ${wrapper} or ${rail}`);

    this.config = {
      firstItem: 0,
      looping: true,
      activeClass: 'active',
      ...config,
    };

    this.distances = { initial: 0, moving: 0, final: 0 };
    this.index = { active: 0 };
    this.bindingMethods();
  }

  // ==== PUBLIC ====
  init() {
    this.cloneIfLooping();
    this.itemsOnRail();
    this.addStartEvent();
    this.addGoToIfLooping();
    this.updateOnResize();
    this.goTo(this.config.firstItem + (this.config.looping ? 1 : 0));
  }

  // ==== SETUP ====
  bindingMethods() {
    const toBind = [
      'onStart',
      'onFinal',
      'goToIfLooping',
      'prevItem',
      'nextItem',
      'linkingDot',
    ];
    toBind.forEach((m) => (this[m] = this[m].bind(this)));
    this.onMoving = throttle(this.onMoving.bind(this), 16);
    this.onResizing = throttle(this.onResizing.bind(this), 200);
  }

  addStartEvent() {
    this.wrapper.addEventListener('pointerdown', this.onStart, {
      passive: false,
    });
  }

  addGoToIfLooping() {
    this.rail.addEventListener('transitionend', this.goToIfLooping);
  }

  updateOnResize() {
    window.addEventListener('resize', this.onResizing);
  }

  itemsOnRail() {
    this.itemsWithClones = [...this.rail.children];

    this.items = this.itemsWithClones.filter(
      (el) => !el.classList.contains(this.classClone),
    );

    this.itemsPosition = this.itemsWithClones.map((item) => {
      const onLeft = -item.offsetLeft;
      return { item, onLeft };
    });

    return {
      items: this.items,
      itemsWithClones: this.itemsWithClones,
      itemsPosition: this.itemsPosition,
    };
  }

  cloneIfLooping() {
    if (!this.config.looping) return;
    const elements = [...this.rail.children];

    if (elements.length < 2) return;

    const firstEl = elements[0];
    const lastEl = elements[elements.length - 1];

    const firstElClone = firstEl.cloneNode(true);
    const lastElClone = lastEl.cloneNode(true);
    this.classClone = 'clonedItem';

    firstElClone.classList.add(this.classClone);
    lastElClone.classList.add(this.classClone);

    this.rail.insertBefore(lastElClone, firstEl);
    this.rail.appendChild(firstElClone);
  }

  // ==== ITEM CHANGE ====
  goTo(index, transition = true) {
    const arrSize = this.itemsWithClones.length;
    const lastIndex = arrSize - 1;

    if (this.config.looping) {
      if (index < 0) index = 1;
      if (index > lastIndex) index = lastIndex - 1;
    } else {
      if (index < 0) index = 0;
      if (index > lastIndex) index = lastIndex;
    }

    const { onLeft } = this.itemsPosition[index];
    this.moveSlide(onLeft, transition);
    this.distances.final = onLeft;
    this.index.active = index;
  }

  prevItem(e) {
    e?.preventDefault();
    this.goTo(this.index.active - 1);
  }

  nextItem(e) {
    e?.preventDefault();
    this.goTo(this.index.active + 1);
  }

  toggleActive() {
    const activeClass = this.config.activeClass;

    this.items.forEach((el) => el.classList.remove(activeClass));

    const realIndex = this.getRealIndex(this.index.active);
    const realItem = this.items[realIndex];
    if (realItem) realItem.classList.add(activeClass);

    this.accessibility();
  }

  goToIfLooping() {
    if (!this.config.looping) {
      this.toggleActive();
      return;
    }

    const lastIndex = this.itemsWithClones.length - 1;
    const activeIndex = this.index.active;

    if (activeIndex === lastIndex) this.goTo(1, false);
    else if (activeIndex === 0) this.goTo(lastIndex - 1, false);

    this.toggleActive();
  }

  // ==== MOVEMENT ====
  updatePosition(currentX) {
    const calcDist = Math.round((currentX - this.distances.initial) * 1.5);
    this.distances.moving = calcDist;
    return this.distances.final + calcDist;
  }

  moveSlide(distX, transition = true) {
    this.rail.style.transform = `translate3d(${distX}px, 0, 0)`;
    this.rail.style.transition = transition
      ? 'transform .3s ease-in-out'
      : 'none';
  }

  changeOnMoving() {
    const minMove = this.wrapper.offsetWidth * 0.06;
    if (this.distances.moving < -minMove) this.nextItem();
    else if (this.distances.moving > minMove) this.prevItem();
    else this.goTo(this.index.active);
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

  // ==== RESIZE ====
  onResizing() {
    setTimeout(() => {
      this.itemsOnRail();
      this.goTo(this.index.active);
    }, 200);
  }

  // ==== UTILS ====
  getRealIndex(index) {
    if (!this.config.looping) return index;

    const totalOriginals = this.items.length;
    const totalWithClones = this.itemsWithClones.length;

    if (index === 0) return totalOriginals - 1;
    if (index === totalWithClones - 1) return 0;
    return index - 1;
  }

  // ==== ACCESSIBILITY ====
  accessibility() {
    const listItems = this.itemsWithClones;
    const activeClass = this.config.activeClass;

    listItems.forEach((child) => {
      const isActive = child.classList.contains(activeClass);
      if (
        !isActive &&
        document.activeElement &&
        child.contains(document.activeElement)
      )
        document.activeElement.blur();

      if (!isActive) {
        child.setAttribute('inert', '');
        child.setAttribute('aria-hidden', 'true');
        child.setAttribute('tabindex', '-1');
        child.removeAttribute('aria-current');
      } else {
        child.removeAttribute('inert');
        child.setAttribute('aria-hidden', 'false');
        child.setAttribute('tabindex', '0');
        child.setAttribute('aria-current', 'true');
      }
    });

    return listItems;
  }
}

export class SliderCTRL extends Slider {
  constructor(defaultParams) {
    super(defaultParams);
    this.prevControl = defaultParams.config
      ? document.querySelector(this.config.prevControl)
      : null;
    this.nextControl = defaultParams.config
      ? document.querySelector(this.config.nextControl)
      : null;
    this.enableDots = defaultParams.config.enableDots ?? true;
    this.arrDots = [];
  }

  // ==== PUBLIC ====
  init() {
    super.init();
    this.addEventToCTRL();
  }

  // ==== SETUP ====
  addEventToCTRL() {
    const userEvent = ['click', 'touchstart'];
    userEvent.forEach((evt) => {
      if (this.prevControl && this.nextControl) {
        this.prevControl.addEventListener(evt, this.prevItem);
        this.nextControl.addEventListener(evt, this.nextItem);
      }
    });
    if (this.enableDots) {
      this.createDotCTRL();
      this.arrDots.forEach((dot) =>
        userEvent.forEach((evt) => {
          dot.addEventListener(evt, this.linkingDot);
        }),
      );
    }
  }

  // ==== CREATE DOTS ====
  createDotCTRL() {
    if (!this.wrapper && !this.config.enableDots) return;
    const items = this.items;
    this.classActiveDot = 'active-dot';

    const railDot = document.createElement('ul');
    railDot.dataset.ctrl = 'railDot';

    items.forEach((item, i) => {
      const dotLi = document.createElement('li');
      const dotLink = document.createElement('a');
      if (!item.classList.contains(this.classClone)) {
        dotLink.href = `#slide${i}`;
        dotLi.appendChild(dotLink);
        railDot.appendChild(dotLi);
      }
      this.arrDots.push(dotLink);
    });
    this.wrapper.appendChild(railDot);
  }

  activeDot() {
    this.arrDots.forEach((dot) => dot.classList.remove(active));
    if (this.index.active === index) {
      // console.log(this.arrDots.classList.add(this.activeDot));
    }
  }

  linkingDot(e) {
    e.preventDefault();
    console.log(e);
  }
}
