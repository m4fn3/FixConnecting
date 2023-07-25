import {Plugin, registerPlugin} from 'enmity/managers/plugins'
import {React, Toasts} from 'enmity/metro/common'
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name as plugin_name} from '../manifest.json'
import Settings from "./components/Settings"
import {getStoreByName} from "../../hook";
import {getByProps} from "enmity/modules";
import {getIDByName} from "enmity/api/assets";

const Patcher = create('FixConnecting')

const FixConnecting: Plugin = {
    ...manifest,
    onStart() {
        // NOTE: 調査用
        // setTimeout(()=>{
        //     let l = getByKeyword("session", {all:true})
        //     console.log(l)
        // },2000)

        // NOTE: メイン実行部
        let S = getByProps("startSession") // ログイン等の関数がある
        let store = getStoreByName("AuthenticationStore") // initializedとかフックしたけど起動とは関係なさそう、しかしgetSessionIdで成功したかがわかる
        // let cons = getByProps("_handleConnectionOpen", "_handleConnectionOpenSupplemental")
        // handleGuildCreate -> handleConnectionOpenSupplemental -> handleConnectionOpen の順に呼ばれさいごのやつでCONNECTION_OPENが起こる、そして読み込みを行う <- 自分でこれらを呼んでも意味がない
        // let a = getByProps("handleSessionsChanged") // 成功時はわかるが意味ない

        const FluxDispatcher = getByProps("_currentDispatchActionType", "_subscriptions", "_actionHandlers", "_waitQueue")

        // hookAllMethods(Patcher, getStoreHandlers("ToastStore"))

        const unpatch = Patcher.after(S, "startSession", (self, args, res) => {
            unpatch() // 一回目のみでいいので解除する(無限ループしちゃう)
            setTimeout(() => {
                let session_id = store.getSessionId()
                if (!session_id) {
                    FluxDispatcher?.dispatch({type: 'APP_STATE_UPDATE', state: 'active'})
                    Toasts.open({ // Warning: Toastの引数が変更されている
                        key: "TOAST",
                        content: `Automatically fixed Connecting bug!`,
                        icon: getIDByName('Check')
                    });
                    // S.switchAccountToken(args[0])
                }
            }, 300) // NOTE: 早すぎたら不必要に再読み込みするだけなのであまり気にしない
        })
    },
    onStop() {
        Patcher.unpatchAll()
    },
    getSettingsPanel({settings}) {
        return <Settings settings={settings}/>
    }
}

registerPlugin(FixConnecting)
