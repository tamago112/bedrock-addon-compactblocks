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


    
    
    
              //koko
              //player.onScreenDisplay.setActionBar("設置方向:" + `${targetBlock?.face}`)

        
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
    
          
    
              //player.onScreenDisplay.setActionBar("設置方向:"+`§ax:${maxDirection.x} §aY:${maxDirection.y} §bZ:${maxDirection.z}`+"\n"+`視点方向: §ax:${useDirection.x} §aY:${useDirection.y} §bZ:${useDirection.z}`)
    
    
 
    



          

               
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

              //座標の履歴を保存
              player.setDynamicProperty(StorageId.PLAYER_PLACE_LAST_VEC,targetBlock.location)
           

              

          


              

              //最後の設置場所に面した座標を取得。
              
             
     

              
              player.setDynamicProperty(StorageId.PLAYER_PLACE_FIRST_VEC,targetBlock.location)
              
    
              const nextCount = InterCount - 1
    
              let nextItem = setBagInter(item, interItem, nextCount,player)
    
              
    
    
              Equippable.setEquipment(EquipmentSlot.Mainhand, nextItem);
    
    
    
    
    
            }
    
        
      }

}



 
/*
*
* プレイヤーの視線先にあるブロック情報を取得します。
* 視線の先にブロックが見つからない場合（undefined）は、足元のブロックと
* 視線方向から算出した面（Direction）の組み合わせをフォールバックとして返します。
*
* @param { Player } player 判定対象のプレイヤー
* @param { number } maxDistance Raycastの最大照射距離（デフォルト: 7）
* @returns { { block: Block, face: Direction } | undefined } ターゲット情報 \*
*/
export  function getTargetBlockWithFallback(player:Player, maxDistance = 7):{block:Block,face:Direction}|undefined {

        // 1\. 通常の視線判定（レイキャスト）を実行 [cite: 5, 55] 
        const entityHit = player.getEntitiesFromViewDirection({ maxDistance,includePassableBlocks:true,excludeTypes:["minecraft:arrow"]});
        const blockHit = player.getBlockFromViewDirection({ maxDistance,includePassableBlocks:true});
        const nextHit = player.getBlockFromViewDirection({ maxDistance:maxDistance+1,includePassableBlocks:true,excludeTypes:["minecraft:arrow"]});


        if(entityHit.length > 0){
            return
        }

        if (blockHit) {
    
            const placeBlock = BlocksInTheDirection(blockHit.block,blockHit.face)
            
            if(placeBlock){
                    return {
                        block: placeBlock,
                        face: blockHit.face
                        
                    };
             }

        } 

        
        if(!nextHit&& player.getRotation().x > 48){
        
                    // 2. 視線先にブロックがない場合、足元のブロックを取得 [cite: 7, 57] 
                    let standingBlock = player.getBlockStandingOn();
                if (!standingBlock) return undefined; // 3. プレイヤーの視線ベクトル（getViewDirection）から最も向いている面（Face）を判定 [cite: 12, 64]
                    const view = player.getViewDirection(); // [cite: 12, 64]
                    const absX = Math.abs(view.x);
                    const absY = Math.abs(view.y);
                    const absZ = Math.abs(view.z);

                    let face = Direction.North; // [cite: 25] 

                    if (absX > absZ) {
                        face = view.x > 0 ? Direction.East : Direction.West; // [cite: 25] } 
                    }
                    else {
                        face = view.z > 0 ? Direction.South : Direction.North; // [cite: 25]

                    } // getBlockFromViewDirection と同じ構造 { block, face } で返却

                    const adjacent = getAdjacentBlock(standingBlock,face)
                    const block    =  player.dimension.getBlock(adjacent)

                    if(block){
                        return {
                            block: block,
                            face: face
                        };
                    }
        }
}


export function getAdjacentBlock(block:Block,direction:"West"|"East"|"North"|"South"|"Up"|"Down"):Vector3{



    const blockPos = {x:block.x,y:block.y,z:block.z}
    let result = {...blockPos,y:block.y + 1}

    switch(direction){
        
        case "West":result =  {...blockPos,x:block.x - 1}; break;
        case "East":result =  {...blockPos,x:block.x + 1}; break;
        case "North":result =  {...blockPos,z:block.z - 1}; break;
        case "South":result =  {...blockPos,z:block.z + 1}; break;
        case "Up":result =  {...blockPos,y:block.y + 1}; break;
        case "Down":result =  {...blockPos,y:block.y - 1}; break;

    }

    return result



     



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

export function blocksInTheOppositeDirection(block: Block, direction: Direction) {


  switch (direction) {

 

    case "East":

      return block.west();


    case "West":

      return block.east();




    case "North":

      return block.south();





    case "South":

      return block.north();



    case "Up":

      return block.below();

    case "Down":

      return block.above();








    default:


      return undefined;





  }


}

export function getPlacementDirection(player: Player):Direction {

    const pitch = player.getRotation().x;
    const yaw = player.getRotation().y;
    // -180 から 180 度 
    // // プレイヤーが向いている方向を判定

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
    // プレイヤーのAABBを取得 { center: Vector3, extent: Vector3 } [1-3]
    const pAABB = target.getAABB(); // [3]
    if (!pAABB) return false;

    // center と extent からプレイヤーの当たり判定の最小値(pMin)と最大値(pMax)を算出 [1, 2]
    const pMin = {
        x: pAABB.center.x - pAABB.extent.x, // [1, 2]
        y: pAABB.center.y - pAABB.extent.y, // [1, 2]
        z: pAABB.center.z - pAABB.extent.z  // [1, 2]
    };
    const pMax = {
        x: pAABB.center.x + pAABB.extent.x, // [1, 2]
        y: pAABB.center.y + pAABB.extent.y, // [1, 2]
        z: pAABB.center.z + pAABB.extent.z  // [1, 2]
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

