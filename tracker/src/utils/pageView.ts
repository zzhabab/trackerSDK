export const createHistoryEvnent = <T extends keyof History>(type: T): () => any => {
    // 这里的origin就是拿到了原本的history.pushState()、history.replaceState()两个方法
    const origin = history[type];
    console.log(`here is origin:${origin}`)
    return function (this: any) { // this是一个假参数后续使用的时候并不会传递进来一个this，此处需要它是因为需要给个any限定类型
        /* arguments 是一个对应于传递给函数的参数的类数组对象。
        function zzh(a, b) {
          console.log(arguments[0]) output:0
          console.log(arguments[1]) output:1
          console.log(arguments) output:Object{0:0,1:1}
        }
        zzh(0, 1)
        */
        const res = origin.apply(this, arguments)
        var e = new Event(type)
        window.dispatchEvent(e)
        return res;
        /* 并没有对history.pushState()进行参数上的改造。
        pushState(data: any, unused: string, url?: string | URL | null): void;依然使用原本的参数要求
        */
    }
}