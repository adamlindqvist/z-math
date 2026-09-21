import * as THREE from "three";

/** Soft billowing wisps, pooled into one draw call without textures or lights. */
export class ArmyBarrier extends THREE.InstancedMesh {
  declare material: THREE.ShaderMaterial;
  constructor() {
    super(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying float vPhase;
        uniform float time;
        void main() {
          vUv = uv;
          vPhase = instanceMatrix[3].x * 1.7 + instanceMatrix[3].y * 3.0;
          vec4 center = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          center.xy += vec2(sin(time * 0.45 + vPhase) * 0.25, sin(time * 0.6 + vPhase) * 0.3);
          vec2 size = vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
          center.xy += position.xy * size;
          gl_Position = projectionMatrix * center;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vPhase;
        uniform float time;
        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float ripple = sin(p.x * 7.0 + vPhase + time * 0.4) * sin(p.y * 6.0 - time * 0.5) * 0.10;
          float density = 1.0 - smoothstep(0.1, 0.95, length(p) + ripple);
          vec3 color = mix(vec3(0.18, 0.002, 0.006), vec3(0.52, 0.008, 0.015), density);
          gl_FragColor = vec4(color, density * density * 0.56);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    }), 32);
    this.name = "army-barrier";
    this.frustumCulled = false;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.count; i++) {
      const column = i % 16;
      // Stagger the rows and overlap their soft edges to form a continuous veil.
      dummy.position.set(-14.5 + column * 1.93 + (i < 16 ? -0.45 : 0.45), i < 16 ? 0.6 : 1.65 + Math.sin(column * 2) * 0.25, -17 + Math.sin(i * 2.4) * 0.25);
      dummy.scale.set(5.2, 3.1 + (i % 3) * 0.35, 1);
      dummy.updateMatrix();
      this.setMatrixAt(i, dummy.matrix);
    }
  }
  update(time: number) {
    this.material.uniforms.time.value = time;
  }
}
