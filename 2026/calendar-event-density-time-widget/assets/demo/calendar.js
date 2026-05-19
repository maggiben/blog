/* Event-density calendar — vanilla JS from CodePen OPmLBW (blog embed, no Angular). */
(function () {
  var today = moment();

  function Calendar(selector, events) {
    this.el = document.querySelector(selector);
    this.events = events;
    this.maxEvents = this.events.reduce(function (p, c) {
      return c.events.length > p ? c.events.length : p;
    }, 0);
    this.current = moment().date(1);
    this.draw();
    var current = this.el.querySelector('.today');
    if (current) {
      var self = this;
      window.setTimeout(function () {
        self.openDay(current);
      }, 500);
    }
  }

  Calendar.prototype.draw = function () {
    this.drawHeader();
    this.drawMonth();
  };

  Calendar.prototype.drawHeader = function () {
    var self = this;
    if (!this.header) {
      this.header = createElement('div', 'header');
      this.header.className = 'header';
      this.title = {
        month: createElement('div', 'month', this.current.format('MMMM')),
        year: createElement('div', 'year', this.current.format('YYYY')),
      };
      var right = createElement('div', 'right');
      right.addEventListener('click', function () {
        self.nextMonth();
      });
      var left = createElement('div', 'left');
      left.addEventListener('click', function () {
        self.prevMonth();
      });
      var ringLeft = createElement('div', 'ring-left');
      var ringRight = createElement('div', 'ring-right');
      this.header.appendChild(this.title.month);
      this.header.appendChild(this.title.year);
      this.header.appendChild(ringLeft);
      this.header.appendChild(ringRight);
      this.header.appendChild(right);
      this.header.appendChild(left);
      this.el.appendChild(this.header);
      this.drawWeekDays();
    }
    this.title.month.innerHTML = this.current.format('MMMM');
    this.title.year.innerHTML = this.current.format('YYYY');
  };

  Calendar.prototype.drawMonth = function () {
    var self = this;
    this.events.forEach(function (event) {
      event.date = moment(event.date);
    });
    if (this.month) {
      this.oldMonth = this.month;
      this.oldMonth.className = 'month out ' + (self.next ? 'next' : 'prev');
      this.oldMonth.addEventListener('animationend', function () {
        if (self.oldMonth.parentNode) {
          self.oldMonth.parentNode.removeChild(self.oldMonth);
        }
        self.month = createElement('div', 'month');
        self.backFill();
        self.currentMonth();
        self.fowardFill();
        self.el.appendChild(self.month);
        window.setTimeout(function () {
          self.month.className = 'month in ' + (self.next ? 'next' : 'prev');
        }, 16);
      });
    } else {
      this.month = createElement('div', 'month');
      this.el.appendChild(this.month);
      this.backFill();
      this.currentMonth();
      this.fowardFill();
      this.month.className = 'month new';
    }
  };

  Calendar.prototype.backFill = function () {
    var clone = this.current.clone();
    var dayOfWeek = clone.day();
    if (!dayOfWeek) return;
    clone.subtract('days', dayOfWeek + 1);
    for (var i = dayOfWeek; i > 0; i--) {
      this.drawDay(clone.add('days', 1));
    }
  };

  Calendar.prototype.fowardFill = function () {
    var clone = this.current.clone().add('months', 1).subtract('days', 1);
    var dayOfWeek = clone.day();
    if (dayOfWeek === 6) return;
    for (var i = dayOfWeek; i < 6; i++) {
      this.drawDay(clone.add('days', 1));
    }
  };

  Calendar.prototype.currentMonth = function () {
    var clone = this.current.clone();
    while (clone.month() === this.current.month()) {
      this.drawDay(clone);
      clone.add('days', 1);
    }
  };

  Calendar.prototype.getWeek = function (day) {
    if (!this.week || day.day() === 0) {
      this.week = createElement('div', 'week');
      this.month.appendChild(this.week);
    }
  };

  Calendar.prototype.drawDay = function (day) {
    var self = this;
    this.getWeek(day);
    var todayEvents = this.events.filter(function (event) {
      return event.date.isSame(day, 'day');
    })[0];
    var outer = createElement('div', this.getDayClass(day));
    var circle = createElement('span', 'circle');
    if (todayEvents) {
      outer.addEventListener('click', function () {
        self.openDay(this);
      });
      var size = (1 / this.maxEvents) * todayEvents.events.length;
      circle.style.transform = 'scale(' + size + ')';
    } else {
      circle.style.transform = 'scale(0, 0)';
      outer.style.cursor = 'default';
    }
    var number = createElement('div', 'day-number', day.format('DD'));
    outer.appendChild(circle);
    outer.appendChild(number);
    this.week.appendChild(outer);
  };

  Calendar.prototype.getDayClass = function (day) {
    var classes = ['day'];
    if (day.month() !== this.current.month()) {
      classes.push('other');
    } else if (today.isSame(day, 'day')) {
      classes.push('today');
    }
    return classes.join(' ');
  };

  Calendar.prototype.openDay = function (el) {
    var details;
    var dayNumber =
      +el.querySelector('.day-number').innerText ||
      +el.querySelector('.day-number').textContent;
    var day = this.current.clone().date(dayNumber);
    var currentOpened = this.el.querySelector('.details');
    if (currentOpened && currentOpened.parentNode === el.parentNode) {
      details = currentOpened;
    } else {
      if (currentOpened) {
        currentOpened.addEventListener('animationend', function () {
          if (currentOpened.parentNode) {
            currentOpened.parentNode.removeChild(currentOpened);
          }
        });
        currentOpened.className = 'details out';
      }
      details = createElement('div', 'details in');
      var arrow = createElement('div', 'arrow');
      details.appendChild(arrow);
      el.parentNode.appendChild(details);
    }
    var todaysEvents = this.events.filter(function (event) {
      return event.date.isSame(day, 'day');
    });
    this.renderEvents(todaysEvents, details);
    var arrowEl = details.querySelector('.arrow');
    if (arrowEl) {
      arrowEl.style.left =
        el.offsetLeft - el.parentNode.offsetLeft + el.offsetWidth / 2 + 'px';
    }
  };

  Calendar.prototype.renderEvents = function (events, ele) {
    var currentWrapper = ele.querySelector('.events');
    var wrapper = createElement('div', 'events in' + (currentWrapper ? ' new' : ''));
    if (events.length < 1) return;
    events[0].events.forEach(function (ev) {
      var div = createElement('div', 'event');
      var square = createElement('div', 'event-category ' + ev.color);
      var span = createElement('span', '', ev.name);
      div.appendChild(square);
      div.appendChild(span);
      wrapper.appendChild(div);
    });
    if (currentWrapper) {
      currentWrapper.className = 'events out';
      currentWrapper.addEventListener('animationend', function () {
        if (currentWrapper.parentNode) {
          currentWrapper.parentNode.removeChild(currentWrapper);
        }
        ele.appendChild(wrapper);
      });
    } else {
      ele.appendChild(wrapper);
    }
  };

  Calendar.prototype.drawWeekDays = function () {
    var self = this;
    this.weekDays = createElement('div', 'week-days');
    ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(function (weekday) {
      self.weekDays.appendChild(createElement('span', 'day', weekday));
    });
    this.el.appendChild(this.weekDays);
  };

  Calendar.prototype.nextMonth = function () {
    this.current.add('months', 1);
    this.next = true;
    this.draw();
  };

  Calendar.prototype.prevMonth = function () {
    this.current.subtract('months', 1);
    this.next = false;
    this.draw();
  };

  function createElement(tagName, className, innerText) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (innerText) element.textContent = innerText;
    return element;
  }

  function demoEvents() {
    var y = moment().year();
    var m = moment().month();
    return [
      { date: new Date(y, m, 1), events: [{ name: 'Sprint planning', color: 'blue' }] },
      {
        date: new Date(y, m, 3),
        events: [
          { name: 'Design review', color: 'orange' },
          { name: 'API sync', color: 'yellow' },
          { name: 'Deploy window', color: 'green' },
        ],
      },
      {
        date: new Date(y, m, 5),
        events: [
          { name: 'Blog draft', color: 'orange' },
          { name: 'Office hours', color: 'blue' },
        ],
      },
      { date: new Date(y, m, 12), events: [{ name: 'Release candidate', color: 'green' }] },
      {
        date: new Date(y, m, 19),
        events: [
          { name: 'Publish post', color: 'pink' },
          { name: 'Retro', color: 'blue' },
        ],
      },
      {
        date: new Date(y, m, 28),
        events: [
          { name: 'Quarter close', color: 'orange' },
          { name: 'All-hands', color: 'yellow' },
          { name: 'Backup drill', color: 'green' },
          { name: 'Roadmap review', color: 'blue' },
        ],
      },
    ];
  }

  function init() {
    var root = document.getElementById('calendar-event-demo');
    if (!root || !window.moment) return;
    new Calendar('#calendar-event-demo #calendar', demoEvents());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
