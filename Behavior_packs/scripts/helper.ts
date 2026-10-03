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
   
        const velocity = player.getVelocity();


        const speed = Math.sqrt(
            velocity.x ** 2 + 
            velocity.y ** 2 + 
            velocity.z ** 2
        );

    


        return speed
}