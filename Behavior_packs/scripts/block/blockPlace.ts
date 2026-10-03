import { Player, Direction, Block, Vector3, ItemStack, EntityComponentTypes, EquipmentSlot, system, world, BlockPermutation, BlockType, BlockTypes, Entity } from "@minecraft/server";
import {block_interaction_range, blockbagId, StorageId } from "../pram";
import { addBlockCount, checkSomeVector,getBagInter, getBlockCount, setBagInter } from "./bagInter";
import { checkVector3 } from "../helper";
import { replaceableID, solidId, solidTag } from "./blocks";






export function placeInteractBlock(player:Player,item:ItemStack,targetBlock:Block,prevDirection:Direction,blockFace:Direction){




    const bagInter = getBagInter(item)
  

    if(!player.getDynamicProperty(StorageId.PLAYER_SELECTING)&&bagInter&&blockbagId === item.typeId){
    
          
         
    
    
          const Equippable = player.getComponent(EntityComponentTypes.Equippable);
    
    
    
            if (!Equippable) return;
    
            if (bagInter && item.typeId === blockbagId) {


              
    
              //中に入っているアイテムデータを入手。
              const interItem = bagInter.type;
              const InterCount = bagInter.count;
              //type -> アイテムID
              //count  -> アイテム個数


    
    
   
        
              if (typeof interItem !== "string" ||  InterCount < 1 || !targetBlock) {
                return;
              }



               const getPrevVector     = player.getDynamicProperty(StorageId.PLAYER_PLACE_LAST_VEC)
               const prevVec     = checkVector3(getPrevVector) ? getPrevVector as Vector3 :undefined
               const prevBlock   = prevVec ?  player.dimension.getBlock(prevVec) : undefined

               const adjacentVec = prevBlock  ? BlocksInTheDirection(prevBlock,prevDirection)?.location:undefined
               
               
               
               
           

 

             
              const directionBlock =targetBlock
                 

               


                        
            
    
    
              //置く場所を指定。
    
    
    
    
    
           
              const directionBlockLocation = directionBlock.location;

              const solidBlock    = isSolidBlock(interItem,solidId)
              const entityHindering = isEntityCollidingWithTarget(player,directionBlockLocation)

              const someVector      = !!adjacentVec&&checkSomeVector(adjacentVec,targetBlock.location)

              const blockCount      = getBlockCount(player)

        

         
              if (!directionBlock || !interItem  ||!directionBlock.isLiquid&&!isSolidBlock(directionBlock.typeId,replaceableID)&&!directionBlock.isAir || !solidBlock&&entityHindering) return;
    
          
 
    



          

               
             if(blockCount === 1){
                    const placeDirection = getPlaceDirection(player,directionBlockLocation)
                    player.setDynamicProperty(StorageId.PLAYER_PLACE_FIRST_DIRECTION,placeDirection)
               }

               

             
               if(blockCount > 1&&adjacentVec&&!someVector){


                  
                  return;
              }

            
                   
              addBlockCount(player)
              
    
    
                  const blockDirection = blockCount < 1 ? blockFace : prevDirection;

                  try{
                    // ブロックの方向を適用
                    const permutation = getDirectionBlock(interItem,blockDirection,player)
                    player.dimension.setBlockPermutation(directionBlockLocation,permutation);
                  }catch{
                      player.sendMessage({translate:"compactblocks.error.noblock"});
                  }

              
              
             
    
              player.playSound("use.stone");

              //現在時刻を記録してクールタイムを初期化
              player.setDynamicProperty(StorageId.PLAYER_PLACE_LAST_TICK,system.currentTick)

     
              player.setDynamicProperty(StorageId.PLAYER_PLACE_LAST_VEC,targetBlock.location)
           

              

          


              

             
     

              
              player.setDynamicProperty(StorageId.PLAYER_PLACE_FIRST_VEC,targetBlock.location)
              
    
              const nextCount = InterCount - 1
    
              let nextItem = setBagInter(item, interItem, nextCount,player)
    
              
    
    
              Equippable.setEquipment(EquipmentSlot.Mainhand, nextItem);
    
    
    
    
    
            }
    
        
      }

}



 





export function BlocksInTheDirection(block: Block, direction: Direction) {


  

  switch (direction) {

    case "Down":

      return block.below();



    case "East":

      return block.east();



    case "North":

      return block.north();





    case "South":

      return block.south();



    case "Up":

      return block.above();



    case "West":

      return block.west();



    default:


      return undefined;





  }


}



export function getPlacementDirection(player: Player):Direction {

    const pitch = player.getRotation().x;
    const yaw = player.getRotation().y;

     if (pitch <= -55 && pitch < -89) {

        return Direction.Up; // 上向き

    } if (pitch >= 75 && pitch > 80) {

        return Direction.Down; // 下向き

    } else if ((yaw >= -180 && yaw < -140)||(yaw < 180 && yaw > 140)) {

        return Direction.North; // 南向き

    } else if (yaw < -50 && yaw >  -140) {

        return Direction.East; // 東向き

    } else if (yaw > 20 && yaw < 140) {

        return Direction.West; // 西向き

    } else {

        return Direction.South; // 北向き 

    }
}

