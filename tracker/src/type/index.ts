/**
 * @requestUrl 接口地址
 * @historyTracker history上报
 * @hashTracker hash上报
 * @domTracker 携带Tracker-key 点击事件上报
 * @sdkVersionsdk版本
 * @extra透传字段
 * @jsError js 和 promise 报错异常上报
 */
export interface DefaultOptons {
    uuid: string | undefined,
    requestUrl: string | undefined,
    historyTracker: boolean,
    hashTracker: boolean,
    domTracker: boolean,
    sdkVersion: string | number,
    extra: Record<string, any> | undefined, // Record<string, any>意思就是string、any的key-value
    jsError:boolean
}
 
//必传参数 requestUrl
// Partial关键字。继承于DefaultOptons，同时也给DefaultOptons里面的属性设置了类似params?: string，可选属性设置
export interface Options extends Partial<DefaultOptons> {
    requestUrl: string,
}
 
//版本
export enum TrackerConfig {
    version = '1.0.0'
}
//上报必传参数
export type reportTrackerData = {
    [key: string]: any, // 一对key-vlaue但是约束了key是string，value是any
    event: string,
    targetKey: string
}