import { DefaultOptons, Options, TrackerConfig, reportTrackerData } from "../type/index";
import { createHistoryEvnent } from "../utils/pageView";
 
const MouseEventList: string[] = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover']
 
/* 为什么打包后引入打包后的index.js是通过new tracker()进行使用而不是new Tracker()，而且你查看
dist里面的index.js文件里面有一段return Tracker。答案就在立执行函数的函数体里面的global.tracker = factory()这一段
*/
export default class Tracker {
    public data: Options;
    private version: string | undefined;
 
    public constructor(options: Options) {
        this.data = Object.assign(this.initDef(), options)
        this.installInnerTrack()
    }
 
    private initDef(): DefaultOptons {
        this.version = TrackerConfig.version;
        /* 直接输出history你会发现并没有pushState属性，但是在它的原型链上其实是有的。
        为什么就重写pushState和replaceState而不写popState等，因为pushState不会触发window.addEventListener('pushState',() =>{})
        */
        window.history['pushState'] = createHistoryEvnent("pushState")
        window.history['replaceState'] = createHistoryEvnent('replaceState')
        return <DefaultOptons>{
 
            sdkVersion: this.version,
            historyTracker: false,
            hashTracker: false,
            domTracker: false,
            jsError: false
        }
    }
 
    // 两个public set方法用于用户自定义设置option
    public setUserId<T extends DefaultOptons['uuid']>(uuid: T) {
        this.data.uuid = uuid;
    }
 
    public setExtra<T extends DefaultOptons['extra']>(extra: T) {
        this.data.extra = extra
    }
 
    public sendTracker<T extends reportTrackerData>(data: T) {
        this.reportTracker(data)
    }
 
    private captureEvents<T>(MouseEventList: string[], targetKey: string, data?: T) {
        MouseEventList.forEach(event => {
            window.addEventListener(event, () => {
                this.reportTracker({ event, targetKey, data })
            })
        })
    }
 
    private installInnerTrack() {
        /* 在init阶段对pushState、replaceState、popstate、hashchange四个事件进行监听
         而且window.history['pushState']和window.history['replaceState']在initDefaultOption
        阶段就已经被我们重写  */
        if (this.data.historyTracker) {
            this.captureEvents(['pushState'], 'history-pv')
            this.captureEvents(['replaceState'], 'history-pv')
            this.captureEvents(['popstate'], 'history-pv')
        }
        if (this.data.hashTracker) {
            this.captureEvents(['hashchange'], 'hash-pv')
        }
        if (this.data.domTracker) {
            this.targetKeyReport()
        }
        if (this.data.jsError) {
            this.jsError()
        }
    }
    //dom 点击上报
    private targetKeyReport() {
        MouseEventList.forEach(event => {
            window.addEventListener(event, (e) => {
                const target = e.target as HTMLElement
                const targetValue = target.getAttribute('target-key')
                if (targetValue) {
                    this.sendTracker({
                        targetKey: targetValue,
                        event
                    })
                }
            })
        })
    }
 
    private jsError() {
        this.errorEvent()
        this.promiseReject()
    }
   //捕获js报错
    private errorEvent() {
        window.addEventListener('error', (e) => {
            this.sendTracker({
                targetKey: 'message',
                event: 'error',
                message: e.message
            })
        })
    }
   //捕获promise 错误
    private promiseReject() {
        window.addEventListener('unhandledrejection', (event) => {
            event.promise.catch(error => {
                this.sendTracker({
                    targetKey: "reject",
                    event: "promise",
                    message: error
                })
            })
        })
    }
   //上报
    private reportTracker<T>(data: T) {
        const params = Object.assign(this.data, data, { time: new Date().getTime() })
        let headers = {
            type: 'application/x-www-form-urlencoded'
        };
        let blob = new Blob([JSON.stringify(params)], headers);
        navigator.sendBeacon(this.data.requestUrl, blob)
    }
 
}
 
 
 