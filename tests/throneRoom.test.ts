import { afterEach, describe, expect, it, vi } from "vitest";
import { Vector3, Vector2, Mesh } from "three";
import { createGameStore, gameStore, parseSave } from "../src/store/gameStore";
import { WORLD_OBJECTS, type WorldObjectId } from "../src/game/interactables/definitions";
import { PUZZLES } from "../src/game/puzzles/definitions";
import { ThroneRoomArea } from "../src/game/castle/ThroneRoomArea";
import { pickInteraction } from "../src/game/InteractionSystem";
import { GameCamera } from "../src/game/Camera";
import { Player } from "../src/game/Player";
import { disposeTree } from "../src/game/Area";
import type { SoundEvent } from "../src/audio/types";
const memory = () => { let raw: string | null = null; return { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } }; };
type Store = ReturnType<typeof createGameStore>;
const enter = (s: Store) => { s.travelTo({castle:"hall"}); s.travelTo({castle:"throne"}); };
const press = (s: Store, id: WorldObjectId) => { s.setTarget({kind:"worldObject",id,label:WORLD_OBJECTS[id].label}); s.interact(); };
const open = (s: Store) => { s.setTarget({kind:"chest",id:"royal-treasure",label:"Öppna"}); s.interact(); };
const solveQuiz = (s: Store) => {
  s.beginQuiz();
  for (let i = 0; i < 3; i++) {
    s.answer(s.getState().question!.correctAnswer);
    s.finishQuiz();
  }
};
const symbols = PUZZLES["royal-symbols"].symbols;
const orders = symbols.flatMap(a => symbols.filter(b=>b!==a).map(b=>[a,b,symbols.find(c=>c!==a&&c!==b)!]));
afterEach(()=>gameStore.reset());
describe("royal secret persistence",()=>{
  it.each(orders.map(order=>[order]))("accepts every symbol order %s with partial reloads and one atomic reward",(order)=>{
    const storage=memory(); let s=createGameStore(storage); enter(s);
    open(s); expect(s.getState().rupees).toBe(0);
    order.forEach((id,index)=>{
      press(s,id); press(s,id);
      expect(s.getState().puzzles["royal-symbols"].activated).toHaveLength(index+1);
      if(index<2) s=createGameStore(storage);
    });
    open(s); expect(s.getState().rupees).toBe(0); // Sliding barrier not finished.
    // Reloading mid-slide restores the destination with no replay.
    s=createGameStore(storage);
    const writes=vi.spyOn(storage,"setItem"); open(s);
    expect(s.getState()).toMatchObject({overlay:"locked",rupees:0,chests:{"royal-treasure":false}});
    solveQuiz(s);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(s.getState()).toMatchObject({rupees:20,items:expect.arrayContaining(["royal-crown"]),equipment:{head:"royal-crown"},chests:{"royal-treasure":true},overlay:"itemReward",question:null});
    open(s); s.close(); open(s);
    expect(s.getState()).toMatchObject({rupees:20,overlay:"empty"});
    expect(s.getState().items.filter(id=>id==="royal-crown")).toHaveLength(1);
    s.close(); s.unequipItem("head");
    s=createGameStore(storage); expect(s.getState().equipment.head).toBeNull();
    expect(s.getState().chests["royal-treasure"]).toBe(true);
  });
  it("allows retries and restarts an unfinished royal quiz after closing or reloading",()=>{
    const storage=memory(); let s=createGameStore(storage); enter(s);
    symbols.forEach(id=>press(s,id)); s.finishBarrier("royal-throne"); open(s); s.beginQuiz();
    s.answer(-1);
    expect(s.getState()).toMatchObject({feedback:"retry",quizCorrectAnswers:0,rupees:0,chests:{"royal-treasure":false}});
    s.replaceQuestion();
    s.answer(s.getState().question!.correctAnswer); s.finishQuiz();
    expect(s.getState().quizCorrectAnswers).toBe(1);
    expect(s.getState().items).not.toContain("royal-crown");
    s.close(); open(s); s.beginQuiz();
    expect(s.getState().quizCorrectAnswers).toBe(0);
    s.answer(s.getState().question!.correctAnswer); s.finishQuiz();
    s=createGameStore(storage);
    expect(s.getState()).toMatchObject({rupees:0,chests:{"royal-treasure":false}});
    open(s); solveQuiz(s);
    expect(s.getState()).toMatchObject({overlay:"itemReward",reward:20,rewardItems:["royal-crown"]});
    s.answer(1); s.finishQuiz(); s.close(); open(s); s.beginQuiz();
    expect(s.getState()).toMatchObject({overlay:"empty",rupees:20,question:null});
    const restored=createGameStore(storage);
    expect(restored.getState()).toMatchObject({rupees:20,chests:{"royal-treasure":true},equipment:{head:"royal-crown"}});
  });
  it("saves revealed pickups independently, including uncollected pickups and exactly 22 rupees",()=>{
    const storage=memory(); let s=createGameStore(storage); enter(s);
    for(const [id,pickup] of [["loose-helmet","royal-helmet-rupee"],["royal-pot","royal-pot-rupee"]] as const){
      s.collect(pickup); expect(s.getState().collected).not.toContain(pickup);
      press(s,id); s=createGameStore(storage);
      expect(s.getState().worldObjects).toContain(id);
      s.collect(pickup); s.collect(pickup); press(s,id); s.collect(pickup);
    }
    expect(s.getState().rupees).toBe(2);
    symbols.forEach(id=>press(s,id)); s.finishBarrier("royal-throne"); open(s); solveQuiz(s);
    expect(createGameStore(storage).getState().rupees).toBe(22);
  });
  it("rejects corrupt history and previous save versions, but tolerates unavailable storage",()=>{
    const storage=memory(),s=createGameStore(storage); enter(s); symbols.forEach(id=>press(s,id)); s.finishBarrier("royal-throne"); open(s); solveQuiz(s);
    const saved=JSON.parse(storage.getItem()!);
    for(const change of [
      {version:9},{puzzles:{}},{puzzles:{"royal-symbols":{activated:["unknown"]}}},
      {puzzles:{"royal-symbols":{activated:[symbols[0],symbols[0]]}}},
      {puzzles:{"royal-symbols":{activated:[symbols[0]]}}},
      {items:["green-clothes"],equipment:{...saved.equipment,head:null}},
      {worldObjects:["royal-book"]}, {collected:["royal-pot-rupee"],rupees:21}, {rupees:40},
    ]) expect(parseSave(JSON.stringify({...saved,...change})).location).toBeNull();
    const unavailable=createGameStore({getItem:()=>null,setItem:()=>{throw new Error("denied");}});
    enter(unavailable); symbols.forEach(id=>press(unavailable,id)); unavailable.finishBarrier("royal-throne"); open(unavailable); solveQuiz(unavailable);
    expect(unavailable.getState()).toMatchObject({rupees:20,savingAvailable:false});
  });
  it("guards locations, overlays and nonadjacent travel, with silent restoration and debug isolation",()=>{
    const storage=memory(),s=createGameStore(storage),events:SoundEvent[]=[];
    s.subscribeSound(e=>events.push(e));
    s.travelTo({castle:"throne"}); expect(s.getState().location).toBeNull();
    symbols.forEach(id=>press(s,id)); expect(events).toEqual([]);
    enter(s); s.pause(); press(s,symbols[0]); expect(events).toEqual([]); s.pause();
    symbols.forEach(id=>press(s,id)); expect(events).toEqual(["click","click","mechanism"]);
    const restored=createGameStore(storage); restored.subscribeSound(e=>events.push(e));
    expect(events).toHaveLength(3);
    const baseline=storage.getItem(); restored.openDebug(); restored.debugTravelTo({castle:"throne"}); restored.closeDebug(); open(restored); solveQuiz(restored);
    expect(restored.getState().rupees).toBe(20); expect(storage.getItem()).toBe(baseline);
    restored.openDebug(); restored.debugEndSession(); expect(restored.getState().rupees).toBe(0);
    restored.reset(); expect(restored.getState()).toMatchObject({puzzles:{"royal-symbols":{activated:[]}},worldObjects:[],movingBarriers:[],objectEvent:null});
  });
});

