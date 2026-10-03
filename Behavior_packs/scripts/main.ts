import { Container, Direction, EntityComponentTypes, EntitySwingSource, EquipmentSlot, ItemComponentTypes, ItemLockMode, ItemStack, Player, system, world } from "@minecraft/server";
import { checkBlock, clearBagInter, findbag, getBagInter, getBlockCount, getBlockInterval, playerGiveItem, playerPosDropItem, setBagInter } from "./block/bagInter";
import { BlocksInTheDirection, getInvertDirection, getPlacementDirection, placeInteractBlock } from "./block/blockPlace";
import {block_interaction_range, blockbagId, blockResetInterval, StorageId } from "./pram";
import { replaceableID } from "./block/blocks";




world.beforeEvents.playerInteractWithBlock.subscribe((event)=>{

  const player = event.player
  const item   = event.itemStack


  
  
  if(item?.typeId === blockbagId){

  

  event.cancel = true

  const block = event.block
  const blockFace = event.blockFace



  const isReplaceable = replaceableID.includes(block.typeId)

  const nextBlock =  isReplaceable ? block : BlocksInTheDirection(block,blockFace)
  


  system.run(()=>{
    if(nextBlock){


       

        //現在時刻を記録してクールタイムを初期化
      
        player.setDynamicProperty(StorageId.PLAYER_USE_LAST_TICK,system.currentTick)



      
        

        const getPlaceLastTick =  player.getDynamicProperty(StorageId.PLAYER_PLACE_LAST_TICK)
        const lastPlace    = typeof getPlaceLastTick === "number" ? getPlaceLastTick : undefined

      

              
          const getContent = player.getComponent(EntityComponentTypes.Inventory)?.container
          const getSlectIngItem = getContent?.getItem(player.selectedSlotIndex)

          const getCount = getBlockCount(player)

      
          const interval = getBlockInterval(player,getCount)
          const clientTick  = system.currentTick

      
      
          
            if(getSlectIngItem&&(((lastPlace == undefined ||lastPlace + interval < clientTick)))){
              
                
                const placementDirection = getPlacementDirection(player)      
                const invertDirection    = getInvertDirection(placementDirection)


                const getFirstDirection =   player.getDynamicProperty(StorageId.PLAYER_PLACE_FIRST_DIRECTION)
                const firstDirection    =   typeof getFirstDirection === "string" ? getFirstDirection as Direction: undefined

               
              
                if(firstDirection){
                    
                    
                    placeInteractBlock(player,getSlectIngItem,nextBlock,firstDirection,blockFace)
                }else  if(invertDirection === blockFace){
                      placeInteractBlock(player,getSlectIngItem,nextBlock,invertDirection,blockFace)
                  }else{
                      placeInteractBlock(player,getSlectIngItem,nextBlock,placementDirection,blockFace)
                  }

                
                
            }

        

    }
  })
  

}
  




})



