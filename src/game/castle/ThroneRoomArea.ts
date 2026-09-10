import * as THREE from "three";
import { type Area, type Interaction, disposeTree } from "../Area";
import { CollisionSystem } from "../CollisionSystem";
import { Chest } from "../entities/Chest";
import { canOpenChest } from "../entities/chestAccess";
import { Collectible } from "../entities/Collectible";
import { SlidingBarrier } from "../entities/SlidingBarrier";
import { gameStore, type GameState } from "../../store/gameStore";
import { OBJECT_IDS, WORLD_OBJECTS, PICKUP_OBJECTS, type WorldObjectId } from "../interactables/definitions";
import { puzzleSolved, PUZZLES } from "../puzzles/definitions";
import { furnishThroneRoom } from "./throneRoomModels";

export class ThroneRoomArea implements Area {
  root = new THREE.Group();
  collision = new CollisionSystem(4.6,4.2);
  spawn = { x: 0, z: 2.7 };
  cameraMode = "room" as const;
  chest: Chest;
  rupees: Collectible[] = [];
  private decor;
  barrier: SlidingBarrier;
  private time = 0;
  private idle = 0;
  private nextHint = 45;
  private hintRemaining = 0;
  private hintId: WorldObjectId | undefined;
  private count: number;
  private sequence: number;
  private focused = true;
  private blur = () => { this.focused = false; };
  private focus = () => { this.focused = true; };
  constructor() {
    this.root.name = "Kungasalen";
    const state = gameStore.getState();
    this.count = state.puzzles["royal-symbols"].activated.length;
    this.sequence = state.objectEvent?.sequence ?? 0;
    this.decor = furnishThroneRoom(this.root,this.collision,state.worldObjects);
    this.barrier = new SlidingBarrier(this.decor.throne,1.8,puzzleSolved(state.puzzles,"royal-symbols"));
    this.chest = new Chest(state.chests["royal-treasure"]);
    this.chest.root.position.set(0,0,-3.62);
    this.chest.root.userData.target = { kind: "chest", id: "royal-treasure", label: "Öppna" };
    this.root.add(this.chest.root);
    this.collision.add(0,-3.66,0.54,0.38);
    for (const id of PICKUP_OBJECTS) {
      const b = WORLD_OBJECTS[id].behavior;
      if (b.kind !== "pickup") continue;
      const rupee = new Collectible(b.pickup,b.position.x,b.position.z);
      rupee.root.visible = state.worldObjects.includes(id) && !state.collected.includes(b.pickup);
      this.rupees.push(rupee); this.root.add(rupee.root);
    }
    this.syncCollision();
    this.update(0,0);
    if (typeof window !== "undefined") {
      window.addEventListener("blur",this.blur); window.addEventListener("focus",this.focus);
    }
  }
  private syncCollision() {
    this.collision.dynamic = [{ x: this.decor.throne.position.x, z: -2.8, halfX: 0.85, halfZ: 1.1 }];
  }
  passages() { return [{ x: 0,z: 3.65,destination: { castle: "hall" as const } }]; }
  interactions(state: GameState): Interaction[] {
    const targets: Interaction[] = OBJECT_IDS.map(id => {
      const d = WORLD_OBJECTS[id];
      return { x: d.x,z: d.z,target: { kind: "worldObject",id,label: d.label } };
    });
    if (this.barrier.opened) {
      const throne = targets.find(i => typeof i.target === "object" && i.target?.kind === "worldObject" && i.target.id === "royal-throne")!;
      throne.x = 1.8;
      if (canOpenChest(state,"royal-treasure")) targets.push({ x: 0,z: -2.95,target: this.chest.root.userData.target });
    }
    return targets;
  }
  update(dt: number, _time: number, position?: THREE.Vector3) {
    const state = gameStore.getState();
    const paused = !!state.overlay || !this.focused || (typeof document !== "undefined" && document.hidden);
    const step = paused ? 0 : dt;
    this.time += step;
    const activated = state.puzzles["royal-symbols"].activated;
    if (activated.length !== this.count) { this.count = activated.length; this.idle = 0; this.nextHint = 45; this.hintRemaining = 0; }
    if (!paused && state.objectEvent && state.objectEvent.sequence !== this.sequence) {
      this.sequence = state.objectEvent.sequence;
      this.decor.reactions.get(state.objectEvent.id)?.play(state.worldObjects.includes(state.objectEvent.id));
      if (state.objectEvent.id === "royal-throne") { this.hintRemaining = 2; this.hintId = PUZZLES["royal-symbols"].symbols.find(id => !activated.includes(id)); }
    }
    this.idle += step;
    this.hintRemaining = Math.max(0,this.hintRemaining-step);
    if (activated.length < 3 && this.idle >= this.nextHint) {
      this.hintId = PUZZLES["royal-symbols"].symbols.find(id => !activated.includes(id));
      this.hintRemaining = 2; this.nextHint = this.idle + 30;
    }
    for (const reaction of this.decor.reactions.values()) reaction.update(step);
    const solved = puzzleSolved(state.puzzles,"royal-symbols");
    // Do not reserve an invisible patch of floor. Wait for the player to leave
    // the swept area before moving, then keep collision aligned with the throne.
    const inSweep = position && position.x > -1.17 && position.x < 2.97 && position.z > -4.22 && position.z < -1.38;
    const safeStep = !this.barrier.opened && inSweep ? 0 : step;
    if (this.barrier.update(safeStep,solved)) gameStore.finishBarrier("royal-throne");
    this.syncCollision();
    for (const [id,medal] of this.decor.symbols) {
      const on = activated.includes(id);
      const destination = medal.depth - (on ? 0.065 : 0);
      medal.root.position.z += (destination-medal.root.position.z) * Math.min(1,step*18);
      if (!dt && on) medal.root.position.z = destination;
      medal.gold.emissive.set("#ffc75c");
      medal.gold.emissiveIntensity = on ? 0.85 : this.hintId === id && this.hintRemaining > 0 ? 1.4 : activated.length ? 0.13 + (1+Math.sin(this.time*1.8))*0.14 : 0;
    }
    this.decor.indicators.forEach((medal,i) => {
      const on = i < activated.length;
      medal.gold.color.set(on ? "#fff3a3" : "#705b43");
      medal.gold.emissive.set(on ? "#ffc928" : "#000000");
      medal.gold.emissiveIntensity = on ? 2.2 : 0;
      medal.inset.color.set(on ? "#fffbd1" : "#251c2b");
      medal.inset.emissive.set(on ? "#ffb817" : "#000000");
      medal.inset.emissiveIntensity = on ? 2.8 : 0;
      medal.glow.material.opacity = on ? 0.58 : 0;
      medal.light.intensity = on ? 1.15 : 0;
      medal.root.scale.setScalar(medal.size * (on ? 1.12 : 1));
    });
    for (const [i,f] of this.decor.flames.entries()) (f.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8+Math.sin(this.time*5+i)*0.15;
    if (position) this.decor.eyes.forEach((eye,i) => { eye.position.x = (i ? 0.09 : -0.09)+THREE.MathUtils.clamp((position.x+1.95)*0.004,-0.015,0.015); });
    for (const id of PICKUP_OBJECTS) {
      const b = WORLD_OBJECTS[id].behavior;
      if (b.kind !== "pickup") continue;
      const rupee = this.rupees.find(r => r.id === b.pickup)!;
      rupee.update(this.time,!state.worldObjects.includes(id) || state.collected.includes(b.pickup));
    }
    this.chest.update(step,state.chests["royal-treasure"]);
  }
  dispose() {
    if (typeof window !== "undefined") { window.removeEventListener("blur",this.blur); window.removeEventListener("focus",this.focus); }
    disposeTree(this.root);
  }
}