describe("royal room geometry and animation",()=>{
  it("keeps the barrier solid until animation finishes, pauses, restores and cleans up",()=>{
    enter(gameStore); const room=new ThroneRoomArea();
    expect(room.collision.free(0,-2.3)).toBe(false);
    expect(room.root.getObjectByName("royal-armour")!.position.x).toBe(4.15);
    expect(room.chest.root.position.x).toBe(0);
    symbols.forEach(id=>press(gameStore,id)); room.update(0.7,0);
    expect(room.barrier.opened).toBe(false); expect(room.collision.free(0,-2.3)).toBe(false);
    gameStore.pause(); room.update(8,0); expect(room.barrier.amount).toBeCloseTo(0.7/1.5); gameStore.pause();
    room.update(0.8,0); expect(room.barrier.opened).toBe(true);
    expect(gameStore.getState().movingBarriers).toEqual([]);
    expect(room.collision.free(0,-2.7)).toBe(true);
    expect(room.interactions(gameStore.getState()).some(i=>typeof i.target==="object"&&i.target?.kind==="chest")).toBe(true);
    const restored=new ThroneRoomArea(); expect(restored.barrier.opened).toBe(true);
    const geometry=(room.root.getObjectByName("royal-shield")!.children[0] as Mesh).geometry;
    const dispose=vi.spyOn(geometry,"dispose"); room.dispose(); expect(dispose).toHaveBeenCalledOnce(); restored.dispose();
  });
  it("has a reachable approach to every object, including a clear aisle to the right of the throne",()=>{
    enter(gameStore); const room=new ThroneRoomArea();
    const queue=[room.spawn], seen=new Set<string>();
    for(let i=0;i<queue.length;i++){
      const p=queue[i];
      for(const [dx,dz] of [[0.2,0],[-0.2,0],[0,0.2],[0,-0.2]]){
        const q={x:Math.round((p.x+dx)*10)/10,z:Math.round((p.z+dz)*10)/10},key=`${q.x},${q.z}`;
        if(!seen.has(key)&&room.collision.free(q.x,q.z)){seen.add(key);queue.push(q);}
      }
    }
    for(const target of room.interactions(gameStore.getState())) {
      expect(queue.some(p=>Math.hypot(p.x-target.x,p.z-target.z)<1.5&&room.collision.visible(p,target)),JSON.stringify({target:target.target,closest:queue.reduce((best,p)=>Math.hypot(p.x-target.x,p.z-target.z)<Math.hypot(best.x-target.x,best.z-target.z)?p:best,queue[0])})).toBe(true);
    }
    expect(room.collision.free(1.8,-2.8)).toBe(true);
    expect(queue.some(p => p.x === 3.4 && p.z === -2.7)).toBe(true);
    room.dispose();
  });
  it("allows large object taps on every symbol and rejects remote taps",()=>{
    enter(gameStore); const room=new ThroneRoomArea(),camera=new GameCamera();
    camera.resize(1024,768); camera.setMode("room",new Vector3());
    room.root.updateMatrixWorld(true); camera.camera.updateMatrixWorld(true);
    for(const id of symbols){
      const object=room.root.getObjectByName(id)!;
      const seal=object.children.find(c=>c.type==="Group")!;
      const world=seal.getWorldPosition(new Vector3());
      const point=world.project(camera.camera),d=WORLD_OBJECTS[id];
      const target=pickInteraction(room,new Vector3(d.x,0,d.z),camera.camera,new Vector2(point.x,point.y));
      expect(target,id).toMatchObject({kind:"worldObject",id});
      expect(pickInteraction(room,new Vector3(0,0,3),camera.camera,new Vector2(point.x,point.y))).toBeNull();
    }
    room.dispose();
  });
  it("waits safely when the player stands to the right, then leaves a walkable outer aisle",()=>{
    enter(gameStore); const room = new ThroneRoomArea();
    expect(room.collision.free(1.8,-2.8)).toBe(true);
    symbols.forEach(id=>press(gameStore,id));
    room.update(2,0,new Vector3(1.8,0,-2.8));
    expect(room.barrier.amount).toBe(0);
    expect(room.collision.free(1.8,-2.8)).toBe(true);
    room.update(1.5,0,new Vector3(3.5,0,-2.8));
    expect(room.barrier.opened).toBe(true);
    expect(room.collision.free(1.8,-2.8)).toBe(false);
    for (let z = 1; z >= -3.7; z -= 0.1) expect(room.collision.free(3.4,z)).toBe(true);
    expect(room.root.getObjectByName("rattling-armour")).toBeUndefined();
    expect(room.root.getObjectByName("empty-pot")).toBeUndefined();
    room.dispose();
  });
  it("shows only the equipped headwear",()=>{
    const player=new Player(),s=createGameStore(); s.grantItems(["royal-crown"],true); player.setEquipment(s.getState().equipment);
    expect(player.root.getObjectByName("royal-crown")!.visible).toBe(true);
    expect(player.root.getObjectByName("green-hat")!.visible).toBe(false);
    expect(player.root.getObjectByName("base-hat")!.visible).toBe(false);
    s.unequipItem("head"); player.setEquipment(s.getState().equipment);
    expect(player.root.getObjectByName("base-hat")!.visible).toBe(false); disposeTree(player.root);
  });
});