world.afterEvents.itemUse.subscribe(function (event) {
  const item = event.itemStack;
  const player = event.source;

  const Equippable = player.getComponent(EntityComponentTypes.Equippable);


 
  if (player.getDynamicProperty(StorageId.PLAYER_SELECTING) && Equippable?.getEquipment(EquipmentSlot.Offhand)?.typeId === blockbagId) {



         if(checkBlock(item.typeId)){
          
          
          const backItem = new ItemStack(blockbagId);

          const setBackItem = setBagInter(backItem, item.typeId, item.amount,player)

          Equippable.setEquipment(EquipmentSlot.Mainhand, setBackItem);
          Equippable.setEquipment(EquipmentSlot.Offhand, undefined);


          player.setDynamicProperty(StorageId.PLAYER_SELECTING, false);

          player.sendMessage({translate:"compactblocks.message.save.success",with:[`${item.typeId}`,`${item.amount}`]});


          player.dimension.playSound("item.spyglass.use", player.location);
    }else{
        player.sendMessage({translate:"compactblocks.message.save.error",with:[`${item.typeId}`,`${item.amount}`]});
        player.dimension.playSound("note.bass", player.location);

    }




  }

  


  else if(blockbagId === item.typeId&&!player.getDynamicProperty(StorageId.PLAYER_SELECTING)) {

  

    
    const cooldownComp = item.getComponent(ItemComponentTypes.Cooldown);
    const remaining    = cooldownComp?.getCooldownTicksRemaining(player)

    const bagInter = getBagInter(item)

    if(remaining === undefined||remaining < 1){
        if (!bagInter ) {



          
          if (Equippable?.getEquipment(EquipmentSlot.Offhand)) {

      player.sendMessage({translate:"compactblocks.message.select.error"});
      
    } else {



            const backItem = new ItemStack(blockbagId);
            backItem.lockMode = ItemLockMode.slot;


            system.run(()=>{

              Equippable?.setEquipment(EquipmentSlot.Offhand, backItem);
              Equippable?.setEquipment(EquipmentSlot.Mainhand, undefined);

            })


            player.sendMessage({translate:"compactblocks.message.select.start"});
            player.dimension.playSound("random.orb", player.location);
            player.setDynamicProperty(StorageId.PLAYER_SELECTING, true);

          }



        }else{
          


          

            const item = event.itemStack;

            if (!item || !Equippable) return;


            const bagInter = getBagInter(item)








            if (!player.getDynamicProperty(StorageId.PLAYER_SELECTING) && bagInter) {




              if (bagInter) {

                



                const viewBlock = player.getBlockFromViewDirection({maxDistance:block_interaction_range})

                if (!viewBlock) {

                  
                  player.sendMessage({translate:"compactblocks.message.input.success"});
                  const contenter = player.getComponent(EntityComponentTypes.Inventory)?.container



                  if (contenter) {



                    let blockCount = 0;

                    for (let slot = 0; slot < contenter.size; slot++) {

                      const getSlot = contenter.getSlot(slot)




                      if (!getSlot.isValid || !getSlot.hasItem()) continue;


                      if (getSlot.typeId === bagInter.type) {


                        blockCount += getSlot.amount
                        getSlot.setItem(undefined)


                      }






                    }



                    const nextCount = bagInter.count + blockCount
                    const nextItem = setBagInter(item, bagInter.type, nextCount,player)

                    contenter.setItem(player.selectedSlotIndex, nextItem)

                  }







                }

              }



            }




          
        }
    }


}







});


world.afterEvents.playerSwingStart.subscribe((event) => {
  const player = event.player;
  const item = event.heldItemStack

  const source = event.swingSource


  if(source === EntitySwingSource.Attack||source === EntitySwingSource.Mine){

         

          const Equippable = player.getComponent(EntityComponentTypes.Equippable);
          const ofHandItemId = Equippable?.getEquipment(EquipmentSlot.Offhand)?.typeId


          
          const content = player.getComponent(EntityComponentTypes.Inventory)?.container



          if (item && blockbagId === item.typeId && player.isSneaking && player.getRotation().x > 80) {

            

            const bagInter = getBagInter(item)






            if (!content) return;

            if (bagInter) {

              const interId = bagInter.type
              const interCount = bagInter.count



              const returnItem = new ItemStack(interId);

              const nextbagItem = clearBagInter(item,player)

              playerGiveItem(player, interId, interCount)

              content.setItem(player.selectedSlotIndex, nextbagItem);

              player.playSound("random.pop")
              player.sendMessage({ rawtext: [{ text: "§e" }, { translate: returnItem.localizationKey }, { translate:"compactblocks.message.return.success"}] })



            } else {

              const nextbagItem = clearBagInter(item,player)

              content.setItem(player.selectedSlotIndex, nextbagItem);
              player.sendMessage({translate:"compactblocks.message.return.error"});

            }

          }

          else if (player.getDynamicProperty(StorageId.PLAYER_SELECTING) && ofHandItemId &&blockbagId === ofHandItemId && player.isSneaking && player.getRotation().x > 80) {
            if (player.getDynamicProperty(StorageId.PLAYER_SELECTING)) {




              const backItem = new ItemStack(blockbagId);
      

              
              if(content&&content.emptySlotsCount > 0){
                  content.addItem(backItem)
              }else{
                  playerPosDropItem(player,backItem)
              }

              Equippable?.setEquipment(EquipmentSlot.Offhand, undefined);


              player.setDynamicProperty(StorageId.PLAYER_SELECTING, false);
              player.sendMessage({translate:"compactblocks.message.select.cancel"});
              player.dimension.playSound("random.orb", player.location, { pitch: 0.5 });

            }
          }

  }

  


});

world.beforeEvents.playerBreakBlock.subscribe((event) => {

  const player = event.player;
  const item = event.itemStack



  const Equippable = player.getComponent(EntityComponentTypes.Equippable);
  const ofHandItemId = Equippable?.getEquipment(EquipmentSlot.Offhand)?.typeId



  if ((item && item.getDynamicProperty(StorageId.BAG_INTER)) || (ofHandItemId && blockbagId === ofHandItemId)) {

    if (player.isSneaking && player.getRotation().x > 80) {


      event.cancel = true

    }



  }
})


