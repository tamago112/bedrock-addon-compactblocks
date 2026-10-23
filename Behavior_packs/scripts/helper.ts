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

export function checkRGB(rgb:any){

    if(typeof rgb === "object"&&!Array.isArray(rgb)){

        const record = rgb as Record<any,any>

        if(typeof record["red"] === "number" && typeof record["blue"] === "number"&& typeof record["green"] === "number"){
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

export function safeJsonParse(str:any){

    try{
        return JSON.parse(str) as Record<any,any>
    }catch(e){
        return undefined
    }

}

export function safeJsonStr(obj:any){

    try{
        return JSON.stringify(obj)
    }catch(e){
        return undefined
    }

}