export function getInvertDirection(direction: Direction):Direction {


    switch(direction){

        case Direction.Down:
            return Direction.Up; // 南向き
        case Direction.East:
             return Direction.West; // 西向き
        case Direction.North:
              return Direction.South; // 南向き 
        case Direction.South:
              return Direction.North; // 北向き 
        case Direction.Up:
            return Direction.Down; // 南向き
        case Direction.West:
             return Direction.East; // 東向き

    }


   
}

export function getPlaceDirection(player:Player,client: Vector3):Direction{

    const getPrev = player.getDynamicProperty(StorageId.PLAYER_PLACE_FIRST_VEC)

    if(checkVector3(getPrev)){

        const prevVec = getPrev as Vector3
        const diffVec:Vector3 = {
                x:client.x - prevVec.x,
                y:client.y  - prevVec.y,
                z:client.z - prevVec.z
        }

       

        const getAbsoluteMax:[string,number]  =  Object.entries(diffVec).reduce((max, current) => {
          return Math.abs(current[1]) > Math.abs(max[1]) ? current : max;
        });

        switch(getAbsoluteMax[0]){
            case "x":
                return Math.sign(getAbsoluteMax[1]) === 1 ? Direction.East :Direction.West
            case "y":
               return Math.sign(getAbsoluteMax[1]) === 1 ? Direction.Up :Direction.Down
            case "z":
                return Math.sign(getAbsoluteMax[1]) === 1 ? Direction.South :Direction.North


        }

        

        

    }

        
    return getPlacementDirection(player)

    
    

   
}







function getDirectionBlock(typeId:string,direction:Direction,player:Player){

    const currentPermutation = BlockPermutation.resolve(typeId);



    //方向を設定する方法がブロックによって違う。

     if (currentPermutation.getState("minecraft:cardinal_direction") !== undefined) {

           const placementDirection = getPlacementDirection(player)   
           const invertDirection    = getInvertDirection(placementDirection)

           
           return currentPermutation.withState("minecraft:cardinal_direction", invertDirection.toLowerCase());


            
        }else if(currentPermutation.getState("torch_facing_direction") !== undefined) {

            const invertDirection = getInvertDirection(direction)

      
            return currentPermutation.withState("torch_facing_direction", invertDirection.toLowerCase()); 


        }else if(currentPermutation.getState("lever_direction") !== undefined) {

    
      
            return currentPermutation.withState("lever_direction", direction.toLowerCase()); 

            
      }else if (currentPermutation.getState("facing_direction") !== undefined) {

                 return currentPermutation.withState("facing_direction", cardinalToFacingDirection(direction)); 

        }else if(currentPermutation.getState("pillar_axis") !== undefined) {
           
           
            return currentPermutation.withState("pillar_axis", cardinalToPillarAxis(direction)); 
        }else {
            return currentPermutation;
        }


  
  

}

function cardinalToFacingDirection(direction:Direction){

    switch(direction){
        case Direction.Down:
          return 0
        case Direction.East:
          return 4
        case Direction.North:
          return 3
        case Direction.South:
          return 2
        case Direction.Up:
          return 1
        case Direction.West:
          return 5
    }

}

function cardinalToPillarAxis(direction:Direction){

    switch(direction){
        case Direction.Down:
          return "y"
        case Direction.East:
          return "x"
        case Direction.North:
          return "z"
        case Direction.South:
          return "z"
        case Direction.Up:
          return "y"
        case Direction.West:
          return "x"
    }

}

function isSolidBlock(typeId:string,list:string[]){

    try{
        const block = BlockPermutation.resolve(typeId)
        const findTag = solidTag.filter(tag=>block.hasTag(tag))

      
        return findTag.length > 0 || list.includes(typeId)
    }catch(e){
      return false
    }

}

function isEntityCollidingWithTarget(target:Entity, targetLoc:Vector3) {

    const pAABB = target.getAABB(); 
    if (!pAABB) return false;


    const pMin = {
        x: pAABB.center.x - pAABB.extent.x, 
        y: pAABB.center.y - pAABB.extent.y,
        z: pAABB.center.z - pAABB.extent.z  
    };
    const pMax = {
        x: pAABB.center.x + pAABB.extent.x, 
        y: pAABB.center.y + pAABB.extent.y, 
        z: pAABB.center.z + pAABB.extent.z  
    };

    // 設置予定ブロックのAABB範囲 (1x1x1の立方体)
    const bMin = { x: targetLoc.x, y: targetLoc.y, z: targetLoc.z };
    const bMax = { x: targetLoc.x + 1, y: targetLoc.y + 1, z: targetLoc.z + 1 };

    // 3軸(X, Y, Z)すべてで範囲が交差しているか判定
    const overlapsX = pMin.x < bMax.x && pMax.x > bMin.x;
    const overlapsY = pMin.y < bMax.y && pMax.y > bMin.y;
    const overlapsZ = pMin.z < bMax.z && pMax.z > bMin.z;

    return overlapsX && overlapsY && overlapsZ;
}

