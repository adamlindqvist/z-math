import * as THREE from "three";
import { CompanionTrail } from "./CompanionTrail";
import { Yunobo } from "../entities/Yunobo";
import type { Area } from "../Area";
import { gameStore } from "../../store/gameStore";
import { hasYunobo, YUNOBO_ROCK } from "./definitions";

/** Follow the player's recorded footsteps, never push or interact with the world. */
export class YunoboCompanion {
  readonly model = new Yunobo();
  readonly root = this.model.root;
  private following = new CompanionTrail(this.root);
  private elapsed = 0;
  private greeting = 0;
  private helpTime = 0;
  private helpStart = new THREE.Vector3();
  private mounted = false;
  reset(position: THREE.Vector3, area: Area) {
    this.following.reset(position, area);
    this.helpTime = this.greeting = 0;
    this.mounted = true;
    this.root.visible = hasYunobo(gameStore.getState().dungeons);
    this.model.animate(this.elapsed, 0, false);
  }
  update(dt: number, position: THREE.Vector3, area: Area, falling = false) {
    const state = gameStore.getState();
    const unlocked = hasYunobo(state.dungeons);
    if (!this.mounted || (unlocked && !this.root.visible && !falling)) this.reset(position, area);
    this.root.visible = unlocked && !falling;
    if (!unlocked || falling || state.overlay || state.motion) return;
    this.elapsed += dt;
    if (!state.yunobo.greeted && !state.riding) {
      this.greeting += dt;
      this.root.rotation.y = Math.atan2(position.x - this.root.position.x, position.z - this.root.position.z);
      this.model.animate(this.elapsed, 0, true, 0, dt);
      if (this.greeting >= 0.9) gameStore.greetYunobo();
      return;
    }
    if (state.yunoboHelping) {
      if (this.helpTime === 0) this.helpStart.copy(this.root.position);
      this.helpTime = Math.min(1.1, this.helpTime + dt);
      const t = this.helpTime / 1.1;
      this.root.position.lerpVectors(this.helpStart, new THREE.Vector3(YUNOBO_ROCK.x, 0, YUNOBO_ROCK.z + 0.7), t);
      this.root.rotation.y = Math.atan2(YUNOBO_ROCK.x - this.helpStart.x, YUNOBO_ROCK.z - this.helpStart.z);
      this.model.animate(this.elapsed, 0, false, t, dt);
      if (t >= 1) {
        gameStore.finishYunoboHelp();
        this.following.restart(position);
      }
      return;
    }
    this.helpTime = 0;
    const speed = this.following.update(dt, position, area, state.riding ? 7 : 4);
    this.model.animate(this.elapsed, speed, false, 0, dt);
  }
}
