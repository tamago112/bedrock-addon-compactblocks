import { BlockPermutation, Container, EnchantmentTypes, EntityComponentTypes, ItemStack, Player, Vector3} from "@minecraft/server";
import { blockbagData } from "../type";
import { blockbagId, StorageId } from "../pram";
import { getPlayerSpeed } from "../helper";

export function setBagInter(itemStack: ItemStack, typeId: string, count: number,player:Player) {




  if(count > 0){
          itemStack.setDynamicProperties({

          [StorageId.BAG_INTER]: typeId,
          [StorageId.BAG_COUNT]: count


        })


        const getLang = getItemLang(typeId)
        const translateText = getLang ? {translate:getLang} :{text:`: ${typeId}`}

        // item: {itemName} * {count}
        itemStack.setLore([{rawtext:[translateText,{text:`*${count}`}]}]);



        const enchantable = itemStack.getComponent("minecraft:enchantable");
        const encType = EnchantmentTypes.get("unbreaking");

        if (!enchantable) console.warn(`The "enchantable" component could not be found.`)

        if (encType) {
          enchantable?.addEnchantment({ type: encType, level: 1 })
        } else {
          console.warn("The specified enchantmentTypes was not found.")
        }

       return itemStack
  }else{
      return clearBagInter(itemStack,player)
  }







 


}

export function clearBagInter(itemStack: ItemStack,player:Player) {





  itemStack.setDynamicProperties({

    [StorageId.BAG_INTER]: undefined,
    [StorageId.BAG_COUNT]: undefined


  })

  itemStack.setLore([]);

  const cooldownComp = itemStack.getComponent("minecraft:cooldown");
  cooldownComp?.startCooldown(player);
    

  const enchantable = itemStack.getComponent("minecraft:enchantable");
  const encType = EnchantmentTypes.get("unbreaking");

  if (encType) {

    enchantable?.removeEnchantment(encType)

  }




  return itemStack


}


export function getBagInter(itemStack: ItemStack): blockbagData | undefined {

  const getInter = itemStack.getDynamicProperty(StorageId.BAG_INTER)
  const bagInter = typeof getInter === "string" ? getInter : undefined

  const getCount = itemStack.getDynamicProperty(StorageId.BAG_COUNT)
  const bagCount = typeof getCount === "number" ? getCount : 0

  if (bagInter && bagCount) {

    return {

      type: bagInter,
      count: bagCount

    }

  } else {

    return
  }





}

export function findbag(container: Container, itemId: string) {
  // コンテナの全スロットをループ
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);

    if(item){

          const inter  = getBagInter(item)

          // スロットにアイテムが存在し、かつIDが一致するか確認
          if (blockbagId === item.typeId&&inter?.type === itemId) {
            return slot; // 見つかった時点でスロット位置を返して終了
          }

    }

  
  }
  return -1; // 全て空、または一致しなかった場合に -1
}

export function checkBlock(typeId:string){

    try{

      BlockPermutation.resolve(typeId)
      return true

    }catch(e){

      return false
    }

}


export function playerGiveItem(player: Player, typeId: string, count: number) {

  const getItemData = new ItemStack(typeId)
  const maxAmount = getItemData.maxAmount
  const contenter = player.getComponent(EntityComponentTypes.Inventory)?.container

  let clientCount = count;

  if (contenter) {
    while (clientCount > 1) {

      

      if (clientCount >= maxAmount) {

        
        const newItem = new ItemStack(typeId,maxAmount)
        
        if(contenter.emptySlotsCount > 0){
            contenter.addItem(newItem)
        }else{
            playerPosDropItem(player,newItem)
        }

        clientCount -= maxAmount

      } else {

       
        if(clientCount > 0){
           const newItem = new ItemStack(typeId,clientCount)
           contenter.addItem(newItem)


          if(contenter.emptySlotsCount > 0){

                contenter.addItem(newItem)

            }else{

                playerPosDropItem(player,newItem)

            }

        }

         clientCount -= maxAmount
        

      }

     

    }
  }



}

export function playerPosDropItem(player:Player,itemStack:ItemStack){

     const dimension = player.dimension
     const pos       = player.location

     dimension.spawnItem(itemStack,pos)

}

export function checkSomeVector(source:Vector3,dest:Vector3){

      if(source.x === dest.x&&source.y === dest.y&&source.z === dest.z){
          return true
      }
      
     

      return false

}


export function addBlockCount(player:Player){

        
      const getPlaceLastTick =  player.getDynamicProperty(StorageId.PLAYER_PLACE_COUNT)
      const lastPlace    = typeof getPlaceLastTick === "number" ? getPlaceLastTick : 0

      player.setDynamicProperty(StorageId.PLAYER_PLACE_COUNT,lastPlace +1)

}

export function getBlockCount(player:Player){

        
      const getPlaceLastTick =  player.getDynamicProperty(StorageId.PLAYER_PLACE_COUNT)
      const lastPlace    = typeof getPlaceLastTick === "number" ? getPlaceLastTick : 0

      return lastPlace

}

export function getItemLang(typeId:string){

    try{
        const item = new ItemStack(typeId)
        return item.localizationKey
    }catch{

       return 

    }
  
}


export function getBlockInterval(player:Player,placeCount:number){

  if(placeCount < 2){
      return 7
  }else if(getPlayerSpeed(player) < 0.15){
      return 5
  }

  return 0

}