(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.tracker = factory());
})(this, (function () { 'use strict';

    //版本
    var TrackerConfig;
    (function (TrackerConfig) {
        TrackerConfig["version"] = "1.0.0";
    })(TrackerConfig || (TrackerConfig = {}));

    const createHistoryEvnent = (type) => {
        // 这里的origin就是拿到了原本的history.pushState()、history.replaceState()两个方法
        const origin = history[type];
        console.log(`here is origin:${origin}`);
        return function () {
            /* arguments 是一个对应于传递给函数的参数的类数组对象。
            function zzh(a, b) {
              console.log(arguments[0]) output:0
              console.log(arguments[1]) output:1
              console.log(arguments) output:Object{0:0,1:1}
            }
            zzh(0, 1)
            */
            const res = origin.apply(this, arguments);
            var e = new Event(type);
            window.dispatchEvent(e);
            return res;
            /* 并没有对history.pushState()进行参数上的改造。
            pushState(data: any, unused: string, url?: string | URL | null): void;依然使用原本的参数要求
            */
        };
    };

    const MouseEventList = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover'];
    /* 为什么打包后引入打包后的index.js是通过new tracker()进行使用而不是new Tracker()，而且你查看
    dist里面的index.js文件里面有一段return Tracker。答案就在立执行函数的函数体里面的global.tracker = factory()这一段
    */
    class Tracker {
        constructor(options) {
            this.data = Object.assign(this.initDef(), options);
            this.installInnerTrack();
        }
        initDef() {
            this.version = TrackerConfig.version;
            /* 直接输出history你会发现并没有pushState属性，但是在它的原型链上其实是有的。
            为什么就重写pushState和replaceState而不写popState等，因为pushState不会触发window.addEventListener('pushState',() =>{})
            */
            window.history['pushState'] = createHistoryEvnent("pushState");
            window.history['replaceState'] = createHistoryEvnent('replaceState');
            return {
                sdkVersion: this.version,
                historyTracker: false,
                hashTracker: false,
                domTracker: false,
                jsError: false
            };
        }
        // 两个public set方法用于用户自定义设置option
        setUserId(uuid) {
            this.data.uuid = uuid;
        }
        setExtra(extra) {
            this.data.extra = extra;
        }
        sendTracker(data) {
            this.reportTracker(data);
        }
        captureEvents(MouseEventList, targetKey, data) {
            MouseEventList.forEach(event => {
                window.addEventListener(event, () => {
                    this.reportTracker({ event, targetKey, data });
                });
            });
        }
        installInnerTrack() {
            /* 在init阶段对pushState、replaceState、popstate、hashchange四个事件进行监听
             而且window.history['pushState']和window.history['replaceState']在initDefaultOption
            阶段就已经被我们重写  */
            if (this.data.historyTracker) {
                this.captureEvents(['pushState'], 'history-pv');
                this.captureEvents(['replaceState'], 'history-pv');
                this.captureEvents(['popstate'], 'history-pv');
            }
            if (this.data.hashTracker) {
                this.captureEvents(['hashchange'], 'hash-pv');
            }
            if (this.data.domTracker) {
                this.targetKeyReport();
            }
            if (this.data.jsError) {
                this.jsError();
            }
        }
        //dom 点击上报
        targetKeyReport() {
            MouseEventList.forEach(event => {
                window.addEventListener(event, (e) => {
                    const target = e.target;
                    const targetValue = target.getAttribute('target-key');
                    if (targetValue) {
                        this.sendTracker({
                            targetKey: targetValue,
                            event
                        });
                    }
                });
            });
        }
        jsError() {
            this.errorEvent();
            this.promiseReject();
        }
        //捕获js报错
        errorEvent() {
            window.addEventListener('error', (e) => {
                this.sendTracker({
                    targetKey: 'message',
                    event: 'error',
                    message: e.message
                });
            });
        }
        //捕获promise 错误
        promiseReject() {
            window.addEventListener('unhandledrejection', (event) => {
                event.promise.catch(error => {
                    this.sendTracker({
                        targetKey: "reject",
                        event: "promise",
                        message: error
                    });
                });
            });
        }
        //上报
        reportTracker(data) {
            const params = Object.assign(this.data, data, { time: new Date().getTime() });
            let headers = {
                type: 'application/x-www-form-urlencoded'
            };
            let blob = new Blob([JSON.stringify(params)], headers);
            navigator.sendBeacon(this.data.requestUrl, blob);
        }
    }

    return Tracker;

}));
