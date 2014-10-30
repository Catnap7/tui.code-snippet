/**
 * @fileoverview
 * @author FE개발팀
 */

(function(ne) {
    'use strict';
    /* istanbul ignore if */
    if (!ne) {
        ne = window.ne = {};
    }

    /**
     * 커스텀 이벤트를 위한 메서드 믹스인.
     *
     * extend 메서드를 사용하여 
     * @exports CustomEvent
     * @mixin
     */
    var CustomEvent = {
        /**
         * 인스턴스가 발생하는 이벤트에 핸들러를 등록하는 메서드
         * @param {(Object|String)} types - 이벤트 타입 (타입과 함수 쌍으로 된 객체를 전달할 수도 있고 타입만
         * 전달할 수 있다. 후자의 경우 두 번째 인자에 핸들러를 전달해야 한다.)
         * @param {function()=} fn - 이벤트 핸들러 목록
         * @param {*=} context
         */
        on: function(types, fn, context) {
            var type, i, len;

            if (typeof types === 'object') {
                for (type in types) {
                    if (types.hasOwnProperty(type)) {
                        this._on(type, types[type], fn);
                    }
                }
            } else {
                types = types.split(' ');

                for (i = 0, len = types.length; i < len; i++) {
                    this._on(types[i], fn, context);
                }
            }

            return this;
        },

        /**
         * 내부적으로 실제로 이벤트를 등록하는 로직을 담는 메서드.
         *
         * 옵션에 따라 이벤트를 배열에 등록하기도 하고 해시에 등록하기도 한다.
         *
         * 두개를 사용하는 기준:
         *
         * 핸들러가 이미 this바인딩이 되어 있고 핸들러를 사용하는 object가 같은 종류가 동시다발적으로 생성/삭제되는 경우에는 context인자를
         * 전달하여 해시의 빠른 접근 속도를 이용하는 것이 좋다.
         *
         * @param {(Object.<String, Function()>|String)} type - 이벤트 타입 (타입과 함수 쌍으로 된 객체를 전달할 수도 있고 타입만
         * 전달할 수 있다. 후자의 경우 두 번째 인자에 핸들러를 전달해야 한다.)
         * @param {function()} fn - 이벤트 핸들러
         * @param {*=} context
         * @private
         */
        _on: function(type, fn, context) {
            var events = this._events = this._events || {},
                contextId = context && context !== this && ne.object.stamp(context);

            if (contextId) {
                /*
                 context가 현재 인스턴스와 다를 때 context의 아이디로 내부의 해시에서 빠르게 해당 핸들러를 컨트롤 하기 위한 로직.
                 이렇게 하면 동시에 많은 이벤트를 발생시키거나 제거할 때 성능면에서 많은 이점을 제공한다.
                 특히 동시에 많은 엘리먼트들이 추가되거나 해제될 때 도움이 될 수 있다.
                 */
                var indexKey = type + '_idx',
                    indexLenKey = type + '_len',
                    typeIndex = events[indexKey] = events[indexKey] || {},
                    id = ne.object.stamp(fn) + '_' + contextId; // 핸들러의 id + context의 id

                if (!typeIndex[id]) {
                    typeIndex[id] = {
                        fn: fn,
                        ctx: context
                    };

                    // 할당된 이벤트의 갯수를 추적해 두고 할당된 핸들러가 없는지 여부를 빠르게 확인하기 위해 사용한다
                    events[indexLenKey] = (events[indexLenKey] || 0) + 1;
                }
            } else {
                // fn이 이미 this 바인딩이 된 상태에서 올 경우 단순하게 처리해준다
                events[type] = events[type] || [];
                events[type].push({fn: fn});
            }
        },

        /**
         * 인스턴스에 등록했던 이벤트 핸들러를 해제할 수 있다.
         * @param {(Object|string)=} types 등록 해지를 원하는 이벤트 객체 또는 타입명. 아무 인자도 전달하지 않으면 모든 이벤트를 해제한다.
         * @param {Function=} fn
         * @param {*=} context
         */
        off: function(types, fn, context) {
            var type, i, len;

            if (!types) {
                this._events = null;
            } else if (typeof types === 'object') {
                for (type in types) {
                    if (types.hasOwnProperty(type)) {
                        this._off(type, types[type], fn);
                    }
                }
            } else {
                types = types.split(' ');

                for (i = 0, len = types.length; i < len; i++) {
                    this._off(types[i], fn, context);
                }
            }

            return this;
        },

        /**
         * 실제로 구독을 해제하는 메서드
         * @param {(Object|string)=} type 등록 해지를 원하는 핸들러명
         * @param {Function} fn
         * @param {*} context
         * @private
         */
        _off: function(type, fn, context) {
            var events = this._events,
                indexKey = type + '_idx',
                indexLenKey = type + '_len';

            /* istanbul ignore if */
            if (!events) {
                return;
            }

            var contextId = context && context !== this && ne.object.stamp(context),
                listeners, i, len, id;

            if (contextId) {
                id = ne.object.stamp(fn) + '_' + contextId;
                listeners = events[indexKey];

                if (listeners && listeners[id]) {
                    listeners[id] = null;
                    events[indexLenKey]--;
                }

            } else {
                listeners = events[type];

                if (listeners) {
                    for (i = 0, len = listeners.length; i < len; i++) {
                        if (listeners[i] && listeners[i].fn === fn) {
                            listeners.splice(i, 1);
                            break;
                        }
                    }

                }
            }

        },

        /**
         * 이벤트를 발생시키는 메서드
         * @param {String} type 이벤트 타입명
         * @param {(Object|String)=} data 발생과 함께 전달할 이벤트 데이터
         * @return {*}
         */
        fire: function(type, data) {
            if (!this.hasListener(type)) {
                return this;
            }

            var event = ne.object.extend({}, data, {type: type, target: this}),
                events = this._events;

            /* istanbul ignore if */
            if (!events) {
                return;
            }

            var typeIndex = events[type + '_idx'],
                i, len, listeners, id;

            if (events[type]) {
                listeners = events[type].slice();

                for (i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].fn.call(this, event);
                }
            }

            for (id in typeIndex) {
                if (typeIndex.hasOwnProperty(id)) {
                    typeIndex[id].fn.call(typeIndex[id].ctx, event);
                }
            }

            return this;

        },

        /**
         * 이벤트 핸들러 존재 여부 확인
         * @param {String} type 핸들러명
         * @return {boolean}
         */
        hasListener: function(type) {
            var events = this._events;
            return events && (events[type] || events[type + '_len']);
        },

        /**
         * 단발성 커스텀 이벤트 핸들러 등록 시 사용
         * @param {(Object|String)} types 이벤트명:핸들러 객체 또는 이벤트명
         * @param {function()=} fn 핸들러 함수
         * @param {*=} context
         * @return {*}
         */
        once: function(types, fn, context) {
            var that = this;

            if (typeof types === 'object') {
                for (var type in types) {
                    if (types.hasOwnProperty(type)) {
                        this.once(type, types[type], fn);
                    }
                }
                return this;
            }

            function onceHandler() {
                fn.apply(context, arguments);
                that.off(types, onceHandler, context);
            }

            this.on(types, onceHandler, context);

            return this;
        }
    };

    function customEvent(Type) {
        return ne.object.extend(Type.prototype, CustomEvent);
    }

    ne.customEvent = customEvent;

})(window.ne);