import { Player, Vector3 } from "@minecraft/server";

export function checkVector3(vector:any){

    if(typeof vector === "object"&&!Array.isArray(vector)){

        const record = vector as Record<any,any>

        if(record["x"] !== undefined&&record["y"] !== undefined&&record["z"] !== undefined){
            return true
        }

    }

    return false


}

export function getPlayerSpeed(player:Player){
      // 1. 各軸の速度ベクトル（Vector3）を取得
        const velocity = player.getVelocity();

        // 2. 三平方の定理を使って、3次元空間上の実際のスピード（スカラー値）を計算
        const speed = Math.sqrt(
            velocity.x ** 2 + 
            velocity.y ** 2 + 
            velocity.z ** 2
        );

        // 3. 水平方向（地面の移動）だけの速度を知りたい場合はこちら
        const horizontalSpeed = Math.sqrt(
            velocity.x ** 2 + 
            velocity.z ** 2
        );

        /*

        // 画面上のアクションバーに速度を表示 (小数点第2位まで)
        player.onScreenDisplay.setActionBar(
            `現在の速度: ${speed.toFixed(2)} ブロック/tick\n` +
            `水平速度: ${horizontalSpeed.toFixed(2)} ブロック/tick`
        );
        */

        return speed
}