world.beforeEvents.entityItemPickup.subscribe((event) => {

  const entity = event.entity


  const itemEntity = event.item
  const itemComponent = itemEntity.getComponent(EntityComponentTypes.Item)
  const pickupItem = itemComponent?.itemStack;







  if (entity.typeId === "minecraft:player" && pickupItem !== undefined) {



    const player = entity as Player
    const contenter = player.getComponent(EntityComponentTypes.Inventory)?.container





    if (contenter) {
      const findBag = findbag(contenter, pickupItem.typeId)//保存する鞄を探す関数

     
      
      if (findBag > -1) {



    




     

          const getSlot = contenter.getSlot(findBag)


          if (!getSlot.isValid || !getSlot.hasItem()) return;

          const slotItem = getSlot.getItem()

          if (blockbagId === getSlot.typeId && slotItem) {


       
                event.cancel = true;
        
               system.run(() => {

                
                  const currentSlot = contenter.getSlot(findBag)
                  const currentSlotItem = currentSlot.getItem()
                   const clientInterItem = currentSlotItem ? getBagInter(currentSlotItem):undefined;//鞄の中身を取得。type ->アイテムID,count->内部の個数
               
                  
                      if (clientInterItem && clientInterItem.type === pickupItem.typeId && slotItem !== undefined) {



                        const previous = clientInterItem.count
                
                        if (typeof previous === "number") {

                          
                  


                            if (!currentSlotItem ||blockbagId !== currentSlotItem.typeId) return;

                   
                       

                            
                            const nextCount = previous + pickupItem.amount

                          

                            const nextItem = setBagInter(currentSlotItem, clientInterItem.type, nextCount,player)//鞄に中身を設定する関数。
                            getSlot.setItem(nextItem)
                            player.playSound("random.pop",{pitch:1.5})





                        if (itemEntity.isValid) itemEntity.remove()
                        }
                      }
              })

              

                return;

              


            }

          }







        





      

    }




   }
})



world.afterEvents.worldLoad.subscribe(() => {

  system.runInterval(() => {

    

      const allPlayer = world.getAllPlayers()

      for (let player of allPlayer) {

        if (!player.isValid) return;


      
      


        const getUseLastTick =  player.getDynamicProperty(StorageId.PLAYER_USE_LAST_TICK)
        const uselast    = typeof getUseLastTick === "number" ? getUseLastTick : undefined

 

       
        
         if(uselast&&uselast + blockResetInterval < system.currentTick){

             
              player.setDynamicProperty(StorageId.PLAYER_USE_LAST_TICK,undefined)
              player.setDynamicProperty(StorageId.PLAYER_PLACE_LAST_TICK,undefined)
              player.setDynamicProperty(StorageId.PLAYER_PLACE_LAST_VEC,undefined)
              player.setDynamicProperty(StorageId.PLAYER_PLACE_COUNT,undefined)
              player.setDynamicProperty(StorageId.PLAYER_PLACE_FIRST_DIRECTION,undefined)
              player.setDynamicProperty(StorageId.PLAYER_PLACE_FIRST_VEC,undefined)


            

        }


        







      }

  },2)


   world.getAllPlayers().forEach((player)=>{
      resetBagpack(player)
   })



})






function resetBagpack(player:Player){


  const Equippable = player.getComponent(EntityComponentTypes.Equippable);
  const ofHand = Equippable?.getEquipment(EquipmentSlot.Offhand)

     if (ofHand?.typeId === blockbagId) {




              const backItem = new ItemStack(blockbagId);
              player.getComponent(EntityComponentTypes.Inventory)?.container.addItem(backItem)
              Equippable?.setEquipment(EquipmentSlot.Offhand, undefined);


         
              player.sendMessage({translate:"compactblocks.message.select.cancel"});
              player.dimension.playSound("random.orb", player.location, { pitch: 0.5 });

  }


  player.setDynamicProperty(StorageId.PLAYER_USE_LAST_TICK,undefined)
  player.setDynamicProperty(StorageId.PLAYER_PLACE_LAST_TICK,undefined)
  player.setDynamicProperty(StorageId.PLAYER_PLACE_LAST_VEC,undefined)
  player.setDynamicProperty(StorageId.PLAYER_PLACE_COUNT,undefined)
  player.setDynamicProperty(StorageId.PLAYER_PLACE_FIRST_DIRECTION,undefined)
  player.setDynamicProperty(StorageId.PLAYER_PLACE_FIRST_VEC,undefined)

  player.setDynamicProperty(StorageId.PLAYER_SELECTING,undefined)

  
}

